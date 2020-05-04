import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";
import {MatBottomSheet, MatDialog, MatPaginator, MatSnackBar, MatSort} from "@angular/material";
import {CustomDataSource} from "../../tableQueries/customDataSource";
import {ApiService} from "../../services/api/api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {QueryFactory} from "../../tableQueries/queryFactory";
import {SharingService} from "../../services/sharing/sharing.service";
import {BranchService} from "../../services/branch/branch.service";
import {AuthService} from "../../services/auth/auth.service";
import {FormControl} from "@angular/forms";
import {debounceTime, takeUntil} from "rxjs/operators";
import {ReminderComponent} from "./reminder/reminder.component";
import {Title} from "@angular/platform-browser";
import {NoteComponent} from "../../modals/note/note.component";
import {animate, state, style, transition, trigger} from "@angular/animations";

@Component({
  selector: 'app-reminders',
  templateUrl: './reminders.component.html',
  styleUrls: ['./reminders.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class RemindersComponent implements OnInit, AfterViewInit, OnDestroy {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  /* manage component */
  @ViewChildren('displayData') displayElem: QueryList<any>;
  @ViewChildren('noData') noDisplayElem: QueryList<any>;
  private onDestroy = new Subject<void>();
  public firstLoad = true;
  /* manage table */
  @ViewChild(MatSort, {static: false}) sort: MatSort;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;
  public dataSource: CustomDataSource;
  public isExpansionDetailRow = (i: number, row: Object) => true;
  public expandedElement: any;
  public displayedColumns: string[] = [
    'text',
    'client',
    'date',
    'button'
  ];
  public displayData = new BehaviorSubject<boolean>(false);
  public tableCount= 0;
  public cellHover = '';
  // --------------------------- //
  // Component constructor //
  // --------------------------- //
  constructor(
      private apiService: ApiService,
      public router: Router,
      public route: ActivatedRoute,
      public queryFactory: QueryFactory,
      public dialog: MatDialog,
      private bottomSheet: MatBottomSheet,
      private sharingService: SharingService,
      private branchService: BranchService,
      private authService: AuthService,
      private titleService: Title,
      private snackBar: MatSnackBar,
  ) {
    this.setTitle('Reminders');
  }
  public setTitle(newTitle: string) {
    this.titleService.setTitle( newTitle );
  }
  // -------------------------------------- //
  // Form inputs & validations declaration  //
  // -------------------------------------- //
  public searchbar = new FormControl({value: '', disabled: false});
  public categories = new FormControl({value: '',disabled: false});
  public year = new FormControl({value: '', disabled: false});
  public type = new FormControl({value: '', disabled: false});
  // ------------------ //
  // On view init cycle //
  // ------------------ //
  ngOnInit() {
    /* on branch change listener */
    this.dataSource = new CustomDataSource(this.apiService);
  }
  // --------------------- //
  // After view init cycle //
  // --------------------- //
  ngAfterViewInit() {
    /* on search change (managing 250 ms) */
    this.searchbar.valueChanges.pipe(
        takeUntil(this.onDestroy),
        debounceTime(250)
    ).subscribe( (dataSearch) => {
      this.loadTableData(dataSearch, this.categories.value, true, this.sort);
    });
    /* listener when data load finish */
    this.displayData.asObservable().pipe(takeUntil(this.onDestroy)).subscribe(isData => this.showData(isData));
    /* listener when slected branch change */
    if (this.branchService.branchesLoaded.getValue()) {
      this.loadTableData(this.searchbar.value, this.categories.value,  true, this.sort);
      this.branchService.branchObservable.pipe(takeUntil(this.onDestroy)).subscribe(() => {
        this.loadTableData(this.searchbar.value, this.categories.value,  true, this.sort);
      });
    } else {
      this.branchService.branchesLoaded.pipe(takeUntil(this.onDestroy)).subscribe((state) => {
        if (state) {
          this.branchService.branchObservable.pipe(takeUntil(this.onDestroy)).subscribe(() => {
            this.loadTableData(this.searchbar.value, this.categories.value,  true, this.sort);
          });
        }
      });
    }
  }
  // --------------------------------------------------//
  // Method to show  data depending on request results //
  // --------------------------------------------------//
  showData(isData: boolean) {
    this.displayElem.forEach((elem: ElementRef) => {
      if (isData) {
        if (elem.nativeElement.classList.contains('hidden')) {
          elem.nativeElement.classList.remove('hidden');
        }
      } else {
        if (!elem.nativeElement.classList.contains('hidden')) {
          elem.nativeElement.classList.add('hidden');
        }
      }
    });
    this.noDisplayElem.forEach((noElem: ElementRef) => {
      if (isData) {
        if (!noElem.nativeElement.classList.contains('hidden')) {
          noElem.nativeElement.classList.add('hidden');
        }
      } else {
        if (noElem.nativeElement.classList.contains('hidden')) {
          noElem.nativeElement.classList.remove('hidden');
        }
      }
    });
  }
  // ------------------------------------------------------//
  // Method to load table data (paginate, filter and sort) //
  // ------------------------------------------------------//
  public loadTableData(dataSearch: string, category: string, count: boolean, sort: any) {
    /* ------- */
    /* PENDING */
    /* ------- */
    const currentUserRole = this.authService.currentUserValue.user.role;
    const branchFilter: any[] = [];
    let needBranch = true;
    /* CONFIGURE CURRENT USER PERMITIONS */
    if (currentUserRole === 'generalAdmin') {
      needBranch = false;
    } else {

    }
    /* set search query */
    const searchObject = this.queryFactory.setSearchQuery(dataSearch, ['text']);
    const andObject: any[] = [
      searchObject
    ];
    if (needBranch) {
      andObject.push({ or: [
        {
          createdById: this.authService.currentUserValue.user.id
        },
        {
          assignedToId: this.authService.currentUserValue.user.id
        }
      ]});
    }
    /* set query properties */
    const page = this.paginator ? this.paginator.pageSize : 25;
    const skip = this.paginator ? page * this.paginator.pageIndex : 0;
    let sorter = this.queryFactory.setSorterProperty(sort);
    if (sorter === 'createdAt DESC') {
      sorter = 'date DESC';
    }
    /* set include object */
    const include = [{
      relation: 'note',
      scope: {
        include: [{
          relation: 'client'
        }]
      }
    }];
    const getDataQuery = this.queryFactory.generateGetQuery('Reminders', {and: andObject }, page, skip, sorter, include);
    /* if requires data count */
    if (count) {
      const getCountQuery = this.queryFactory.generateGetCountQuery('Reminders', {and: andObject });
      /* preform count request */
      this.apiService.getDataObjects(getCountQuery).pipe(takeUntil(this.onDestroy)).subscribe((count: any) => {
        this.tableCount = count.count;
        if (this.tableCount > 0) {
          /* preform data request */
          this.dataSource.loadData(getDataQuery).pipe(takeUntil(this.onDestroy)).subscribe(() => {
            this.firstLoad ? this.firstLoad = false : null;
            /* notify result */
            this.displayData.next(true);
          });
        } else {
          this.firstLoad ? this.firstLoad = false : null;
          /* notify result */
          this.displayData.next(false);
        }
      });
    } else {
      /* preform data request */
      this.dataSource.loadData(getDataQuery).pipe(takeUntil(this.onDestroy)).subscribe();
    }
  }
  // ---------------------------- //
  // select row with check method //
  // ---------------------------- //
  selectRow(event, className: string) {
    const cells = document.getElementsByClassName(className);
    if (event.checked) {
      for (let x = 0; x < cells.length; x++) {
        cells[x].classList.add('selectedRow');
      }
    } else {
      for (let x = 0; x < cells.length; x++) {
        cells[x].classList.remove('selectedRow');
      }
    }
  }
  // --------------------- //
  // Open new reminder modal //
  // --------------------- //
  newReminder() {
    const dialogRef = this.dialog.open(ReminderComponent, {
      data: {
        reminder: {},
        title: 'New reminder',
        isNew: true
      },
      autoFocus: false,
      width: '1000px'
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe((result) => {
      if (result !== undefined) {
        if (result.changes) {
          this.loadTableData(this.searchbar.value, this.categories.value, true, this.sort);
        }
      }
    });
  }
  editReminder(data: any) {
    const dialogRef = this.dialog.open(ReminderComponent, {
      data: {
        reminder: data,
        title: 'Edit reminder',
        isNew: false
      },
      autoFocus: false,
      width: '1000px'
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe((result) => {
      if (result !== undefined) {
        if (result.changes) {
          this.loadTableData(this.searchbar.value, this.categories.value, true, this.sort);
        }
      }
    });
  }
  // ---------------------//
  // Copy data function //
  // ---------------------//
  copyData(data) {
    let text = document.createElement('textarea');
    text.value = data;
    text.style.position = 'absolute';
    text.style.left = '-9999px';
    // el.setAttribute('readonly', '');
    document.body.appendChild(text);
    text.select();
    document.execCommand("copy");
    document.body.removeChild(text);
    this.presentToast('Data copied succesfullly', 'gray-snackbar');
  }

  openNote(note: any) {
    console.log(note);
    const dialogRef = this.dialog.open(NoteComponent, {
      data: {
        client: note.client,
        prevNote: note,
        title: 'Edit note',
        isNew: false
      },
      autoFocus: false,
      width: '1000px'
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe((result) => {
      if (result !== undefined) {
        if (result.changes) {
          this.loadTableData(this.searchbar.value, this.categories.value,  true, this.sort);
        }
      }
    });
  }
  // ---------------------//
  // Present toast method //
  // ---------------------//
  presentToast(message: string, style: string) {
    this.snackBar.open(message, 'Close', {
      duration: 1000,
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
