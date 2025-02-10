/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, EMPTY, of,  repeat, switchMap, tap, throwError } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { ENV } from 'src/environments/environment';
import { SnacksService } from './snacks.service';
import { SERVER_ERRORS } from '../types/errors-model';
import { AuthService } from './auth.service';
export interface IServerCommand {
  cmd: string; //command to server: start, stop
  timeToWork: number; //time of emmiting values in milliseconds
  intervalToEmit: number; //interval between emits in milliseconds
  market: string;
}
@Injectable({
  providedIn: 'root',
})
export class TestingMngService { //Service to handle testing functionaly
  constructor(
    private snacksService:SnacksService,
    private authService:AuthService
  ) {}
  public webSocketTest:WebSocketSubject<{message:string}|IServerCommand>;
  public streamStarted$ = new BehaviorSubject <boolean> (false)
  public serverConnection$ = new BehaviorSubject <boolean> (false)
  public quotesStreamIsStarted = false;
  private cmdCurrent:IServerCommand;
  private closeConnectionErrorCode:number;
  private conecctionRetryCount:number = 2;
  private connectionAttemptN:number = 0;
  ngOnDestroy(): void {
    this.webSocketTest.closed? null : this.webSocketTest.unsubscribe();   
  }
  sendMessageToServer (cmd:IServerCommand) {
    this.cmdCurrent = cmd;
    this.webSocketTest&&!this.webSocketTest.closed? this.webSocketTest.next(cmd):this.createTestingStream ();
  }
  private createTestingStream() { //Creating stream of quotes for testing 
    this.webSocketTest = webSocket({
      url: ENV.TEST_WS_ENDPOINT+'/manage_connection',
      openObserver: {next:()=>{
        this.serverConnection$.next(true);
        this.connectionAttemptN = 0;
        this.cmdCurrent? this.webSocketTest.next(this.cmdCurrent):null;
      }},
      closeObserver:{next: (event)=>{
        console.log('createTestingStream closed. code:',event.code)
        this.closeConnectionErrorCode = event.code
        this.streamStarted$.next(false);
        this.serverConnection$.next(false);
       }}
      })
    this.webSocketTest.pipe(
      catchError(err=>{
        console.log('catchError',err)
        if (SERVER_ERRORS.get(this.closeConnectionErrorCode)?.retryConnection){
          throwError(()=>err);
          this.serverConnection$.next(false)
          this.streamStarted$.next(false);
        } 
        return EMPTY;
      }),
      repeat({delay: ()=> {
        this.connectionAttemptN++
        return of(SERVER_ERRORS.get(this.closeConnectionErrorCode)?.authErr===true).pipe(
          tap((jwtError) =>jwtError===true? setTimeout(() => this.authService.refreshJWTSub.next(true), 10) : null),
          switchMap((jwtError) =>jwtError===true? this.authService.jwtRefreshedSub: of(false)),
          switchMap(() => SERVER_ERRORS.get(this.closeConnectionErrorCode)?.retryConnection===false? EMPTY: of(true)),
          tap (()=>{
            if (this.conecctionRetryCount+1 === this.connectionAttemptN) {
              this.connectionAttemptN = 0
              console.log('this.webSocketTest.closed',this.webSocketTest.closed )
              this.webSocketTest.closed? null : this.webSocketTest.unsubscribe();
              this.serverConnection$.next(false);
              SERVER_ERRORS.get(this.closeConnectionErrorCode).errmsgIgnore? null:
              this.snacksService.openSnack(`Error code: ${this.closeConnectionErrorCode}. ${SERVER_ERRORS.get(1).messageToUI} `,'Okay','error-snackBar')
              return EMPTY; 
            };
            console.log(`TestingMngService: Trying to reconnect due to error 
              ${this.closeConnectionErrorCode }. Attempt ${this.connectionAttemptN} out of ${this.conecctionRetryCount}`);
            return of({})
          })
        ) 
      }})
    )
    .subscribe({ 
      next:msg => {
        this.connectionAttemptN = 0;
        switch ((msg as {message:string, detail: string}).message) { 
          case 'stream_stopped':
            console.log('stream_stopped',);
            this.streamStarted$.next(false) 
            this.cmdCurrent = null;
            this.webSocketTest.closed? null : this.webSocketTest.unsubscribe();
            break;
          case 'stream_started': 
            console.log('stream_started',);
            this.streamStarted$.next(true);
          break;
          default: console.log('msg',msg);
        }
      }
    });
  }
}
