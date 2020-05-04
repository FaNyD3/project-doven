import {Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";
import {MatDialog, MatPaginator, MatSort} from "@angular/material";
import {CustomDataSource} from "../../../../tableQueries/customDataSource";
import {ApiService} from "../../../../services/api/api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {QueryFactory} from "../../../../tableQueries/queryFactory";
import {FormControl} from "@angular/forms";
import {takeUntil} from "rxjs/operators";
import {SharingService} from "../../../../services/sharing/sharing.service";
import {BranchService} from "../../../../services/branch/branch.service";
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-groups-table',
  templateUrl: './groups-table.component.html',
  styleUrls: ['./groups-table.component.sass']
})
export class GroupsTableComponent implements OnInit {
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
    'clientsCount',
    'filtersCount',
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
      private sharingService: SharingService,
      public route: ActivatedRoute,
      private branchService: BranchService,
      private titleService: Title
  ) {
    this.setTitle('Groups - catalogs');
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
    const searchObject = this.queryFactory.setSearchQuery(dataSearch, ['name']);
    const whereObject = {
      and: [
          {branchId: this.branchService.currentBranch.getValue().id},
          searchObject
      ]
    };
    /* set query properties */
    const page = this.paginator ? this.paginator.pageSize : 25;
    const skip = this.paginator ? page * this.paginator.pageIndex : 0;
    const sorter = this.queryFactory.setSorterProperty(sort);
    const getDataQuery = 'Groups' + '?filter=' + JSON.stringify({
      where: whereObject,
      limit: page,
      skip: skip,
      order: sorter,
      include: [
        {
          relation : 'clients',
          scope: {
            fields: ['id']
          }
        }
      ]
    });
    console.log(whereObject);
    console.log(getDataQuery);
    /* if requires data count */
    if (count) {
      const getCountQuery = this.queryFactory.generateGetCountQuery('Groups', whereObject);
      /* preform count request */
      this.apiService.getDataObjects(getCountQuery).pipe(takeUntil(this.onDestroy)).subscribe((count: any) => {
        this.tableCount = count.count;
        if (this.tableCount > 0) {
          /* preform data request */
          this.dataSource.loadData(getDataQuery).pipe(takeUntil(this.onDestroy)).subscribe((data) => {
            console.log(data);
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
  // Open group function //
  // ----------------- //
  public openGroup(row: any) {
    this.sharingService.groupData = row;
    this.router.navigate([row.id], {relativeTo: this.route});
  }
  // ----------------- //
  // New group function //
  // ----------------- //
  public newGroup() {
    this.sharingService.groupData = null;
    this.router.navigate(['new'], {relativeTo: this.route});
  }
  // -------------------- //
  // On destroy lifecycle //
  // -------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
