/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { throttleTime,  switchMap, filter, timeout, catchError, retry ,repeat} from 'rxjs/operators';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
export interface IRate {
  //Intreface for received quotes from server
  time: Date; //quote rate
  symbol: string; // instrument code
  bid: number; // price to buy
  ask: number; // price to sell
  open: number; // price to sell
  chgBid:number;
  chgAsk:number;
  chgUpDown:number;
}
@Injectable({
  providedIn: 'root',
})
export class QuotesDataService { //Service to handle data stream
  private quotesWS$: WebSocketSubject<IRate[]|{message:string}>;
  public connectionOk$ = new BehaviorSubject <boolean> (false) //Connection status for UI
  public streamActive$ = new BehaviorSubject <boolean> (false) //Stream status for UI
  public quotesDataArray: IRate[] = []; // Quotes array to be displayed in the template

  public connectToWSServer(endpoint = environment.TEST_WS_ENDPOINT) {
    this.quotesWS$ = webSocket({
      url:  endpoint+'/front',
      openObserver: {next:()=>{
        console.log('openObserver');
        this.connectionOk$.next(true);
      }},
      closingObserver:{next:()=>console.log('closing')},
      closeObserver:{next:(event)=>{
        console.log('closed front connection',event);
        this.connectionOk$.next(false)
      }}
    });
    this.quotesWS$.pipe(
      retry({count:2, delay:environment.RETRY_INTERVAL }), 
      repeat({delay: environment.RETRY_INTERVAL }),
      filter(data=>('message' in Object(data))),
    )
    .subscribe({      
      error: err=>{ 
        console.log('error connectToWSServer',err);
        this.streamActive$.next(false);
      },
      next:msg => {
        switch ((msg as {message:string}).message) { 
          case 'stream_started':
            this.streamActive$.next(true) 
            this.connectionOk$.next(true);
            this.quotesDataArray = [];
          break
          case 'stream_stopped':
            this.streamActive$.next(false) 
          break
          default: console.log('msg',msg);
        }
      }
  });
  }

  public tapToQuotesStream( cachingTime = 500): Observable<IRate[]> {
    let bufferRates: IRate[] =[];
    return of(!this.quotesWS$||this.quotesWS$.closed).pipe(
      switchMap(()=> this.quotesWS$.pipe(
        filter(data=>!('message' in Object(data))),
        timeout({ each: environment.STREAM_TIMEOUT}),
        switchMap(newSet =>{ 
          const newSetSymbols =( newSet as IRate[]).map(newRate=>newRate.symbol)
          return of(bufferRates = (newSet as IRate[]).concat(bufferRates.filter(oldRate=>!newSetSymbols.includes(oldRate.symbol))))
        }),
        throttleTime(cachingTime), 
        switchMap(newSetFull => {
          bufferRates = [];
          newSetFull.length && !this.streamActive$.getValue()? this.streamActive$.next(true) : null;
          newSetFull.forEach(newRate=> {
            const index = this.quotesDataArray.findIndex(rateRow=>rateRow.symbol===newRate.symbol)
            index > -1? this.quotesDataArray[index] = newRate : this.quotesDataArray.push(newRate)
          })
          return of(this.quotesDataArray)
        }),
        catchError((err) => {
          console.log('error tapToQuotesStream',err);
          this.streamActive$.next(false) 
          return of(this.quotesDataArray);
        })
      )));
  };

  public disconnectFromServer () {
    this.quotesWS$.closed? null: this.quotesWS$.unsubscribe();
  }
}