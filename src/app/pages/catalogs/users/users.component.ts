// -----------------------------------//
// Dependencies and libraries imports //
// -----------------------------------//
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
import {ApiService} from "../../../services/api/api.service";
import {takeUntil} from "rxjs/operators";
import {BehaviorSubject, Subject} from "rxjs";
import {FormControl} from "@angular/forms";
import {Router} from "@angular/router";
import {MatDialog, MatPaginator, MatSort} from "@angular/material";
import {CustomDataSource} from "../../../tableQueries/customDataSource";
import {QueryFactory} from "../../../tableQueries/queryFactory";
import {UserComponent} from "./user/user.component";
import {BranchService} from "../../../services/branch/branch.service";
import {AuthService} from "../../../services/auth/auth.service";
import {Title} from "@angular/platform-browser";
@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit, AfterViewInit, OnDestroy {
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
    'name',
    'email',
    'role',
    'button'
  ];
  public displayData = new BehaviorSubject<boolean>(false);
  public tableCount= 0;
  /* manage searchbar */
  public timer;
  // --------------------- //
  // Component constructor //
  // --------------------- //
  constructor(
      private apiService: ApiService,
      public router: Router,
      public queryFactory: QueryFactory,
      public dialog: MatDialog,
      public branchService: BranchService,
      public authService: AuthService,
      private titleService: Title
  ) {
    this.setTitle('Admins - catalogos');
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
    this.dataSource = new CustomDataSource(this.apiService);
  }
  // --------------------- //
  // After view init cycle //
  // --------------------- //
  ngAfterViewInit() {
    /* on search change (managing 250 ms) */
    this.searchbar.valueChanges.pipe(takeUntil(this.onDestroy)).subscribe( (dataSearch) => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.loadTableData(dataSearch, true, this.sort);
      }, 250);
    });
    /* listener when data load finish */
    this.displayData.asObservable().pipe(takeUntil(this.onDestroy)).subscribe(isData => this.showData(isData));
    /* first table load */
    if (this.branchService.branchesLoaded.getValue()) {
      //this.loadTableData(this.searchbar.value, this.categories.value,  this.kms.value, this.rate.value, true, this.sort);
      this.branchService.branchObservable.pipe(takeUntil(this.onDestroy)).subscribe((data) => {
        this.loadTableData(this.searchbar.value, true, this.sort);
      });
    } else {
      this.branchService.branchesLoaded.pipe(takeUntil(this.onDestroy)).subscribe((state) => {
        if (state) {
          this.branchService.branchObservable.pipe(takeUntil(this.onDestroy)).subscribe((data) => {
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
    /* set search query */
    const searchObject = this.queryFactory.setSearchQuery(dataSearch, ['name', 'role', 'email']);
    const inqBranches: string[] = [];
    if (this.authService.currentUserValue.user.role === 'branchAdmin') {
      for (let x = 0; x < this.branchService.branchOptions.length; x++) {
        inqBranches.push(this.branchService.branchOptions[x].id);
      }
    }
    let whereObject: any = {
      and: [
        searchObject
      ]
    };
    if (this.authService.currentUserValue.user.role === 'branchAdmin') {
      whereObject = {
        and: [
          searchObject,
          {role: 'branchTrader'},
          { branchIds: {inq: inqBranches} }
        ]
      };
    }
    /* set query properties */
    const page = this.paginator ? this.paginator.pageSize : 25;
    const skip = this.paginator ? page * this.paginator.pageIndex : 0;
    const sorter = this.queryFactory.setSorterProperty(sort);
    const include = [];
    const getDataQuery = this.queryFactory.generateGetQuery('AppUsers', whereObject, page, skip, sorter, include);
    /* if requires data count */
    if (count) {
      const getCountQuery = this.queryFactory.generateGetCountQuery('AppUsers', whereObject);
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
  // ----------------- //
  // Open user function //
  // ----------------- //
  public openUser(data: any) {
    const dialogRef = this.dialog.open(UserComponent, {
      data: {
        user: data,
        title: 'Actualizar Usuario',
        isNew: false
      },
      autoFocus: false,
      width: '1000px'
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(() => {
      this.loadTableData(this.searchbar.value, true, this.sort);
    });
  }
  // ----------------- //
  // New user function //
  // ----------------- //
  public newUser() {
    const dialogRef = this.dialog.open(UserComponent, {
      data: {
        user: {},
        title: 'Nuevo Usuario',
        isNew: true
      },
      autoFocus: false,
      width: '1000px'
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(() => {
      this.loadTableData(this.searchbar.value, true, this.sort);
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
