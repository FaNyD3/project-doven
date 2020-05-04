import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {AuthService} from '../auth/auth.service';
// import {Observable} from "rxjs";
import {LocalForageService} from '../localForage/local-forage.service';

@Injectable({
  providedIn: 'root'
})

export class SessionGuard implements CanActivate{ // borre implements CanActivate
  constructor(
      private router: Router,
      private authService: AuthService,
      private localForage: LocalForageService
  ) { }
    canActivate(): Promise<boolean> {
        // clg para saber si funciona guard
        console.log('guard');
        return new Promise((resolve) => {
            this.localForage.getItem('currentUser').then((data) => {
                console.log('data', data );
                if (data) {
                    // this.router.navigate(['/dashboard']);
                    resolve(true);
                } else {
                    this.router.navigate(['/login']);
                    resolve(false);
                }
            }).catch(err => {
                resolve(false);
            });
        });
    }
}
