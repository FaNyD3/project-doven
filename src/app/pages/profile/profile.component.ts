// -----------------------------------//
// Dependencies and libraries imports //
// -----------------------------------//
import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar} from "@angular/material";
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {ApiService} from "../../services/api/api.service";
import {AuthService} from "../../services/auth/auth.service";
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";
import {LoadingService} from "../../services/loading/loading.service";
import {ModalConfirmComponent} from "../../modals/modal-confirm/modal-confirm.component";
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.sass']
})
export class ProfileComponent implements OnInit {

  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  private onDestroy = new Subject<void>();
  public today = new Date();
  public currentProfile = {
    name: ""
  };
  public branchOptions: any[] = [];
  public branchBelongs: any[] = [];
  // --------------------- //
  // Component constructor //
  // --------------------- //
  constructor(
      private fb: FormBuilder,
      private apiService: ApiService,
      private authService: AuthService,
      private snackBar: MatSnackBar,
      private loadingService: LoadingService,
      private titleService: Title
  ) {
    this.setTitle('Profile');
  }
  public setTitle(newTitle: string) {
    this.titleService.setTitle( newTitle );
  }
  // --------------------------------------//
  // Form inputs & validations declaration //
  // --------------------------------------//
  addForm = this.fb.group({
    name: new FormControl({value: '', disabled: false}, Validators.required),
    email: new FormControl({value: '', disabled: false}, Validators.required),
    type: new FormControl({value: '', disabled: false}),
    password: new FormControl({value: '', disabled: false}),
  });
  // ------------------ //
  // On view init cycle //
  // ------------------ //
  ngOnInit(): void {
    if (this.authService.currentUserValue.user) {
      this.currentProfile = this.authService.currentUserValue.user;
      this.addForm.patchValue({
        name: this.authService.currentUserValue.user.name,
        email: this.authService.currentUserValue.user.email,
        type: this.authService.currentUserValue.user.type
      });
    }
  }
  // ----------------------------//
  // Add data object to database //
  // ----------------------------//
  performRequest() {
    if (this.addForm.status === 'INVALID') {
      this.presentToast('Error en formulario', 'yellow-snackbar');
    } else {
      let editUser = {
        name: this.addForm.get('name').value,
        email: this.addForm.get('email').value,
        type: this.addForm.get('type').value
      };
      /* perform edit request */
      this.apiService.editDataObject(this.authService.currentUserValue.user.id, editUser, 'Admins').pipe(takeUntil(this.onDestroy)).subscribe(() => {
        this.presentToast('Usuario actualizado correctamente', 'green-snackbar');
        this.authService.updateUserData();
        this.loadingService.showLoader.next(false);
      }, (e) => {
        this.presentToast('Connexion rechazada', 'red-snackbar');
        this.loadingService.showLoader.next(false);
      });
    }
  }
  // ----------------------------//
  // Present toast method //
  // ----------------------------//
  presentToast(message: string, style: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: [style],
      horizontalPosition: 'end',
      verticalPosition: document.documentElement.clientWidth >= 1050 ? 'top' : 'bottom'
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
export interface dataIn {
  title: string;
}


