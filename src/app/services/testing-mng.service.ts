import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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
  private TEST_WS_ENDPOINT = environment.TEST_WS_ENDPOINT+'/manage_connection';
  private webSocketTest:WebSocket;
  public streamStarted$ = new BehaviorSubject <boolean> (false)
  public quotesStreamIsStarted = false;
  createTestingStream(cmd: IServerCommand) { //Creating stream of quotes for testing purposes
    if (this.webSocketTest && this.webSocketTest.readyState == WebSocket.OPEN) {
      this.webSocketTest.send(JSON.stringify(cmd))
     } else {
      this.webSocketTest = new WebSocket(`${this.TEST_WS_ENDPOINT}`) 
     }
    this.webSocketTest.onopen = () => {
      this.webSocketTest.send(JSON.stringify(cmd));
    };
    this.webSocketTest.onmessage = (msg:MessageEvent<string>) => {
        switch (msg.data) {
          case 'stream_stopped':
            this.streamStarted$.next(false) 
           break;
           case 'stream_started':
            this.streamStarted$.next(true) 
          break;
          default:
            console.log('msg',msg.data);
          break;
        }
    }
  }
}
