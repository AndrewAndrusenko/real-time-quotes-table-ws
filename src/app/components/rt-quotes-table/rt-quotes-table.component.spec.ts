import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RTQuotesTableComponent } from './rt-quotes-table.component';
import { QuotesDataService } from '../../services/quotes-data.service';
import { TestingMngService, IServerCommand } from '../../services/testing-mng.service';
import { ChangeDetectionStrategy } from '@angular/core';

describe('RTQuotesTableComponent', () => {
  let component: RTQuotesTableComponent;
  let fixture: ComponentFixture<RTQuotesTableComponent>;
  let service: QuotesDataService;
  let serviceTestingHelper: TestingMngService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RTQuotesTableComponent],
      providers: [QuotesDataService],
    })
      .overrideComponent(RTQuotesTableComponent, {
        set: { changeDetection: ChangeDetectionStrategy.Default },
      })
      .compileComponents();
    fixture = TestBed.createComponent(RTQuotesTableComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(QuotesDataService);
    serviceTestingHelper = TestBed.inject(TestingMngService);
  });

  it('receiving data with high frequency testing ', async () => {
    let emmmision = 0; //counter of emit for test to finish
    const cmd: IServerCommand = {
      //command to create testing stream of quotes for 60 sec emiting data every 20 ms from 500 instruments
      cmd: 'start',
      timeToWork: 60000,
      intervalToEmit: 20,
      market: 'm',
    };
    serviceTestingHelper.sendMessageToServer(cmd); //creatintg testing stream of quotes.
    const cachingTime = 20; // caching time equals emiting interaval. real time flow without cache
    expect(
      await new Promise((resolve) => {
        service
          .tapToQuotesStream(cachingTime)
          .subscribe(async (ratesSet) => {
            emmmision++;
            expect(ratesSet.length).toBeGreaterThan(1); //check if there is data from testing server
            // component.quotesDataArray = ratesSet; // omit updating data since change detection set to defalut to control view content
            fixture.detectChanges(); //detect changes in the template
            const rowsInView =
              fixture.nativeElement.ownerDocument.querySelectorAll(
                '.li-row'
              ).length; //take all elements of the quotes list
            await fixture.whenRenderingDone(); //wait till view updated
            expect((rowsInView === ratesSet.length)).toBeTruthy(); //check that all received data has been transfered to the view
            if (emmmision > 1000)  {return resolve(true)} //testing on 1000 emit from server
          });
      })
    );
  }, 60000); //set custom timeout so the test won't fail

  it('data consistency check bid equal or less then ask quote', async () => {
    let emmmision = 0; //counter of emit for test to finish
    const cmd: IServerCommand = {
      //command to create testing stream of quotes for 30 sec emiting data every 20 ms from 500 instruments
      cmd: 'start',
      timeToWork: 10000,
      intervalToEmit: 20,
      market: 'm',
    };
    serviceTestingHelper.sendMessageToServer(cmd); //creatintg testing stream of quotes
    expect(
      await new Promise((resolve) => {
        service.tapToQuotesStream().subscribe((ratesSet) => {
          emmmision++;
          expect(ratesSet.every((rate) => rate.bid <= rate.ask)).toBeTruthy(); //checking quotes
          if (emmmision > 10)  {return resolve(true)} //testing on 10 emit from server
        });
      })
    );
  },10000);

  it('checking of quotes stream intreface ', async () => {
    let emmmision = 0; //counter of emit for test to finish
    const cmd: IServerCommand = {
      //command to create testing stream of quotes for 1 sec
      cmd: 'start',
      timeToWork: 1000,
      intervalToEmit: 20,
      market: 'm',
    };
    serviceTestingHelper.sendMessageToServer(cmd); //creatintg testing stream of quotes
    expect(
      await new Promise((resolve) => {
        service.tapToQuotesStream().subscribe((ratesSet) => {
          //testing interface of data
          emmmision++;
          expect(typeof ratesSet[0].ask).toBe('number');
          expect(typeof ratesSet[0].bid).toBe('number');
          expect(new Date(ratesSet[0].time) instanceof Date).toBe(true);
          expect(typeof ratesSet[0].symbol).toBe('string');
          if (emmmision > 1)  {return resolve(true)} //testing on 1 emit
        });
      })
    );
  });
  it('filter input is initiaated', () => {
    fixture.detectChanges();
    expect(component.filterQuotesList).toBeTruthy();
  });
  it('should create component', () => {
    expect(component).toBeTruthy();
  });
});
