import jwt from 'jsonwebtoken';
import { bindNodeCallback, catchError, throwError } from 'rxjs';
import { ENV } from './env/env.js';
export function verifyAccess(cookiesRaw) {
    const parserdCookies = new Map((cookiesRaw.split(';').map(el => el.split('='))).map(el => [el[0], el[1]]));
    const token = parserdCookies.get('A3_AccessToken') || '';
    return bindNodeCallback(jwt.verify)(token, ENV.JWT.JWT_SECRET).pipe(catchError(err => {
        return throwError(() => err);
    }));
}
