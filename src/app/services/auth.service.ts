import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, exhaustMap, Subject, tap } from 'rxjs';
import { ENV } from 'src/environments/environment';
import { AppStorage, StorageService, StorageType } from './storage.service';
export interface IJWTInfo {
  role:string,
  userId:string,
  _id:string
}
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public userData: BehaviorSubject<IJWTInfo> = new BehaviorSubject({userId:'',_id:null,role:null})
  public refreshJWTSub: Subject<boolean> = new Subject()
  public jwtRefreshedSub: Subject<IJWTInfo> = new Subject()
  private appStorage: AppStorage
  public count:number= 0
  constructor(
    private http:HttpClient,
    private storageService:StorageService
  ) {
    this.appStorage = this.storageService.initStorageObj(StorageType.IndexDB)
    this.refreshJWTSub
    .pipe(
      tap(()=>console.log('requst to refresh token', this.count++ )),
      exhaustMap(()=>this.http.get <IJWTInfo>(ENV.AUTH_SERVER_ENDPOINT+'refresh',{withCredentials:true})),
      tap(()=>console.log('REFRESHED token')),
      tap((res)=>this.jwtRefreshedSub.next(res)))
    .subscribe(()=>this.count=0)
   }
   logOut (userId:string) {
    this.http.post<boolean>(ENV.AUTH_SERVER_ENDPOINT+'logout',{userId:userId},{withCredentials:true})
    .subscribe(data=>{
      this.appStorage.setStorageData('jwt',{code:'jwt',data:null})
      this.userData.next({userId:'',role:'',_id:''})
      console.log('data',data )})
   }
}
