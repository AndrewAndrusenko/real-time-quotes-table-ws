import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RTQuotesTableComponent } from './components/rt-quotes-table/rt-quotes-table.component';
describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent, RTQuotesTableComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
