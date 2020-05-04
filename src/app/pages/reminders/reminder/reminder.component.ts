// -----------------------------------//
// Dependencies and libraries imports //
// -----------------------------------//
import {AfterViewInit, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar} from "@angular/material";
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {ApiService} from "../../../services/api/api.service";
import {BranchService} from "../../../services/branch/branch.service";
import {AuthService} from "../../../services/auth/auth.service";
import {debounceTime, startWith, switchMap, takeUntil} from "rxjs/operators";
import {Observable, Subject} from "rxjs";
import {LoadingService} from "../../../services/loading/loading.service";
import {ModalConfirmComponent} from "../../../modals/modal-confirm/modal-confirm.component";
import {QueryFactory} from "../../../tableQueries/queryFactory";

export interface dataIn {
  reminder: any;
  title: string;
  isNew: boolean;
}
@Component({
  selector: 'app-reminder',
  templateUrl: './reminder.component.html',
  styleUrls: ['./reminder.component.scss']
})
export class ReminderComponent implements OnInit, AfterViewInit {

  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  private onDestroy = new Subject<void>();
  public today = new Date();
  public userRole = "";
  public users: any[] = [];
  public availableOptions: Observable<any>;
  public participantBelongs: any[] = [];
  private hasChanges = false;
  // --------------------- //
  // Component constructor //
  // --------------------- //
  constructor(
      private dialogRef: MatDialogRef<ReminderComponent>,
      private fb: FormBuilder,
      private apiService: ApiService,
      private authService: AuthService,
      private snackBar: MatSnackBar,
      private loadingService: LoadingService,
      private dialog: MatDialog,
      private branchService: BranchService,
      private queryFactory: QueryFactory,
      @Inject(MAT_DIALOG_DATA) public dataIn: dataIn
  ) { }
  // --------------------------------------//
  // Form inputs & validations declaration //
  // --------------------------------------//
  addForm = this.fb.group({
    text: new FormControl({value: '', disabled: false}, Validators.required),
    date: new FormControl({value: '', disabled: false}, Validators.required),
    user: new FormControl({value: '', disabled: false}),
    availableUsers: new FormControl({value: '', disabled: false}),
    reminderTime: new FormControl({value: '16:00', disabled: false})
  });
  // ------------------ //
  // On view init cycle //
  // ------------------ //
  ngOnInit(): void {
    if (this.authService.currentUserValue) {
      this.userRole = this.authService.currentUserValue.user.role;
    }
    if (!this.dataIn.isNew) {
      this.addForm.patchValue({
        text: this.dataIn.reminder.text,
        date: this.dataIn.reminder.date,
        createdById: this.dataIn.reminder.createdById,
        sent: this.dataIn.reminder.sent,
        reminderTime: this.setPrevTime(this.dataIn.reminder.date)
      });
      this.loadReminderUsers();
    }
  }

  setPrevTime(date: Date) {
    const tempDate = new Date(date);
    console.log(tempDate);
    const time: string = (tempDate.getHours() > 9 ? tempDate.getHours() : '0' + tempDate.getHours()) + ':' + (tempDate.getMinutes() > 9 ? tempDate.getMinutes() : '0' + tempDate.getMinutes());
    return time;
  }

  loadReminderUsers() {
    if (this.dataIn.reminder.assignedToIds) {
      if (this.dataIn.reminder.assignedToIds.length > 0) {
        this.loadingService.showLoader.next(true);
        const reminderFilters: any[] = [];
        for (let x = 0; x < this.dataIn.reminder.assignedToIds.length; x++) {
          reminderFilters.push({ id: this.dataIn.reminder.assignedToIds[x] });
        }
        this.apiService.getDataObjects('AppUsers?filter=' + JSON.stringify({
          where: {
            or: reminderFilters
          }
        })).pipe(takeUntil(this.onDestroy)).subscribe((participants: any[]) => {
          participants.forEach((user) => {
            this.participantBelongs.push(user);
          });
          this.availableOptions = this.addForm.get('availableUsers').valueChanges.pipe(
              debounceTime(250),
              startWith(''),
              switchMap(value => this.loadUserOptions(value))
          );
          setTimeout(() => {
            this.loadingService.showLoader.next(false);
          },150);
        });
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.dataIn.isNew) {
      this.availableOptions = this.addForm.get('availableUsers').valueChanges.pipe(
          debounceTime(250),
          startWith(''),
          switchMap(value => this.loadUserOptions(value))
      );
    }
  }

  loadUserOptions(dataSearch: string) {
    const searchQuery = this.queryFactory.setSearchQuery(dataSearch, ['name']);
    const andObject: any[] = [];
    for (let x = 0; x < this.participantBelongs.length; x++) {
      andObject.push({ id: { neq: this.participantBelongs[x].id } })
    }
    andObject.push(searchQuery);
    /*andObject.push({
      or: [
        { role: 'branchTrader' },
        { role: 'branchAdmin' },
      ]
    });*/
    const whereQuery = { and: andObject };
    const getParticipantsQuery = this.queryFactory.generateGetQuery('AppUsers', whereQuery, 25, 0, 'name ASC', ['branches']);
    return new Observable<any>((objs) => this.apiService.getDataObjects(getParticipantsQuery).subscribe((data: any) => {
      objs.next(data)
    }));
  }

  // ----------------------------//
  // Add data object to database //
  // ----------------------------//
  performRequest() {

    if (this.addForm.status === 'INVALID') {
      this.presentToast('Error in form', 'yellow-snackbar');
    } else {
      const participantsObject: string[] = [];
      for (let x = 0; x < this.participantBelongs.length; x++) {
        participantsObject.push(this.participantBelongs[x].id);
      }
      const reminderDate: Date = this.addForm.get('date').value ? new Date(this.addForm.get('date').value) : new Date();
      const timeObject = this.addForm.get('reminderTime').value.split(':');
      reminderDate.setHours(parseInt(timeObject[0]));
      reminderDate.setMinutes(parseInt(timeObject[1]));
      if (this.dataIn.isNew) {
        /* if is new */
        let newReminder = {
          text: this.addForm.get('text').value,
          date: reminderDate,
          createdById: this.authService.currentUserValue.user.id,
          assignedToIds: participantsObject,
          sent: false,
          hasNote: false,
          noteId: '-'
        };
        console.log(newReminder, 'newReminder');
        /* perform new reminder request*/
        this.apiService.addDataObject(newReminder, 'Reminders').pipe(takeUntil(this.onDestroy)).subscribe((res: any) => {
          this.hasChanges = true;
          this.presentToast('Reminder created succesfullly', 'green-snackbar');
          this.loadingService.showLoader.next(false);
          this.onNoClick();
        }, () => {
          this.presentToast('Connection rejected', 'red-snackbar');
          this.loadingService.showLoader.next(false);
        });
      } else {
        /* if is not new */
        let editReminder = {
          text: this.addForm.get('text').value,
          date: reminderDate,
          createdById: this.authService.currentUserValue.user.id,
          assignedToIds: participantsObject,
          sent: reminderDate.getTime() <= new Date().getTime()
        };
        console.log(editReminder);
        console.log(this.dataIn.reminder.id);
        this.loadingService.showLoader.next(false);
        /* perform edit request */
        this.apiService.editDataObject(this.dataIn.reminder.id, editReminder, 'Reminders').pipe(takeUntil(this.onDestroy)).subscribe(() => {
          if (this.dataIn.reminder.hasNote) {
            this.apiService.editDataObject(this.dataIn.reminder.noteId, {reminderDate: reminderDate},'Notes').pipe(takeUntil(this.onDestroy)).subscribe(() => {
              this.presentToast('Reminder and note edited succesfullly', 'green-snackbar');
              this.loadingService.showLoader.next(false);
              this.hasChanges = true;
              this.onNoClick();
            }, () => {
              this.presentToast('Connection rejected', 'red-snackbar');
              this.loadingService.showLoader.next(false);
            });
          } else {
            this.presentToast('Reminder edited succesfullly', 'green-snackbar');
            this.loadingService.showLoader.next(false);
            this.hasChanges = true;
            this.onNoClick();
          }
        }, (e) => {
          this.presentToast('Connection rejected', 'red-snackbar');
          this.loadingService.showLoader.next(false);
        });
      }
    }
  }

  // ----------------------------//
  // Add user to reminder relation //
  // ----------------------------//
  addParticipant() {
    const selected = this.addForm.get('availableUsers').value;
    if (selected !== '' && typeof selected === 'object') {
      this.participantBelongs.push(selected);
      this.addForm.patchValue({
        availableUsers: ''
      });
      /*if (!this.dataIn.isNew) {
        this.loadingService.showLoader.next(true);
        const reminderRelation = {
          confirmationEmailIds: []
        };
        this.apiService.editDataObject(this.dataIn.prevDeal.id, {}, 'Deals').pipe(takeUntil(this.onDestroy)).subscribe((res) => {
          this.presentToast('Branch added to user succesfullly', 'green-snackbar');
          this.loadingService.showLoader.next(false);
        });
      }*/
    }
  }
  // ----------------------------//
  // Remove user from reminder relation //
  // ----------------------------//
  removeParticipant(user: any) {
    const spliced: any = this.participantBelongs.splice(this.participantBelongs.findIndex(obj => obj.id === user.id), 1);
    this.addForm.patchValue({
      availableUsers: ''
    });
    /*if (!this.dataIn.isNew) {
      this.loadingService.showLoader.next(true);
      this.apiService.deleteDataObject('AppUsers/' + this.dataIn.user.id + '/branches/rel', splicedBranch[0].id).pipe(takeUntil(this.onDestroy)).subscribe((res) => {
        this.presentToast('Branch removed from user succesfullly', 'green-snackbar');
        this.loadingService.showLoader.next(false);
      });
    }*/
  }
  // -------------------------------//
  // Delete data object on database //
  // -------------------------------//
  deleteObject() {
    const dialogRef = this.dialog.open(ModalConfirmComponent, {
      data: {
        button: 'Delete',
        title: 'Reminder',
        subtitle: '¿Are you sure about deleting this reminder?',
        message: [
        ]
      },
      autoFocus: false
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(result => {
      if (result !== undefined) {
        if (result.confirmation) {
          this.apiService.deleteDataObject('Reminders', this.dataIn.reminder.id).pipe(takeUntil(this.onDestroy)).subscribe(() => {
            if (this.dataIn.reminder.hasNote) {
              this.apiService.editDataObject(this.dataIn.reminder.noteId, {hasReminder: false},'Notes').pipe(takeUntil(this.onDestroy)).subscribe(() => {
                this.presentToast('Reminder deleted and note updated succesfully', 'green-snackbar');
                this.hasChanges = true;
                this.onNoClick();
              });
            } else {
              this.presentToast('Reminder deleted succesfully', 'green-snackbar');
              this.hasChanges = true;
              this.onNoClick();
            }
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

  // ---------------------------------------------------//
  // Method to display name and load id on autocomplete //
  // ---------------------------------------------------//
  displayFn(user?: any): string | undefined {
    return user ? user.name : undefined;
  }
  // -------------------//
  // Close modal method //
  // -------------------//
  onNoClick(): void {
    this.dialogRef.close({changes: this.hasChanges});
  }
  // -------------------- //
  // On destroy lifecycle //
  // -------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }

}



