/* eslint-disable @typescript-eslint/no-unused-expressions */
import process from 'node:process';
import {moexRead, nasdaqRead} from './market-quotes-load.js'
import { switchMap,of,tap, catchError, EMPTY } from 'rxjs';
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

export function shareConnectionStatus (wsServer, msg, details='') {
  wsServer.clients.forEach(client => client.readyState === 1 ? client.send(JSON.stringify({message:msg, detail:details})):null)
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
export function simulateRatesFlow (wsServer, timeToWork = 60 * 30, intervalToEmit = 100, source = 'm') {
  timeToWork=timeToWork||60*30;
  intervalToEmit=intervalToEmit||100;
  shareConnectionStatus (wsServer, 'stream_started');
  of(source).pipe(
    switchMap(source => source==='m'? moexRead() : nasdaqRead()),
    tap(symbols => {
      symbols.forEach(el=>el.VALUE=el.OPEN)
      wsStreamMockInt = setInterval(() => {
        let ratesSet = []; // quotes set to be emited from the mock server
        symbols.forEach((symbol) => {
          let changeQuote = Math.round(Math.random() * 0.53); //flag to generate or not quotes for the specific instrument
          if (changeQuote&&symbol.OPEN) {
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
            ['LLY'].includes(rate.symbol)? process.send([rate.symbol,rate.bid,rate.time ]):null
          }
        });
        wsServer.clients.forEach(client => client.readyState === 1 && client.manage !=='/manage_connection'? client.send(JSON.stringify(ratesSet)) : null);
      }, intervalToEmit);
      ws_timeout = setTimeout(() => {stopQuotesStreams(wsServer,'stream_stopped')}, timeToWork*1000);//setting timer to stop emmision after given time d
    }),
    catchError(err=>{
      console.log(err.message);
      shareConnectionStatus (wsServer, 'stream_stopped');
      shareConnectionStatus (wsServer, 'error','Stream has not been started\n'+err.message);
      return EMPTY
    })
  ).subscribe (symbols =>
    process.send(['Stream has been launched for',Number(timeToWork),'sec with', Number(intervalToEmit), 'ms interval',(source.replaceAll('m','moex')).replaceAll('n','nasdaq'), 'is a source with', symbols.length, 'symbols'])
    
  )
}