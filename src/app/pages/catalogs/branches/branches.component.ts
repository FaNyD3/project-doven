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
import {MatDialog, MatPaginator, MatSort} from "@angular/material";
import {CustomDataSource} from "../../../tableQueries/customDataSource";
import {ApiService} from "../../../services/api/api.service";
import {Router} from "@angular/router";
import {QueryFactory} from "../../../tableQueries/queryFactory";
import {FormControl} from "@angular/forms";
import {debounceTime, takeUntil} from "rxjs/operators";
import {BranchComponent} from "./branch/branch.component";
import {BranchService} from "../../../services/branch/branch.service";
import {AuthService} from "../../../services/auth/auth.service";
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-branches',
  templateUrl: './branches.component.html',
  styleUrls: ['./branches.component.scss']
})
export class BranchesComponent implements OnInit, AfterViewInit, OnDestroy {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  /* manage component */
  @ViewChildren('displayData') displayElem: QueryList<any>;
  @ViewChildren('noData') noDisplayElem: QueryList<any>;
  private onDestroy = new Subject<void>();
  public firstLoad = true;
  /* manage table */
  @ViewChild(MatSort, {static: false} ) sort: MatSort;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;
  public dataSource: CustomDataSource;
  public displayedColumns: string[] = [
    'check',
    'name',
    'color',
    'state',
    'operationType',
    'classification',
    'serviceType'
  ];
  public displayedColumnsAdmin: string[] = [
    'name',
    'color',
    'state',
    'operationType',
    'serviceType',
    'classification',
    'button'
  ];
  public displayData = new BehaviorSubject<boolean>(false);
  public tableCount= 0;
  public editAccess = true;
  /* manage searchbar */
  // --------------------- //
  // Component constructor //
  // --------------------- //
  constructor(
      private apiService: ApiService,
      private authService: AuthService,
      public router: Router,
      public queryFactory: QueryFactory,
      public dialog: MatDialog,
      private branchService: BranchService,
      private titleService: Title
  ) {
    this.setTitle('Airplain - catalogos'); // antes aerodromo
    }
  public setTitle(newTitle: string) {
    this.titleService.setTitle( newTitle );
  }
  // -------------------------------------- //
  // Form inputs & validations declaration  //
  // -------------------------------------- //
  public searchbar = new FormControl({value: '', disabled: false});
  // ------------------ //
  // On view init cycle //
  // ------------------ //
  ngOnInit() {
    if (this.authService.currentUserValue) {
      const userRole = this.authService.currentUserValue.user.role;
      // this.editAccess = userRole === 'generalAdmin';
    }
    this.authService.userObservable.pipe(takeUntil(this.onDestroy)).subscribe((user) => {
      if (user) {
        // this.editAccess = user.user.role === 'generalAdmin';
      }
    });
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
        this.loadTableData(dataSearch, true, this.sort);
    });
    /* listener when data load finish */
    this.displayData.asObservable().pipe(takeUntil(this.onDestroy)).subscribe(isData => this.showData(isData));
    if (this.branchService.branchesLoaded.getValue()) {
      /* first table load */
      this.loadTableData(this.searchbar.value, true, this.sort);
    } else {
      this.branchService.branchesLoaded.pipe(takeUntil(this.onDestroy)).subscribe((state) => {
        if (state) {
          this.branchService.branchObservable.pipe(takeUntil(this.onDestroy)).subscribe(() => {
            /* first table load */
            this.loadTableData(this.searchbar.value, true, this.sort);
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
  public loadTableData(dataSearch: string, count: boolean, sort: any) {
    const branchesIds: string[] = [];
    this.branchService.branchOptions.forEach((branch) => {
      branchesIds.push(branch.id);
    });
    /* set search query */
    const searchObject = this.queryFactory.setSearchQuery(dataSearch, ['name']);
    const orObject = this.queryFactory.setOrQuery('id', branchesIds);
    const whereObject = {
      and: [ orObject, searchObject ]
    };
    /* set query properties */
    const page = this.paginator ? this.paginator.pageSize : 25;
    const skip = this.paginator ? page * this.paginator.pageIndex : 0;
    const sorter = this.queryFactory.setSorterProperty(sort);
    const include = [];
    const getDataQuery = this.queryFactory.generateGetQuery('Airstrips', whereObject, page, skip, sorter, include);
    /* if requires data count */
    if (count) {
      const getCountQuery = this.queryFactory.generateGetCountQuery('Airstrips', whereObject);
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
  // --------------------- //
  // Open branch function //
  // --------------------- //
  public openBranch(data: any) {
    if (this.editAccess) {
      const dialogRef = this.dialog.open(BranchComponent, {
        data: {
          branch: data,
          title: 'Actualizar Airstrip',
          isNew: false
        },
        autoFocus: false,
        width: '1000px'
      });
      dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(() => {
        this.loadTableData(this.searchbar.value, true, this.sort);
      });

    }
  }
  // ----------------- //
  // New user function //
  // ----------------- //
  public newBranch() {
    if (this.editAccess) {
      const dialogRef = this.dialog.open(BranchComponent, {
        data: {
          branch: {},
          title: 'Nuevo Airstrip',
          isNew: true
        },
        autoFocus: false,
        width: '1000px'
      });
      dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(() => {
        this.loadTableData(this.searchbar.value, true, this.sort);
      });
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
  // -------------------- //
  // On destroy lifecycle //
  // -------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
