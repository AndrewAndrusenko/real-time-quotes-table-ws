/* eslint-disable @typescript-eslint/no-unused-expressions */
import { ChangeDetectionStrategy,  Component} from '@angular/core';
import { filter, Observable, of, Subscription, switchMap,} from 'rxjs';
import { QuotesDataService, IRate } from '../../services/quotes-data.service';
import { FormControl } from '@angular/forms';
@Component({
  selector: 'app-rt-quotes-table',
  templateUrl: './rt-quotes-table.component.html',
  styleUrls: ['./rt-quotes-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RTQuotesTableComponent {
  public filterQuotesList = new FormControl ('');
  public cachedTime = 500;
  public quotesData$ : Observable<IRate[]>; //Subsction to the quotes stream
  private subsriptions = new Subscription ();
  constructor(public quotesService: QuotesDataService) {}
  ngOnInit(): void {
    this.subsriptions.add(this.quotesService.connectionOk$.asObservable().pipe(filter(st=>st===true)).subscribe(()=>{this.getQuotesStream(this.cachedTime)}));
  }
  ngOnDestroy(): void {
    this.subsriptions.unsubscribe();
  }
  manageStream () {
    this.quotesService.connectionOk$.getValue()? this.disconnectedFromStream() : this.quotesService.connectToWSServer()
  }
  resetCacheTime() {
    this.getQuotesStream(this.cachedTime)
  }
  getQuotesStream(cahceTime = 500) {//Subscribe to the stream of quotes and handle update of quotes array
    this.quotesData$ = this.quotesService.tapToQuotesStream(cahceTime)
      .pipe(
        switchMap(data=> {
          const filterArray = this.filterQuotesList.getRawValue().toLocaleLowerCase().split(',').map(el=>el.trim());
          return of(filterArray[0].length>0? data.filter(row=>filterArray.includes(row.symbol.toLocaleLowerCase())) : data) 
        })
      );
  }
  disconnectedFromStream() {// stop receiving quotes data
    this.quotesService.disconnectFromServer();
  }
  trackByfn(index: number, item: IRate) { //trackBy to avoid whole list rendering on update
    return item.symbol + item.time; // quote has to be updated in the view if for given symbol changed time stamp
  }
  saveFilter() {
    (document.getElementById("my-form") as HTMLFormElement).submit()
  }
}