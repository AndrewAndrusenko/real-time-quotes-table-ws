/* eslint-disable @typescript-eslint/no-unused-expressions */
import process from 'node:process'
import http from "http";
import {WebSocketServer } from 'ws';
import * as quotesStreamHandlers from './quotes-stream-handlers.js'
import {getMoexSharesQuotesLast} from './market-quotes-load.js'
const PORT = 3003;

process.stdin.resume();
process.on('exit', () => console.log('exit. clients connected:',wsServer.clients.size));
process.on('uncaughtException',() => console.log('uncaughtException')); 
process.on('SIGINT', () => {
  console.log('SIGINT');
  closeWsServer();
  setTimeout(() => process.exit(1), 500);
});

const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end("WS-Serever is running");
});
httpServer.on('close', ()=>{console.log('http close')});
httpServer.on('connection', ()=>{console.log('http connection')});
httpServer.on('error', ()=>{console.log('http error')});
httpServer.listen(PORT, () => { //sever starting
  console.log(`WebSocket server is listening on port ${PORT}`);
  getMoexSharesQuotesLast(); //update moex quotes with last open prices via moex api
});

const wsServer = new WebSocketServer ({ server: httpServer }); 
wsServer.on('close', ()=> console.log('server closed'));
wsServer.on('error;', (err)=> console.log('error', err));
wsServer.on("connection", async (ws, req) => {
  console.log('req.url',req.url);
  let newClient = Array.from(wsServer.clients).pop()
  newClient.manage=req.url; //adding property to differ managing stream sockets from sockets receiving only quotes stream 
  newClient.id=req.headers['sec-websocket-key']
  ws.on('error',(event)=>{console.log('ev',event);})
  ws.on("close", client =>  console.log(`Client has disconnected: ${client}`));
  ws.on("message", (message) => { // handle commands sent to server to manage streams of quotes
    let cmdIns = JSON.parse(message.toString());
    console.log(cmdIns);
    switch (cmdIns.cmd) {
      case "start": //start new stream and stop 
      console.log('start new',);
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

function closeWsServer () {
  console.log(' wsServer.close()', wsServer.clients.size);
  wsServer.clients.forEach(client =>{
    console.log('id',client.id);
    client.close()
  });
  wsServer.close();
  quotesStreamHandlers.shareConnectionStatus(wsServer, 'closeWsServer')
}