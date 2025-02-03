/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { throttleTime,  switchMap, filter, timeout, catchError, repeat } from 'rxjs/operators';
import { BehaviorSubject, EMPTY, MonoTypeOperatorFunction, Observable, of, throwError } from 'rxjs';
import { ENV } from 'src/environments/environment';
import { SnacksService } from './snacks.service';
import { TConnectionStatus } from '../types/shared-models';
import { SERVER_ERRORS } from '../types/errors-model';
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
export class QuotesDataService { //Service to handle data 
  constructor(private snacksService:SnacksService ) {}
  private quotesWS$: WebSocketSubject<IRate[]|{message:string}>;
  public connectionState$ = new BehaviorSubject <TConnectionStatus> ('disconnected') //Connection status for UI
  public connectionRepeat$ = new BehaviorSubject <{current:number,total:number}|null> (null) //Connection status for UI
  public streamActive$ = new BehaviorSubject <boolean> (false) //Stream status for UI
  public quotesDataArray: IRate[] = []; // Quotes array to be displayed in the template
  private closeConnectionErrorCode:number;
  private conecctionRetryCount:number = 2;
  private connectionAttemptN:number = 0;
  private noReconnectErrors:number[] = Array.from(SERVER_ERRORS).filter(el=>el[1].retryConnection===false).map(el=>el[0])
  public connectToWSServer(endpoint = ENV.TEST_WS_ENDPOINT) {
    this.connectionState$.next('Connecting')
    this.quotesWS$ = webSocket({
      url:  endpoint+'/front',
      openObserver: {next:()=>{
        this.connectionState$.next('connected');
        this.closeConnectionErrorCode = null
      }},
      closingObserver:{next:()=>console.log('closing')},
      closeObserver:{next:(event)=>{
        console.log('UI connection is closed with code: ' ,event.code);
        this.closeConnectionErrorCode = event.code
      }}
    });
    
    this.quotesWS$
    .pipe(
      catchError(err=>{
        this.closeConnectionErrorCode = err.code || this.closeConnectionErrorCode
        if (this.noReconnectErrors.includes(this.closeConnectionErrorCode)){
           throwError(()=>err);
           this.connectionState$.next('disconnected')
        } 
        return EMPTY;
      }),
      this.handleRepeatErrors(),
      filter(data=>('message' in Object(data))),
    )
    .subscribe({      
      next:msg => {
        this.connectionAttemptN = 0;
        this.connectionState$.next('connected');
        switch ((msg as {message:string}).message) { 
          case 'stream_started':
            this.streamActive$.next(true) 
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

  private handleRepeatErrors <T>():MonoTypeOperatorFunction<T> {
    return repeat({
      delay:()=>{
        this.connectionAttemptN ++
        if (this.noReconnectErrors.includes(this.closeConnectionErrorCode)) {
          this.connectionAttemptN = 0;
          this.connectionState$.next('disconnected')
          this.snacksService.openSnack(`Error code: ${this.closeConnectionErrorCode}. ${SERVER_ERRORS.get(this.closeConnectionErrorCode).messageToUI}`,'Okay','error-snackBar')
          return throwError(()=>new Error(this.closeConnectionErrorCode.toString())); 
        };
        this.connectionRepeat$.next({current:this.connectionAttemptN,total:this.conecctionRetryCount})
        console.log(`Trying to reconnect due to error ${this.closeConnectionErrorCode }. Attempt ${this.connectionAttemptN} out of ${this.conecctionRetryCount}`);
        this.connectionState$.next('Reconnecting');
        if (this.conecctionRetryCount+1 === this.connectionAttemptN) {
          this.connectionAttemptN = 0
          this.quotesWS$.complete()
          this.connectionState$.next('disconnected');
          this.snacksService.openSnack(`Error code: ${this.closeConnectionErrorCode}. ${SERVER_ERRORS.get(1).messageToUI} `,'Okay','error-snackBar')
          return EMPTY; 
        };
        return of({});
      }
    })
  }

  public tapToQuotesStream( cachingTime = 500): Observable<IRate[]> {
    let bufferRates: IRate[] =[];
    return of(!this.quotesWS$||this.quotesWS$.closed).pipe(
      switchMap(()=> this.quotesWS$.pipe(
        filter(data=>!('message' in Object(data))),
        timeout({ each: ENV.STREAM_TIMEOUT}),
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
          console.error('error tapToQuotesStream',err);
          this.streamActive$.next(false);
          let errMsg='';
          switch (err.name) {
            case 'TimeoutError': 
            errMsg = `Warning: There has been no new quote for ${ENV.STREAM_TIMEOUT/1000} sec...`
            break
          }
          this.snacksService.openSnack(errMsg,'Okay','error-snackBar')
          return of(this.quotesDataArray)
        }),
      )));
  };

  public disconnectFromServer () {
    this.quotesWS$.closed? null: this.quotesWS$.unsubscribe();
  }
}