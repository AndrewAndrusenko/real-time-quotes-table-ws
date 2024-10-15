import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { QuotesDataService, IRate } from '../quotes-data.service';
import { TestingMngService, IServerCommand } from '../testing-mng.service';
@Component({
  selector: 'app-rt-quotes-table',
  templateUrl: './rt-quotes-table.component.html',
  styleUrls: ['./rt-quotes-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RTQuotesTableComponent {
  @ViewChild('filter') public filterQuotesList: ElementRef; //Input to filter incoming quotes list
  public quotesStreamIsOpened: boolean = false; //Status of subscription to the quotes stream
  private quotesData$ = new Subscription(); //Subsction to the quotes stream
  private subsriptions = new Subscription(); //Collection to handle unsubscription when componenet is being destroyed
  public quotesDataArray: IRate[] = []; // Quotes array to be displayed in the template
  constructor(
    private quotesService: QuotesDataService,
    private testingService: TestingMngService,
    private ref: ChangeDetectorRef
  ) {}
  ngOnDestroy(): void {
    this.subsriptions.unsubscribe(); //Close all subsription to avoid memory leaks
  }
  getQuotesStream() {
    //Subscribe to the stream of quotes and handle update of quotes array
    this.quotesStreamIsOpened = true;
    this.subsriptions.add(
      (this.quotesData$ = this.quotesService
        .tapToQuotesStream(undefined, 500)
        .subscribe((newQuotesSet) => {
          //subscribe to quote stream
          //manually update quotes array with new data to optimize rendering.
          //with async pipe there's the whole list of quote is rerendered
          //if data update is moved to the service then component is receiving a lot of events from servie which trigger change detection
          newQuotesSet.forEach((newRate) => {
            let indexDS = this.quotesDataArray.findIndex(
              (IRate) => IRate.symbol === newRate.symbol
            );
            if (indexDS > -1) {
              this.quotesDataArray[indexDS].ask = newRate.ask;
              this.quotesDataArray[indexDS].bid = newRate.bid;
              this.quotesDataArray[indexDS].time = newRate.time;
            } else {
              this.quotesDataArray.push(newRate); //add new quotes to the end of the list
            }
          });
          this.filterQuotesList.nativeElement.value !== ''
            ? (this.quotesDataArray = this.quotesDataArray.filter(
                (quotesData) =>
                  this.filterQuotesList.nativeElement.value
                    .split(',')
                    .includes(quotesData.symbol)
              ))
            : null; //filter updated array to show only selected quotes
          this.ref.detectChanges();
        }))
    );
  }
  trackByfn(index: number, item: IRate) {
    //trackBy to avoid whole list rendering on update
    return item.symbol + item.time; // quote has to be updated in the view if for given symbol changed time stamp
  }
  pauseQuotesStream() {
    // stop receiving quotes data
    this.quotesData$.unsubscribe();
    this.quotesStreamIsOpened = false;
    this.ref.detectChanges();
  }
  manageStream(cmd: string) {
    let cmdIns: IServerCommand = {
      //command to create testing stream of quotes
      cmd: cmd,
      timeToWork: 30000,
      intervalToEmit: 50,
      symbolQty: 500,
    };
    this.testingService.createTestingStream(cmdIns);
  }
}
