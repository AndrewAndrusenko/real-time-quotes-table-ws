/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from 'src/environments/environment';
export interface IServerCommand {
  cmd: string; //command to server: start, stop
  timeToWork: number; //time of emmiting values in milliseconds
  intervalToEmit: number; //interval between emits in milliseconds
  symbolQty: number; // max quantity of symbols in a stream
}
@Injectable({
  providedIn: 'root',
})
export class TestingMngService { //Service to handle testing functionaly
  public webSocketTest:WebSocketSubject<{message:string}|IServerCommand>;
  public streamStarted$ = new BehaviorSubject <boolean> (false)
  public quotesStreamIsStarted = false;
  ngOnDestroy(): void {
    this.webSocketTest.unsubscribe();   
  }
  sendMessageToServer (cmd:IServerCommand) {
    this.webSocketTest? console.log(this.webSocketTest.closed, this.webSocketTest.observed):null;
    this.webSocketTest&&!this.webSocketTest.closed? this.webSocketTest.next(cmd):this.createTestingStream (cmd);
  }
  private createTestingStream(cmd: IServerCommand) { //Creating stream of quotes for testing 
    this.webSocketTest = webSocket({
      url: environment.TEST_WS_ENDPOINT+'/manage_connection',
      openObserver: {next:()=>{
        console.log('open',cmd);
        this.webSocketTest.next(cmd)}
      },
      closeObserver:{next: (event)=>{
        console.log('closed',event)
        this.streamStarted$.next(false);
        this.webSocketTest.unsubscribe();
      }}
      })
    this.webSocketTest.subscribe({ 
      error: err=>{
        console.log('error',err)
        this.streamStarted$.next(false);
        this.webSocketTest.unsubscribe();
      },
      complete: ()=>console.log('complete'),
      next:msg => {
        switch ((msg as {message:string}).message) { 
          case 'stream_stopped':
            console.log('stream_stopped',);
            this.streamStarted$.next(false) 
          break;
          case 'stream_started': 
            this.streamStarted$.next(true);
          break;
          default: console.log('msg',msg);
        }
      }
    });
  }
}
