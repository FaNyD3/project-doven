import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import { Observable } from 'rxjs';
import {AuthService} from "../auth/auth.service";
import {LocalForageService} from "../localForage/local-forage.service";

@Injectable({
  providedIn: 'root'
})
export class GeneralAdminGuard { // borre implements CanActivate
  constructor(
      private router: Router,
      private authService: AuthService,
      private localForage: LocalForageService
  ) { }
  canActivate(): Promise<boolean> {
    return new Promise((resolve) => {
      this.localForage.getItem('currentUser').then((data) => {
        console.log( 'data', data )
        if (data) {
          resolve(true);
        } else {
          this.router.navigate(['/login']); // comente puse / antes de login
          resolve(false);
        }
      }).catch(err => {
        resolve(false);
      });
    });
  }
}
