import { inject } from '@angular/core';
import { CanActivateChildFn} from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
// import { MatSnackBar } from '@angular/material/snack-bar';

export const verifyAccess:CanActivateChildFn = (
/*   next:ActivatedRouteSnapshot,
  state:RouterStateSnapshot */
) => {
    const cookies = inject(CookieService)
    // const snack = inject(MatSnackBar)

    // if (cookies.get('A3_AccessToken_Shared')=='') {snack.open('Access is forbidden','Ok')};
    return cookies.get('A3_AccessToken_Shared')? true:true
  }
