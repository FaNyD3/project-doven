import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {Subject} from "rxjs";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar} from "@angular/material";
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {ApiService} from "../../../../services/api/api.service";
import {LoadingService} from "../../../../services/loading/loading.service";
import {takeUntil} from "rxjs/operators";
import {ModalConfirmComponent} from "../../../../modals/modal-confirm/modal-confirm.component";

export interface dataIn {
  product: any;
  title: string;
  isNew: boolean;
}

@Component({
  selector: 'app-new-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnDestroy, OnInit {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  private onDestroy = new Subject<void>();
  // --------------------- //
  // Component constructor //
  // --------------------- //
  constructor(
      private dialogRef: MatDialogRef<ProductComponent>,
      private fb: FormBuilder,
      private apiService: ApiService,
      private snackBar: MatSnackBar,
      private loadingService: LoadingService,
      private dialog: MatDialog,
      @Inject(MAT_DIALOG_DATA) public dataIn: dataIn
  ) { }
  // --------------------------------------//
  // Form inputs & validations declaration //
  // --------------------------------------//
  addForm = this.fb.group({
    model: new FormControl({value: '', disabled: false}, Validators.required),
    enrollment: new FormControl({value: '', disabled: false}, Validators.required),
    certificationM: new FormControl({value: '', disabled: false}, Validators.required),
    certificationA: new FormControl({value: '', disabled: false}, Validators.required),
    policyS: new FormControl({value: '', disabled: false}, Validators.required),
    binnacleV: new FormControl({value: '', disabled: false}, Validators.required),
    binnacleM: new FormControl({value: '', disabled: false}, Validators.required),
    authorizationOER: new FormControl({value: '', disabled: false}, Validators.required),
    airline: new FormControl({value: '', disabled: false}, Validators.required)
    // createdAt: new FormControl({value: '', disabled: false}, Validators.required)
  });
  // ------------------ //
  // On view init cycle //
  // ------------------ //
  ngOnInit() {
    if (this.dataIn.product) {
      this.addForm.patchValue({
        model: this.dataIn.product.model,
        enrollment: this.dataIn.product.enrollment,
        certificationM: this.dataIn.product.certificationM,
        certificationA: this.dataIn.product.certificationA,
        policyS: this.dataIn.product.policyS,
        binnacleV: this.dataIn.product.binnacleV,
        binnacleM: this.dataIn.product.binnacleM,
        authorizationOER: this.dataIn.product.authorizationOER,
        airline: this.dataIn.product.airline
        // createdAt: this.dataIn.product.createdAt
      });
    }
  }
  // ----------------------------//
  // Add data object to database //
  // ----------------------------//
  performRequest() {
    if (this.addForm.status === 'INVALID') {
      this.presentToast('Error en formulario', 'red-snackbar');
    } else {
      if (this.dataIn.isNew) {
        /* if is new */
        const newProduct = {
          model: this.addForm.get('model').value,
          enrollment: this.addForm.get('enrollment').value,
          certificationM: this.addForm.get('certificationM').value,
          certificationA: this.addForm.get('certificationA').value,
          policyS: this.addForm.get('policyS').value,
          binnacleV: this.addForm.get('binnacleV').value,
          binnacleM: this.addForm.get('binnacleM').value,
          authorizationOER: this.addForm.get('authorizationOER').value,
          airline: this.addForm.get('airline').value
          // createdAt: this.addForm.get('createdAt').value
        };
        console.log(this.dataIn.isNew);
        /* perform add request */
        this.apiService.addDataObject(newProduct, 'Airplains').pipe(takeUntil(this.onDestroy)).subscribe(() => {
          this.presentToast('Airplain creado exitosamente', 'green-snackbar');
          this.loadingService.showLoader.next(false);
          this.onNoClick();
        }, () => {
          this.presentToast('Error de conexion', 'red-snackbar');
          this.loadingService.showLoader.next(false);
        });
      } else {
        /* if is not new */
        const editProduct = {
          model: this.addForm.get('model').value,
          enrollment: this.addForm.get('enrollment').value,
          certificationM: this.addForm.get('certificationM').value,
          certificationA: this.addForm.get('certificationA').value,
          policyS: this.addForm.get('policyS').value,
          binnacleV: this.addForm.get('binnacleV').value,
          binnacleM: this.addForm.get('binnacleM').value,
          authorizationOER: this.addForm.get('authorizationOER').value,
          airline: this.addForm.get('airline').value,
          // createdAt: this.addForm.get('createdAt').value
        };
        /* perform edit request */
        this.apiService.editDataObject(this.dataIn.product.id, editProduct, 'Airplains').pipe(takeUntil(this.onDestroy)).subscribe(() => {
          this.presentToast('Airplain actualizado exitosamente', 'green-snackbar');
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
        title: 'Airplains',
        subtitle: '¿ Estas seguro de eliminar este producto ?',
        message: [
        ]
      },
      autoFocus: false
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(result => {
      if (result !== undefined) {
        if (result.confirmation) {
          this.apiService.deleteDataObject('Airplains', this.dataIn.product.id).pipe(takeUntil(this.onDestroy)).subscribe(() => {
            this.presentToast('Airplain eliminado exitosamente', 'green-snackbar');
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
    this.snackBar.open(message, 'Close', {
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
