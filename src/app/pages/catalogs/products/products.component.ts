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
import {BehaviorSubject, Subject} from "rxjs";
import {MatDialog, MatPaginator, MatSort} from "@angular/material";
import {CustomDataSource} from "../../../tableQueries/customDataSource";
import {ApiService} from "../../../services/api/api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {QueryFactory} from "../../../tableQueries/queryFactory";
import {FormControl} from "@angular/forms";
import {first, takeUntil} from "rxjs/operators";
import {ProductComponent} from "./product/product.component";
import {AuthService} from "../../../services/auth/auth.service";
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.sass']
})
export class ProductsComponent implements OnInit, AfterViewInit, OnDestroy {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  /* manage component */
  @ViewChildren('displayData') displayElem: QueryList<any>;
  @ViewChildren('noData') noDisplayElem: QueryList<any>;
  private onDestroy = new Subject<void>();
  public firstLoad = true;
  public currentYear = new Date().getFullYear();
  public years = [];
  public  searchObject = [{}];
  /* manage table */
  @ViewChild(MatSort, {static: false}) sort: MatSort;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;
  public dataSource: CustomDataSource;
  public displayedColumns: string[] = [
    'model',
    'enrollment',
    'certificationM',
    'certificationA',
    'policyS',
    'binnacleV',
    'binnacleM',
    'authorizationOER',
    'airline'
    // 'createdAt'
    // 'productGrown',
    // 'productAvailable'
  ];
  public displayedColumnsAdmin: string[] = [
    'model',
    'enrollment',
    'certificationM',
    'certificationA',
    'policyS',
    'binnacleV',
    'binnacleM',
    'authorizationOER',
    'airline',
    // 'createdAt',
    // 'productGrown',
    // 'productAvailable',
    'button'
  ];
  public displayData = new BehaviorSubject<boolean>(false);
  public tableCount = 0;
  public editAccess = true;
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
      private authService: AuthService,
      private titleService: Title
  ) {
    this.setTitle('Airplains - catalogos');
  }
  public setTitle(newTitle: string) {
    this.titleService.setTitle( newTitle );
  }
  // -------------------------------------- //
  // Form inputs & validations declaration  //
  // -------------------------------------- //
  public searchbar = new FormControl({value: '', disabled: false});
  public yearControl = new FormControl({value: this.currentYear, disabled: false});
  // ------------------ //
  // On view init cycle //
  // ------------------ //
  ngOnInit() {
    if (this.authService.currentUserValue) {
      const userRole = this.authService.currentUserValue.user.role;
      // this.editAccess = userRole === 'generalAdmin' || userRole === 'branchAdmin';
    }
    this.authService.userObservable.pipe(takeUntil(this.onDestroy)).subscribe((user) => {
      if (user) {
        // this.editAccess = user.user.role === 'generalAdmin' || user.user.role === 'branchAdmin';
      }
    });
    this.dataSource = new CustomDataSource(this.apiService);
    this.apiService.getDataObjects('Airplains?filter=' + JSON.stringify({
      order: 'model ASC',
      limit: 1
    })).pipe(takeUntil(this.onDestroy)).subscribe((firstData) => {
      if (firstData[0] !== undefined) {
        for (let x = (this.currentYear - 1); x >= firstData[0].model; x--) { // era name
          this.years.push(x);
        }
      }
    });
  }
  // --------------------- //
  // After view init cycle //
  // --------------------- //
  ngAfterViewInit() {
    /* on search change (managing 250 ms) */
    this.searchbar.valueChanges.pipe(takeUntil(this.onDestroy)).subscribe( (dataSearch) => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.obtainSearch(dataSearch);
      }, 250);
    });
    /* listener when data load finish */
    this.displayData.asObservable().pipe(takeUntil(this.onDestroy)).subscribe(isData => this.showData(isData));
    /* first table load */
    this.loadTableData(this.yearControl.value, true, this.sort);
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
  obtainSearch(dataSearch: string) {
    if (dataSearch !== '') {
      this.searchObject = [];
      const searchObject = this.queryFactory.setSearchQuery(dataSearch, ['model']);
      this.apiService.getDataObjects('Airplains?filter=' + JSON.stringify({
        where: searchObject,
        fields: ['id'],
        limit: 100
      })).pipe(takeUntil(this.onDestroy)).subscribe((products: any) => {
        if (products.length > 0) {
          for (let x = 0; x < products.length; x++) {
            this.searchObject.push({
              productId: products[x].id
            });
          }
        } else {
          this.searchObject.push({productId: null});
        }
        this.loadTableData(this.yearControl.value,true, this.sort);
      });
    } else{
      this.searchObject = [{}];
      this.loadTableData(this.yearControl.value,true, this.sort);
    }
  }
  // ------------------------------------------------------//
  // Method to load table data (paginate, filter and sort) //
  // ------------------------------------------------------//
  public loadTableData(year, count: boolean, sort: any) {
    /* set search query */
    const orObject = {
      or: this.searchObject
    };
    const whereObject = this.queryFactory.setWhereQuery(['model'], [], orObject);
    /* set query properties */
    const page = this.paginator ? this.paginator.pageSize : 25;
    const skip = this.paginator ? page * this.paginator.pageIndex : 0;
    const sorter = this.queryFactory.setSorterProperty(sort.direction ? sort : 'model ASC');
    const include = [];
    const getDataQuery = this.queryFactory.generateGetQuery('Airplains', whereObject, page, skip, sorter, include);
    /* if requires data count */
    if (count) {
      const getCountQuery = this.queryFactory.generateGetCountQuery('Airplains', whereObject);
      /* preform count request */
      this.apiService.getDataObjects(getCountQuery).pipe(takeUntil(this.onDestroy)).subscribe((count: any) => {
        this.tableCount = count.count;
        if (this.tableCount > 0) {
          /* preform data request */
          this.dataSource.loadData(getDataQuery).pipe(takeUntil(this.onDestroy)).subscribe((data) => {
            console.log(data, 'data from request');
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
  // Open product function //
  // --------------------- //
  public openProduct(data: any) {
    if (this.editAccess) {
      const dialogRef = this.dialog.open(ProductComponent, {
        data: {
          product: data,
          title: 'Actualizar Airplain',
          isNew: false
        },
        autoFocus: false,
        width: '1000px'
      });
      dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(() => {
        this.loadTableData(this.yearControl.value, true, this.sort);
      });
    }
  }
  // -------------------- //
  // New product function //
  // -------------------- //
  public newProduct() {
    if (this.editAccess) {
      const dialogRef = this.dialog.open(ProductComponent, {
        data: {
          product: {},
          title: 'Nuevo Airplain',
          isNew: true
        },
        autoFocus: false,
        width: '1000px'
      });
      dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(() => {
        this.loadTableData(this.yearControl.value, true, this.sort);
      });
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
