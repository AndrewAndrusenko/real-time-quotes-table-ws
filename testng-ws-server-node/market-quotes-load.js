/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-prototype-builtins */

import {fromFetch} from 'rxjs/fetch';
import {switchMap, of, from,forkJoin, filter, catchError } from 'rxjs';
import fetch from "node-fetch";
import {promises as fs} from 'fs';
globalThis.fetch = fetch;
const switchResult =  switchMap(response => {return response.ok? response.json() : of({ error: true, message: `Error ${ response.status }`})});

export async function getMoexSharesQuotesLast () {
  const quotesData = await fs.readFile("quotes.json",'utf8');
  let dateLoaded = quotesData? JSON.parse (quotesData)[0].TRADEDATE : undefined;
  const issUrl = new URL('iss/history/engines/stock/markets/shares/securities.json?','https://iss.moex.com/');
  const params = new URLSearchParams({
    'start':0,
    'iss.json': 'extended',
    'iss.meta':'off',
    'history.columns' :'TRADEDATE',
    'limit':1
  });
  issUrl.search = params;
  fromFetch(issUrl.href)
  .pipe (
    switchResult,
    filter (data=> data[1].history[0].TRADEDATE !== dateLoaded),
    switchMap(data=> loadMarketDataMOEXiss(dateLoaded=data[1].history[0].TRADEDATE, data[1]['history.cursor'][0].TOTAL))
  ).subscribe (()=>{
    console.log('Moex shares prices are saved for ',dateLoaded);
  }); 
}
function loadMarketDataMOEXiss (dataToLoad='2024-10-22',rowsToLoad=592 ) {
   const issUrl = new URL('iss/history/engines/stock/markets/shares/securities.json?','https://iss.moex.com/');
   const params = new URLSearchParams({
     date:dataToLoad,
     start:'0',
     'iss.json': 'extended',
     'iss.meta':'off',
     'history.columns' :'TRADEDATE,SECID, VALUE, OPEN'
   });
  issUrl.search = params;
  const issFetchs =[];
  for (let i = 0; i < rowsToLoad ; i=i+100) {
    params.set('start',i)
    issUrl.search = params
    issFetchs.push(fromFetch(issUrl.href).pipe(switchResult))
  };
  return forkJoin(issFetchs).pipe(
    switchMap(result=> {from(fs.writeFile ('./quotes.json',JSON.stringify(result.map(el=>el[1].history).flat()), (err) => {if (err) throw(err)} ))}),
    catchError(err => {
      console.error(err);
      return of({ error: true, message: err.message })
    })
  );
}