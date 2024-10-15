import { InjectionToken, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { RTQuotesTableComponent } from './rt-quotes-table/rt-quotes-table.component';
export const WEB_SOCKET = new InjectionToken('WEB_SOCKET');

@NgModule({
  declarations: [AppComponent, RTQuotesTableComponent],
  imports: [BrowserModule],
  bootstrap: [AppComponent],
})
export class AppModule {}
