/* eslint-disable @typescript-eslint/no-unused-expressions */
import process from 'node:process'
import http from "http";
import {WebSocketServer } from 'ws';
import {Buffer } from 'node:buffer';
import * as quotesStreamHandlers from './quotes-stream-handlers.js';
import {getMoexSharesQuotesLast} from './market-quotes-load.js';
const PORT = 3003;
var serverStatus = 'none';
process.send = process.send || console.log 
process.stdin.resume();
process.on('SIGINT',() => {}); 
process.on('uncaughtException',(err) => {
  process.send(['uncaughtException -',err]); 
  process.exit(1);
}); 

let params=[];
process.on('message',(msg)=>{
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
      params.length<=2 && params.every(el=>!Number.isNaN(Number(el)))? quotesStreamHandlers.simulateRatesFlow(wsServer,...params) : process.send(['Incorrect params']);
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

function restartWsServer() {
  serverStatus = 'restart';
  closeWsServer (serverStatus);
}
function closeProcess () {
  serverStatus = 'close';
  closeWsServer(serverStatus);
}
function closeWsServer (msg) {
  process.send(['Server process is closing... Clients connected:', wsServer.clients.size,'PID',process.pid]);
  wsServer.clients.forEach(client => client.close(1011, Buffer.from(msg,  "utf8")));
  wsServer.close();
  httpServer.close();
}

const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end("WS-Serever is running");
});

httpServer.on('close', () =>{ 
  process.send(['HTTP Server is closed']);
  setTimeout(function () {process.exit(0)}, 1000);
});
httpServer.once('connection', ()=>{console.log('http connection')});
httpServer.on('error', (error)=>{process.send(`http error ${error}`)});
httpServer.listen(PORT, () => { //sever starting
  process.send(['WebSocket server is listening on port',PORT ,'PID', process.pid])
  getMoexSharesQuotesLast().subscribe(res=>process.send([res]))  //update moex quotes with last open prices via moex api
});
const wsServer = new WebSocketServer ({ server: httpServer }); 
wsServer.on('close', ()=> process.send(['WS Server is closed. Clients connected:',wsServer.clients.size]));
wsServer.on('error;', (error)=>{process.send(['http error' ,error])});
wsServer.on("connection", async (ws, req) => {
  let newClient = Array.from(wsServer.clients).pop()
  newClient.manage=req.url; //adding property to differ managing stream sockets from sockets receiving only quotes stream 
  newClient.id=req.headers['sec-websocket-key']
  process.send(['Client connected ID:',newClient.id,'| URL:', req.url]);
  ws.on('error',(event)=>{process.send(['Ws Server error',event])})
  ws.on("close", () =>   process.send(['Client disconnected ID:',ws.id,'| URL:',ws.manage]));
  ws.on("message", (message) => { // handle commands sent to server to manage streams of quotes
    let cmdIns = JSON.parse(message.toString());
    switch (cmdIns.cmd) {
      case "start": //start new stream and stop 
        quotesStreamHandlers.stopQuotesStreams();
        quotesStreamHandlers.simulateRatesFlow(wsServer, cmdIns.timeToWork, cmdIns.intervalToEmit, cmdIns.symbolQty ); //create new stream of quotes
        break;
      case "stop": //stop stream of quotes
        quotesStreamHandlers.stopQuotesStreams();
        quotesStreamHandlers.shareConnectionStatus(wsServer,'stream_stopped');
      break;
    }
  });
});