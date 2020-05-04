import { Injectable, OnDestroy} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject} from 'rxjs';
import { map, takeUntil} from 'rxjs/operators';
import { Router} from '@angular/router';
import {LocalForageService} from '../localForage/local-forage.service';
import {ApiService} from '../api/api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {

  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  // private url = 'http://localhost:3000/'; COMENTE
  private url = 'http://localhost:3400/api/'; // puse

  private onDestroy = new Subject<void>();

  private currentUserSubject: BehaviorSubject<any> = new BehaviorSubject<any>(false);
  public userObservable: Observable<any> = this.currentUserSubject.asObservable();

  public currentUser: Observable<any>;
  public firstLoad = true;

  // ------------------- //
  // Service constructor //
  // ------------------- //
  constructor(
      private http: HttpClient,
      private router: Router,
      private localForage: LocalForageService,
      private apiService: ApiService
  ) {
    this.localForage.getItem('currentUser').then((currentUser) => {
      console.log( 'currentUser', currentUser );
      this.currentUserSubject.next( currentUser );
      this.updateUserData();
    }).catch((e) => {
      console.log( e )
      this.logout(false);
      this.firstLoad = false;
    });

    this.userObservable.pipe(takeUntil(this.onDestroy)).subscribe((changedUser) => {
      if (changedUser && !this.firstLoad) {
        // console.log('Trying to save on localForage');
        this.localForage.setItem('currentUser', changedUser).then(() => {
        });
      }
    });
  }

  // ---------------- //
  // Update user data //
  // ---------------- //
  public updateUserData() {
    const user = this.currentUserValue;
    // this.apiService.getDataObject('users', user.user.id ) COMENTE
    console.log('user', user );
    this.apiService.getDataObject('Admins', user.user.id ) // puse
      .pipe(takeUntil(this.onDestroy))
      .subscribe(( updatedUser ) => {
        console.log('admin', updatedUser);
        if ( JSON.stringify( user.user ) !== JSON.stringify( updatedUser ) ) {
          user.user = updatedUser;
          this.currentUserSubject.next(user);
        }
        if (this.firstLoad) {
          this.firstLoad = false;
        }
      }
    );
  }

  // ------------------------ //
  // Get value of logged user //
  // ------------------------ //
  public get currentUserValue(): any {
    return this.currentUserSubject.getValue();
  }

  // --------------------- //
  // Perform login request //
  // --------------------- //
  login(credentials: any) { // en lugar de admins/login era login
    return new Observable(obj => this.http.post(this.url + 'Admins/login?include=user', credentials ).subscribe((user: any) => {
      console.log(user);
      if (user && user.id) { // gymId
        this.currentUserSubject.next( user );
        obj.next(user);
        // this.router.navigate(['/dashboard']); // puse
        console.log(user);
      }
    }, () => {
      obj.next(false);
      //this.router.navigate(['/dashboard']); // puse
    }));
  }

  // ---------------------- //
  // Perform logout request //
  // ---------------------- //
  logout(req: boolean) {
    if (req) {
      this.http.post<any>( // en lugar de Admins logout era logout
          this.url + 'Admins/logout',
          '',
      ).pipe(takeUntil(this.onDestroy)).subscribe(() => {
        this.cleanSession();
      }, () => {
        this.cleanSession();
      });
    } else {
      this.cleanSession();
    }
  }

  // ------------------ //
  // Clean localForage //
  // ------------------ //
  cleanSession() {
    /*
    this.localForage.getItem('currentBranch').then(() => {
      this.localForage.removeItem('currentBranch').then(() => {
        this.currentUserSubject.next(false);
      });
    }).catch(() => {
      this.currentUserSubject.next(false);
    });
    */
    this.localForage.getItem('currentUser').then(() => {
      this.localForage.removeItem('currentUser').then(() => {
        this.currentUserSubject.next(false);
        this.router.navigate(['/login']);
      });
    }).catch(() => {
      this.currentUserSubject.next(false);
      this.router.navigate(['/login']);
    });
  }

  // -------------------- //
  // On destroy lifecycle //
  // -------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
