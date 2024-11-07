/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import { environment } from 'src/environments/environment';
import { QuotesDataService} from 'src/app/services/quotes-data.service'
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
  private TEST_WS_ENDPOINT = environment.TEST_WS_ENDPOINT+'/manage_connection';
  private webSocketTest:WebSocketSubject<{message:string}|IServerCommand>;
  // private webSocketTest:WebSocket;
  public streamStarted$ = new BehaviorSubject <boolean> (false)
  public quotesStreamIsStarted = false;
  constructor(private quotesDataService:QuotesDataService) {}
  socketOpened (cmd:IServerCommand) {
    console.log('socketOpened',);
    this.webSocketTest.next(cmd)
  }
  createTestingStream(cmd: IServerCommand) { //Creating stream of quotes for testing 
      this.webSocketTest = webSocket({
        url: environment.TEST_WS_ENDPOINT+'/manage_connection',
        openObserver: {next:()=>this.socketOpened(cmd)},
        closeObserver:{next: (event)=>{console.log('closed',event)}}
        })
      this.webSocketTest.pipe(
      ).subscribe(
        {
        next:msg => {
          switch ((msg as {message:string}).message) {
            case 'stream_stopped':
              this.streamStarted$.next(false) 
            break;
            case 'stream_started': 
              this.streamStarted$.next(true);
            break;
            case 'closed':
              this.webSocketTest = null;
              setTimeout(() => {
                this.streamStarted$.getValue() ? this.createTestingStream(cmd) : this.webSocketTest =  webSocket(environment.TEST_WS_ENDPOINT+'/manage_connection');
                this.streamStarted$.next(false);
                
              }, 2000);
              this.quotesDataService.quotesWS$=null;
              this.quotesDataService.streamRestart$.next(true);
            break;
            default: console.log('msg',msg);
          }
        }
      });
      
/*     if (this.webSocketTest && this.webSocketTest.readyState == WebSocket.OPEN) {
      this.webSocketTest.send(JSON.stringify(cmd))
     } else {
      this.webSocketTest = new WebSocket(`${this.TEST_WS_ENDPOINT}`) 
     } */
/*     this.webSocketTest.onopen = () => {
      console.log('ws state',this.webSocketTest.readyState);
      this.webSocketTest.send(JSON.stringify(cmd))

    }; */
/*     this.webSocketTest.onclose = () =>  console.log('onclose');
    this.webSocketTest.onmessage = (msg:MessageEvent<string>) => {
      switch (msg.data) {
        case 'stream_stopped':
          this.streamStarted$.next(false) 
        break;
        case 'stream_started': 
          this.streamStarted$.next(true);
        break;
        case 'closed':
          this.webSocketTest = null;
          setTimeout(() => {
            this.streamStarted$.getValue() ? this.createTestingStream(cmd) : this.webSocketTest = new WebSocket(`${this.TEST_WS_ENDPOINT}`) ;
            this.streamStarted$.next(false);
            
          }, 2000);
          this.quotesDataService.quotesWS$=null;
          this.quotesDataService.streamRestart$.next(true);
        break;
        default: console.log('msg',msg.data);
      }
    } */
  }
}
