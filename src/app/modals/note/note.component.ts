import {AfterViewInit, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subject} from "rxjs";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar} from "@angular/material";
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {ApiService} from "../../services/api/api.service";
import {LoadingService} from "../../services/loading/loading.service";
import {QueryFactory} from "../../tableQueries/queryFactory";
import {debounceTime, startWith, switchMap, takeUntil} from "rxjs/operators";
import {BranchService} from "../../services/branch/branch.service";
import {AuthService} from "../../services/auth/auth.service";
import {ModalConfirmComponent} from "../modal-confirm/modal-confirm.component";

export interface dataIn {
  client: any;
  title: string;
  isNew: boolean;
  prevNote: any;
  note: any;
  // branchId: any;
  branch: any;
}

export class objectValidator {
  static validData(control: FormControl){
    if(typeof control.value !== 'object'){
      return ({validData: true});
    } else {
      return (null);
    }
  }
}

@Component({
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.scss']
})
export class NoteComponent implements OnInit, AfterViewInit, OnDestroy {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  private onDestroy = new Subject<void>();
  public ownerOptions: Observable<any>;
  public availableOptions: Observable<any>;
  public participantBelongs: any[] = [];
  public today = new Date();
  public noteContent = '';
  public quillConfig = {
    toolbar: [
      ['bold', 'underline'],        // toggled buttons

      [{ 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
      [{ 'size': ['small', false, 'large'] }],  // custom dropdown

      [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    ]
  };
  private prevReminder: any = false;
  private hasChanges = false;
  // --------------------- //
  // Component constructor //
  // --------------------- //
  constructor(
      private dialogRef: MatDialogRef<NoteComponent>,
      private fb: FormBuilder,
      private apiService: ApiService,
      private snackBar: MatSnackBar,
      private loadingService: LoadingService,
      private queryFactory: QueryFactory,
      private dialog: MatDialog,
      private branchService: BranchService,
      @Inject(MAT_DIALOG_DATA) public dataIn: dataIn,
      private authService: AuthService
  ) { }
  // --------------------------------------//
  // Form inputs & validations declaration //
  // --------------------------------------//
  addForm = this.fb.group({
    //date: new FormControl({value: '', disabled: false}, Validators.required),
    //date: new FormControl({value: '', disabled: false}, Validators.required),
    // owner: new FormControl({value: '', disabled: false}, [Validators.required, objectValidator.validData]),
    type: new FormControl({value: '', disabled: false}),
    availableUsers: new FormControl({value: '', disabled: false}),
    // notes: new FormControl({value: '', disabled: false}, Validators.required),
    // reminder: new FormControl({value: this.dataIn.isNew ? false : this.dataIn.prevNote.hasReminder, disabled: !this.dataIn.isNew}, Validators.required),
    reminderDate: new FormControl({value: new Date(), disabled: false}),
    reminderTime: new FormControl({value: '16:00', disabled: false})
  });

  changeReminder(data: any) {
    if (data.checked) {
      this.addForm.get('reminderDate').validator = Validators.required;
    } else {
      console.log(data);
      this.addForm.get('reminderDate').setErrors(null);
    }
  }

  setPrevTime(date: Date) {
    const tempDate = new Date(date);
    console.log(tempDate);
    const time: string = (tempDate.getHours() > 9 ? tempDate.getHours() : '0' + tempDate.getHours()) + ':' + (tempDate.getMinutes() > 9 ? tempDate.getMinutes() : '0' + tempDate.getMinutes());
    return time;
  }
  // ------------------ //
  // On view init cycle //
  // ------------------ //
  ngOnInit() {
    if (!this.dataIn.isNew) {
      console.log( 'jajaja', this.dataIn);
      this.noteContent = this.dataIn.note.htmlComments;
      this.addForm.patchValue({
        //date: this.dataIn.prevNote.createdAt,
        type: this.dataIn.note.subject,
        // reminder: this.dataIn.prevNote.hasReminder
      });
      /*
      if (this.dataIn.prevNote.hasReminder) {
        this.addForm.patchValue({
          reminderDate: this.dataIn.prevNote.reminderDate,
          reminderTime: this.setPrevTime(this.dataIn.prevNote.reminderDate)
        });
      }
      */
    }
  }
  // --------------------- //
  // After view init cycle //
  // --------------------- //
  ngAfterViewInit() {
    /* on user search change (managing 250 ms) */
    /*this.ownerOptions = this.addForm.get('owner').valueChanges.pipe(
        debounceTime(250),
        switchMap(value => this.loadOwnerOptions(value))
    );
    this.addForm.patchValue({
      buyer: ''
    });*/
    if (this.dataIn.isNew) {
      this.availableOptions = this.addForm.get('availableUsers').valueChanges.pipe(
          debounceTime(250),
          startWith(''),
          switchMap(value => this.loadUserOptions(value))
      );
    } else {
      if (this.dataIn.prevNote.hasReminder) {
        this.loadPrevReminder();
        this.loadReminderUsers();
      }
    }
    /* on user search change (managing 250 ms) */
  }

  loadPrevReminder() {
    this.apiService.getDataObjects('Reminders?filter=' + JSON.stringify({
      where: {
        noteId: this.dataIn.prevNote.id
      }
    })).pipe(takeUntil(this.onDestroy)).subscribe((reminder) => {
      console.log(reminder);
      if (reminder) {
        this.prevReminder = reminder[0];
      } else {
        this.prevReminder = false;
      }
    });
  }
  // ---------------------------------------------------//
  // Method to load reminder users //
  // ---------------------------------------------------//
  loadReminderUsers() {
    if (this.dataIn.prevNote.participants) {
      if (this.dataIn.prevNote.participants.length > 0) {
        this.loadingService.showLoader.next(true);
        const reminderFilters: any[] = [];
        for (let x = 0; x < this.dataIn.prevNote.participants.length; x++) {
          reminderFilters.push({ id: this.dataIn.prevNote.participants[x] });
        }
        this.apiService.getDataObjects('partners?filter=' + JSON.stringify({
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
  // ---------------------------------------------------//
  // Method to display name and load id on autocomplete //
  // ---------------------------------------------------//
  displayFn(user?: any): string | undefined {
    return user ? user.name : undefined;
  }
  // --------------------------------------------//
  // Method to load buyers with the autocomplete //
  // --------------------------------------------//
  loadOwnerOptions(dataSearch: string) {
    const searchQuery = this.queryFactory.setSearchQuery(dataSearch, ['name']);
    const whereQuery = {
      and: [
        searchQuery,
        /*{
          or: [
            { role: 'branchTrader' },
            { role: 'branchAdmin' },
          ]
        }*/
      ]
    };
    const getBuyersQuery = this.queryFactory.generateGetQuery('partners', whereQuery, 25, 0, 'name ASC', []);
    return new Observable<any>((objs) => this.apiService.getDataObjects(getBuyersQuery).subscribe((data: any) => {
      objs.next(data)
    }));
  }
  // -------------------------------------------------------------//
  // Method to load available users to reminder with the autocomplete //
  // -------------------------------------------------------------//
  loadUserOptions(dataSearch: string) {
    const searchQuery = this.queryFactory.setSearchQuery(dataSearch, ['name']);
    const andObject: any[] = [];
    for (let x = 0; x < this.participantBelongs.length; x++) {
      andObject.push({ id: { neq: this.participantBelongs[x].id } });
    }
    andObject.push({ id: { neq: this.authService.currentUserValue.user.id } });
    andObject.push(searchQuery);
    /*andObject.push({
      or: [
        { role: 'branchTrader' },
        { role: 'branchAdmin' },
      ]
    });*/
    const whereQuery = { and: andObject };
    const getParticipantsQuery = this.queryFactory.generateGetQuery('partners', whereQuery, 25, 0, 'name ASC', []);
    return new Observable<any>((objs) => this.apiService.getDataObjects(getParticipantsQuery).subscribe((data: any) => {
      objs.next(data)
    }));
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
  // -------------------//
  // Perform deal create / edit request //
  // -------------------//
  performRequest() {
    if (this.addForm.status === 'INVALID' || this.noteContent === '') {
      this.presentToast('Error in form', 'yellow-snackbar');
    } else {
      // const hasReminder = this.addForm.get('reminder').value;
      const participantsObject: string[] = [];
      for (let x = 0; x < this.participantBelongs.length; x++) {
        participantsObject.push(this.participantBelongs[x].id);
      }
      let text = this.noteContent;
      text = text.replace(/<style([\s\S]*?)<\/style>/gi, '');
      text = text.replace(/<script([\s\S]*?)<\/script>/gi, '');
      text = text.replace(/<\/div>/ig, '\n');
      text = text.replace(/<\/li>/ig, '\n');
      text = text.replace(/<li>/ig, '  *  ');
      text = text.replace(/<\/ul>/ig, '\n');
      text = text.replace(/<\/p>/ig, '\n');
      text = text.replace(/<br\s*[\/]?>/gi, "\n");
      text = text.replace(/<[^>]+>/ig, '');
      const reminderDate: Date = this.addForm.get('reminderDate').value ? new Date(this.addForm.get('reminderDate').value) : new Date();
      const timeObject = this.addForm.get('reminderTime').value.split(':');
      /*
      if (hasReminder) {
        reminderDate.setHours(parseInt(timeObject[0]));
        reminderDate.setMinutes(parseInt(timeObject[1]));
      }
      */
      if (this.dataIn.isNew) {
        /* if is new */
        const newNote = {
          createdAt: new Date() /*this.addForm.get('date').value*/,
          userId: this.authService.currentUserValue.user.id,
          // clientId: this.dataIn.client.id,
          subject: this.addForm.get('type').value,
          // participants: participantsObject,
          htmlComments: this.noteContent,
          comment: text,
          // hasReminder: hasReminder,
          // reminderDate: reminderDate,
          // reminderSent: false,
          branchOfficeId: this.dataIn.branch.id
        };
        console.log( newNote );
        /* perform add request */

        this.apiService.addDataObject(newNote, 'notes').pipe(takeUntil(this.onDestroy)).subscribe((res: any) => {
          this.presentToast('Nota creada exitosamente', 'green-snackbar');
          this.loadingService.showLoader.next(false);
          this.onNoClick();
          /*
          if (hasReminder) {
            const reminderObject= {
              date: reminderDate,
              text: text,
              createdById: this.authService.currentUserValue.user.id,
              assignedToIds: participantsObject,
              sent: false,
              hasNote: true,
              noteId: res.id
            };
            this.hasChanges = true;
            this.apiService.addDataObject(reminderObject,'Reminders').pipe(takeUntil(this.onDestroy)).subscribe(() => {
              this.presentToast('Note and reminder created succesfullly', 'green-snackbar');
              this.loadingService.showLoader.next(false);
              this.onNoClick();
            }, () => {
              this.presentToast('Connection rejected', 'red-snackbar');
              this.loadingService.showLoader.next(false);
            });
          } else {
            this.presentToast('Note created succesfullly', 'green-snackbar');
            this.loadingService.showLoader.next(false);
            this.onNoClick();
          }
          */
        }, () => {
          this.presentToast('Connection rejected', 'red-snackbar');
          this.loadingService.showLoader.next(false);
        });
      } else {
        /* if is not new */
        const editNote = {
          createdAt: new Date() /*this.addForm.get('date').value*/,
          userId: this.authService.currentUserValue.user.id,
          // clientId: this.dataIn.client.id,
          subject: this.addForm.get('type').value,
          // participants: participantsObject,
          htmlComments: this.noteContent,
          comment: text,
          // hasReminder: hasReminder,
          // reminderDate: reminderDate,
          // reminderSent: false,
          branchOfficeId: this.dataIn.branch.id
        };
        this.apiService.editDataObject(this.dataIn.note.id, editNote, 'notes').pipe(takeUntil(this.onDestroy)).subscribe(() => {
          /*
          if (hasReminder && this.prevReminder) {
            console.log(reminderDate <= new Date());
            const reminderObject= {
              date: reminderDate,
              text: text,
              assignedToIds: participantsObject,
              sent: reminderDate.getTime() <= new Date().getTime()
            };
            console.log(reminderObject);
            this.hasChanges = true;
            this.apiService.editDataObject(this.prevReminder.id, reminderObject,'Reminders').pipe(takeUntil(this.onDestroy)).subscribe(() => {
              this.presentToast('Nota actualizada correctamente', 'green-snackbar');
              this.loadingService.showLoader.next(false);
              this.hasChanges = true;
              this.onNoClick();
            }, () => {
              this.presentToast('Error de conexion', 'red-snackbar');
              this.loadingService.showLoader.next(false);
            });
          } else {
            this.presentToast('Nota actualizada correctamente', 'green-snackbar');
            this.loadingService.showLoader.next(false);
            this.hasChanges = true;
            this.onNoClick();
          }
          */
          this.presentToast('Nota actualizada correctamente', 'green-snackbar');
          this.loadingService.showLoader.next(false);
          this.hasChanges = true;
          this.onNoClick();
        }, (e) => {
          this.presentToast('Error de conexion', 'red-snackbar');
          this.loadingService.showLoader.next(false);
        });
      }
    }
  }

  deleteObject() {
    const dialogRef = this.dialog.open(ModalConfirmComponent, {
      data: {
        button: 'Eliminar',
        title: 'Nota',
        subtitle: '¿ Estas seguro de eliminar esta nota ?',
        message: [
        ]
      },
      autoFocus: false
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(result => {
      if (result !== undefined) {
        if (result.confirmation) {
          this.apiService.deleteDataObject('notes', this.dataIn.note.id).pipe(takeUntil(this.onDestroy)).subscribe(() => {
            this.presentToast('Nota eliminada exitosamente', 'green-snackbar');
            this.loadingService.showLoader.next(false);
            this.onNoClick();
            /*
            if (this.dataIn.prevNote.hasReminder) {
              this.apiService.editDataObject(this.prevReminder.id, {hasNote: false},'Reminders').pipe(takeUntil(this.onDestroy)).subscribe(( newReminder) => {
                console.log(newReminder);
                this.onUserHasNotReply();
              });
            } else {
              this.onUserHasNotReply();
            }
            */
          }, (e) => {
            this.presentToast('Error de conexion', 'red-snackbar');
            this.loadingService.showLoader.next(false);
          });
        }
      }
    });
  }


  onUserHasNotReply() {
    if (this.dataIn.prevNote.hasNotReply) {
      const tagIndex = this.dataIn.client.tags.findIndex(tag => tag === 'Not reply');
      if (tagIndex !== -1) {
        this.dataIn.client.tags.splice(tagIndex, 1);
        this.apiService.editDataObject(this.dataIn.client.id,{
          tags: this.dataIn.client.tags
        }, 'Clients').pipe(takeUntil(this.onDestroy)).subscribe(() => {
          this.presentToast('Note deleted succesfullly', 'green-snackbar');
          this.hasChanges = true;
          this.onNoClick();
        }, () => {
          this.presentToast('Note deleted, but tag was not removed', 'yellow-snackbar');
          this.hasChanges = true;
          this.onNoClick();
        });
      } else {
        this.presentToast('Note deleted succesfullly', 'green-snackbar');
        this.onNoClick();
      }
    } else {
      this.presentToast('Note deleted succesfullly', 'green-snackbar');
      this.hasChanges = true;
      this.onNoClick();
    }
  }
  // ---------------------//
  // Present toast method //
  // ---------------------//
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
    this.dialogRef.close({changes: this.hasChanges});
  }

  setHours(hours: number) {

  }
  // -------------------- //
  // On destroy lifecycle //
  // -------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}