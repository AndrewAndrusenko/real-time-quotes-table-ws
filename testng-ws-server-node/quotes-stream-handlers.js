/* eslint-disable @typescript-eslint/no-unused-expressions */
import {promises as fs} from 'fs';
import process from 'node:process';
import {quotesPath} from './market-quotes-load.js'
class Rate {
  time; //quotes time
  symbol; //instrument code
  bid; //buy price
  ask; //sell price
  open; //open price
  chgBid;
  chgAsk;
  chgUpDown;
}
const quoteDeviationRate = 500;
var wsStreamMockInt; // interval to mock data stream from server
var ws_timeout;
process.send = process.send || console.log 

export function shareConnectionStatus (wsServer, msg) {
  wsServer.clients.forEach(client => client.readyState === 1 ? client.send(JSON.stringify({message:msg})):null)
}

export function stopQuotesStreams (wsServer,msg) {
  typeof wsStreamMockInt !== "undefined"? clearInterval(wsStreamMockInt) : null; // stop intervals from emmision
  typeof ws_timeout !== "undefined" ? clearTimeout(ws_timeout) : null; // stop times to stop emmision;
  wsServer? shareConnectionStatus (wsServer, msg) : null;
  process.send(['Stream has been stopped'])
}
//function to mock quotes data stream from a websocket server
//param timeToWork - time of intereval or time of server working and streaming data
//param intervalToEmit - interval of emmision. frequency of emits
//param symbolQty - quantity of instruments inside stream
export async function simulateRatesFlow (wsServer, timeToWork = 60 * 30, intervalToEmit = 100) {
  timeToWork=timeToWork||60*30;
  intervalToEmit=intervalToEmit||100;
  shareConnectionStatus (wsServer, 'stream_started');
  let symbols
  const data = await fs.readFile(quotesPath)
  symbols = JSON.parse(data)
  symbols.map((el=>{return el.VALUE=el.OPEN}))
  process.send(['Stream has been launched for',Number(timeToWork),'sec with', Number(intervalToEmit), 'ms interval'])
  console.log('symbols.length',symbols.length);
  wsStreamMockInt = setInterval(() => {
    let ratesSet = []; // quotes set to be emited from the mock server
    symbols.forEach((symbol) => {
      let changeQuote = Math.round(Math.random() * 0.53); //flag to generate or not quotes for the specific instrument
      if (changeQuote) {
        let rate = new Rate();
        rate.chgUpDown = Math.floor(Math.random() * 2)
        let multi = rate.chgUpDown ===1? (1 + Math.random() / quoteDeviationRate) : (1 - Math.random() / quoteDeviationRate)
        rate.bid = Math.round(symbol.VALUE * multi * 10000) / 10000;
        symbol.VALUE = rate.bid;
        rate.ask = Math.round(rate.bid * (1 + Math.random() / quoteDeviationRate) * 10000) / 10000; // random ask price = random bid + random deviation from bid
        rate.symbol = symbol.SECID.replace('RU000','');
        rate.time = new Date(); 
        rate.chgBid = (rate.bid/symbol.OPEN - 1) 
        rate.open= symbol.OPEN;
        ratesSet.push(rate);
      }
    });
    wsServer.clients.forEach(client => client.readyState === 1 && client.manage !=='/manage_connection'? client.send(JSON.stringify(ratesSet)) : null);
  }, intervalToEmit);
  ws_timeout = setTimeout(() => {stopQuotesStreams(wsServer,'stream_stopped')}, timeToWork*1000);//setting timer to stop emmision after given time d
}
