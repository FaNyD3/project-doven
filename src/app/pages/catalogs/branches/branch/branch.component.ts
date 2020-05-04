import {Component, Inject, OnInit} from '@angular/core';
import {Subject} from "rxjs";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar} from "@angular/material";
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {ApiService} from "../../../../services/api/api.service";
import {LoadingService} from "../../../../services/loading/loading.service";
import {takeUntil} from "rxjs/operators";
import {ModalConfirmComponent} from "../../../../modals/modal-confirm/modal-confirm.component";

export interface dataIn {
  branch: any;
  title: string;
  isNew: boolean;
}

@Component({
  selector: 'app-new-branch',
  templateUrl: './branch.component.html',
  styleUrls: ['./branch.component.scss']
})
export class BranchComponent implements OnInit {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  private onDestroy = new Subject<void>();
  colorValue;
  // --------------------- //
  // Component constructor //
  // --------------------- //
  constructor(
      private dialogRef: MatDialogRef<BranchComponent>,
      private fb: FormBuilder,
      private apiService: ApiService,
      private snackBar: MatSnackBar,
      private loadingService: LoadingService,
      private dialog: MatDialog,
      @Inject(MAT_DIALOG_DATA) public dataIn: dataIn
  ) { }
  addForm = this.fb.group({
    name: new FormControl({value: '', disabled: false}, Validators.required),
    color: new FormControl({value: '#109ff5', disabled: false}, Validators.required),
    state: new FormControl({value: '', disabled: false}, Validators.required),
    operationType: new FormControl({value: '', disabled: false}, Validators.required),
    serviceType: new FormControl({value: '', disabled: false}, Validators.required),
    classification: new FormControl({value: '', disabled: false}, Validators.required)
  });
  // ------------------ //
  // On view init cycle //
  // ------------------ //
  ngOnInit() {
    if (!this.dataIn.isNew) {
      this.addForm.patchValue({
        name: this.dataIn.branch.name,
        state: this.dataIn.branch.state,
        operationType: this.dataIn.branch.operationType,
        serviceType: this.dataIn.branch.serviceType,
        classification: this.dataIn.branch.classification,
        color: this.dataIn.branch.color
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
      if (this.dataIn.isNew) {
        /* if is new */
        const newBranch = {
          name: this.addForm.get('name').value,
          state: this.addForm.get('state').value,
          operationType: this.addForm.get('operationType').value,
          serviceType: this.addForm.get('serviceType').value,
          classification: this.addForm.get('classification').value,
          color: this.addForm.get('color').value
        };
        /* perform add request */
        this.apiService.addDataObject(newBranch, 'Airstrips').pipe(takeUntil(this.onDestroy)).subscribe(() => {
          this.presentToast('Airplain creado exitosamente', 'green-snackbar'); // antes de Aerodromo era surcursal
          this.loadingService.showLoader.next(false);
          this.onNoClick();
        }, () => {
          this.presentToast('Connection rejected', 'red-snackbar');
          this.loadingService.showLoader.next(false);
        });
      } else {
        /* if is not new */
        const editBranch = {
          name: this.addForm.get('name').value,
          state: this.addForm.get('state').value,
          operationType: this.addForm.get('operationType').value,
          serviceType: this.addForm.get('serviceType').value,
          classification: this.addForm.get('classification').value,
          color: this.addForm.get('color').value
        };
        /* perform edit request */
        this.apiService.editDataObject(this.dataIn.branch.id, editBranch, 'Airstrips').pipe(takeUntil(this.onDestroy)).subscribe(() => {
          this.presentToast('Airstrip actualizado correctamente', 'green-snackbar'); // antes de aerodromo era sucursal
          this.loadingService.showLoader.next(false);
          this.onNoClick();
        }, (e) => {
          this.presentToast('Error de conexion', 'red-snackbar');
          this.loadingService.showLoader.next(false);
        });
      }
    }
  }
  // -------------------------------//
  // Delete data object on database //
  // -------------------------------//
  deleteObject() {
    const dialogRef = this.dialog.open(ModalConfirmComponent, {
      data: {
        button: 'Eliminar',
        title: 'Airstrip',
        subtitle: '¿ Estas seguro de eliminar esta Airstrip ?',
        message: [
        ]
      },
      autoFocus: false
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(result => {
      if (result !== undefined) {
        if (result.confirmation) {
          this.apiService.deleteDataObject('Airstrips', this.dataIn.branch.id).pipe(takeUntil(this.onDestroy)).subscribe(() => {
            this.presentToast('Airstrip eliminado exitosamente', 'green-snackbar');
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
