import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TestingMngService } from 'src/app/services/testing-mng.service';

@Component({
  selector: 'app-testing-panel',
  templateUrl: './testing-panel.component.html',
  styleUrls: ['./testing-panel.component.scss'],
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class TestingPanelComponent {
  public quotesStreamIsStarted:Observable<boolean> =  this.testingService.streamStarted$.asObservable()   //Status of the quotes stream
  public manageStreamForm:FormGroup;
  public serverStatus:boolean = this.testingService.webSocketTest&&!this.testingService.webSocketTest.closed
  public panelOpenStateSD:boolean //status of extension panel  
  constructor( public testingService: TestingMngService, private fb:FormBuilder) {
    this.manageStreamForm = this.fb.group ({
      cmd: ['start'],
      timeToWork: [50, { validators:  [Validators.required,Validators.pattern('[0-9]*')]}],
      intervalToEmit: [50,{ validators:  [Validators.required,Validators.pattern('[0-9]*')]}],
      market: ['n']
    })
  }

  manageStream() {
    const cmd = this.testingService.streamStarted$.getValue()? 'stop':'start'
    this.manageStreamForm.get('cmd').patchValue(cmd)
    this.testingService.sendMessageToServer(this.manageStreamForm.value);
  }
 get interval() {return this.manageStreamForm.get('intervalToEmit')}
 get timeToWork() {return this.manageStreamForm.get('timeToWork')}
}
