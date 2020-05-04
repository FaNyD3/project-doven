import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";

export interface dataIn {
  title: string;
  subtitle: string;
  msg: string;
}

@Component({
  selector: 'app-message-modal',
  templateUrl: './message-modal.component.html',
  styleUrls: ['./message-modal.component.sass']
})
export class MessageModalComponent {

  constructor(
      public dialogRef: MatDialogRef<MessageModalComponent>,
      @Inject(MAT_DIALOG_DATA) public data: dataIn
  ) { }
  confirm(){
    this.dialogRef.close({ confirmation: true });
  }
  dismiss(): void {
    this.dialogRef.close({ confirmation: false });
  }
}
