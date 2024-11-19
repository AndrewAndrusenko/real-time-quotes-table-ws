/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-prototype-builtins */

import {fromFetch} from 'rxjs/fetch';
import {switchMap, of, from,forkJoin, filter, catchError,map } from 'rxjs';
import fetch from "node-fetch";
import {promises as fs} from 'fs';
import process from 'node:process'

globalThis.fetch = fetch;
const switchResult =  switchMap(response => {return response.ok? response.json() : of({ error: true, message: `Error ${ response.status }`})});
process.send = process.send || console.log 

export function getMoexSharesQuotesLast () {
  const issUrl = new URL('iss/history/engines/stock/markets/shares/securities.json?','https://iss.moex.com/');
  const params = new URLSearchParams({
    'start':0,
    'iss.json': 'extended',
    'iss.meta':'off',
    'history.columns' :'TRADEDATE',
    'limit':1
  });
  issUrl.search = params;
  return forkJoin ({
    lastDateIss: fromFetch(issUrl.href).pipe(switchResult),
    dateLoaded: from(fs.readFile("quotes.json",'utf8')).pipe(map(data=>data? JSON.parse(data)[0].TRADEDATE:''))
  }).pipe (
    filter (data=> data.lastDateIss[1].history[0].TRADEDATE !== data.dateLoaded),
    switchMap(data=> loadMarketDataMOEXiss(data.lastDateIss[1].history[0].TRADEDATE, data.lastDateIss[1]['history.cursor'][0].TOTAL)),
    switchMap((result)=>of(`Moex shares prices are saved for ${result.dateSaved}`))
  )
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
    switchMap(result=> {  
      return forkJoin ({
        dateSaved: of(result[0][1].history[0].TRADEDATE),
        dataSaved : from(fs.writeFile ('./quotes.json',JSON.stringify(result.map(el=>el[1].history).flat()), (err) => {if (err) throw(err)} ))
      })
    }),
    catchError(err => {
      console.error(err);
      return of({ error: true, message: err.message })
    })
  );
}