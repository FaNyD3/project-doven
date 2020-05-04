import {AfterViewInit, ChangeDetectorRef, Component, Inject, NgZone, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";
import {MAT_DIALOG_DATA, MatBottomSheetRef, MatDialog, MatDialogRef} from "@angular/material";
import {ApiService} from "../../services/api/api.service";
import {QueryFactory} from "../../tableQueries/queryFactory";
import {FormControl} from "@angular/forms";
import {takeUntil} from "rxjs/operators";

export interface dataIn {
  client: any;
  years: any;
}

@Component({
  selector: 'app-products-list',
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.sass']
})
export class ProductsListComponent implements AfterViewInit, OnDestroy {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  /* manage component */
  private onDestroy = new Subject<void>();
  public firstLoad = true;
  public displayData = new BehaviorSubject<boolean>(false);
  public tableCount= 0;
  public products: any[] = [];
  public paginator = 0;
  public finishLoad = false;
  // --------------------- //
  // Component constructor //
  // --------------------- //
  constructor(
      private dialogRef: MatDialogRef<ProductsListComponent>,
      @Inject(MAT_DIALOG_DATA) public dataIn: dataIn,
      private apiService: ApiService,
      public queryFactory: QueryFactory,
      public dialog: MatDialog,
      private ngZone: NgZone,
      private changeDetectorRef: ChangeDetectorRef
  ) {}
  // -------------------------------------- //
  // Form inputs & validations declaration  //
  // -------------------------------------- //
  public yearControl = new FormControl({value: this.dataIn.years !== undefined ? this.dataIn.years[0].id : '', disabled: false});
  // --------------------- //
  // After view init cycle //
  // --------------------- //
  ngAfterViewInit() {
    /* listener when data load finish */
    /* first table load */
    this.loadTableData(this.yearControl.value, true);
  }
  // ------------------------------------------------------//
  // Method to load table data (paginate, filter and sort) //
  // ------------------------------------------------------//
  public loadTableData(year, count: boolean) {
    const whereObject = this.queryFactory.setWhereQuery(['clientYearId'], [year], null);
    /* set query properties */
    const page = 25;
    const skip = page * this.paginator;
    const include = ['product'];
    const getDataQuery = this.queryFactory.generateGetQuery('ClientProducts', whereObject, page, skip, 'productAvailable ASC', include);
    /* if requires data count */
    if (count) {
      const getCountQuery = this.queryFactory.generateGetCountQuery('ClientProducts', whereObject);
      /* preform count request */
      this.apiService.getDataObjects(getCountQuery).pipe(takeUntil(this.onDestroy)).subscribe((count: any) => {
        this.tableCount = count.count;
        if (count.count > 0) {
          /* preform data request */
          this.apiService.getDataObjects(getDataQuery).pipe(takeUntil(this.onDestroy)).subscribe((data: any) => {
            data.forEach((product) => {
              this.products.push(product);
            });
            /* notify result */
            this.ngZone.run(() => {
              if (this.firstLoad) {
                this.firstLoad = false;
              }
              this.finishLoad = true;
              this.changeDetectorRef.markForCheck();
            });
          });
        } else {
          /* notify result */
          this.ngZone.run(() => {
            if (this.firstLoad) {
              this.firstLoad = false;
            }
            this.finishLoad = true;
            this.changeDetectorRef.markForCheck();
          });
        }
      });
    } else {
      /* preform data request */
      this.apiService.getDataObjects(getDataQuery).pipe(takeUntil(this.onDestroy)).subscribe((data: any) => {
        data.forEach((product) => {
          this.products.push(product);
        });
      });
    }
  }
  close(): void {
    this.dialogRef.close();
  }
  // -------------------- //
  // On destroy lifecycle //
  // -------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
