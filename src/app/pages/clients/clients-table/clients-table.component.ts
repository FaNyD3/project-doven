import {
  AfterViewInit, ChangeDetectorRef,
  Component,
  ElementRef, HostListener, NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {
  MatCheckbox,
  MatDialog,
  MatExpansionPanel,
  MatPaginator,
  MatSnackBar,
  MatSort,
  MatSortable
} from "@angular/material";
import {CustomDataSource} from "../../../tableQueries/customDataSource";
import {ApiService} from "../../../services/api/api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {QueryFactory} from "../../../tableQueries/queryFactory";
import {FormControl} from "@angular/forms";
import {debounceTime, startWith, switchMap, takeUntil} from "rxjs/operators";
import {CrudClientComponent} from "./crud-client/crud-client.component";
import {MapClientsComponent} from "./map-clients/map-clients.component";
// import {SharingService} from "../../../services/sharing/sharing.service";
import {BranchService} from "../../../services/branch/branch.service";
import {AuthService} from "../../../services/auth/auth.service";
// import {ProductsListComponent} from "../../../modals/products-list/products-list.component";
import {animate, state, style, transition, trigger} from '@angular/animations';
import {Title} from "@angular/platform-browser";

declare const google: any;

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
  selector: 'app-clients-table',
  templateUrl: './clients-table.component.html',
  styleUrls: ['./clients-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ClientsTableComponent implements OnInit, AfterViewInit, OnDestroy {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  /* manage component */
  @ViewChildren('displayData') displayElem: QueryList<any>;
  @ViewChildren('noData') noDisplayElem: QueryList<any>;
  @ViewChildren('clientCheck') clientChecks: QueryList<MatCheckbox>; // cambiar
  public displayData = new BehaviorSubject<boolean>(false);
  private onDestroy = new Subject<void>();
  public firstLoad = true;
  public editAccess = true;
  /* manage DOM elements */

  @ViewChild('mapButton', {static: false}) mapButton: ElementRef;

  @ViewChild('resetbutton', {static: false}) resetbutton: ElementRef;
  @ViewChild('newPilotButton', {static: false}) newPilotButton: ElementRef;
  @ViewChild('expansionFilters', {static: false}) expansionFilters: MatExpansionPanel;
  @ViewChild('clientsCard', {static: false}) clientsCard: ElementRef; // cambiar
  @ViewChild('addressWrapper', {static: false}) addressWrapper: HTMLInputElement;

  public isExpanded = false;
  public expandableSetted = false;
  /* manage table (DESKTOP) */
  @ViewChild(MatSort, {static: false}) sort: MatSort;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;
  public tableCount = 0;
  public dataSource: CustomDataSource;
  public displayedColumns: string[] = [
    // 'id',
    'name',
    // 'email',
    // 'password',
    'lastName',
    'phone',
    'createdAt',
    'lastDate',
    'type',
    'status',
    'tags',
    'button'
  ];
  public productColumns: string[] = [];
  public cellHover = '';
  /* manage table (MOBILE) */
  public displayedResponsiveColumns: string[] = [
    // 'id',
    'name',
    'type',
    'lastName',
    'email'
  ];
  public isExpansionDetailRow = (i: number, row: Object) => true;
  public expandedElement: any;
  public selectedClients: any[] = [];
  /* manage closed deals of clients */
  public dealsCount: any[] = [];
  /* manage filters */
  public filterTags: string[] = [];
  public productOptions: Observable<any>;
  public filterProducts: any[] = [];
  public buyerOptions: Observable<any>;
  public filterBuyers: any[] = [];
  public groupOptions: Observable<any>;
  public filterGroups: any[] = [];
  /* manage address filter */
  public searchPoint = null;
  public placeAutocomplete;
  public placeAutocompleteMobile;
  public circleCoords: any[] = [];
  public isRegexAddress = true;
  private patchGoogle = false;
  /* manage responsive component */
  public showOnLarge = window.innerWidth > 960;
  public showBigTable = window.innerWidth > 1054;
  // --------------------- //
  // Component constructor //
  // --------------------- //
  constructor(
      private apiService: ApiService,
      public router: Router,
      public route: ActivatedRoute,
      public queryFactory: QueryFactory,
      public dialog: MatDialog,
      // public sharingService: SharingService,
      private branchService: BranchService,
      private authService: AuthService,
      private changeDetectorRef: ChangeDetectorRef,
      private zone: NgZone,
      private snackBar: MatSnackBar,
      private titleService: Title
  ) {
    this.setTitle('Pilotos');
  }
  public setTitle(newTitle: string) {
    this.titleService.setTitle( newTitle );
  }
  // -------------------------------------- //
  // Form inputs & validations declaration  //
  // -------------------------------------- //
  // tslint:disable-next-line: member-ordering
  public searchbar = new FormControl({value: '', disabled: false});
  // tslint:disable-next-line: member-ordering
  public categories = new FormControl({value: [],disabled: false});
  public type = new FormControl({value: '', disabled: false});
  // tslint:disable-next-line: member-ordering
  public tags = new FormControl({value: '', disabled: false});
  // tslint:disable-next-line: member-ordering
  public products = new FormControl({value: '', disabled: false}, [objectValidator.validData]);
  public buyers = new FormControl({value: '', disabled: false}, [objectValidator.validData]);
  public groups = new FormControl({value: '', disabled: false}, [objectValidator.validData]);
  public rate = new FormControl({value: [], disabled: false});
  public address = new FormControl({value: '', disabled: false});
  public kms = new FormControl({value: '', disabled: false});
  // ----------------- //
  // Listener OnResize //
  // ----------------- //
  @HostListener('window:resize') onResize() {
    let tempOnLarge;
    let tempOnBigTable;
    /* if firstLoad set change points */
    if (this.firstLoad ) {
      tempOnLarge = !this.showOnLarge;
      tempOnBigTable = !this.showBigTable;
    } else {
      tempOnLarge = window.innerWidth > 960;
      tempOnBigTable = window.innerWidth > 1054;
    }
    /* if resize pass !showOnLarge point */
    if (tempOnLarge !== this.showOnLarge) {
      this.showOnLarge = window.innerWidth > 960;
      if (this.showOnLarge) {
        setTimeout(() => {
          this.setGoogleAutocomplete();
        }, 350);
      } else {
        setTimeout(() => {
          this.setGoogleAutocompleteMobile();
        }, 350);
        /* set expandable listener */
        if (!this.expandableSetted) {
          setTimeout(() => {
            //this.setExpandableListener();
          }, 250);
        }
      }
    }
    /*
    if (tempOnBigTable !== this.showBigTable) {
      this.showBigTable = window.innerWidth > 1054;
      this.dataSource = new CustomDataSource(this.apiService);
      this.loadTableData(this.searchbar.value, this.address.value, this.categories.value,  this.kms.value, this.rate.value, true, this.sort);
    }
    */
  }
  // ------------- //
  // On init cycle //
  // ------------- //
  ngOnInit() {
    this.dataSource = new CustomDataSource(this.apiService);
    this.authService.userObservable.pipe(takeUntil(this.onDestroy)).subscribe((user) => {
      /*
      if (user) {
        this.editAccess = user.user.role === 'generalAdmin' || user.user.role === 'branchAdmin';
      }
      */
    });
    /* table data source */
    /*
    this.dataSource = new CustomDataSource(this.apiService);
    if (this.authService.currentUserValue) {
      const userRole = this.authService.currentUserValue.user.role;
      this.editAccess = userRole === 'generalAdmin' || userRole === 'branchAdmin';
    }
    this.authService.userObservable.pipe(takeUntil(this.onDestroy)).subscribe((user) => {
      if (user) {
        this.editAccess = user.user.role === 'generalAdmin' || user.user.role === 'branchAdmin';
      }
    });
    this.selectedClients = localStorage.getItem('selectedClients') ? JSON.parse(localStorage.getItem('selectedClients')) : [];
    */
  }
  // --------------------- //
  // After view init cycle //
  // --------------------- //
  ngAfterViewInit() {
    this.setFilterListeners();
    this.displayData.asObservable().pipe(takeUntil(this.onDestroy)).subscribe(isData => this.showData(isData));
    this.branchService.branchesLoaded.pipe(takeUntil(this.onDestroy)).subscribe((state) => {
      if (state) {
        this.branchService.branchObservable.pipe(takeUntil(this.onDestroy)).subscribe((data) => {
          this.loadTableData(this.searchbar.value, this.categories.value,  this.rate.value,true, this.sort);
        });
      }
    });
  }
  // --------------------- //
  // Set filters listeners //
  // --------------------- //
  private setFilterListeners() {
    /* on search change (managing 250 ms) */
    this.searchbar.valueChanges.pipe(
      takeUntil(this.onDestroy),
      debounceTime(250)
    ).subscribe( (dataSearch) => {
      this.loadTableData(dataSearch, this.categories.value, this.rate.value,true, this.sort);
    });
  }

  public onAddressTextChange(event) {
    // console.log(event);
  }
  // ------------------------------ //
  // Set google autocomplete config (DESKTOP) //
  // ------------------------------ //
  private setGoogleAutocomplete() {
    console.log('trying to wrap maps on input');
    /* wrap google autocomplete on input */
    this.placeAutocomplete = new google.maps.places.Autocomplete(document.getElementById('addressWrapper'), {});
    google.maps.event.addListener(this.placeAutocomplete, 'place_changed', () => {
      /* Emit the new address object for the updated place */
      if (this.placeAutocomplete.getPlace()) {
        this.zone.run(() => {
          this.searchPoint = {
            lat: this.placeAutocomplete.getPlace().geometry.location.lat(),
            lng: this.placeAutocomplete.getPlace().geometry.location.lng(),
            selectedText: this.placeAutocomplete.getPlace().formatted_address
          };
          this.patchGoogle = true;
          this.address.patchValue((<HTMLInputElement>document.getElementById('addressWrapper')).value);
          // this.address.patchValue((<HTMLInputElement>document.getElementById('addressWrapper2')).value);
        });
      }
    });
  }
  // ------------------------------ //
  // Set google autocomplete config (MOBILE) //
  // ------------------------------ //
  private setGoogleAutocompleteMobile() {
    console.log('trying to wrap maps on mobile input');
    /* wrap google autocomplete on input */
    this.placeAutocompleteMobile = new google.maps.places.Autocomplete(document.getElementById('addressWrapper2'), {});
    google.maps.event.addListener(this.placeAutocompleteMobile, 'place_changed', () => {
      /* Emit the new address object for the updated place */
      if (this.placeAutocompleteMobile.getPlace()) {
        this.zone.run(() => {
          this.searchPoint = {
            lat: this.placeAutocompleteMobile.getPlace().geometry.location.lat(),
            lng: this.placeAutocompleteMobile.getPlace().geometry.location.lng(),
            selectedText: this.placeAutocompleteMobile.getPlace().formatted_address
          };
          this.patchGoogle = true;
          this.address.patchValue((<HTMLInputElement>document.getElementById('addressWrapper2')).value);
          // this.address.patchValue((<HTMLInputElement>document.getElementById('addressWrapper2')).value);
        });
      }
    });
  }

  // ----------------- //
  // Set circle coords //
  // ----------------- //
  private setCircleCoords() {
    this.isRegexAddress = false;
    if (this.kms.value === '' || this.kms.value === undefined || this.kms.value === null) {
      this.kms.patchValue(100);
    }
    const origin = { lat: this.searchPoint.lat, lng: this.searchPoint.lng };
    const circle = new google.maps.Circle({
      center: origin,
      radius: this.kms.value * 1000
    });
    this.circleCoords = [];
    const orObject: any[] = [];
    for (let x = 0; x < 32; x++) {
      const startPoint = google.maps.geometry.spherical.computeOffset(circle.getCenter(), (this.kms.value * 1000), (5.625 * x));
      const endPoint = google.maps.geometry.spherical.computeOffset(circle.getCenter(), (this.kms.value * 1000), ((5.625 * x) + 180));
      /*const marker1 = new google.maps.Marker({
        position: startPoint,
        map: this.map,
      });
      const marker2 = new google.maps.Marker({
        position: endPoint,
        map: this.map,
      });
      marker1.setMap(this.map);
      marker2.setMap(this.map);*/
      if (x !== 0 && x !== 4) {
        orObject.push({
          and: [
            { ['location.lat']: {between: [((5.625 * x) < 90) ? endPoint.lat(): startPoint.lat() ,((5.625 * x) < 90) ? startPoint.lat(): endPoint.lat()]} },
            /*{ ['location.lat']: {[((22.5 * x) < 90) ? 'lt' : 'gt']: startPoint.lat()} },
            { ['location.lat']: {[((22.5 * x) < 90) ? 'gt' : 'lt']: endPoint.lat()} },*/
            { ['location.lng']: {between: [endPoint.lng(), startPoint.lng()]} },
            /*{ ['location.lng']: {lt: startPoint.lng()} },
            { ['location.lng']: {gt: endPoint.lng()} },*/
          ]
        });
      }
    }
    this.circleCoords.push({or: orObject});
    // this.loadTableData(this.searchbar.value, this.address.value, this.categories.value, this.kms.value, this.rate.value, true, this.sort);
  }
  // -------------------------------//
  // Method to preloaddata from service  //
  // -------------------------------//
  preloadSearch(dataPilots: any) {
    if (dataPilots.tags) {
      for (let x = 0; x < dataPilots.tagsObject.length; x++) {
        this.filterTags.push(dataPilots.tagsObject[x]);
      }
    }
    if (dataPilots.buyers) {
      for (let x = 0; x < dataPilots.buyersObject.length; x++) {
        this.filterBuyers.push(dataPilots.buyersObject[x]);
      }
    }
    if (dataPilots.groups) {
      for (let x = 0; x < dataPilots.groups.groups.length; x++) {
        this.filterGroups.push(dataPilots.groups.groups[x]);
      }
    }
    if (dataPilots.products) {
      const filterProducts = dataPilots.products.products;
      for (let x = 0; x < filterProducts.length; x++) {
        const formattedName = this.setFormmatedReq(filterProducts[x].name);
        /* get product abreviation */
        filterProducts[x].abreviation = this.getProductAvreviation(filterProducts[x].name);
        /* filtered products array */
        this.filterProducts.push(filterProducts[x]);
        /* products columns array */
        this.productColumns.push(formattedName);
        /* table columns array */
        this.displayedColumns.splice(7,0, formattedName);
      }
    }
    this.patchGoogle = true;
    if (dataPilots.place) {
      this.searchPoint = {
        lat: dataPilots.place.location.lat,
        lng: dataPilots.place.location.lng,
        selectedText: dataPilots.place.formattedAddress
      };
      this.kms.patchValue(dataPilots.place.radius);
      this.setCircleCoords();
      this.address.patchValue(dataPilots.place.formattedAddress);
    } else if (dataPilots.searchAddress) {
      this.address.patchValue(dataPilots.searchAddressString);
    }
    /*if (dataClients.sorter) {
      this.sort.active = dataClients.sorter.active;
      this.sort.direction = dataClients.sorter.direction.toLowerCase();
    }*/
    if (dataPilots.searchString) {
      this.searchbar.patchValue(dataPilots.searchString);
    }
    if (dataPilots.categories) {
      this.categories.patchValue(dataPilots.categories.category.inq);
    }
    if (dataPilots.rates) {
      this.rate.patchValue(dataPilots.rates.rate.inq);
    }

    if (localStorage.getItem('pilotsPage')) {
      // this.paginator.pageIndex = parseInt(localStorage.getItem('clientsPage'));
    }
  }

  setPage() {
    // localStorage.setItem('clientsPage', this.paginator.pageIndex.toString());
  }
  // -------------------------------//
  // Method to make buttons bigger  //
  // -------------------------------//

  // --------------------------------//
  // Method to make buttons smaller  //
  // --------------------------------//

  // ---------------------------------------------------//
  // Method to display name and load id on autocomplete //
  // ---------------------------------------------------//
  displayFn(data?: any): string | undefined {
    return data ? data.name : undefined;
  }
  // --------------------------------------------//
  // Method to load products with the autocomplete //
  // --------------------------------------------//
  loadProductOptions(dataSearch: string) {
    /*
    const searchQuery = this.queryFactory.setSearchQuery(dataSearch, ['name']);
    const andObject: any[] = [
      searchQuery
    ];
    for (let x = 0; x < this.filterProducts.length; x++) {
      andObject.push({ id: { neq: this.filterProducts[x].id } });
    }
    const whereQuery = {
      and: andObject
    };
    const getProductsQuery = this.queryFactory.generateGetQuery('Products', whereQuery, 25, 0, 'name ASC', []);
    return new Observable<any>((objs) => this.apiService.getDataObjects(getProductsQuery).subscribe((data: any[]) => {
      data.forEach((product) => {
        product.color = this.getRandomColor();
      });
      objs.next(data);
    }));
    */
  }
  // --------------------------------------------//
  // Method to load buyers with the autocomplete //
  // --------------------------------------------//
  loadBuyerOptions(dataSearch: string) {
    /*
    const searchQuery = this.queryFactory.setSearchQuery( dataSearch, ['name']);
    const andObject: any[] = [
      searchQuery
    ];
    const getBuyersQuery = this.queryFactory.generateGetQuery('partners', {and: andObject}, 25, 0, 'name ASC', ['branches']);
    return new Observable<any>((objs) => this.apiService.getDataObjects(getBuyersQuery).subscribe((data: any[]) => {
      objs.next(data);
    }));
    */
    /*
    const searchQuery = this.queryFactory.setSearchQuery(dataSearch, ['name']);
    const andObject: any[] = [
      searchQuery
    ];
    for (let x = 0; x < this.filterBuyers.length; x++) {
      andObject.push({ id: { neq: this.filterBuyers[x].id } });
    }
    if (this.obtainUserPermitions() === 'branchAdmin') {
      andObject.push({
        or: [
          { role: 'branchTrader' },
          { role: 'branchAdmin' },
        ]
      });
    }
    const getBuyersQuery = this.queryFactory.generateGetQuery('AppUsers', {and: andObject}, 25, 0, 'name ASC', ['branches']);
    return new Observable<any>((objs) => this.apiService.getDataObjects(getBuyersQuery).subscribe((data: any[]) => {
      if (this.obtainUserPermitions() === 'generalAdmin') {
        objs.next(data);
      } else {
        const filteredData: any[] = [];
        data.forEach((user) => {
          if (this.validateUserWithBranches(user)) {
            filteredData.push(user);
          }
        });
        objs.next(filteredData);
      }
    }));

    */
  }
  // --------------------------------------------//
  // Method to load groups with the autocomplete //
  // --------------------------------------------//
  loadGroupOptions(dataSearch: string) {
    /* AÑADIR FILTRO POR BRANCH DEPENDIENDO USER PERMITIONS */
    /*
    const searchQuery = this.queryFactory.setSearchQuery(dataSearch, ['name']);
    const andObject: any[] = [
      searchQuery
    ];
    for (let x = 0; x < this.filterGroups.length; x++) {
      andObject.push({ id: { neq: this.filterGroups[x].id } });
    }
    andObject.push({ branchId: this.branchService.currentBranch.getValue().id });
    const getGroupsQuery = this.queryFactory.generateGetQuery('Groups', {and: andObject}, 25, 0, 'name ASC', []);
    return new Observable<any>((objs) => this.apiService.getDataObjects(getGroupsQuery).subscribe((data: any[]) => {
      objs.next(data);
    }));
    */
  }
  // -------------------------------------------- //
  // Method to obtain logged user permitions role //
  // -------------------------------------------- //
  obtainUserPermitions() {
    return this.authService.currentUserValue.user.role;
  }
  // ------------------------------------------------------------------ //
  // Method to validate if buyers match with logged user branch options //
  // ------------------------------------------------------------------ //

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
  public loadTableData(dataSearch: string, type: string[], rates: number[], count: boolean, sort: any) {

    const searchService: any = {};
    const searchObject = this.queryFactory.setSearchQuery(dataSearch, [ 'id', 'name', 'type' ]);
    const searchQuery = this.queryFactory.setSearchQuery(dataSearch, ['name']);
    const andObject: any[] = [
      searchObject,
    ];
    // andObject.push({branchOfficeId: this.branchService.currentBranch.getValue().id})

    if (dataSearch !== '') {
      searchService.search = searchObject;
      searchService.searchString = dataSearch;
    }

    /* set rates filter */
    if (rates.length > 0) {
      andObject.push({rate: {inq: rates}});
      searchService.rates = {rate: {inq: rates}};
      searchService.ratesCount = rates.length;
    }

    /* set category filter */

    if ( type.length > 0) {
      // andObject.push({gender: {inq: gender}});
      // searchService.gender =  {gender: {inq: gender}};
      // searchService.genderCount = gender.length;
    }

    if (this.filterTags.length > 0) {
      andObject.push({tags: {inq: this.filterTags}});
      searchService.tags = {tags: {inq: this.filterTags}};
      searchService.tagsObject = this.filterTags;
      searchService.tagsCount = this.filterTags.length;
    }
    const currentUser = this.authService.currentUserValue;

    /* set query properties */
    const page = this.paginator ? this.paginator.pageSize : 25;
    const skip = this.paginator ? page * this.paginator.pageIndex : 0;
    searchService.skip = skip;
    searchService.page = page;
    let sorter;
    if (sort.active && sort.direction) {

      if (sort.active === 'button') {
        sorter = 'rate ' + sort.direction;
        searchService.sorter = {active: 'rate', direction: sort.direction};
      } else {
        sorter = sort.active + ' ' + sort.direction;
        searchService.sorter = {active: sort.active, direction: sort.direction};
      }
    } else {
      sorter = 'createdAt DESC';
    }

    /* set include object */
    const include = [
    ];

    // searchService.sorter = {active: 'id', direction: 'DESC'};
    const getDataQuery = this.queryFactory.generateGetQuery('Admins', {and: andObject}, page, skip, sorter, include);
    if( count ){
      const getCountQuery = this.queryFactory.generateGetCountQuery('Admins', {and: andObject});

      this.apiService.getDataObjects(getCountQuery).pipe(takeUntil(this.onDestroy)).subscribe((countPartners: any) => {
        this.tableCount = countPartners.count;
        if (this.tableCount > 0) {
          /* preform data request */
          this.dataSource.loadData(getDataQuery).pipe(takeUntil(this.onDestroy)).subscribe((data) => {
            if (this.firstLoad) {
              this.firstLoad = false;
            }
            this.displayData.next(true);
            this.changeDetectorRef.markForCheck();
            /* notify result */
          });

        } else {
          if (this.firstLoad) {
            this.firstLoad = false;
          }
          /* notify result */
          this.displayData.next(false);
          this.changeDetectorRef.markForCheck();
        }
      });

    } else {
      /* preform data request */
      this.dataSource.loadData(getDataQuery).pipe(takeUntil(this.onDestroy)).subscribe((clients) => {
        this.changeDetectorRef.markForCheck();
      });
      this.changeDetectorRef.markForCheck();
    }
  }

  resetSelectedClients() {
    this.selectedClients = [];
    localStorage.setItem('selectedPilots', JSON.stringify(this.selectedClients));
  }
  // --------------------- //
  // Open branch function //
  // --------------------- //
  public openClient(data: any) {
    const dialogRef = this.dialog.open( CrudClientComponent, {
      data: {
        client: data,
        title: 'Actualizar Piloto',
        branch: this.branchService.currentBranch.getValue(),
        isNew: false
      },
      autoFocus: false,
      width: '1000px'
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe((result) => {
      if (result !== undefined) {
        if (result.changes) {
          this.loadTableData(this.searchbar.value, this.categories.value, this.rate.value, true, this.sort);
        }
      }
    });
  }
  // ----------------- //
  // New user function //
  // ----------------- //
  public newPilot() {
    if ( this.editAccess ) {
      const dialogRef = this.dialog.open(CrudClientComponent, {
        data: {
          client: {},
          title: 'Nuevo Piloto',
          /*
          branch: {
            name: 'San Andres',
            color: 'blue'
          },
          */
          branch: this.branchService.currentBranch.getValue(),
          isNew: true
        },
        autoFocus: false,
        width: '1000px'
      });
      dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe((result) => {
        if (result !== undefined) {
          if (result.changes) {
            this.loadTableData(this.searchbar.value, this.categories.value, this.rate.value,true, this.sort );
          }
        }
      });
    }
  }

  // --------------------- //
  // open map modal method //
  // --------------------- //
  openMapView() {
    const dialogRef = this.dialog.open(MapClientsComponent, {
      data: {
        client: {},
        title: 'New Pilot',
        isNew: true
      },
      autoFocus: false,
      width: '90vw',
      maxWidth: '90vw',
      minWidth: '90vw',
      height: '90vh',
      maxHeight: '90vh',
      minHeight: '90vh'
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(() => {
      //this.loadTableData(this.searchbar.value, this.address.value, this.categories.value,  this.kms.value, this.rate.value, true, this.sort);
    });
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
        if (this.selectedClients.findIndex(clientId => clientId === className) === -1) {
          this.selectedClients.push(className);
          localStorage.setItem('selectedPilots', JSON.stringify(this.selectedClients));
        }
      }else {
        for (let x = 0; x < cells.length; x++) {
            cells[x].classList.remove('selectedRow');
        }
        this.selectedClients.splice(this.selectedClients.findIndex(clientId => clientId === className) ,1);
        localStorage.setItem('selectedPilots', JSON.stringify(this.selectedClients));
      }
  }
  // -------------- //
  // add tag method //
  // -------------- //
  addTag() {
    const selected = this.tags.value;
    if (selected !== '') {
      this.filterTags.push(selected);
      this.tags.patchValue('');
    }
    this.loadTableData(this.searchbar.value, this.categories.value, this.rate.value, true, this.sort);
  }
  removeTag(tag: string) {
    this.filterTags.splice(this.filterTags.findIndex(obj => obj === tag), 1);
    this.loadTableData(this.searchbar.value, this.categories.value, this.rate.value, true, this.sort);
  }
  // ------------------ //
  // add product method //
  // ------------------ //
  addProduct() {
    const selected = this.products.value;
    if (this.products.valid) {
      const formattedName = this.setFormmatedReq(selected.name);
      /* get product abreviation */
      selected.abreviation = this.getProductAvreviation(selected.name);
      /* filtered products array */
      this.filterProducts.push(selected);
      /* products columns array */
      this.productColumns.push(formattedName);
      /* table columns array */
      this.displayedColumns.splice(7,0, formattedName);
      this.products.patchValue('');
      // this.loadTableData(this.searchbar.value, this.address.value, this.categories.value,  this.kms.value, this.rate.value, true, this.sort);
    }
  }
  setFormmatedReq(name: string) {
    return name.replace(/ /g,"_").toLowerCase();
  }
  getProductAvreviation(product: string) {
    const splittedProduct = product.split(' ');
    if (splittedProduct.length > 1) {
      return splittedProduct[0].substring(0,1) + '.' + splittedProduct[1].substring(0,1) + '.';
    } else {
      return splittedProduct[0].substring(0,2) + '.';
    }
  }
  removeProduct(product: any) {
    this.filterProducts.splice(this.filterProducts.findIndex(obj => obj.id === product.id), 1);
    const formattedName = this.setFormmatedReq(product.name);
    this.productColumns.splice(this.productColumns.findIndex(column => column === formattedName), 1);
    this.displayedColumns.splice(this.displayedColumns.findIndex(column => column === formattedName), 1);
    this.products.patchValue('');
    // this.loadTableData(this.searchbar.value, this.address.value, this.categories.value,  this.kms.value, this.rate.value, true, this.sort);
  }
  // -------------- //
  // add buyer method //
  // -------------- //
  addBuyer() {
    const selected = this.buyers.value;
    if (this.buyers.valid) {
      this.filterBuyers.push(selected);
      this.buyers.patchValue('');
    }
    // this.loadTableData(this.searchbar.value, this.address.value, this.categories.value,  this.kms.value, this.rate.value, true, this.sort);
  }
  // -------------- //
  // remove buyer method //
  // -------------- //
  removeBuyer(buyer: any) {
    this.filterBuyers.splice(this.filterBuyers.findIndex(obj => obj.id === buyer.id), 1);
    // this.loadTableData(this.searchbar.value, this.address.value, this.categories.value,  this.kms.value, this.rate.value, true, this.sort);
    this.buyers.patchValue('');
  }
  // -------------- //
  // add group method //
  // -------------- //
  addGroup() {
    const selected = this.groups.value;
    if (this.groups.valid) {
      this.filterGroups.push(selected);
      this.groups.patchValue('');
    }
    // this.loadTableData(this.searchbar.value, this.address.value, this.categories.value,  this.kms.value, this.rate.value, true, this.sort);
  }
  // -------------- //
  // remove group method //
  // -------------- //
  removeGroup(group: any) {
    this.filterGroups.splice(this.filterGroups.findIndex(obj => obj.id === group.id), 1);
    // this.loadTableData(this.searchbar.value, this.address.value, this.categories.value,  this.kms.value, this.rate.value, true, this.sort);
    this.groups.patchValue('');
  }
  // -----------------------------------------------------------------------------||
  // Show details method (load children component with the selected route data) ||
  // -----------------------------------------------------------------------------||
  details(row: any, clientIndexInTable: number) {
    // console.log('row', row);
    // console.log('client', clientIndexInTable);
    /*
    const page = this.paginator ? this.paginator.pageSize : 25;
    const skip = this.paginator ? page * this.paginator.pageIndex : 0;


    this.sharingService.serviceData.next(row);
    this.sharingService.currentClient.next(skip + clientIndexInTable);

    this.sharingService.clientsScroll = this.clientsCard.nativeElement.scrollTop;

    this.router.navigate([row.id], {relativeTo: this.route});
    */
    this.router.navigate([ row.number ], { relativeTo: this.route } );
  }
  obtainTypeValue(value: string) {
    switch (value) {
      case 'producer':
        return 'Producer';
      case 'broker':
        return 'Broker';
      case 'elevator':
        return 'Elevator';
      case 'cleaning':
        return 'Cleaning plant';
      default:
        return '';
    }
  }
  validateCategory(categories: string[], match) {
    if (categories.length > 0) {
      return categories.findIndex(cat => cat === match) > -1;
    }
    return false;
  }
  setExpanded() {

  }
  // -------------------- //
  // Method to reset filters //
  // -------------------- //
  resetFilters() {
    this.resetSelectedClients();
    for (let x = 0; x < this.productColumns.length; x++) {
      this.displayedColumns.splice(this.displayedColumns.findIndex(columnName => columnName === this.productColumns[x]), 1);
    }
    this.productColumns = [];
    this.filterProducts = [];
    this.filterTags = [];
    this.filterBuyers = [];
    this.filterGroups = [];
    this.searchbar.patchValue('');
    this.categories.patchValue([]);
    this.tags.patchValue('');
    this.products.patchValue('');
    this.buyers.patchValue('');
    this.rate.patchValue([]);
    this.address.patchValue('');
    this.kms.patchValue('');
  // console.log('apply false next to clientSearch on reset');
    localStorage.setItem('pilotsPage', '0');
    /*
    this.paginator.pageIndex = 0;
    this.sharingService.newClientSearch.next(false);
    this.sharingService.serviceData.next(false);
    this.sharingService.currentClient.next(null);
    */
  }

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
    this.presentToast('Datos copiados correctamente', 'gray-snackbar');

  }
  // ----------------------------//
  // Generate random color //
  // ----------------------------//
  getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  setFormattedPhone(phone) {
    if (phone !== undefined && phone !== null) {
      if (typeof phone === 'string') {
        if (phone !== '' && phone !== '0') {
          return  phone.length == 11 ? ( phone.substring(0,1) + ' (' + ' ' +  phone.substring(1,3) + ' ) ' + phone.substring(4,7) + ' ' + phone.substring(7,11)) : ( '(' + ' ' +  phone.substring(0,2) + ' ) ' + phone.substring(3,6) + ' ' + phone.substring(6,10));
        }
      }
    }
    return 'N/A';
  }
  // ---------------------//
  // Present toast method //
  // ---------------------//
  presentToast(message: string, style: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 1000,
      panelClass: [style],
      horizontalPosition: 'end',
      verticalPosition: document.documentElement.clientWidth >= 1050 ? 'top' : 'bottom'
    });
  }
  setFormattedNumber(number: number) {
    if (number) {
      if (number > 999) {
        if (number > 999999) {
          return (number / 1000000).toFixed(1) + ' M';
        } else {
          return (number / 1000).toFixed(1) + ' K';
        }
      }
      return number.toFixed(1);
    }
    return 0;
  }
  // -------------------- //
  // On destroy lifecycle //
  // -------------------- //
  ngOnDestroy(): void {
    window.removeEventListener('resize', ()=>{});
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
