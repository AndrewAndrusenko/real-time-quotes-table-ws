import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { TestingMngService } from 'src/app/services/testing-mng.service';

@Component({
  selector: 'app-testing-panel',
  templateUrl: './testing-panel.component.html',
  styleUrls: ['./testing-panel.component.scss']
})
export class TestingPanelComponent {
  public quotesStreamIsStarted:Observable<boolean> =  this.testingService.streamStarted$.asObservable()   //Status of the quotes stream
  public manageStreamForm:FormGroup;
  public panelOpenStateSD:boolean //status of extension panel  
  constructor( public testingService: TestingMngService, private ref: ChangeDetectorRef, private fb:FormBuilder) {
    this.manageStreamForm = this.fb.group ({
      cmd: ['start'],
      timeToWork: [6000],
      intervalToEmit: [50],
      symbolQty: [500],
    })
  }
  manageStream(cmd: string) {
    this.manageStreamForm.get('cmd').patchValue(cmd)
    this.testingService.createTestingStream(this.manageStreamForm.value);
  }
}
