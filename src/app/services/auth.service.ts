import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ENV } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private http:HttpClient) { }
  renewAccessJWT ():Observable<boolean> {
    console.log('ENV.AUTH_SERVER_ENDPOINT',ENV.AUTH_SERVER_ENDPOINT )
    return this.http.get <boolean>(ENV.AUTH_SERVER_ENDPOINT,{withCredentials:true})
  }
}
