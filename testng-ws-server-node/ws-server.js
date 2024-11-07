/* eslint-disable @typescript-eslint/no-unused-expressions */
import {WebSocketServer, WebSocket } from 'ws';
import http from "http";
import {promises as fs} from 'fs';
import {getMoexSharesQuotesLast} from './market-quotes-load.js'
import process from 'node:process'
class Rate {
  time; //quotes time
  symbol; //instrument code
  bid; //buy price
  ask; //sell price
}
const PORT = 3003;
var wsStreamMockInt; // interval to mock data stream from server
var ws_timeout;

process.stdin.resume();
process.on('exit', () => console.log('exit')); 
process.on('SIGINT', ()=> {
  shareConnectionStatus('closed') 
  process.exit(1)
});
process.on('SIGUSR1',() => console.log('SIGUSR1')); 
process.on('SIGUSR2',() => console.log('SIGUSR1')); 
process.on('uncaughtException',() => console.log('uncaughtException')); 

const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end("WS-Serever is running");
});

const wsServer = new WebSocketServer ({ server: httpServer }); 
wsServer.on('close', ()=> console.log('server closed'))
wsServer.on('error;', (err)=> console.log('error', err));
wsServer.on("connection", async (ws, req) => {
  console.log('req.url',req.url);
  Array.from(wsServer.clients).pop().manage=req.url; //adding property to differ managing stream sockets from sockets receiving only quotes stream 
  ws.on('error',(event)=>{console.log('ev',event);})
  ws.on("close", client =>  console.log(`Client has disconnected: ${client}`));
  ws.on("message", (message) => { // handle commands sent to server to manage streams of quotes
    console.log(message);
    let cmdIns = JSON.parse(message.toString());
    console.log(cmdIns);
    switch (cmdIns.cmd) {
      case "start": //start new stream and stop existing
        typeof wsStreamMockInt !== "undefined"? clearInterval(wsStreamMockInt) : null; // stop intervals from emmision
        typeof ws_timeout !== "undefined" ? clearTimeout(ws_timeout) : null; // stop times to stop emmision
        simulateRatesFlow( cmdIns.timeToWork, cmdIns.intervalToEmit, cmdIns.symbolQty ); //create new stream of quotes
        break;
      case "stop": //stop stream of quotes
        stopConnection('stopped by command');
      break;
    }
  });
});
httpServer.listen(PORT, () => { //sever starting
  console.log(`WebSocket server is listening on port ${PORT}`);
  getMoexSharesQuotesLast(); //update moex quotes with last open prices via moex api
});

function shareConnectionStatus (msg) {
  wsServer.clients.forEach(client => client.readyState === WebSocket.OPEN && client.manage==='/manage_connection'? client.send(JSON.stringify({message:msg})):null)
}

function stopConnection (msg) {
  typeof wsStreamMockInt !== "undefined"? clearInterval(wsStreamMockInt) : null; // stop intervals from emmision
  typeof ws_timeout !== "undefined" ? clearTimeout(ws_timeout) : null; // stop times to stop emmision;
  shareConnectionStatus('stream_stopped')
  console.log(msg); 
}
//function to mock quotes data stream from a websocket server
//param timeToWork - time of intereval or time of server working and streaming data
//param intervalToEmit - interval of emmision. frequency of emits
//param symbolQty - quantity of instruments inside stream
async function simulateRatesFlow ( timeToWork = 60000 * 30, intervalToEmit = 100) {
  shareConnectionStatus ('stream_started');
  let symbols
  const data = await fs.readFile('quotes.json')
  symbols = JSON.parse(data)
  console.log(symbols.length);
  wsStreamMockInt = setInterval(() => {
    let ratesSet = []; // quotes set to be emited from the mock server
    symbols.forEach((symbol) => {
      let changeQuote = Math.round(Math.random() * 0.53); //flag to generate or not quotes for the specific instrument
      if (changeQuote) {
        let rate = new Rate();
        rate.bid = Math.round(symbol.OPEN * (1 + Math.random() / 10) * 10000) / 10000;
        rate.ask = Math.round(rate.bid * (1 + Math.random() / 10) * 10000) / 10000; // random ask price = random bid + random deviation from bid
        rate.symbol = symbol.SECID.replace('RU000','');
        rate.time = new Date(); 
        ratesSet.push(rate);
      }
    });
     console.log("emitted: ",ratesSet.length);
    wsServer.clients.forEach(client => client.readyState === WebSocket.OPEN && client.manage !=='/manage_connection'? client.send(JSON.stringify(ratesSet)) : null);
  }, intervalToEmit);
  ws_timeout = setTimeout(() => stopConnection('stopped by timer'), timeToWork*1000);//setting timer to stop emmision after given time d
}
