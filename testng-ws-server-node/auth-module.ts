import  jwt from 'jsonwebtoken'
import { bindNodeCallback, catchError, Observable, throwError } from 'rxjs'
import { ENV } from './env/env.js'

export function verifyAccess (cookiesRaw: string):Observable<string | undefined | jwt.Jwt | jwt.JwtPayload> {
  let parserdCookies :Map <string,string>
  try {
    parserdCookies= new Map ((cookiesRaw.split(';').map(el=>el.split('='))).map(el=>[el[0].trim(),el[1]] as const))
  } catch (error) {
    return throwError(()=>error)
  }
  const token:string = parserdCookies.get('A3_AccessToken')||''
  return bindNodeCallback (jwt.verify)(token,ENV.JWT.JWT_SECRET).pipe(
    catchError(err=>{
      return throwError(()=>err)
    })
  )
}