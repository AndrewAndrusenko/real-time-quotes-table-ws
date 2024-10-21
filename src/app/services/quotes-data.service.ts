import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { map, throttleTime,  switchMap, pairwise } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
export const WS_ENDPOINT = 'ws://localhost:3003'; //server address
export interface IRate {
  //Intreface for received quotes from server
  time: Date; //quote rate
  symbol: string; // instrument code
  bid: number; // price to buy
  ask: number; // price to sell
}
@Injectable({
  providedIn: 'root',
})
export class QuotesDataService { //Service to handle data stream
  constructor() {}
  private quotesWS$: WebSocketSubject<IRate[]>;
  public quotesDataArray: IRate[] = []; // Quotes array to be displayed in the template
  //Connection to data provider server
  //param endpoint: data provider server address
  private connectToWSServer(endpoint = WS_ENDPOINT): boolean {
    !this.quotesWS$ || this.quotesWS$.closed? (this.quotesWS$ = webSocket(endpoint)) : null;
    return this.quotesWS$.closed;
  }
  //tapToQuotesStrea - Connect to the server and prepare and return stream to manage incoming data
  //param endpoint: data provider server address
  //param cachingTime: time in ms to cache stream before pass it down to the client
  public tapToQuotesStream( endpoint: string = WS_ENDPOINT,  cachingTime: number = 500): Observable<IRate[]> {
    this.connectToWSServer(endpoint);
    return this.quotesWS$.pipe(
      pairwise(),
      map(([oldSet,newSet])=>newSet.concat(oldSet.filter(oldRate=> newSet.every(newRate=>!newRate.symbol.includes(oldRate.symbol))))),
      throttleTime(cachingTime), 
      switchMap(newSetFull => {
        newSetFull.forEach(newRate=> {
          let index = this.quotesDataArray.findIndex(rateRow=>rateRow.symbol===newRate.symbol)
          index>-1?  this.quotesDataArray[index] = newRate : this.quotesDataArray.push(newRate)
        })
        return of(this.quotesDataArray)
      })
    );
  }
}