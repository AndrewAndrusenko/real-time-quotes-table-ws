import { Injectable } from '@angular/core';
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
  private TEST_WS_ENDPOINT: string = 'ws://localhost:3003';
  constructor() {}
  createTestingStream(cmd: IServerCommand) { //Creating stream of quotes for testing purposes
    const webSocketTest = new WebSocket(this.TEST_WS_ENDPOINT);
    webSocketTest.onopen = () => {
      webSocketTest.send(JSON.stringify(cmd));
    };
  }
}
