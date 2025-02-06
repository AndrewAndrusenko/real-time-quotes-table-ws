import { Injectable } from '@angular/core';
import { HttpRequest,HttpHandler,HttpEvent,HttpInterceptor, HttpErrorResponse} from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { SnacksService } from '../services/snacks.service';
import { errorsCode, errorsInfo, IErrorCode } from '../types/errors-model';
import { Location } from '@angular/common';

@Injectable()
export class HttpErrorsHandlerInterceptor implements HttpInterceptor {
  constructor (
    private router : Router,
    private snacksService:SnacksService,
    private location:Location,
  ) 
  { }
  showError (code:number, msg:string|null='') {
    const errorOptions = errorsCode.get(code) as IErrorCode
    this.snacksService.openSnackObserve(errorOptions?.message+'\n '+msg,errorOptions?.buttonName,'error-snackBar').pipe(
      tap(()=>errorOptions?.redirect==true&&errorOptions.externalRoute===true? window.location.href  = errorOptions?.route:null),
      tap(()=>errorOptions?.redirect==true&&errorOptions.externalRoute==false? this.router.navigate([errorOptions?.route]):null),
      tap(()=>errorOptions?.redirect===false&&errorOptions.route==='back'? this.location.back():null)
    ).subscribe()
  }
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      map(res => {return res}),
      catchError((error: HttpErrorResponse) => {
        // let errorMsg = '';
        if (error.error instanceof ErrorEvent) {
          // errorMsg = `Error: ${error.error.message}`;
        } else {
          switch (error.status) {
            case 401:
              this.showError(401,error?.error);
            break;
            case 403:
              this.showError(403);
            break;
            case 0:
              this.showError(0)
            break;
            default:
              console.log('def err',error )
               this.snacksService.openSnack(`Module:${error.error.ml} | Code: ${errorsInfo.get(error.error.msg)||error.error.msg}`,'Okay','error-snackBar');
            break;
          }
        }
        return throwError(() => error)
      })
    )
  }
}
