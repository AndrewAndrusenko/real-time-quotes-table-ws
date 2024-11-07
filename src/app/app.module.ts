import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { RTQuotesTableComponent } from './components/rt-quotes-table/rt-quotes-table.component';
import { MatIconModule} from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule} from '@angular/material/form-field';
import { MatSliderModule} from '@angular/material/slider';
import { MatButtonModule} from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { TestingPanelComponent } from './components/testing-panel/testing-panel.component';
import { MatTooltipModule} from '@angular/material/tooltip'
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatExpansionModule} from '@angular/material/expansion';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
@NgModule({
  declarations: [
    AppComponent, 
    RTQuotesTableComponent, TestingPanelComponent
  ],
  imports: [
    BrowserModule,
    MatIconModule,
    FormsModule,
    MatSliderModule,
    MatButtonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatTooltipModule,
    MatExpansionModule,
    MatAutocompleteModule
  ],
  providers: [
    provideAnimations()
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
