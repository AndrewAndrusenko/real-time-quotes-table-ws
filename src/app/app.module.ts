import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { RTQuotesTableComponent } from './rt-quotes-table/rt-quotes-table.component';
import {MatIconModule} from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import {MatSliderModule} from '@angular/material/slider';
import {MatButtonModule} from '@angular/material/button';
@NgModule({
  declarations: [
    AppComponent, 
    RTQuotesTableComponent
  ],
  imports: [
    BrowserModule,
    MatIconModule,
    FormsModule,
    MatSliderModule,
    MatButtonModule
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
