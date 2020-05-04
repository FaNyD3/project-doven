import {Component, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

export interface dataIn {
    button: string;
    title: string;
    subtitle: string;
    message: string[];
}

@Component({
  selector: 'app-modal-confirm',
  templateUrl: './modal-confirm.component.html',
  styleUrls: ['./modal-confirm.component.scss']
})

export class ModalConfirmComponent {

  constructor(
      public dialogRef: MatDialogRef<ModalConfirmComponent>,
      @Inject(MAT_DIALOG_DATA) public data: dataIn
  ) { }
    confirm(){
        this.dialogRef.close({ confirmation: true });
    }
    dismiss(): void {
        this.dialogRef.close({ confirmation: false });
    }
}
