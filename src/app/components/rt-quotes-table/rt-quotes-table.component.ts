import { ChangeDetectionStrategy,  ChangeDetectorRef,  Component,} from '@angular/core';
import { Observable } from 'rxjs';
import { QuotesDataService, IRate } from '../../services/quotes-data.service';
@Component({
  selector: 'app-rt-quotes-table',
  templateUrl: './rt-quotes-table.component.html',
  styleUrls: ['./rt-quotes-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RTQuotesTableComponent {
  public filterQuotesList:string = '';
  public cachedTime:number = 500;
  public quotesStreamIsOpened: boolean = false; //Status of subscription to the quotes stream
  public quotesData$ : Observable<IRate[]>; //Subsction to the quotes stream
  constructor(private quotesService: QuotesDataService) {}
  getQuotesStream(cahceTime:number = 500) {//Subscribe to the stream of quotes and handle update of quotes array
    this.quotesData$ = this.quotesService.tapToQuotesStream(undefined, cahceTime);
  }
  resetCacheTime() {
    this.pauseQuotesStream();
    this.getQuotesStream(this.cachedTime)
  }
  trackByfn(index: number, item: IRate) { //trackBy to avoid whole list rendering on update
    return item.symbol + item.time; // quote has to be updated in the view if for given symbol changed time stamp
  }
  pauseQuotesStream() {// stop receiving quotes data
    this.quotesData$ = null;
  }
}