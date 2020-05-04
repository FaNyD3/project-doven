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
import {QueryFactory} from "../../../../tableQueries/queryFactory";
import {ActivatedRoute, Router} from "@angular/router";
import {MatDialog, MatPaginator, MatSort} from "@angular/material";
import {CustomDataSource} from "../../../../tableQueries/customDataSource";
import {FormControl} from "@angular/forms";
import {BranchService} from "../../../../services/branch/branch.service";
import {ApiService} from "../../../../services/api/api.service";
import {AuthService} from "../../../../services/auth/auth.service";
import {takeUntil} from "rxjs/operators";
import {SharingService} from "../../../../services/sharing/sharing.service";
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-plants-table',
  templateUrl: './plants-table.component.html',
  styleUrls: ['./plants-table.component.scss']
})
export class PlantsTableComponent implements OnInit, AfterViewInit, OnDestroy {

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
  @ViewChild(MatPaginator, {static: false} ) paginator: MatPaginator;
  public dataSource: CustomDataSource;
  public displayedColumns: string[] = [
    'name',
    'location'
  ];
  public displayedColumnsAdmin: string[] = [
    'name',
    'location',
    'button'
  ];
  public displayData = new BehaviorSubject<boolean>(false);
  public tableCount= 0;
  public editAccess = false;
  /* manage searchbar */
  public timer;
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
      private sharingService: SharingService,
      public route: ActivatedRoute,
      private titleService: Title
  ) {
    this.setTitle('Plants - catalogs');
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
      this.editAccess = userRole === 'generalAdmin' || userRole === 'branchAdmin';
    }
    this.authService.userObservable.pipe(takeUntil(this.onDestroy)).subscribe((user) => {
      if (user) {
        this.editAccess = user.user.role === 'generalAdmin' || user.user.role === 'branchAdmin';
      }
    });
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
    if (this.branchService.branchesLoaded.getValue()) {
      /* first table load */
      this.loadTableData(this.searchbar.value, true, this.sort);
      this.branchService.branchObservable.pipe(takeUntil(this.onDestroy)).subscribe(() => {
        /* first table load */
        this.loadTableData(this.searchbar.value, true, this.sort);
      });
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
    const currentId = this.branchService.currentBranch.getValue().id;
    /* set search query */
    const searchObject = this.queryFactory.setSearchQuery(dataSearch, ['name', 'location']);
    const whereObject = {
      and: [ {branchId: currentId}, searchObject ]
    };
    /* set query properties */
    const page = this.paginator ? this.paginator.pageSize : 25;
    const skip = this.paginator ? page * this.paginator.pageIndex : 0;
    const sorter = this.queryFactory.setSorterProperty(sort);
    const include = [{}];
    const getDataQuery = this.queryFactory.generateGetQuery('Plants', whereObject, page, skip, sorter, include);
    /* if requires data count */
    if (count) {
      const getCountQuery = this.queryFactory.generateGetCountQuery('Plants', whereObject);
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
  // ------------------ //
  // Open user function //
  // ------------------ //
  public openPlant(data: any) {
    this.sharingService.plantData = data;
    this.router.navigate([data.id], {relativeTo: this.route});
    /*if (this.editAccess) {
      const dialogRef = this.dialog.open(PlantComponent, {
        data: {
          plant: data,
          title: 'Edit plant',
          isNew: false
        },
        autoFocus: false,
        width: '1000px'
      });
      dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(() => {
        this.loadTableData(this.searchbar.value, true, this.sort);
      });
    }*/
  }
  // ----------------- //
  // New user function //
  // ----------------- //
  public newPlant() {
    this.sharingService.plantData = null;
    this.router.navigate(['new'], {relativeTo: this.route});
    /*if (this.editAccess) {
      const dialogRef = this.dialog.open(PlantComponent, {
        data: {
          plant: {},
          title: 'New plant',
          isNew: true
        },
        autoFocus: false,
        width: '1000px'
      });
      dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(() => {
        this.loadTableData(this.searchbar.value, true, this.sort);
      });
    }*/
  }
  // -------------------- //
  // On destroy lifecycle //
  // -------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }

}
