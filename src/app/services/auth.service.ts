import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { exhaustMap, Subject, tap } from 'rxjs';
import { ENV } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public refreshJWTSub: Subject<boolean> = new Subject()
  public jwtRefreshedSub: Subject<string> = new Subject()
  public count:number= 0
  constructor(private http:HttpClient) {
    this.refreshJWTSub
    .pipe(
      tap(()=>console.log('requst to refresh token', this.count++ )),
      exhaustMap(()=>this.http.get <string>(ENV.AUTH_SERVER_ENDPOINT,{withCredentials:true})),
      tap(()=>console.log('REFRESHED token')),
      tap((res)=>this.jwtRefreshedSub.next(res)))
    .subscribe(()=>this.count=0)
   }
}
