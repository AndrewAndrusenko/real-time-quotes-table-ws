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
import { MatAutocompleteModule} from '@angular/material/autocomplete';
import { MatSelectModule} from '@angular/material/select';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { CookieService } from 'ngx-cookie-service';
import { RouterModule } from '@angular/router';
import { AppRouteModule } from './app.routes';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatSnackBarModule} from '@angular/material/snack-bar'
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { HttpErrorsHandlerInterceptor } from './services/errors-http.interceptor';
import { MatMenuModule} from '@angular/material/menu'

export const IndexDBConfig: DBConfig  = {
  name: 'RTQ',
  version: 1,
  objectStoresMeta: [
    {
      store: 'rtq',
      storeConfig: { keyPath: 'code', autoIncrement: false },
      storeSchema: [
        { name: 'code', keypath: 'code', options: { unique: true } },
      ]
    }
  ]
};
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
    MatAutocompleteModule,
    MatSelectModule,
    RouterModule,
    AppRouteModule,
    MatSnackBarModule,
    MatProgressBarModule,
    HttpClientModule,
    MatMenuModule,
    NgxIndexedDBModule.forRoot(IndexDBConfig) 
    
  ],
  providers: [
    provideAnimations(),
    {
      provide:HTTP_INTERCEPTORS,
      useClass:HttpErrorsHandlerInterceptor,
      multi:true
    },
    [CookieService]
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
