import {Component, Inject, OnInit} from '@angular/core';
import {Subject} from "rxjs";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar} from "@angular/material";
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import { v4 as uuid } from 'uuid';
import {ModalConfirmComponent} from "../../../../../modals/modal-confirm/modal-confirm.component";
import {takeUntil} from "rxjs/operators";

export interface dataIn {
  plantData: any;
  employeeData: any;
  title: string;
  isNew: boolean;
}

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.scss']
})
export class EmployeeComponent implements OnInit {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  private onDestroy = new Subject<void>();
  public hourOptions: string[] = [];
  // --------------------- //
  // Component constructor //
  // --------------------- //
  constructor(
      private dialogRef: MatDialogRef<EmployeeComponent>,
      private dialog: MatDialog,
      private fb: FormBuilder,
      private snackBar: MatSnackBar,
      @Inject(MAT_DIALOG_DATA) public dataIn: dataIn,
  ) { }
  // --------------------------------------//
  // Form inputs & validations declaration //
  // --------------------------------------//
  addForm = this.fb.group({
    name: new FormControl({value: '', disabled: false}, Validators.required),
    position: new FormControl({value: '', disabled: false}, Validators.required),
    days: new FormControl({value: '', disabled: false}),
    sameSchedule: new FormControl({value: false, disabled: false}),
    startHour: new FormControl({value: '', disabled: false}),
    endHour: new FormControl({value: '', disabled: false}),
    MoStartHour: new FormControl({value: '', disabled: false}),
    MoEndHour: new FormControl({value: '', disabled: false}),
    TuStartHour: new FormControl({value: '', disabled: false}),
    TuEndHour: new FormControl({value: '', disabled: false}),
    WeStartHour: new FormControl({value: '', disabled: false}),
    WeEndHour: new FormControl({value: '', disabled: false}),
    ThStartHour: new FormControl({value: '', disabled: false}),
    ThEndHour: new FormControl({value: '', disabled: false}),
    FrStartHour: new FormControl({value: '', disabled: false}),
    FrEndHour: new FormControl({value: '', disabled: false}),
    SaStartHour: new FormControl({value: '', disabled: false}),
    SaEndHour: new FormControl({value: '', disabled: false}),
    SuStartHour: new FormControl({value: '', disabled: false}),
    SuEndHour: new FormControl({value: '', disabled: false}),
  });
  ngOnInit() {
    this.hourOptions = this.getHours();
    if (!this.dataIn.isNew) {
      this.addForm.patchValue({
        //date: this.dataIn.prevNote.createdAt,
        name: this.dataIn.employeeData.name,
        position: this.dataIn.employeeData.position,
        days: this.setPrevDays(),
        sameSchedule: this.dataIn.employeeData.isAlwaysSame
      });
      this.setPrevSchedule();
    }
  }
  // ---------------------- //
  // Get hours, return: any //
  // ---------------------- //
  getHours() {
    const hoursObject: string[] = [];
    const tempInitHour = this.dataIn.plantData.startHour ? this.getHourIndex(this.dataIn.plantData.startHour): 0;
    // console.log('init hour index  ', tempInitHour);
    const initHour = tempInitHour !== null ? tempInitHour: 0;
    const tempEndHour = this.dataIn.plantData.endHour? (this.getHourIndex(this.dataIn.plantData.endHour) + 1) : 24;
    // console.log('end hour index  ', tempEndHour);
    const endHour = tempEndHour !== null ? tempEndHour: 24;
    for (let x = initHour; x < endHour; x++) {
      if (x === 0) {
        hoursObject.push('12:00 AM');
      } else if (x === 12) {
        hoursObject.push('12:00 PM');
      } else if (x > 12) {
        hoursObject.push((x - 12)+ ':00 PM');
      } else {
        hoursObject.push(x + ':00 AM');
      }
    }
    return hoursObject;
  }
  // ---------------------------------- //
  // Get specific index of string hour
  // params: (hour: string),
  // return: number
  // ---------------------------------- //
  getHourIndex(hour: string) {
    // console.log('searching index ', hour);
    if (hour) {
      for (let x = 0; x < 24; x++) {
        if (x === 0) {
          if (hour === '12:00 AM') {
            return x;
          }
        } else if (x === 12) {
          if (hour === '12:00 PM') {
            return x;
          }
        } else if (x > 12) {
          if (hour === (x - 12) + ':00 PM') {
            return x;
          }
        } else {
          if (hour === x + ':00 AM') {
            return x;
          }
        }
      }
    }
    return null;
  }

  setPrevDays() {
    const days: string[] = [];
    for (let day in this.dataIn.employeeData) {
      if (day !== 'name' && day !== 'position' && day !== 'isAlwaysSame' && day !== 'id') {
        days.push(day);
      }
    }
    return days;
  }

  setPrevSchedule() {
    if (this.dataIn.employeeData.isAlwaysSame) {
      for (let day in this.dataIn.employeeData) {
        if (day !== 'name' && day !== 'position' && day !== 'isAlwaysSame' && day !== 'id') {
          this.addForm.patchValue({
            startHour: this.dataIn.employeeData[day].startHour,
            endHour: this.dataIn.employeeData[day].endHour
          });
          return;
        }
      }
    } else {
      for (let day in this.dataIn.employeeData) {
        if (day !== 'name' && day !== 'position' && day !== 'isAlwaysSame' && day !== 'id') {
          this.addForm.patchValue({
            [day + 'StartHour']: this.dataIn.employeeData[day].startHour,
            [day + 'EndHour']: this.dataIn.employeeData[day].endHour,
          });
        }
      }
    }
  }

  checkDay(searchDay: string) {
    if (this.dataIn.plantData.days){
      if (this.dataIn.plantData.days.findIndex(day => day === searchDay) !== -1) {
        return false;
      }
    } else {
      return false;
    }
    return true;
  }
  // ------------ //
  // Add employee //
  // ------------ //
  performRequest() {
    if (this.addForm.status === 'INVALID') {
      this.presentToast('Error in form', 'yellow-snackbar');
    } else {
      const dailySchedule: any[] = [];
      const selectedDays = this.addForm.get('days').value;
      if (this.addForm.get('sameSchedule').value) {
        let employee: any = {
          name: this.addForm.get('name').value,
          position: this.addForm.get('position').value,
          isAlwaysSame: this.addForm.get('sameSchedule').value
        };
        for (let x = 0; x < selectedDays.length; x++) {
          employee[selectedDays[x]] = {
            startHour: this.addForm.get('startHour').value,
            endHour: this.addForm.get('endHour').value
          };
        }
        if (this.dataIn.isNew) {
          employee.id = uuid();
        } else {
          employee.id = this.dataIn.employeeData.id
        }
        // console.log(employee);
        this.onNoClick(employee, false);
      } else {
        let employee: any = {
          name: this.addForm.get('name').value,
          position: this.addForm.get('position').value,
          isAlwaysSame: this.addForm.get('sameSchedule').value
        };
        for (let x = 0; x < selectedDays.length; x++) {
          employee[selectedDays[x]] = {
            startHour: this.addForm.get(selectedDays[x] + 'StartHour').value,
            endHour: this.addForm.get(selectedDays[x] + 'EndHour').value
          };
        }
        if (this.dataIn.isNew) {
          employee.id = uuid();
        } else {
          employee.id = this.dataIn.employeeData.id
        }
        // console.log(employee);
        this.onNoClick(employee, false);
      }
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

  deleteEmployee() {
    const dialogRef = this.dialog.open(ModalConfirmComponent, {
      data: {
        button: 'Delete',
        title: 'Employee',
        subtitle: '¿Are you sure about deleting this employee?',
        message: [
        ]
      },
      autoFocus: false
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(result => {
      if (result !== undefined) {
        if (result.confirmation) {
          this.onNoClick(this.dataIn.employeeData, true);
        }
      }
    });
  }
  // -------------------//
  // Close modal method //
  // -------------------//
  onNoClick(employee: any, isDelete: boolean ): void {
    this.dialogRef.close({
      employee: employee,
      isDelete: isDelete,
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
