import jwt from 'jsonwebtoken';
import { bindNodeCallback, catchError, throwError } from 'rxjs';
import { ENV } from './env/env.js';
export function verifyAccess(cookiesRaw) {
    const parserdCookies = new Map((cookiesRaw.split(';').map(el => el.split('='))).map(el => [el[0], el[1]]));
    const token = parserdCookies.get('A3_AccessToken') || '';
    const refresh = parserdCookies.get(' A3_RefreshToken');
    return bindNodeCallback(jwt.verify)(token, ENV.JWT.JWT_SECRET).pipe(catchError(err => {
        reissueJWT(refresh || '');
        return throwError(() => err);
    }));
}
function reissueJWT(refresh) {
    console.log('refresh', refresh);
    fetch("https://p2zpsq4w-3010.euw.devtunnels.ms/quote", { method: 'GET', headers: {
            "Content-Type": "application/json",
            "Autorization": 'Bearer ' + refresh,
        }, });
}
