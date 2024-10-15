import { TestBed } from '@angular/core/testing';

import { TestingMngService } from './testing-mng.service';

describe('TestingMngService', () => {
  let service: TestingMngService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TestingMngService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
