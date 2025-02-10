/* eslint-disable @typescript-eslint/no-unused-expressions */
import process from 'node:process'
import http from "http";
import {WebSocketServer } from 'ws';
import {Buffer } from 'node:buffer';
import * as quotesStreamHandlers from './quotes-stream-handlers.js';
import {getMoexSharesQuotesLast} from './market-quotes-load.js';
import readline from 'node:readline'
import { EMPTY,catchError } from 'rxjs';
import * as auth from './auth-module.js';
import {ENV} from './env/env.js'
import {SERVER_ERRORS} from './models/error-model.js'
var serverStatus = 'none';
var rl = readline.createInterface({
  input: process.stdin, 
  terminal: false
});

settingCLIhadler ();

const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end("WS-Serever is running");
});

httpServer.on('close', () =>{ 
  process.send(['HTTP Server is closed']);
  setTimeout(function () {process.exit(0)}, 1000);
});
httpServer.on('connect', ()=>{process.send(['http connection'])});
httpServer.on('error', (error)=>{process.send([`http error ${error}`])});
httpServer.listen(ENV.PORT, () => { //sever starting
  process.send(['WebSocket server is listening on port',ENV.PORT ,'PID', process.pid])
  getMoexSharesQuotesLast().pipe(      
    catchError(err => {
      console.log('Error in loading MOEX data\n',err.message);
      return EMPTY
  }))
  .subscribe(res=>process.send([res]))  //update moex quotes with last open prices via moex api
});
const wsServer = new WebSocketServer ({ server: httpServer }); 
wsServer.on('close', ()=> process.send(['WS Server is closed. Clients connected:',wsServer.clients.size]));
wsServer.on('error;', (error)=>{process.send(['http error' ,error])});

wsServer.on("connection", async (ws, req) => {
  auth.verifyAccess(req.headers.cookie)
  .pipe(
    catchError(error=>{
      process.send(['jwt err:',SERVER_ERRORS.get('JWT_EXPIRED').code, error.message]); //REFACTOR!!
      ws.close(SERVER_ERRORS.get('JWT_EXPIRED').code, Buffer.from( error.message,  "utf8"));
      return EMPTY;
    }))
  .subscribe(()=>settingClientHandler(ws,req))
});

function settingClientHandler (ws,req) {
  let newClient = Array.from(wsServer.clients).pop()
  newClient.manage=req.url; //adding property to differ managing stream sockets from sockets receiving only quotes stream 
  newClient.id=req.headers['sec-websocket-key']
  process.send(['Client connected ID:',newClient.id,'| URL:', req.url]);
  ws.on('error',(event)=>{process.send(['Ws Server error',event])})
  ws.on("close", (ev) => process.send(['Client disconnected ID:',ws.id,'| URL:',ws.manage,ev]));
  ws.on("message", (message) => handleIncomingMessage (message,ws));// handle commands sent to server to manage streams of quotes
}

function handleIncomingMessage (message, ws) {

  let cmdIns = JSON.parse(message.toString());
  switch (cmdIns.cmd) {
    case "start": //start new stream and stop 
      quotesStreamHandlers.stopQuotesStreams();
      quotesStreamHandlers.simulateRatesFlow(wsServer, cmdIns.timeToWork, cmdIns.intervalToEmit, cmdIns.market ); //create new stream of quotes
      break;
    case "stop": //stop stream of quotes
      quotesStreamHandlers.stopQuotesStreams();
      quotesStreamHandlers.shareConnectionStatus(wsServer,'stream_stopped');
    break;
    case "close":
      ws.close(SERVER_ERRORS.get('CLOSE_USER_CONNECTION').code, Buffer.from( 'Request to close connection',  "utf8"))
    break
  }
}

function restartWsServer() {
  serverStatus = 'RESTART_SERVER';
  closeWsServer (serverStatus);
}
function closeProcess () {
  serverStatus = 'CLOSE_SERVER';
  closeWsServer(serverStatus);
}
function closeWsServer (serverAction) {
  process.send(['Server process is closing... Clients connected:', wsServer.clients.size,'PID',process.pid]);
  wsServer.clients.forEach(client => client.close(SERVER_ERRORS.get(serverAction).code, Buffer.from(serverAction,  "utf8")));
  wsServer.close();
  httpServer.close();
}

function settingCLIhadler () {
  let params=[];
  rl.on('line',(line)=>line==='exit'? closeProcess():null )
  process.send = process.send || console.log 
  process.stdin.resume();
  process.on('SIGINT',() => {
  }); 
  process.on('uncaughtException',(err) => {
    process.send(['uncaughtException -',err]); 
    process.exit(1);
  }); 

  process.on('message',(msg)=>{
    let p1 = []
    switch (msg.split(' ')[0]) {
      case 'rs':
        restartWsServer(); 
      break;
      case 'exit':
        closeProcess();
      break;
      case 'start':
        quotesStreamHandlers.stopQuotesStreams();
        params = msg.trim().split(' ')
        params.shift();
        p1.push( params[0] === undefined || !Number.isNaN(Number(params[0])))
        p1.push( params[1] === undefined || !Number.isNaN(Number(params[1])))
        p1.push( params[2] === undefined || ['m','n'].includes(params[2]))
        params.length<=3 && p1.every(el=>el===true)? quotesStreamHandlers.simulateRatesFlow(wsServer,...params) : process.send(['Incorrect params']);
      break;
      case 'stop':
        quotesStreamHandlers.stopQuotesStreams();
        quotesStreamHandlers.shareConnectionStatus(wsServer,'stream_stopped');
      break;
      default:
        process.send(['Sent - Unknown command - ',msg]); 
      break;
    }
  });

}