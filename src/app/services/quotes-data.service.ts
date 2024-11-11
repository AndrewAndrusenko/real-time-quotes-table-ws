/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { map, throttleTime,  switchMap, pairwise } from 'rxjs/operators';
import { Observable, of, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
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
  private quotesWS$: WebSocketSubject<IRate[]>;
  public connectionOk$ = new Subject<boolean> () //Connection status for UI
  private connectionToSwitchMap = new Subject<boolean> () //Connection status for switchMap. It closes with quotesWS$ and doesn't allow to notify UI that connection is closed
  public quotesDataArray: IRate[] = []; // Quotes array to be displayed in the template

  private connectToWSServer(endpoint = environment.TEST_WS_ENDPOINT):Observable<boolean> {
    this.quotesWS$ = webSocket({
      url:  endpoint+'/front',
      openObserver: {next:()=>{
        this.connectionOk$.next(true);
        this.connectionToSwitchMap.next(true);
      }},
      closingObserver:{next:()=>console.log('closing')},
      closeObserver:{next:(event)=>{
        console.log('closed front connection',event);
        this.connectionOk$.next(false)
        this.disconnectFromServer();
      }}
    });
    this.quotesWS$.subscribe({error:err=>console.log('error',err)});
    return this.connectionToSwitchMap.asObservable();
  }

  public tapToQuotesStream( endpoint: string = environment.TEST_WS_ENDPOINT,  cachingTime = 500): Observable<IRate[]> {
    return of(!this.quotesWS$||this.quotesWS$.closed).pipe(
      switchMap(connetionOn=>connetionOn? this.connectToWSServer(endpoint) : of(true)) ,
      switchMap(()=> this.quotesWS$.pipe(
        pairwise(),
        map(([oldSet,newSet])=>newSet.concat(oldSet.filter(oldRate=> newSet.every(newRate=>!newRate.symbol.includes(oldRate.symbol))))),
        throttleTime(cachingTime), 
        switchMap(newSetFull => {
          newSetFull.forEach(newRate=> {
            const index = this.quotesDataArray.findIndex(rateRow=>rateRow.symbol===newRate.symbol)
            index > -1? this.quotesDataArray[index] = newRate : this.quotesDataArray.push(newRate)
          })
          return of(this.quotesDataArray)
        })
      )));
  };

  public disconnectFromServer () {
    this.quotesWS$.unsubscribe();
  }
}