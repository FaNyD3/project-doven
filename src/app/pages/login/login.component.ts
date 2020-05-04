import {AfterViewInit, Component, Inject, OnDestroy, OnInit, NgZone, ViewChild} from '@angular/core';
import {Subject} from "rxjs";
import {FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import {AuthService} from "../../services/auth/auth.service";
import {ApiService} from "../../services/api/api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {MatSnackBar} from '@angular/material/snack-bar';
import {LoadingService} from "../../services/loading/loading.service";
import {takeUntil} from "rxjs/operators";
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {MessageModalComponent} from "../../modals/message-modal/message-modal.component";
import {Title} from "@angular/platform-browser";

declare var particlesJS: any;


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  private onDestroy = new Subject<void>();
  private firstLoad = true;
  // --------------------- //
  // Component constructor //
  // --------------------- //
  constructor(
      private authService: AuthService,
      private apiService: ApiService,
      private fb: FormBuilder,
      private router: Router,
      private zone: NgZone,
      // private activateRoute: ActivatedRoute, // comente
      private snackBar: MatSnackBar,
      private loadingService: LoadingService,
      private dialog: MatDialog,
      private titleService: Title
  ) {
    this.setTitle('LOGIN');
  }
  public setTitle(newTitle: string) {
    this.titleService.setTitle( newTitle );
  }
  // --------------------- //
  // FormGroup declaration //
  // --------------------- //
  public loginForm = this.fb.group({
    email: new FormControl({value: '', disabled: false}, Validators.required), // puse
    password: new FormControl({value: '', disabled: false}, Validators.required)
  });


  ngOnInit(): void {
    particlesJS.load('particles-js', 'assets/particles.json', function() {});
    if (this.authService.currentUserValue && this.firstLoad) {
      this.router.navigate(['/dashboard']).catch();
    } else {
      this.authService.userObservable.pipe(takeUntil(this.onDestroy)).subscribe((user) => {
        if (user && this.firstLoad) {
          this.router.navigate(['/dashboard']).catch();
        }
      });
    }
  }
  // ---------------------- //
  // Perform login function //
  // ---------------------- //
  performLogin() {
    if (this.loginForm.status === 'INVALID') {
      this.presentToast('Datos de campo inválidos');
    } else {
      this.firstLoad = false;
      this.loadingService.showLoader.next(true);
   

      const pilot: string = this.loginForm.get('email').value;

      let loginObject: any = {

      email: this.loginForm.get('email').value, // puse
      password: this.loginForm.get('password').value
 
      };
      if (pilot.includes('@')) {
        if (pilot.includes('.')) {
          loginObject.email = pilot;
        } else {
          this.presentToast('El correo es incorrecto');
          return;
        }
      } else {
        loginObject.email = pilot;
      }
      console.log(loginObject);
      this.authService.login( loginObject ).pipe( takeUntil(this.onDestroy)).subscribe((loggedUser: any) => {
        console.log(loggedUser); // hice
        console.log('imprimete gei');
        console.log( loginObject ); // hice
        if ( loggedUser ) {
          // this.registerInOnesignal(loggedUser.userId);
          this.router.navigate(['/dashboard']).then(() => {
            this.loadingService.showLoader.next(false);
          });
        } else {
          this.loadingService.showLoader.next(false);
          this.presentAlert('Error de autentificación', 'Porfavor, verifica tus credenciales.');
        }
      }, (err) => {
        this.loadingService.showLoader.next(false);
        this.presentAlert('Error de conexion', 'Error intentando conectarse al servidor, verifica tu conexion. ' + err);
      });
    }
  }
  // --------------------------- //
  // Show toast on invalid login //
  // --------------------------- //
  presentToast(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['yellow-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: document.documentElement.clientWidth >= 1050 ? 'top' : 'bottom'
    });
  }
  // --------------------------- //
  // Show alert on invalid login //
  // --------------------------- //
  presentAlert(title, msg) {
    this.dialog.open(MessageModalComponent, {
      width: '300px',
      data: {
        title,
        msg
      }
    });
  }
  // -------------------- //
  // On destroy lifecycle //
  // -------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
  // -------------------- //
  // Save user //
  // -------------------- //
  saveNotification(userId, id){
    let notificationToken = {
      appUserId: userId,
      token: id
    };

    this.apiService.addDataObject( notificationToken , 'NotificationTokens').pipe(takeUntil(this.onDestroy)).subscribe((params) => {
      this.router.navigate(['/dashboard']).then(() => {
        this.loadingService.showLoader.next(false);
      });
    }, (e) => {
      console.log('error', e);
      this.router.navigate(['/dashboard']).then(() => {
        this.loadingService.showLoader.next(false);
      });
    });
  }
  // -------------------- //
  // Register user in onesignal //
  // -------------------- //
  registerInOnesignal(userId){
    /*
    console.log(userId, 'registerInOnesignal');
    var OneSignal = window['OneSignal'] || false;
    console.log(OneSignal, 'OneSignal', window.location.href);
    if(window.location.href == "https://www.adroitoverseas.net/#/login"){
      OneSignal.getUserId((id) => {
        console.log(id, 'onesignal');
        this.zone.run(() => {
          this.saveNotification(userId, id);
        });
      }, (e) => {
        console.log(e, 'error');
      });
    }else{
      console.log('onesignal not available');
      this.router.navigate(['/dashboard']).then(() => {
        this.loadingService.showLoader.next(false);
      });
    }
    */
  }
}
