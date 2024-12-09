/* eslint-disable @typescript-eslint/no-unused-expressions */
import { ChangeDetectionStrategy,  Component} from '@angular/core';
import { debounceTime, filter, Observable, of, Subscription, switchMap} from 'rxjs';
import { QuotesDataService, IRate } from '../../services/quotes-data.service';
import { FormControl } from '@angular/forms';
import { AppStorage, StorageService, StorageType } from 'src/app/services/storage.service';
@Component({
  selector: 'app-rt-quotes-table',
  templateUrl: './rt-quotes-table.component.html',
  styleUrls: ['./rt-quotes-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RTQuotesTableComponent {
  public filterQuotesList = new FormControl ('');
  public savedFilters = ['A,C','A']
  public cachedTime = 500;
  public quotesData$ : Observable<IRate[]>; //Subsction to the quotes stream
  public newFilter:Observable<boolean>;
  private subsriptions = new Subscription ();
  private appStorage:AppStorage;
  constructor(
    public quotesService: QuotesDataService,
    private storageService:StorageService
  ) {
    this.appStorage = this.storageService.initStorageObj(StorageType.IndexDB)
  }
  ngOnInit(): void {
    this.subsriptions.add(this.appStorage.getStorageData('custom-filter').subscribe(filters=>{
      this.savedFilters= (filters as {code:string,filter:string[]}).filter
    }))
    this.subsriptions.add(this.quotesService.connectionOk$.asObservable().pipe(filter(st=>st===true)).subscribe(()=>{this.getQuotesStream(this.cachedTime)}));
    this.newFilter = this.filterQuotesList.valueChanges.pipe(
      debounceTime(300),
      switchMap((newFilter)=>of(!this.savedFilters.includes(newFilter.toLocaleUpperCase())))
    )
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
  saveFilter(newFilter:string) { //Saving user custom filter in indexDBB
    this.savedFilters.push(newFilter.toLocaleUpperCase());
    this.subsriptions.add(this.appStorage.setStorageData('filterList',{code:'custom-filter',filter:this.savedFilters}).subscribe());
    this.filterQuotesList.updateValueAndValidity();
  }
  deleteFilter(event:MouseEvent, oldFilter:string) { //Deleting user custom filter from indexDBB
    event.stopPropagation();//prevent closing of autocomplete list
    this.savedFilters.splice(this.savedFilters.findIndex(el=>el === oldFilter),1);
    this.subsriptions.add(this.appStorage.setStorageData('filterList',{code:'custom-filter',filter:this.savedFilters}).subscribe());
  }
}