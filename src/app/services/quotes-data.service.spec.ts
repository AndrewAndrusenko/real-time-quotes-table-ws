import { TestBed } from '@angular/core/testing';
import { QuotesDataService } from './quotes-data.service';
export const WS_ENDPOINT = 'ws://localhost:3003';
describe('QuotesDataService', () => {
  let service: QuotesDataService;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuotesDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('open connection to server', () => {
    expect(service['connectToWSServer'](WS_ENDPOINT)).toEqual(false);
  });
  it('create pipe to receive data from server', () => {
    expect(service.tapToQuotesStream()).toBeTruthy();
  });
});
