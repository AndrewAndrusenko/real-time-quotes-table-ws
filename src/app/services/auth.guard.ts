import { inject } from '@angular/core';
import { CanActivateChildFn} from '@angular/router';
import { AuthService } from './auth.service';
import { catchError, map, of, switchMap, take, tap } from 'rxjs';
import { StorageService, StorageType } from './storage.service';

export const verifyAccess:CanActivateChildFn = () => {
    const authService = inject(AuthService)
    const storageService = inject(StorageService);
    const appStorage = storageService.initStorageObj(StorageType.IndexDB)
    authService.refreshJWTSub.next(true);
    return authService.jwtRefreshedSub.asObservable()
    .pipe(
      take(1),
      tap(jwt=>authService.userData.next(jwt)),
      switchMap(res=>appStorage.setStorageData('jwt',{code:'jwt',data:res})),
      map(()=>true),
      catchError(()=>{return of(false)})
    )
  }
