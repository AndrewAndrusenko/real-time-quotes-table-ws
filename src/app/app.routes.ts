import { RouterModule, Routes } from '@angular/router';
import { RTQuotesTableComponent } from './components/rt-quotes-table/rt-quotes-table.component';
import { NgModule } from '@angular/core';
import { verifyAccess } from './services/auth.guard';

export const appRoutes: Routes  = [
  {
    path:'',
    component:RTQuotesTableComponent,
    canActivate:[verifyAccess]
  }
];
@NgModule ({
  imports:[RouterModule.forRoot(appRoutes)],
  exports:[RouterModule]
})
export class AppRouteModule {}