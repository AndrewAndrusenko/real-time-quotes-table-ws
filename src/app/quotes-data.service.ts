import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { tap, map, throttleTime } from 'rxjs/operators';
import { Observable } from 'rxjs';
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
  //Connection to data provider server
  //param endpoint: data provider server address
  private connectToWSServer(endpoint = WS_ENDPOINT): boolean {
    !this.quotesWS$ || this.quotesWS$.closed? (this.quotesWS$ = webSocket(endpoint)) : null;
    
    return this.quotesWS$.closed;
  }
  //tapToQuotesStrea - Connect to the server and prepare and return stream to manage incoming data
  //param endpoint: data provider server address
  //param cachingTime: time in ms to cache stream before pass it down to the client
  public tapToQuotesStream(
    endpoint: string = WS_ENDPOINT,
    cachingTime: number = 500
  ): Observable<IRate[]> {
    let cachedData: IRate[] = []; //cache to store quotes received before throttleTime let them be passed down the stream
    this.connectToWSServer(endpoint);
    return this.quotesWS$.pipe(
      map(
        (newQuotesSet) =>
          (cachedData = newQuotesSet.concat( //Merge new data set with rates from cache which haven't been changed
            cachedData.filter((IRateBF) =>   //take from cache only rates which doesn't exist in new data set and thus rates haven't been changed
              newQuotesSet.every(
                (IRate) => !IRate.symbol.includes(IRateBF.symbol)
              )
            )
          ))
      ),
      throttleTime(cachingTime), //wait for cached time to pass the data down the stream
      tap(() => (cachedData = [])) //when data has been moved down we clear the cache
    );
  }
}
