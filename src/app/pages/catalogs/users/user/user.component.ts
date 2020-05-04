// -----------------------------------//
// Dependencies and libraries imports //
// -----------------------------------//
import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar} from "@angular/material";
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {ApiService} from "../../../../services/api/api.service";
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";
import {LoadingService} from "../../../../services/loading/loading.service";
import {ModalConfirmComponent} from "../../../../modals/modal-confirm/modal-confirm.component";
import {BranchService} from "../../../../services/branch/branch.service";
import {AuthService} from "../../../../services/auth/auth.service";

export interface dataIn {
  user: any;
  title: string;
  isNew: boolean;
}

@Component({
  selector: 'app-new-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnDestroy, OnInit {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  private onDestroy = new Subject<void>();
  public today = new Date();
  public branchOptions: any[] = [];
  public branchBelongs: any[] = [];
  public groupOptions: any[] = [];
  public groupBelongs: any[] = [];
  public adminAccess = false;
  public branchAccess = false;
  // --------------------- //
  // Component constructor //
  // --------------------- //
  constructor(
      private dialogRef: MatDialogRef<UserComponent>,
      private fb: FormBuilder,
      private apiService: ApiService,
      private snackBar: MatSnackBar,
      private loadingService: LoadingService,
      private dialog: MatDialog,
      @Inject(MAT_DIALOG_DATA) public dataIn: dataIn,
      private branchService: BranchService,
      private authService: AuthService
  ) { }
  // --------------------------------------//
  // Form inputs & validations declaration //
  // --------------------------------------//
  addForm = this.fb.group({
    name: new FormControl({value: '', disabled: false}, Validators.required),
    role: new FormControl({value: '', disabled: false}, Validators.required),
    lastName: new FormControl({value: '', disabled: false}, Validators.required),
    email: new FormControl({value: '', disabled: false}, Validators.required),
    birthday: new FormControl({value: '', disabled: false}, Validators.required),
    username: new FormControl({value: '', disabled: false}, Validators.required),
    password: new FormControl({value: '', disabled: false}, this.dataIn.isNew ? Validators.required : null),
    airstrip: new FormControl({value: '', disabled: false}),
    group: new FormControl({value: '', disabled: false})
  });
  // ------------------ //
  // On view init cycle //
  // ------------------ //
  ngOnInit(): void {
    if (this.authService.currentUserValue) {
      const userRole = this.authService.currentUserValue.user.role;
      this.adminAccess = false;
      this.branchAccess = true;
      userRole === 'generalAdmin' ? this.adminAccess = true : this.branchAccess = true;
    }
    this.apiService.getDataObjects('Airstrips').pipe(takeUntil(this.onDestroy)).subscribe((branches: any) => {
      this.branchOptions = branches;
      if (!this.dataIn.isNew) {
        for (let x = 0; x < this.dataIn.user.branches.length; x++) { //aqui hay un error
          const findIndex = this.branchOptions.findIndex(branch => branch.id === this.dataIn.user.branches[x].id);
          console.log(this.branchOptions);
          if (findIndex > -1) {
            const tempBranch = this.branchOptions.splice(findIndex, 1)[0];
            this.branchBelongs.push(tempBranch);
          }
        }
      }
    });
    this.apiService.getDataObjects('Groups').pipe(takeUntil(this.onDestroy)).subscribe((groups: any) => {
      this.groupOptions = groups;
      if (!this.dataIn.isNew) {
        for (let x = 0; x < this.dataIn.user.groups.length; x++) {
          const findIndex = this.groupOptions.findIndex(group => group.id === this.dataIn.user.groups[x].id);
          if (findIndex > -1) {
            const tempGroup = this.groupOptions.splice(findIndex, 1)[0];
            this.groupBelongs.push(tempGroup);
          }
        }
      }
    });
    if (!this.dataIn.isNew) {
      this.addForm.patchValue({
        name: this.dataIn.user.name,
        role: this.dataIn.user.role,
        lastName: this.dataIn.user.lastName,
        email: this.dataIn.user.email,
        birthday: this.dataIn.user.birthday,
        username: this.dataIn.user.username,
        password: this.dataIn.user.password,
      });
    }
  }
  // ----------------------------//
  // Add data object to database //
  // ----------------------------//
  performRequest() {
    // console.log(this.dataIn.user);
    if (this.addForm.status === 'INVALID' || (this.addForm.get('role').value !== 'generalAdmin' && this.branchBelongs.length === 0)) {
      if (this.addForm.status === 'INVALID') {
        this.presentToast('Error en formulario', 'yellow-snackbar');
      } else if (this.branchBelongs.length === 0) {
        this.presentToast('Error, the user must be assigned to a branch', 'yellow-snackbar');
      }
    } else {
      const branchIds = [];
      for (let z = 0; z < this.branchBelongs.length; z++) {
        branchIds.push(this.branchBelongs[z].id);
      }
      if (this.dataIn.isNew) {
        /* if is new */
        const newUser = {
          name: this.addForm.get('name').value,
          role: this.addForm.get('role').value,
          lastName: this.addForm.get('lastName').value,
          email: this.addForm.get('email').value,
          birthday: this.addForm.get('birthday').value,
          username: this.addForm.get('username').value,
          password: this.addForm.get('password').value,
          branchIds: branchIds
        };
        /* perform add request */
        this.apiService.addDataObject(newUser, 'AppUsers').pipe(takeUntil(this.onDestroy)).subscribe((res: any) => {
          this.addBranchesWhereNew(res.id);
        }, () => {
          this.presentToast('Error de conexion', 'red-snackbar');
          this.loadingService.showLoader.next(false);
        });
      } else {
        /* if is not new */
        const editUser = {
          name: this.addForm.get('name').value,
          role: this.addForm.get('role').value,
          lastName: this.addForm.get('lastName').value,
          email: this.addForm.get('email').value,
          birthday: this.addForm.get('birthday').value,
          username: this.addForm.get('username').value
        };
        /* perform edit request */
        this.apiService.editDataObject(this.dataIn.user.id, editUser, 'AppUsers').pipe(takeUntil(this.onDestroy)).subscribe(() => {
          this.presentToast('Usuario actualizado exitosamente', 'green-snackbar');
          this.loadingService.showLoader.next(false);
          this.onNoClick();
        }, (e) => {
          this.presentToast('Error de conexion', 'red-snackbar');
          this.loadingService.showLoader.next(false);
        });
      }
    }
  }
  // -----------------------//
  // Add branches relations //
  // -----------------------//
  addBranchesWhereNew(userId: string) {
    let counter = 0;
    for (let x = 0; x < this.branchBelongs.length; x++) {
      const branchRelation = {
        appUserId: userId,
        branchId: this.branchBelongs[x].id
      };
      this.apiService.addDataRelation(branchRelation, 'AppUsers', 'airstrips/rel', userId, this.branchBelongs[x].id).pipe(takeUntil(this.onDestroy)).subscribe((res) => {
        counter++;
        if (counter === this.branchBelongs.length) {
          if (this.groupBelongs.length > 0) {
            this.addGroupsWhereNew(userId);
          } else {
            this.presentToast('Usuario creado exitosamente', 'green-snackbar');
            this.loadingService.showLoader.next(false);
            this.onNoClick();
          }
        }
      }, () => {
        this.presentToast('Error de conexion', 'red-snackbar');
        this.loadingService.showLoader.next(false);
      });
    }
  }
  // -----------------------//
  // Add groups relations //
  // -----------------------//
  addGroupsWhereNew(userId: string) {
    let counter = 0;
    for (let x = 0; x < this.groupBelongs.length; x++) {
      const groupRelation = {
        appUserId: userId,
        groupId: this.groupBelongs[x].id
      };
      this.apiService.addDataRelation(groupRelation, 'AppUsers', 'groups/rel', userId, this.groupBelongs[x].id).pipe(takeUntil(this.onDestroy)).subscribe((res) => {
        counter++;
        if (counter === this.branchBelongs.length) {
          this.presentToast('User created succesfullly', 'green-snackbar');
          this.loadingService.showLoader.next(false);
          this.onNoClick();
        }
      }, () => {
        this.presentToast('Connection rejected', 'red-snackbar');
        this.loadingService.showLoader.next(false);
      });
    }
  }
  // -------------------------------//
  // Delete data object on database //
  // -------------------------------//
  deleteObject() {
    const dialogRef = this.dialog.open(ModalConfirmComponent, {
      data: {
        button: 'Delete',
        title: 'User',
        subtitle: '¿Are you sure about deleting this user?',
        message: [
        ]
      },
      autoFocus: false
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(result => {
      if (result !== undefined) {
        if (result.confirmation) {
          this.apiService.deleteDataObject('AppUsers', this.dataIn.user.id).pipe(takeUntil(this.onDestroy)).subscribe(() => {
            this.presentToast('User deleted succesfullly', 'green-snackbar');
            this.onNoClick();
          });
        }
      }
    });
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
  // ----------------------------//
  // Mehotd to add new branch //
  // ----------------------------//
  addBranch() {
    const selectedBranch = this.addForm.get('airstrip').value;
    if (selectedBranch !== '') {
      this.addForm.patchValue({
        branch: ''
      });
      const splicedBranch = this.branchOptions.splice(this.branchOptions.findIndex(obj => obj === selectedBranch), 1);
      this.branchBelongs.push(splicedBranch[0]);
      this.dataIn.user.branchIds.push(splicedBranch[0].id);
      if (!this.dataIn.isNew) {
        this.loadingService.showLoader.next(true);
        const branchRelation = {
          appUserId: this.dataIn.user.id,
          branchId: splicedBranch[0].id
        };
        this.apiService.addDataRelation(branchRelation, 'AppUsers', 'airstrips/rel', this.dataIn.user.id, splicedBranch[0].id).pipe(takeUntil(this.onDestroy)).subscribe((res) => {
          this.apiService.editDataObject(this.dataIn.user.id, {branchIds: this.dataIn.user.branchIds}, 'AppUsers').pipe(takeUntil(this.onDestroy)).subscribe(() => {
            this.presentToast('Branch added to user succesfullly', 'green-snackbar');
            this.loadingService.showLoader.next(false);
          }, () => {
            this.presentToast('Connection rejected', 'red-snackbar');
            this.loadingService.showLoader.next(false);
          });
        }, () => {
          this.presentToast('Connection rejected', 'red-snackbar');
          this.loadingService.showLoader.next(false);
        });
      }
    }
  }
  // ----------------------------//
  // Mehotd to add new group //
  // ----------------------------//
  addGroup() {
    const selectedGroup = this.addForm.get('group').value;
    if (selectedGroup !== '') {
      this.addForm.patchValue({
        branch: ''
      });
      const splicedGroup = this.groupOptions.splice(this.groupOptions.findIndex(obj => obj === selectedGroup), 1);
      this.groupBelongs.push(splicedGroup[0]);
      if (!this.dataIn.isNew) {
        this.loadingService.showLoader.next(true);
        const groupRelation = {
          appUserId: this.dataIn.user.id,
          groupId: splicedGroup[0].id
        };
        this.apiService.addDataRelation(groupRelation, 'AppUsers', 'groups/rel', this.dataIn.user.id, splicedGroup[0].id).pipe(takeUntil(this.onDestroy)).subscribe((res) => {
          this.presentToast('Group added to user succesfullly', 'green-snackbar');
          this.loadingService.showLoader.next(false);
        }, () => {
          this.presentToast('Connection rejected', 'red-snackbar');
          this.loadingService.showLoader.next(false);
        });
      }
    }
  }
  // ----------------------------//
  // Mehotd to remove new branch //
  // ----------------------------//
  removeBranch(branch: any) {
    const splicedBranch: any = this.branchBelongs.splice(this.branchBelongs.findIndex(obj => obj === branch), 1);
    this.dataIn.user.branchIds.splice(this.dataIn.user.branchIds.findIndex(obj => obj === branch), 1);
    this.branchOptions.push(splicedBranch[0]);
    if (!this.dataIn.isNew) {
      this.loadingService.showLoader.next(true);
      this.apiService.deleteDataObject('AppUsers/' + this.dataIn.user.id + '/airstrips/rel', splicedBranch[0].id).pipe(takeUntil(this.onDestroy)).subscribe((res) => {
        this.apiService.editDataObject(this.dataIn.user.id, {branchIds: this.dataIn.user.branchIds}, 'AppUsers').pipe(takeUntil(this.onDestroy)).subscribe(() => {
          this.presentToast('Branch removed from user succesfullly', 'green-snackbar');
          this.loadingService.showLoader.next(false);
        }, () => {
          this.presentToast('Connection rejected', 'red-snackbar');
          this.loadingService.showLoader.next(false);
        });
      }, () => {
        this.presentToast('Connection rejected', 'red-snackbar');
        this.loadingService.showLoader.next(false);
      });
    }
  }
  // ----------------------------//
  // Mehotd to remove new branch //
  // ----------------------------//
  removeGroup(group: any) {
    const splicedGroup: any = this.groupBelongs.splice(this.groupBelongs.findIndex(obj => obj === group), 1);
    this.groupOptions.push(splicedGroup[0]);
    if (!this.dataIn.isNew) {
      this.loadingService.showLoader.next(true);
      this.apiService.deleteDataObject('AppUsers/' + this.dataIn.user.id + '/groups/rel', splicedGroup[0].id).pipe(takeUntil(this.onDestroy)).subscribe((res) => {
        this.presentToast('Group removed from user succesfullly', 'green-snackbar');
        this.loadingService.showLoader.next(false);
      }, () => {
        this.presentToast('Connection rejected', 'red-snackbar');
        this.loadingService.showLoader.next(false);
      });
    }
  }
  // -------------------//
  // Close modal method //
  // -------------------//
  onNoClick(): void {
    this.dialogRef.close();
  }
  // -------------------- //
  // On destroy lifecycle //
  // -------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
