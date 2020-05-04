import {Component, ElementRef, Input, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";
import {MatBottomSheet, MatDialog, MatPaginator, MatSort} from "@angular/material";
// import {CustomDataSource} from "../../../../tableQueries/customDataSource";
import {ApiService} from "../../../../services/api/api.service";
import {ActivatedRoute, Router} from "@angular/router";
// import {QueryFactory} from "../../../../tableQueries/queryFactory";
// import {SharingService} from "../../../../services/sharing/sharing.service";
import {FormControl} from "@angular/forms";
import {debounceTime, takeUntil} from "rxjs/operators";
/*
import {ParticipantsBottomSheetComponent} from "../../../../components/participants-bottom-sheet/participants-bottom-sheet.component";
import {DeductionBottomSheetComponent} from "../../../../components/deduction-bottom-sheet/deduction-bottom-sheet.component";
import {DealComponent} from "../../../../modals/deal/deal.component";
import {BranchService} from "../../../../services/branch/branch.service";
import {ParticipantsListComponent} from "../../../../modals/participants-list/participants-list.component";
import {DeductionListComponent} from "../../../../modals/deduction-list/deduction-list.component";
*/
import {animate, state, style, transition, trigger} from "@angular/animations";

@Component({
  selector: 'app-client-deals',
  templateUrl: './client-deals.component.html',
  styleUrls: ['./client-deals.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ClientDealsComponent implements OnInit {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  /* manage component */
  @ViewChildren('displayData') displayElem: QueryList<any>;
  @ViewChildren('noData') noDisplayElem: QueryList<any>;
  private onDestroy = new Subject<void>();
  public firstLoad = true;
  /* manage table */
  //@ViewChild(MatSort) sort: MatSort;
  // @ViewChild(MatPaginator) paginator: MatPaginator;
  // public dataSource: CustomDataSource;
  public displayedColumns: string[] = [
    'createdAt',
    'product',
    /*'quantity',
    'units',
    'grade',
    'buyer',
    'price',*/
    'shipment',
    //'deductions',
    'button'
  ];
  public isExpansionDetailRow = (i: number, row: Object) => true;
  public expandedElement: any;
  public displayData = new BehaviorSubject<boolean>(false);
  public tableCount= 0;
  public clientYear;
  //public clientId = this.sharingService.serviceData.getValue().id;
  public yearNumber = new Date().getFullYear();
  public isBigSize = window.innerWidth > 959;
  public isSmallSize = window.innerWidth < 576;
  constructor(
      private apiService: ApiService,
      public router: Router,
      public route: ActivatedRoute,
      // public queryFactory: QueryFactory,
      public dialog: MatDialog,
      // private bottomSheet: MatBottomSheet,
      // private sharingService: SharingService,
      // private branchService: BranchService
  ) { }
  // -------------------------------------- //
  // Form inputs & validations declaration  //
  // -------------------------------------- //
  public searchbar = new FormControl({value: '', disabled: false});
  public dealStatus = new FormControl({value: '',disabled: false});
  @Input()
  set clientData(clientData) {
    this.displayData.next(false);
    this.firstLoad = true;
    this.yearNumber = clientData.yearNumber;
    // this.clientId = clientData.clientId;
    /*
    this.apiService.getDataObjects('ClientYears?filter=' + JSON.stringify({
      where:{
        and: [
          { clientId: this.clientId },
          { name: clientData.yearNumber.toString() }
        ]
      }
    })).pipe(takeUntil(this.onDestroy)).subscribe((clientYears: any[]) => {
      console.log('clientYears founded ', clientYears[0]);
      if (clientYears[0]) {
        this.clientYear = clientYears[0].id;
        this.loadTableData(this.dealStatus.value, true, this.sort);
      } else {
        this.firstLoad = false;
      }
    });
    */
  }
  @Input()
  set reload(status) {
    this.displayData.next(false);
    this.firstLoad = true;
   // this.loadTableData(this.dealStatus.value, true, this.sort);
  }
  // ------------------ //
  // On view init cycle //
  // ------------------ //
  ngOnInit() {
    // this.dataSource = new CustomDataSource(this.apiService);
  }
  // --------------------- //
  // After view init cycle //
  // --------------------- //
  ngAfterViewInit() {
    /* listener when data load finish */
    this.displayData.asObservable().pipe(takeUntil(this.onDestroy)).subscribe(isData => this.showData(isData));
    /* first table load */
    /*
    if (this.branchService.branchesLoaded.getValue()) {
      this.loadTableData(this.dealStatus.value, true, this.sort);
    }
    this.branchService.branchesLoaded.pipe(takeUntil(this.onDestroy)).subscribe((state) => {
      if (state) {
        this.loadTableData(this.dealStatus.value, true, this.sort);
      }
    });
    */

    /* set listener OnResize */
    this.setResizeListener();
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
  // ------------------------------------------------------//
  // Method to load table data (paginate, filter and sort) //
  // ------------------------------------------------------//
  public loadTableData(dealStatus: string, count: boolean, sort: any) {

    console.log('deals year number ', this.yearNumber);
    /* set search query */
    const whereProperties = ['createdAt', 'createdAt', 'clientId', 'branchId'];

    const ltYear = new Date(( (this.yearNumber ? this.yearNumber : new Date().getFullYear()) + 1),0,1, 0, 0);
    const gtYear = new Date(( (this.yearNumber ? this.yearNumber : new Date().getFullYear()) - 1),11,31, 23, 59);

    const valueProperties = [
      {lt: ltYear},
      {gt: gtYear},
      // this.clientId,
      // this.branchService.currentBranch.getValue().id
    ];
    if (dealStatus) {
      whereProperties.push(dealStatus);
      // valueProperties.push(true);
    }

    /*
    const whereObject = this.queryFactory.setWhereQuery(whereProperties, valueProperties, null);
    const page = this.paginator ? this.paginator.pageSize : 25;
    const skip = this.paginator ? page * this.paginator.pageIndex : 0;
    const sorter = this.queryFactory.setSorterProperty(sort);
    const include = [
      'buyer',
      'product'
    ];
    const getDataQuery = this.queryFactory.generateGetQuery('Deals', whereObject, page, skip, sorter, include);
    if (count) {
      const getCountQuery = this.queryFactory.generateGetCountQuery('Deals', whereObject);
      this.apiService.getDataObjects(getCountQuery).pipe(takeUntil(this.onDestroy)).subscribe((count: any) => {
        this.tableCount = count.count;
        if (this.tableCount > 0) {
          this.dataSource.loadData(getDataQuery).pipe(takeUntil(this.onDestroy)).subscribe(() => {
            if (this.firstLoad) {
              this.firstLoad = false;
            }
            this.displayData.next(true);
          });
        } else {
          if (this.firstLoad) {
            this.firstLoad = false;
          }
          this.displayData.next(false);
        }
      });
    } else {
      this.dataSource.loadData(getDataQuery).pipe(takeUntil(this.onDestroy)).subscribe();
    }
    */
  }
  newDeal() {

  }
  openDeal(dealData: any) {

  }
  openDeductions(data: any) {

  }
  obtainTypeValue(value: string) {
    switch (value) {
      case 'isLead':
        return 'Leads';
      case 'isDeal':
        return 'Deals';
      case 'isCanceled':
        return 'Canceled';
      case 'isDone':
        return 'Done';
      default:
        return '';
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
