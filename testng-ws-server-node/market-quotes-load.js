/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-prototype-builtins */

import {fromFetch} from 'rxjs/fetch';
import {switchMap, of, from,forkJoin, filter, catchError,map,tap, throwError } from 'rxjs';
import fetch from "node-fetch";
import {promises as fs} from 'fs';
import process from 'node:process'
export const quotesPath = './data/quotes.json'
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
    dateLoaded: from(fs.readFile(quotesPath,'utf8')).pipe(
      map(data=>data? JSON.parse(data)[0].TRADEDATE:''),
      catchError(err => {
        throwError (()=> new Error(err.message))
      })
    )
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
        dataSaved : from(fs.writeFile (quotesPath, JSON.stringify(result.map(el=>el[1].history).flat()), (err) => {if (err) throw(err)} ))
      })
    }),
    catchError(err => {
      console.error(err);
      return of({ error: true, message: err.message })
    })
  );
}
export function moexRead() {
  return from(fs.readFile(quotesPath)).pipe(
    switchMap(data=>of(JSON.parse(data))),
    map(data=> {return (data.map(el=>{return {...el, VALUE:el.OPEN} } ))}),
    tap(el=>console.log('new',el)),
    catchError(err => {
      console.error(err);
      return of({ error: true, message: err.message })
    })
  )
}
export function nasdaqRead() {
  let quotesResult = []
  let headers =[
    {
      name:'Symbol',
      position:null
    },{
      name:'Last Sale',
      position:null
    }]
  return from (fs.readFile('./data/nasdaq.csv')).pipe(
    map(csvFile=> csvFile.toString().replaceAll('$','').split('\n')),
    tap(file=>console.log('file',file[2].length)),
    switchMap(csvFile=>{
      headers.forEach(header => header.position = csvFile[0].split (',').findIndex(el=>el===header.name));
      csvFile.forEach((rowData,index)=>index>0? quotesResult.push({
        "TRADEDATE":new Date().toLocaleDateString(),
        "SECID":rowData.split(',')[headers[0].position],
        "OPEN": rowData.split(',')[headers[1].position],
        "VALUE": rowData.split(',')[headers[1].position]
      }):null) 
      return of(quotesResult)
    }),
    catchError(err => {
      return throwError (()=> new Error(err.message))
    })
  )
} 