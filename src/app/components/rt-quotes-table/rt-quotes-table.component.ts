import { ChangeDetectionStrategy,  Component,} from '@angular/core';
import { Observable, of, switchMap} from 'rxjs';
import { QuotesDataService, IRate } from '../../services/quotes-data.service';
import { FormControl } from '@angular/forms';
@Component({
  selector: 'app-rt-quotes-table',
  templateUrl: './rt-quotes-table.component.html',
  styleUrls: ['./rt-quotes-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RTQuotesTableComponent {
  // public filterQuotesList = new FormControl ('');
  public cachedTime = 500;
  public quotesStreamIsOpened = false; //Status of subscription to the quotes stream
  public quotesData$ : Observable<IRate[]>; //Subsction to the quotes stream
  constructor(private quotesService: QuotesDataService) {}
  getQuotesStream(cahceTime = 500) {//Subscribe to the stream of quotes and handle update of quotes array
    this.quotesData$ = this.quotesService.tapToQuotesStream(undefined, cahceTime)
/*       .pipe(
        switchMap(data=> {
          const filterArray = this.filterQuotesList.getRawValue().split(',');
          if (filterArray[0].length>0) {
            return of(data.filter(row=>filterArray.includes(row.symbol)))
          } else {
            return of (data)
          }
        })
      ); */
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