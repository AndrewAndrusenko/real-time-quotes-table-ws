/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Injectable } from '@angular/core';
import { BehaviorSubject, repeat, retry } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from 'src/environments/environment';
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
  public webSocketTest:WebSocketSubject<{message:string}|IServerCommand>;
  public streamStarted$ = new BehaviorSubject <boolean> (false)
  public serverConnection$ = new BehaviorSubject <boolean> (false)
  public serverError$ = new BehaviorSubject <string> ('')
  public quotesStreamIsStarted = false;
  private cmdCurrent:IServerCommand;
  ngOnDestroy(): void {
    this.webSocketTest.unsubscribe();   
  }
  sendMessageToServer (cmd:IServerCommand) {
    this.cmdCurrent = cmd;
    this.webSocketTest&&!this.webSocketTest.closed? this.webSocketTest.next(cmd):this.createTestingStream ();
  }
  private createTestingStream() { //Creating stream of quotes for testing 
    this.webSocketTest = webSocket({
      url: environment.TEST_WS_ENDPOINT+'/manage_connection',
      openObserver: {next:()=>{
        this.serverConnection$.next(true);
        console.log('open',this.cmdCurrent);
        this.cmdCurrent? this.webSocketTest.next(this.cmdCurrent):null;
      }},
      closeObserver:{next: (event)=>{
        console.log('closed',event)
        this.streamStarted$.next(false);
        this.serverConnection$.next(false);
      }}
      })
    this.webSocketTest.pipe(
      retry({count:2, delay:environment.RETRY_INTERVAL }), 
      repeat({delay: environment.RETRY_INTERVAL })
    ).subscribe({ 
      error: err=>{
        console.log('error',err)
        this.streamStarted$.next(false);
        this.serverConnection$.next(false);
        this.webSocketTest.unsubscribe();
      },
      complete: ()=>console.log('complete'),
      next:msg => {
        switch ((msg as {message:string, detail: string}).message) { 
          case 'stream_stopped':
            console.log('stream_stopped',);
            this.streamStarted$.next(false) 
            this.cmdCurrent = null;
            break;
          case 'stream_started': 
            console.log('stream_started',);
            this.serverError$.next('')
            this.streamStarted$.next(true);
          break;
          case 'error': 
            console.log('error');
            this.serverError$.next((msg as {message:string, detail: string}).detail);
          break;
          default: console.log('msg',msg);
        }
      }
    });
  }
}
