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
import {ApiService} from "../../services/api/api.service";
import {debounceTime, takeUntil} from "rxjs/operators";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {CustomDataSource} from "../../tableQueries/customDataSource";
import {MatBottomSheet, MatDialog, MatPaginator, MatSnackBar, MatSort} from "@angular/material";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {ActivatedRoute, Router} from "@angular/router";
import {QueryFactory} from "../../tableQueries/queryFactory";
import {SharingService} from "../../services/sharing/sharing.service";
import {BranchService} from "../../services/branch/branch.service";
import {AuthService} from "../../services/auth/auth.service";
import {LoadingService} from "../../services/loading/loading.service";
import {FormControl} from "@angular/forms";
import {Title} from "@angular/platform-browser";
// import {UltimateSelectComponent} from "../../components/ultimate-select/ultimate-select.component";
// import {ParticipantsListComponent} from "../../modals/participants-list/participants-list.component";
import { NoteComponent } from '../../modals/note/note.component';
import {ProductComponent} from '../catalogs/products/product/product.component';
import {CrudClientComponent} from '../clients/clients-table/crud-client/crud-client.component';
import {ReminderComponent} from '../reminders/reminder/reminder.component';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class NotesComponent implements OnInit, OnDestroy, AfterViewInit {

  // ================================ COMPONENT CONFIG AND VARIABLES ================================ //

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
  public displayedColumns: string[] = [
    'createdAt',
    //'clientId',
    //'ownerId',
    //'comments',
    'subject',
    'button'
  ];

  public isExpansionDetailRow = (i: number, row: Object) => true;
  public expandedElement: any;
  public displayData = new BehaviorSubject<boolean>(false);
  public tableCount = 0;

  public isBigSize = window.innerWidth > 959;
  public isSmallSize = window.innerWidth < 576;

  public hasNotReply = false;

  public isEditMode = false;
  public editId;

  /* manage fitlers */
  // @ViewChild('clientsFilter', {static: false}) clientsFilter: UltimateSelectComponent;
  // @ViewChild('ownersFilter', {static: false}) ownersFilter: UltimateSelectComponent;

  // -------------------------------------- //
  // Form inputs & validations declaration  //
  // -------------------------------------- //
  public searchbar = new FormControl({value: '', disabled: false});
  public notes = new FormControl({value: '',disabled: false});

  public clientsFilterObject: any[] = [];
  public ownersFilterObject: any[] = [];

  constructor(
      private apiService: ApiService,
      public router: Router,
      public route: ActivatedRoute,
      public queryFactory: QueryFactory,
      public dialog: MatDialog,
      private sharingService: SharingService,
      private branchService: BranchService,
      private authService: AuthService,
      private loadingService: LoadingService,
      private snackBar: MatSnackBar,
      private titleService: Title,
  ) {
    this.setTitle('Notas');
  }


  // ================================ INIT COMPONENT HOOKS AND LISTENERS ================================ //

  // ----------------- //
  // Set browser title //
  // ----------------- //
  public setTitle(newTitle: string) {
    this.titleService.setTitle( newTitle );
  }

  // ------------------ //
  // On view init cycle //
  // ------------------ //
  ngOnInit() {
    this.dataSource = new CustomDataSource(this.apiService);
  }

  // --------------------- //
  // After view init cycle //
  // --------------------- //
  ngAfterViewInit() {
    /* listener when data load finish */
    this.displayData.asObservable().pipe(takeUntil(this.onDestroy)).subscribe(isData => this.showData(isData));
    if (this.branchService.branchesLoaded.getValue()) {
      this.loadTableData(this.searchbar.value, /*this.clientsFilterObject, this.ownersFilterObject,*/true, this.sort);
    }
    /* listener when branch change */
    this.branchService.branchesLoaded.pipe(takeUntil(this.onDestroy)).subscribe((state) => {
      if (state) {
        this.loadTableData(this.searchbar.value, /*this.clientsFilterObject, this.ownersFilterObject,*/true, this.sort);
      }
    });
    /* on search change (managing 250 ms) */
    this.searchbar.valueChanges.pipe(
        takeUntil(this.onDestroy),
        debounceTime(250)
    ).subscribe( (dataSearch) => {
      this.loadTableData(dataSearch, /*this.clientsFilterObject, this.ownersFilterObject,*/true, this.sort);
    });
    /* set listeners on filters emit data*/
    this.addFilterListeners();
    /* set listener OnResize */
    this.setResizeListener();
  }

  // ---------------- //
  // Filter listeners //
  // ---------------- //
  addFilterListeners() {
    /* manage clients filter */
    /*
    this.clientsFilter.filterContent.pipe(takeUntil(this.onDestroy)).subscribe((filterData: any[]) => {
      this.clientsFilterObject = filterData;
      this.loadTableData(this.searchbar.value, this.clientsFilterObject, this.ownersFilterObject,true, this.sort);
    });
    */
    /* manage owners filter */
    /*
    this.ownersFilter.filterContent.pipe(takeUntil(this.onDestroy)).subscribe((filterData: any[]) => {
      this.ownersFilterObject = filterData;
      this.loadTableData(this.searchbar.value, this.clientsFilterObject, this.ownersFilterObject,true, this.sort);
    });
    */
    /* on search change (managing 250 ms) */
    this.searchbar.valueChanges.pipe(
      takeUntil(this.onDestroy),
      debounceTime(250)
    ).subscribe( (dataSearch) => {
      this.loadTableData(dataSearch,true, this.sort);
    });
  }

  // --------------------- //
  // Set On window resize listener //
  // --------------------- //
  setResizeListener() {
    window.addEventListener('resize', () => {
      let tempOnBigSize;
      let tempSmallSize;
      /* if firstLoad set change points */
      if (this.firstLoad ) {
        tempOnBigSize = !this.isBigSize;
        tempSmallSize = !this.isSmallSize;
      } else {
        tempOnBigSize = window.innerWidth > 959;
        tempSmallSize = window.innerWidth < 576;
      }
      /* if resize pass !showOnLarge point */
      if (tempOnBigSize !== this.isBigSize) {
        this.isBigSize = window.innerWidth > 960;
      }
      if (tempSmallSize !== this.isSmallSize) {
        this.isSmallSize = window.innerWidth < 576;
      }
    });
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

  // ================================ MANAGE TABLES AND DATA SOURCES ================================ //

  // ------------------------------------------------------//
  // Method to load table data (paginate, filter and sort) //
  // ------------------------------------------------------//
  public loadTableData(search: string, /*clientIds: string[], buyerIds: string[],*/ count: boolean, sort: any) {

    const searchObject = this.queryFactory.setSearchQuery(search, ['comment']);

    const whereProperties: any[] = [];
    const whereValues: any[] = [];
    /*
    if (clientIds.length > 0) {
      whereProperties.push('clientId');
      whereValues.push({inq: clientIds});
    }

    if (buyerIds.length > 0) {
      whereProperties.push('ownerId');
      whereValues.push({inq: buyerIds});
    }
    */

    /* set search query */
    const whereObject = this.queryFactory.setWhereQuery(whereProperties, whereValues, searchObject);

    /* set query properties */
    const page = this.paginator ? this.paginator.pageSize : 25;
    const skip = this.paginator ? page * this.paginator.pageIndex : 0;
    const sorter = this.queryFactory.setSorterProperty(sort);
    const include = [
      // { relation: 'owner', scope: { fields:['name', 'id'] } },
      // { relation: 'client', scope: { fields:['name', 'id'] } }
    ];
    const getDataQuery = this.queryFactory.generateGetQuery('notes', whereObject, page, skip, sorter, []);
    /* if requires data count */
    if (count) {
      const getCountQuery = this.queryFactory.generateGetCountQuery('notes', whereObject);
      /* preform count request */
      this.apiService.getDataObjects(getCountQuery).pipe(takeUntil(this.onDestroy)).subscribe((count: any) => {
        this.tableCount = count.count;
        if (this.tableCount > 0) {
          /* preform data request */
          this.dataSource.loadData(getDataQuery).pipe(takeUntil(this.onDestroy)).subscribe((notes: any[]) => {
            if (this.firstLoad) {
              this.firstLoad = false;
            }
            /* notify result */
            this.displayData.next(true);
          });
        } else {
          if (this.firstLoad) {
            this.firstLoad = false;
          }
          /* notify result */
          this.displayData.next(false);
        }
      });
    } else {
      /* preform data request */
      this.dataSource.loadData(getDataQuery).pipe(takeUntil(this.onDestroy)).subscribe((notes: any[]) => {
      });
    }
  }

  // ================================ MANAGE NOTES METHODS ================================ //

  // ------------- //
  // GET NOTE TYPE //
  // ------------- //
  setNoteType(note) {
    let type = note.subject ;
    /*
    if (note.subject !== '') {
      type += note.subject;
      if (note.hasNotReply) {
        type += ', Not reply'
      }
    } else {
      if (note.hasNotReply) {
        type += 'Not reply'
      }
    }
    */
    return type;
    // detail.type + detail.hasNotReply ? ', Not reply' : ''
  }

  // ------------------------------------ //
  // OPEN DROPDOWN WITH PARTICIPANTS DATA //
  // ------------------------------------ //
  openParticipants(data: any) {
    /*
    this.dialog.open(ParticipantsListComponent, {
      data: {
        note: data
      },
      autoFocus: false,
      width: '600px'
    });
    */
  }

  public openNote(data: any) {
    const dialogRef = this.dialog.open(NoteComponent, {
      data: {
        note: data,
        title: 'Actualizar Nota',
        isNew: false,
        branch: this.branchService.currentBranch.getValue(),
      },
      //branch: this.branchService.currentBranch.getValue(),
      autoFocus: false,
      width: '1000px'
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(() => {
      this.loadTableData(this.searchbar.value, /*this.clientsFilterObject, this.ownersFilterObject,*/true, this.sort);
    });
  }

  // ================================ GENERIC COMPONENT METHODS ================================ //

  // ---------------------//
  // Present toast method //
  // ---------------------//
  presentToast(message: string, style: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: [style],
      horizontalPosition: 'end',
      verticalPosition: document.documentElement.clientWidth >= 1050 ? 'top' : 'bottom'
    });
  }

  newNote() {

    let modalRef;
    let data;
    modalRef = NoteComponent;
    data = {
      note: {},
      title: 'Nueva Nota',
      isNew: true,
      prevNote: {},
      branch: this.branchService.currentBranch.getValue()
    };
    const dialogRef = this.dialog.open(modalRef, {
      data: data,
      autoFocus: false,
      width: '1000px'
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(() => {
      this.loadTableData(this.searchbar.value,/* this.clientsFilterObject, this.ownersFilterObject,*/true, this.sort);
    });
  }

  // ================================ DESTROY COMPONENT HOOK MANAGEMENT ================================ //

  // -------------------- //
  // On destroy lifecycle //
  // -------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }

}
