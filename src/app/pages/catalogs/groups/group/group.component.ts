import {Component, ElementRef, NgZone, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {SharingService} from "../../../../services/sharing/sharing.service";
import {ApiService} from "../../../../services/api/api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {QueryFactory} from "../../../../tableQueries/queryFactory";
import {MatCheckbox, MatDialog, MatPaginator, MatSnackBar, MatSort, MatTableDataSource} from '@angular/material';
import {BranchService} from "../../../../services/branch/branch.service";
import {LoadingService} from "../../../../services/loading/loading.service";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {debounceTime, startWith, switchMap, takeUntil} from "rxjs/operators";
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import {objectValidator} from "../../../clients/clients-table/clients-table.component";
import {ProductsListComponent} from "../../../../modals/products-list/products-list.component";
import {AuthService} from "../../../../services/auth/auth.service";
import {Title} from "@angular/platform-browser";

declare const google: any;

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnInit {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  @ViewChildren('displayData') displayElem: QueryList<any>;
  @ViewChildren('noData') noDisplayElem: QueryList<any>;
  @ViewChildren('availableChecks') availableChecks: MatCheckbox[];
  @ViewChildren('belongsToChecks') belongsToChecks: MatCheckbox[];
  @ViewChild('headerAvailableCheck', {static: false}) headerACheck: MatCheckbox;
  @ViewChild('headerBelongsToCheck', {static: false}) headerBCheck: MatCheckbox;
  public displayData = new BehaviorSubject<boolean>(false);
  private onDestroy = new Subject<void>();
  public firstLoad = true;
  public id: string;
  public isNew = true;
  public currentGroup: any = null;
  /* clients lists */
  public availableClientsList: any[] = [];
  public belongsToClientsList: any[] = [];
  /* selected (checked) clients lists */
  public selectedAvailableClients: any[] = [];
  public selectedBelongsToClients: any[] = [];
  /* sorters */
  @ViewChild('belongsToClientsSort', {static: false} ) belongsToClientsSort: MatSort;
  @ViewChild('availableClientsSort', {static: false} ) availableClientsSort: MatSort;
  /* fake tables columns */
  public displayedColumns: string[] = [
      'drag',
      'check',
    'id',
    'name',
      'notes',
    'tags',
    'category',
      'button'
  ];
  /* fake tables dataSource */
  public dataSource = new MatTableDataSource([]);
  /* available clients filters */
  public availableFilterTags: string[] = [];
  public availableFilterProducts: any[] = [];
  public availableFilterBuyers: any[] = [];
  public availableProductOptions: Observable<any>;
  public availableBuyerOptions: Observable<any>;
  public availablePlaceAuto;
  public availableSearchPoint = null;
  public availableCircleCoords: any = [];
  public availablePage = 0;
  public availableCount = 0;
  public isRegexAddress = true;
  private patchGoogle = false;
  /* belongsTo clients filters */
  public belongsToFilterTags: string[] = [];
  public belongsToFilterProducts: any[] = [];
  public belongsToFilterBuyers: any[] = [];
  public belongsToProductOptions: Observable<any>;
  public belongsToBuyerOptions: Observable<any>;
  public belongsToPlaceAuto;
  public belongsToSearchPoint = null;
  public belongsToCircleCoords: any = [];
  public belongsToPage = 0;
  public belongsToCount = 0;
  public notesObject: any[] = [];
  // --------------------- //
  // Component constructor //
  // --------------------- //
  constructor(
      private sharingService: SharingService,
      private apiService: ApiService,
      public router: Router,
      public route: ActivatedRoute,
      public queryFactory: QueryFactory,
      public dialog: MatDialog,
      private branchService: BranchService,
      private loadingService: LoadingService,
      private snackBar: MatSnackBar,
      private zone: NgZone,
      private fb: FormBuilder,
      private authService: AuthService,
      private titleService: Title
  ) {}
  public setTitle(newTitle: string) {
    this.titleService.setTitle( newTitle );
  }
  // -------------------------------------- //
  // Form inputs & validations declaration  //
  // -------------------------------------- //
  public name = new FormControl({value: '', disabled: false}, Validators.required);
  // AVAILABLE CLIENTS FORM //
  public availableForm = this.fb.group({
    searchbar: new FormControl({value: '', disabled: false}),
    tags: new FormControl({value: '', disabled: false}),
    categories: new FormControl({value: [],disabled: false}),
    type: new FormControl({value: '', disabled: false}),
    products: new FormControl({value: '', disabled: false}, [objectValidator.validData]),
    buyers: new FormControl({value: '', disabled: false}, [objectValidator.validData]),
    rate: new FormControl({value: [], disabled: false}),
    address: new FormControl({value: '', disabled: false}),
    kms: new FormControl({value: '', disabled: false})
  });
  // BELONGSTO CLIENTS FORM //
  public belongsToForm = this.fb.group({
    searchbar: new FormControl({value: '', disabled: false}),
    tags: new FormControl({value: '', disabled: false}),
    categories: new FormControl({value: [],disabled: false}),
    type: new FormControl({value: '', disabled: false}),
    products: new FormControl({value: '', disabled: false}, [objectValidator.validData]),
    buyers: new FormControl({value: '', disabled: false}, [objectValidator.validData]),
    rate: new FormControl({value: [], disabled: false}),
    address: new FormControl({value: '', disabled: false}),
    kms: new FormControl({value: '', disabled: false})
  });
  // --------------------- //
  // On view init cycle //
  // --------------------- //
  ngOnInit() {
    const id = window.location.href.split('groups/');
    this.id = id[1].split('/')[0];
    this.isNew = this.id === 'new';
  }
  // --------------------- //
  // After view init cycle //
  // --------------------- //
  ngAfterViewInit() {
    this.setGoogleAutocompletes();
    this.displayData.asObservable().pipe(takeUntil(this.onDestroy)).subscribe((isData: boolean) => this.showData(isData));
    this.setAvailableFiltersListeners();
    this.setBelongsTpFiltersListeners();
    if (this.branchService.branchesLoaded.getValue()) {
      this.startLoading();
    } else {
      this.branchService.branchesLoaded.pipe(takeUntil(this.onDestroy)).subscribe((state) => {
        if (state) {
          this.startLoading();
        }
      });
    }
  }

  /*updateClients () {
    this.apiService.getDataObjects('Clients').pipe(takeUntil(this.onDestroy)).subscribe((clients: any[]) => {
      console.log(clients.length);
      for (let x = 0; x < clients.length; x++) {
        console.log('checando cliente ', x);
        if (clients[x].groupIds.length > 0) {
          this.apiService.editDataObject(clients[x].id, {hasGroups: true}, 'Clients').pipe(takeUntil(this.onDestroy)).subscribe(() => {
            console.log('Client ' + x + ' updated');
          });
        } else {
          this.apiService.editDataObject(clients[x].id, {hasGroups: false}, 'Clients').pipe(takeUntil(this.onDestroy)).subscribe(() => {
            console.log('Client ' + x + ' updated');
          });
        }
      }
    });
  }*/

  // --------------------- //
  // SET FILTERS LISTENERS //
  // --------------------- //
  // set available filter listeners //
  private setAvailableFiltersListeners() {
    /* on address change (change text but not place object) */
    this.availableForm.get('address').valueChanges.pipe(
        takeUntil(this.onDestroy),
        debounceTime(250)
    ).subscribe((data) => {
      if (!this.firstLoad) {
        if (!this.patchGoogle) {
          this.availableSearchPoint = null;
          this.availableCircleCoords = [];
          this.isRegexAddress = true;
        } else {
          this.patchGoogle = false;
        }

        this.loadAvailableClients(this.availableForm.get('searchbar').value, this.availableForm.get('address').value, this.availableForm.get('categories').value, this.availableForm.get('kms').value, this.availableForm.get('rate').value, true, this.availableClientsSort);
      }
    });
    /* on search change (managing 250 ms) */
    this.availableForm.get('searchbar').valueChanges.pipe(
        takeUntil(this.onDestroy),
        debounceTime(250)
    ).subscribe( (dataSearch) => {
      this.loadAvailableClients(this.availableForm.get('searchbar').value, this.availableForm.get('address').value, this.availableForm.get('categories').value, this.availableForm.get('kms').value, this.availableForm.get('rate').value, true, this.availableClientsSort);
    });
    /* on buyer input change (managing 250 ms) */
    this.availableBuyerOptions = this.availableForm.get('buyers').valueChanges.pipe(
        debounceTime(250),
        startWith(''),
        switchMap(value => this.loadBuyerOptions(value, 'available'))
    );
    /* on product input change (managing 250 ms) */
    this.availableProductOptions = this.availableForm.get('products').valueChanges.pipe(
        debounceTime(250),
        startWith(''),
        switchMap(value => this.loadProductOptions(value, 'available'))
    );
  }
  // set belongsTo filter listeners //
  private setBelongsTpFiltersListeners() {
    /* on address change (change text but not place object) */
    this.belongsToForm.get('address').valueChanges.pipe(takeUntil(this.onDestroy)).subscribe((data) => {
      if (!this.firstLoad && this.belongsToSearchPoint !== null) {
        this.belongsToSearchPoint = null;
        this.belongsToCircleCoords = [];
        this.loadBelongsToClients();
      }
    });
    /* on search change (managing 250 ms) */
    this.belongsToForm.get('searchbar').valueChanges.pipe(
        takeUntil(this.onDestroy),
        debounceTime(250)
    ).subscribe( (dataSearch) => {
      this.loadBelongsToClients();
    });
    /* on buyer input change (managing 250 ms) */
    this.belongsToBuyerOptions = this.belongsToForm.get('buyers').valueChanges.pipe(
        debounceTime(250),
        startWith(''),
        switchMap(value => this.loadBuyerOptions(value, 'belongsTo'))
    );
    /* on product input change (managing 250 ms) */
    this.belongsToProductOptions = this.belongsToForm.get('products').valueChanges.pipe(
        debounceTime(250),
        startWith(''),
        switchMap(value => this.loadProductOptions(value, 'belongsTo'))
    );
  }
  // --------------------- //
  // Start loading process //
  // --------------------- //
  startLoading() {
    /* AVOID CHANGES BEFORE LOADED */
    console.log('start loading');
    setTimeout(() => {
      if (this.isNew) {
        this.setTitle('New group - groups');
        /* if is new group */
        if (this.firstLoad) {
          this.firstLoad = false;
        }
        this.displayData.next(true);
        this.loadAvailableClients(this.availableForm.get('searchbar').value, this.availableForm.get('address').value, this.availableForm.get('categories').value, this.availableForm.get('kms').value, this.availableForm.get('rate').value, true, this.availableClientsSort);
      } else {
        /* if is edit group */
        if (this.sharingService.groupData !== null) {
          /* if service has group data (is not first load page) */
          this.currentGroup = this.sharingService.groupData;
          this.setTitle(this.currentGroup.name + ' - group details');
          if (this.firstLoad) {
            this.firstLoad = false;
          }
          this.displayData.next(true);
          this.name.patchValue(this.currentGroup.name);
          this.loadAvailableClients(this.availableForm.get('searchbar').value, this.availableForm.get('address').value, this.availableForm.get('categories').value, this.availableForm.get('kms').value, this.availableForm.get('rate').value, true, this.availableClientsSort);
          this.loadBelongsToClients();
        } else {
          /* if service hasn't group data (is first load page) */
          this.loadGroup(this.id);
        }
      }
    }, 100);
  }
  // --------------------- //
  // Load group from server //
  // --------------------- //
  loadGroup(groupId: string) {
    /* load group from server */
    this.apiService.getDataObject('Groups', groupId + '?filter=' + JSON.stringify({
      include: [
        {
          relation : 'clients',
          scope: {
            include: [
              {
                relation: 'getNotes',
                scope: {
                  order: 'createdAt desc',
                  limit: 10
                }
              }
            ]
          }
        },
      ]
    })).pipe(takeUntil(this.onDestroy)).subscribe((group: any) => {
      console.log(group);
      this.currentGroup = group;
      this.setTitle(this.currentGroup.name + ' - group details');
      this.sharingService.groupData = group;
      this.name.patchValue(group.name);
      if (this.firstLoad) {
        this.firstLoad = false;
      }
      this.belongsToCount = group.clients.length;
      group.clients.forEach((client) => {
        this.belongsToClientsList.push(client);
        /* MANAGE NOTES OBJECT */
        /*const getNotesQuery = 'Notes?filter=' + JSON.stringify({
          where: this.queryFactory.setAndQuery(['branchId', 'clientId'], [this.branchService.currentBranch.getValue().id, client.id]),
          limit: 10,
          order: 'createdAt desc'
        });*/
        /*this.apiService.getDataObjects(getNotesQuery).pipe(takeUntil(this.onDestroy)).subscribe((notes: any) => {
          client.notes = notes;

        });*/
      });
      this.displayData.next(true);
      this.loadAvailableClients(this.availableForm.get('searchbar').value, this.availableForm.get('address').value, this.availableForm.get('categories').value, this.availableForm.get('kms').value, this.availableForm.get('rate').value, true, this.availableClientsSort);
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
  // --------------------------- //
  // GENERIC METHODS FOR FILTERS //
  // --------------------------- //
  setFormmatedReq(name: string) {
    return name.replace(/ /g,"_").toLowerCase();
  }
  resetFilters(clientType: string) {
    if (clientType === 'available') {

    } else {

    }
  }
  // ------------------------------------------- //
  // METHODS FOR GOOGLE AUTOCOMPLETES DIRECTIONS //
  // ------------------------------------------- //
  // Set google autocomplete config //
  private setGoogleAutocompletes() {
    /* wrap google autocomplete on input */
    this.availablePlaceAuto = new google.maps.places.Autocomplete(document.getElementById('availableAddressWrapper'), {});
    google.maps.event.addListener(this.availablePlaceAuto, 'place_changed', () => {
      if (this.availablePlaceAuto.getPlace()) {
        this.zone.run(() => {
          this.availableSearchPoint = {
            lat: this.availablePlaceAuto.getPlace().geometry.location.lat(),
            lng: this.availablePlaceAuto.getPlace().geometry.location.lng(),
            selectedText: this.availablePlaceAuto.getPlace().formatted_address
          };
          this.patchGoogle = true;
          this.availablePlaceAuto.patchValue((<HTMLInputElement>document.getElementById('availableAddressWrapper')).value);
          // this.setCircleCoords('available');
        });
      }
    });
    /* wrap google autocomplete on input */
    this.belongsToPlaceAuto = new google.maps.places.Autocomplete(document.getElementById('belongsToAddressWrapper'), {});
    google.maps.event.addListener(this.belongsToPlaceAuto, 'place_changed', () => {
      if (this.belongsToPlaceAuto.getPlace()) {
        this.zone.run(() => {
          this.belongsToPlaceAuto = {
            lat: this.belongsToPlaceAuto.getPlace().geometry.location.lat(),
            lng: this.belongsToPlaceAuto.getPlace().geometry.location.lng(),
            selectedText: this.belongsToPlaceAuto.getPlace().formatted_address
          };
          this.setCircleCoords('belongsTo');
        });
      }
    });
  }
  // Method to calculate circle radius //
  public setCircleCoords(clientType: string) {
    this.isRegexAddress = false;
    let kms = clientType === 'available' ? this.availableForm.get('kms').value : this.belongsToForm.get('kms').value;
    if (kms === '' || kms === undefined || kms === null) {
      clientType === 'available' ? this.availableForm.get('kms').patchValue(100) : this.belongsToForm.get('kms').patchValue(100);
      kms = 100;
    }
    const origin = {
      lat: clientType === 'available' ? this.availableSearchPoint.lat : this.belongsToSearchPoint.lat,
      lng: clientType === 'available' ? this.availableSearchPoint.lng : this.belongsToSearchPoint.lng
    };
    console.log(origin);
    const circle = new google.maps.Circle({
      center: origin,
      radius: kms * 1000
    });
    clientType === 'available' ? this.availableCircleCoords = [] : this.belongsToCircleCoords = [];
    const orObject: any[] = [];
    for (let x = 0; x < 32; x++) {
      const startPoint = google.maps.geometry.spherical.computeOffset(circle.getCenter(), (kms * 1000), (5.625 * x));
      const endPoint = google.maps.geometry.spherical.computeOffset(circle.getCenter(), (kms * 1000), ((5.625 * x) + 180));
      if (x !== 0 && x !== 4) {
        orObject.push({
          and: [
            { ['location.lat']: {between: [((5.625 * x) < 90) ? endPoint.lat(): startPoint.lat() ,((5.625 * x) < 90) ? startPoint.lat(): endPoint.lat()]} },
            { ['location.lng']: {between: [endPoint.lng(), startPoint.lng()]} },
          ]
        });
      }
    }
    clientType === 'available' ? this.availableCircleCoords.push({or: orObject}) : this.belongsToCircleCoords.push({or: orObject});
    clientType === 'available' ? this.loadAvailableClients(
        this.availableForm.get('searchbar').value,
        this.availableForm.get('address').value,
        this.availableForm.get('categories').value,
        this.availableForm.get('kms').value,
        this.availableForm.get('rate').value,
        true,
        this.availableClientsSort) : this.loadBelongsToClients();
  }
  // --------------------------------- //
  // METHODS FOR GENERIC AUTOCOMPLETES //
  // --------------------------------- //
  // Method to display name and load id on autocomplete //
  displayFn(data?: any): string | undefined {
    return data ? data.name : undefined;
  }
  // Method to load products with the autocomplete //
  loadProductOptions(dataSearch: string, clientType: string) {
    const searchQuery = this.queryFactory.setSearchQuery(dataSearch, ['name']);
    const andObject: any[] = [
      searchQuery
    ];
    const filterProducts = clientType === 'available' ? this.availableFilterProducts : this.belongsToFilterProducts;
    for (let x = 0; x < filterProducts.length; x++) {
      andObject.push({ id: { neq: filterProducts[x].id } });
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
  }
  // Method to load buyers with the autocomplete //
  loadBuyerOptions(dataSearch: string, clientType: string) {
    /* AÑADIR FILTRO POR BRANCH DEPENDIENDO USER PERMITIONS */
    const searchQuery = this.queryFactory.setSearchQuery(dataSearch, ['name']);
    const andObject: any[] = [
      searchQuery
    ];
    const filterBuyers = clientType === 'available' ? this.availableFilterProducts : this.belongsToFilterProducts;
    for (let x = 0; x < filterBuyers.length; x++) {
      andObject.push({ id: { neq: filterBuyers[x].id } });
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
  }
  // Method to generate a random color //
  getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  // Method to obtain logged user permitions role //
  obtainUserPermitions() {
    return this.authService.currentUserValue.user.role;
  }
  // Method to validate if buyers match with logged user branch options //
  validateUserWithBranches(user: any) {
    for (let x = 0; x < this.branchService.branchOptions.length; x++) {
      const userBranches: any[] = user.branches;
      if (userBranches.findIndex(branch => branch.id === this.branchService.branchOptions[x].id) !== -1) {
        return true;
      }
    }
    return false;
  }
  // --------------- //
  // FILTERS METHODS //
  // --------------- //
  // add available tag method //
  addTag(clientType: string) {
    /* detect which list have to update */
    if (clientType === 'available') {
      const selected = this.availableForm.get('tags').value;
      if (selected !== '') {
        this.availableFilterTags.push(selected);
        this.availableForm.get('tags').patchValue('');
      }
      this.loadAvailableClients(this.availableForm.get('searchbar').value, this.availableForm.get('address').value, this.availableForm.get('categories').value, this.availableForm.get('kms').value, this.availableForm.get('rate').value, true, this.availableClientsSort);
    } else {
      const selected = this.belongsToForm.get('tags').value;
      if (selected !== '') {
        this.belongsToFilterTags.push(selected);
        this.belongsToForm.get('tags').patchValue('');
      }
      this.loadBelongsToClients();
    }
  }
  // remove available tag method //
  removeTag(tag: string, clientType: string) {
    /* detect which list have to update */
    if (clientType === 'available') {
      this.availableFilterTags.splice(this.availableFilterTags.findIndex(obj => obj === tag), 1);
      this.loadAvailableClients(this.availableForm.get('searchbar').value, this.availableForm.get('address').value, this.availableForm.get('categories').value, this.availableForm.get('kms').value, this.availableForm.get('rate').value, true, this.availableClientsSort);
    } else {
      this.belongsToFilterTags.splice(this.belongsToFilterTags.findIndex(obj => obj === tag), 1);
      this.loadBelongsToClients();
    }
  }
  // add product method //
  addProduct(clientType: string) {
    /* detect which list have to update */
    if (clientType === 'available') {
      const selected = this.availableForm.get('products').value;
      if (this.availableForm.get('products').valid) {
        const formattedName = this.setFormmatedReq(selected.name);
        this.availableFilterProducts.push(selected);
        this.availableForm.get('products').patchValue('');
        this.loadAvailableClients(this.availableForm.get('searchbar').value, this.availableForm.get('address').value, this.availableForm.get('categories').value, this.availableForm.get('kms').value, this.availableForm.get('rate').value, true, this.availableClientsSort);
      }
    } else {
      const selected = this.belongsToForm.get('products').value;
      if (this.belongsToForm.get('products').valid) {
        const formattedName = this.setFormmatedReq(selected.name);
        this.belongsToFilterProducts.push(selected);
        this.belongsToForm.get('products').patchValue('');
        this.loadBelongsToClients();
      }
    }
  }
  // remove product method //
  removeProduct(product: any, clientType: string) {
    /* detect which list have to update */
    if (clientType === 'available') {
      this.availableFilterProducts.splice(this.availableFilterProducts.findIndex(obj => obj.id === product.id), 1);
      this.availableForm.get('products').patchValue('');
      this.loadAvailableClients(this.availableForm.get('searchbar').value, this.availableForm.get('address').value, this.availableForm.get('categories').value, this.availableForm.get('kms').value, this.availableForm.get('rate').value, true, this.availableClientsSort);
    } else {
      this.belongsToFilterProducts.splice(this.belongsToFilterProducts.findIndex(obj => obj.id === product.id), 1);
      this.belongsToForm.get('products').patchValue('');
      this.loadBelongsToClients();
    }
  }
  // add buyer method //
  addBuyer(clientType: string) {
    if (clientType === 'available') {
      const selected = this.availableForm.get('buyers').value;
      if (this.availableForm.get('buyers').valid) {
        this.availableFilterBuyers.push(selected);
        this.availableForm.get('buyers').patchValue('');
      }
      this.loadAvailableClients(this.availableForm.get('searchbar').value, this.availableForm.get('address').value, this.availableForm.get('categories').value, this.availableForm.get('kms').value, this.availableForm.get('rate').value, true, this.availableClientsSort);
    } else {
      const selected = this.belongsToForm.get('buyers').value;
      if (this.belongsToForm.get('buyers').valid) {
        this.belongsToFilterBuyers.push(selected);
        this.belongsToForm.get('buyers').patchValue('');
      }
      this.loadBelongsToClients();
    }
  }
  // remove buyer method //
  removeBuyer(buyer: any, clientType: string) {
    if (clientType === 'available') {
      this.availableFilterBuyers.splice(this.availableFilterBuyers.findIndex(obj => obj.id === buyer.id), 1);
      this.availableForm.get('buyers').patchValue('');
      this.loadAvailableClients(this.availableForm.get('searchbar').value, this.availableForm.get('address').value, this.availableForm.get('categories').value, this.availableForm.get('kms').value, this.availableForm.get('rate').value, true, this.availableClientsSort);
    } else {
      this.belongsToFilterBuyers.splice(this.belongsToFilterBuyers.findIndex(obj => obj.id === buyer.id), 1);
      this.belongsToForm.get('buyers').patchValue('');
      this.loadBelongsToClients();
    }
  }
  // ------------------------- //
  // AVAILABLE CLIENTS METHODS //
  // ------------------------- //
  // Load available clients //
  loadAvailableClients(dataSearch: string, addressSearch, category: string[], radius: number, rates: number[], count: boolean, sort: any) {
    const searchObject = this.queryFactory.setSearchQuery(dataSearch, ['name', 'landNumber', 'phoneNumber', 'address', 'email', 'productsNames']);
    // searchService.branchId = {branchId: this.branchService.currentBranch.getValue().id};
    if (count) {
      this.availablePage = 0;
    }
    /* crete filter object */
    const andObject: any[] = [
      searchObject,
      { branchId: this.branchService.currentBranch.getValue().id },
      { hasGroups: false }
    ];
    /* set category filter */
    if (category.length > 0) {
      andObject.push({category: {inq: category}});
    }
    /* set tags filter */
    if (this.availableFilterTags.length > 0) {
      andObject.push({tags: {inq: this.availableFilterTags}});
    }
    /* set buyers filter */
    if (this.availableFilterBuyers.length > 0) {
      const orObject: any[] = [];
      for (let x = 0; x < this.availableFilterBuyers.length; x++) {
        orObject.push({ buyerId: this.availableFilterBuyers[x].id });
      }
      andObject.push({or: orObject});
    }
    /* set products filter */
    if (this.availableFilterProducts.length > 0) {
      const inqProducts: string[] = [];
      for (let x = 0; x < this.availableFilterProducts.length; x++) {
        inqProducts.push(this.availableFilterProducts[x].name);
      }
      andObject.push({productsNames: {inq: inqProducts}});
    }
    /* set rates filter */
    if (rates.length > 0) {
      andObject.push({rate: {inq: rates}});
    }
    /* set place & radius filter */
    if (this.availableCircleCoords.length > 0 && this.availableForm.get('kms').value !== '' && !this.isRegexAddress) {
      for (let y = 0; y < this.availableCircleCoords.length; y++) {
        andObject.push(this.availableCircleCoords[y]);
      }
    } else {
      const searchAddressObject = this.queryFactory.setSearchQuery(addressSearch, ['address']);
      andObject.push(searchAddressObject);
    }
    /* set query properties */
    const page = 30;
    const skip = page * this.availablePage;

    /* set sorter property */
    let sorter;
    if (sort) {
      if (sort.active && sort.direction) {
        if (sort.active === 'button') {
          sorter = 'rate ' + sort.direction;
        } else {
          sorter = sort.active + ' ' + sort.direction;
        }
      } else {
        sorter = 'id DESC';
      }
    } else {
      sorter = 'id DESC';
    }

    /* set include object */
    const include = [
      { relation: 'buyer' },
      { relation: 'years',
        scope: {
          order: 'name ASC',
        }
      },
      { relation: 'getNotes',
        scope: {
          order: 'createdAt desc',
          limit: 10
        }
      }
    ];
    /* set get query */
    const getDataQuery = this.queryFactory.generateGetQuery('Clients', {and: andObject}, page, skip, sorter, include);
    /* if requires data count */
    if (count) {
      const getCountQuery = this.queryFactory.generateGetCountQuery('Clients', {and: andObject});
      /* preform count request */
      this.apiService.getDataObjects(getCountQuery).pipe(takeUntil(this.onDestroy)).subscribe((count: any) => {
        this.availableCount = count.count;
        if (this.availableCount > 0) {
          /* preform data request */
          this.apiService.getDataObjects(getDataQuery).pipe(takeUntil(this.onDestroy)).subscribe((data: any[]) => {
            const prevLength = this.availableClientsList.length;
            this.availableClientsList = [];
            console.log('availableCount ', this.availableCount);
            for (let y = 0; y < data.length; y++) {
              if (this.validateClient(data[y])) {

                  /* MANAGE NOTES OBJECT */
                  /*const getNotesQuery = 'Notes?filter=' + JSON.stringify({
                     where: this.queryFactory.setAndQuery(['branchId', 'clientId'], [this.branchService.currentBranch.getValue().id, data[y].id]),
                      limit: 10,
                    order: 'createdAt desc'
                  });
                  this.apiService.getDataObjects(getNotesQuery).pipe(takeUntil(this.onDestroy)).subscribe((notes: any) => {
                      data[y].notes = notes;

                  });*/

                this.availableClientsList.push(data[y]);


              } else {
                this.availableCount = this.availableCount - 1;
              }
            }
            if (this.firstLoad) {
              this.firstLoad = false;
            }
            if (this.availableClientsList.length < 20) {
              this.onAvailableScroll();
            }
          });
        } else {
          if (this.firstLoad) {
            this.firstLoad = false;
          }
          this.availableClientsList = [];
        }
      });
    } else {
      /* preform data request */
      this.apiService.getDataObjects(getDataQuery).pipe(takeUntil(this.onDestroy)).subscribe((data: any[]) => {
        data.forEach((client) => {
          if (this.validateClient(client)) {

            /* MANAGE NOTES OBJECT */
            /*const getNotesQuery = 'Notes?filter=' + JSON.stringify({
              where: this.queryFactory.setAndQuery(['branchId', 'clientId'], [this.branchService.currentBranch.getValue().id, client.id]),
              limit: 10,
              order: 'createdAt desc'
            });

            this.apiService.getDataObjects(getNotesQuery).pipe(takeUntil(this.onDestroy)).subscribe((notes: any) => {
              client.notes = notes;

            });*/

            this.availableClientsList.push(client);

          } else {
            this.availableCount = this.availableCount - 1;
          }
        });
        if (this.firstLoad) {
          this.firstLoad = false;
        }
        if (this.availableClientsList.length < 20) {
          this.onAvailableScroll();
        }
      });
    }
  }
  validateClient(client: any) {
    for (let x = 0; x < this.belongsToClientsList.length; x++) {
      if (this.belongsToClientsList[x].id === client.id) {
        return false;
      }
    }
    return true;
  }
  checkAllAvaiable(checkEvent) {
    if (checkEvent.checked) {
      this.availableChecks.forEach((check, index) => {
        check.checked = true;
        this.selectedAvailableClients.push(this.availableClientsList[index]);
      });
      console.log(this.selectedAvailableClients);
    } else {
      this.availableChecks.forEach((check, index) => {
        check.checked = false;
        const spliceindex = this.selectedAvailableClients.findIndex(selectedClient => selectedClient.id === this.availableClientsList[index].id);
        if (spliceindex !== -1) {
          this.selectedAvailableClients.splice(spliceindex, 1);
        }
      });
      console.log(this.selectedAvailableClients);
    }
  }
  checkAllBelongsTo(checkEvent) {
    if (checkEvent.checked) {
      this.belongsToChecks.forEach((check, index) => {
        check.checked = true;
        this.selectedBelongsToClients.push(this.belongsToClientsList[index]);
      });
      console.log(this.selectedBelongsToClients);

    } else {
      this.belongsToChecks.forEach((check, index) => {
        check.checked = false;
        const spliceindex = this.selectedBelongsToClients.findIndex(selectedClient => selectedClient.id === this.belongsToClientsList[index].id);
        if (spliceindex !== -1) {
          this.selectedBelongsToClients.splice(spliceindex, 1);
        }
      });
      console.log(this.selectedBelongsToClients);
    }
  }
  // ------------------------- //
  // TABLES SCROLLS //
  // ------------------------- //
  // available scroll //
  onAvailableScroll(){
    this.availablePage = this.availablePage + 1;
    this.loadAvailableClients(this.availableForm.get('searchbar').value, this.availableForm.get('address').value, this.availableForm.get('categories').value, this.availableForm.get('kms').value, this.availableForm.get('rate').value, false, this.availableClientsSort);
  }
  // belongsTo scroll //
  onBelongsToScroll(){
    this.belongsToPage = this.belongsToPage + 1;
    this.loadBelongsToClients();
  }
  // ------------------------- //
  // BELONGSTO CLIENTS METHODS //
  // ------------------------- //
  // Load clients with group relation //
  loadBelongsToClients() {
    this.belongsToClientsList = [];
    this.loadGroup(this.currentGroup.id);
  }
  // ------------------------------------ //
  // DRAGG-DROP / RELATIONS FUNCTIONALITY //
  // ------------------------------------ //
  // Add client to relation on button click //
  addClient(index: number) {
    const client = this.availableClientsList[index];
    transferArrayItem(this.availableClientsList, this.belongsToClientsList, index, 0);
    this.belongsToCount = this.belongsToCount + 1;
    this.availableCount = this.availableCount - 1;
    if ((this.availablePage * 30) - this.belongsToCount < 20) {
      this.onAvailableScroll();
    }
    if (!this.isNew) {
      const groupRelation = {
        groupId: this.currentGroup.id,
        clientId: client.id
      };
      // -----------------
      //  TEMPORARY ---->
      // -----------------
      let updateClientGroups;
      if (client.groupIds) {
        updateClientGroups = client.groupIds;
        updateClientGroups.push(this.currentGroup.id);
      } else {
        updateClientGroups = [this.currentGroup.id];
      }
      const hasGroups = true;
      // -----------------
      //  TEMPORARY ---->
      // -----------------
      this.loadingService.showLoader.next(true);
      this.apiService.addDataRelation(groupRelation, 'Groups', 'clients/rel', this.currentGroup.id, client.id).pipe(takeUntil(this.onDestroy)).subscribe((res) => {
        // -----------------
        //  TEMPORARY ---->
        // -----------------
        this.apiService.editDataObject(client.id, {groupIds: updateClientGroups, hasGroups: hasGroups}, 'Clients').pipe(takeUntil(this.onDestroy)).subscribe(() => {
          this.presentToast('Client added to group succesfullly', 'green-snackbar');
          this.loadingService.showLoader.next(false);
        }, () => {
          this.presentToast('Error adding client group', 'red-snackbar');
          transferArrayItem(this.belongsToClientsList, this.availableClientsList, 0, index);
          this.belongsToCount = this.belongsToCount - 1;
          this.availableCount = this.availableCount + 1;
          this.loadingService.showLoader.next(false);
        });
        // -----------------
        //  TEMPORARY ---->
        // -----------------
      }, () => {
        this.presentToast('Error adding client group', 'red-snackbar');
        transferArrayItem(this.belongsToClientsList, this.availableClientsList, 0, index);
        this.belongsToCount = this.belongsToCount - 1;
        this.availableCount = this.availableCount + 1;
        this.loadingService.showLoader.next(false);
      });
    }
  }
  // Add client to relation on drop event //
  dropClient(event: CdkDragDrop<string[]>) {
    //  console.log(event);
    const client = event.previousContainer.id === 'availableList' ? this.availableClientsList[event.previousIndex] : this.belongsToClientsList[event.previousIndex];
    if (event.previousContainer.id === 'availableList' && event.container.id !== 'availableList') {
      this.belongsToClientsList.splice(event.currentIndex, 0, this.availableClientsList.splice(event.previousIndex, 1)[0]);
      this.belongsToCount = this.belongsToCount + 1;
      this.availableCount = this.availableCount - 1;
    } else if (event.previousContainer.id === 'belongsToList' && event.container.id !== 'belongsToList') {
      this.availableClientsList.splice(event.currentIndex, 0, this.belongsToClientsList.splice(event.previousIndex, 1)[0]);
      this.belongsToCount = this.belongsToCount - 1;
      this.availableCount = this.availableCount + 1;
    } else {
      return
    }
    if ((this.availablePage * 30) - this.belongsToCount < 20) {
      this.onAvailableScroll();
    }
    if (!this.isNew) {
      if (event.previousContainer.id === 'availableList' && event.container.id !== 'availableList') {
        const groupRelation = {
          groupId: this.currentGroup.id,
          clientId: client.id
        };
        // -----------------
        //  TEMPORARY ---->
        // -----------------
        let updateClientGroups;
        if (client.groupIds) {
          updateClientGroups = client.groupIds;
          updateClientGroups.push(this.currentGroup.id);
        } else {
          updateClientGroups = [this.currentGroup.id];
        }
        const hasGroups = true;
        // -----------------
        //  TEMPORARY ---->
        // -----------------
        this.loadingService.showLoader.next(true);
        this.apiService.addDataRelation(groupRelation, 'Groups', 'clients/rel', this.currentGroup.id, client.id).pipe(takeUntil(this.onDestroy)).subscribe((res) => {
          // -----------------
          //  TEMPORARY ---->
          // -----------------
          this.apiService.editDataObject(client.id, {groupIds: updateClientGroups, hasGroups: hasGroups}, 'Clients').pipe(takeUntil(this.onDestroy)).subscribe(() => {
            this.presentToast('Client added to group succesfullly', 'green-snackbar');
            this.loadingService.showLoader.next(false);
          }, () => {
            this.presentToast('Error adding client group', 'red-snackbar');
            transferArrayItem(this.belongsToClientsList, this.availableClientsList, 0, event.previousIndex);
            this.belongsToCount = this.belongsToCount - 1;
            this.availableCount = this.availableCount + 1;
            this.loadingService.showLoader.next(false);
          });
          // -----------------
          //  TEMPORARY ---->
          // -----------------
        }, () => {
          this.presentToast('Error adding client group', 'red-snackbar');
          transferArrayItem(this.belongsToClientsList, this.availableClientsList, 0, event.previousIndex);
          this.belongsToCount = this.belongsToCount - 1;
          this.availableCount = this.availableCount + 1;
          this.loadingService.showLoader.next(false);
        });
      } else {
        // -----------------
        //  TEMPORARY ---->
        // -----------------
        let updateClientGroups = [];
        if (client.groupIds) {
          client.groupIds.splice(client.groupIds.findIndex(group => group === this.currentGroup.id), 1);
          updateClientGroups = client.groupIds;
        }
        let hasGroups = false;
        if (updateClientGroups.length > 0) {
          hasGroups = true;
        }
        // -----------------
        //  TEMPORARY ---->
        // -----------------
        this.loadingService.showLoader.next(true);
        console.log(client);
        this.apiService.deleteDataObject('Groups/' + this.currentGroup.id + '/clients/rel', client.id).pipe(takeUntil(this.onDestroy)).subscribe((res) => {
          // -----------------
          //  TEMPORARY ---->
          // -----------------
          this.apiService.editDataObject(client.id, {groupIds: updateClientGroups, hasGroups: hasGroups}, 'Clients').pipe(takeUntil(this.onDestroy)).subscribe(() => {
            this.presentToast('Client removed from group succesfullly', 'green-snackbar');
            this.loadingService.showLoader.next(false);
          }, () => {
            this.presentToast('Error removing client from group', 'red-snackbar');
            transferArrayItem(this.availableClientsList, this.belongsToClientsList, 0, event.previousIndex);
            this.belongsToCount = this.belongsToCount + 1;
            this.availableCount = this.availableCount - 1;
            this.loadingService.showLoader.next(false);
          });
          // -----------------
          //  TEMPORARY ---->
          // -----------------
        }, () => {
          this.presentToast('Error removing client group', 'red-snackbar');
          transferArrayItem(this.availableClientsList, this.belongsToClientsList, 0, event.previousIndex);
          this.belongsToCount = this.belongsToCount + 1;
          this.availableCount = this.availableCount - 1;
          this.loadingService.showLoader.next(false);
        });
      }
    }
  }
  // Remove selected client relation //
  removeClient(index: number) {
    const client = this.belongsToClientsList[index];
    transferArrayItem(this.belongsToClientsList, this.availableClientsList, index, 0);
      this.belongsToCount = this.belongsToCount - 1;
      this.availableCount = this.availableCount + 1;
    // -----------------
    //  TEMPORARY ---->
    // -----------------
    let updateClientGroups = [];
    if (client.groupIds) {
      client.groupIds.splice(client.groupIds.findIndex(group => group === this.currentGroup.id), 1);
      updateClientGroups = client.groupIds;
    }
    let hasGroups = false;
    if (updateClientGroups.length > 0) {
      hasGroups = true;
    }
    // -----------------
    //  TEMPORARY ---->
    // -----------------
    if (!this.isNew) {
      this.loadingService.showLoader.next(true);
      this.apiService.deleteDataObject('Groups/' + this.currentGroup.id + '/clients/rel', client.id).pipe(takeUntil(this.onDestroy)).subscribe((res) => {
        // -----------------
        //  TEMPORARY ---->
        // -----------------
        this.apiService.editDataObject(client.id, {groupIds: updateClientGroups, hasGroups: hasGroups}, 'Clients').pipe(takeUntil(this.onDestroy)).subscribe(() => {
          this.presentToast('Client removed from group succesfullly', 'green-snackbar');
          this.loadingService.showLoader.next(false);
        }, () => {
          this.presentToast('Error removing client from group', 'red-snackbar');
          transferArrayItem(this.availableClientsList, this.belongsToClientsList, 0, index);
          this.belongsToCount = this.belongsToCount + 1;
          this.availableCount = this.availableCount - 1;
          this.loadingService.showLoader.next(false);
        });
        // -----------------
        //  TEMPORARY ---->
        // -----------------
      }, () => {
        this.presentToast('Error removing client group', 'red-snackbar');
        transferArrayItem(this.availableClientsList, this.belongsToClientsList, 0, index);
        this.belongsToCount = this.belongsToCount + 1;
        this.availableCount = this.availableCount - 1;
        this.loadingService.showLoader.next(false);
      });
    }
  }
  // select row with check method //
  selectRow(event, client: any, clientType: string) {
    if (event.checked) {
      if (clientType === 'available') {
        this.selectedAvailableClients.push(client);
      } else {
        this.selectedBelongsToClients.push(client);
      }
    } else {
      if (clientType === 'available') {
        const spliceindex = this.selectedAvailableClients.findIndex(selectedClient => selectedClient.id === client.id);
        if (spliceindex !== -1) {
          this.selectedAvailableClients.splice(spliceindex, 1);
        }
      } else {
        const spliceindex = this.selectedBelongsToClients.findIndex(selectedClient => selectedClient.id === client.id);
        if (spliceindex !== -1) {
          this.selectedBelongsToClients.splice(spliceindex, 1);
        }
      }
    }
  }
  // move multiple selected clients //
  multipleToBelongs() {
    const clients: any[] = [];
    for (let x = 0; x < this.selectedAvailableClients.length; x++) {
      const availableIndex = this.availableClientsList.findIndex(client => client.id === this.selectedAvailableClients[x].id);
      clients.push(this.availableClientsList[availableIndex]);
      this.belongsToClientsList.splice(0, 0, this.availableClientsList.splice(availableIndex ,1)[0]);
        this.belongsToCount = this.belongsToCount + 1;
        this.availableCount = this.availableCount - 1;
    }
    this.selectedAvailableClients = [];
    if ((this.availablePage * 30) - this.belongsToCount < 20) {
      this.onAvailableScroll();
    }
    console.log(this.headerACheck.checked);
    if (this.headerACheck.checked) {
      this.headerACheck.checked = false;
    }
    if (!this.isNew) {
      this.loadingService.showLoader.next(true);
      let counter = 0;
      for (let x = 0; x < clients.length; x++) {
        const groupRelation = {
          groupId: this.currentGroup.id,
          clientId: clients[x].id
        };
        // -----------------
        //  TEMPORARY ---->
        // -----------------
        let updateClientGroups;
        if (clients[x].groupIds) {
          updateClientGroups = clients[x].groupIds;
          updateClientGroups.push(this.currentGroup.id);
        } else {
          updateClientGroups = [this.currentGroup.id];
        }
        const hasGroups = true;
        // -----------------
        //  TEMPORARY ---->
        // -----------------
        this.apiService.addDataRelation(groupRelation, 'Groups', 'clients/rel', this.currentGroup.id, clients[x].id).pipe(takeUntil(this.onDestroy)).subscribe((res) => {
          // -----------------
          //  TEMPORARY ---->
          // -----------------
          this.apiService.editDataObject(clients[x].id, {groupIds: updateClientGroups, hasGroups: hasGroups}, 'Clients').pipe(takeUntil(this.onDestroy)).subscribe(() => {
            counter++;
            if (counter === clients.length) {
              this.presentToast('Clients added to group succesfullly', 'green-snackbar');
              this.loadingService.showLoader.next(false);
            }
          }, () => {
            this.presentToast('Error adding client group', 'red-snackbar');
            for (let y = 0; y < clients.length; y++) {
              const belongsToIndex = this.belongsToClientsList.findIndex(client => client.id === clients[y].id);
              this.availableClientsList.splice(0, 0, this.belongsToClientsList.splice(belongsToIndex ,1)[0]);
              this.belongsToCount = this.belongsToCount - 1;
              this.availableCount = this.availableCount + 1;
            }
            this.loadingService.showLoader.next(false);
          });
          // -----------------
          //  TEMPORARY ---->
          // -----------------
        }, () => {
          this.presentToast('Error adding clients to group', 'red-snackbar');
          for (let y = 0; y < clients.length; y++) {
            const belongsToIndex = this.belongsToClientsList.findIndex(client => client.id === clients[y].id);
            this.availableClientsList.splice(0, 0, this.belongsToClientsList.splice(belongsToIndex ,1)[0]);
              this.belongsToCount = this.belongsToCount - 1;
              this.availableCount = this.availableCount + 1;
          }
          this.loadingService.showLoader.next(false);
        });
      }
    }
  }
  // move multiple selected clients //
  multipleToAvailable() {
    const clients: any[] = [];
    for (let x = 0; x < this.selectedBelongsToClients.length; x++) {
      const belongsToIndex = this.belongsToClientsList.findIndex(client => client.id === this.selectedBelongsToClients[x].id);
      clients.push(this.belongsToClientsList[belongsToIndex]);
      this.availableClientsList.splice(0, 0, this.belongsToClientsList.splice(belongsToIndex ,1)[0]);
        this.belongsToCount = this.belongsToCount - 1;
        this.availableCount = this.availableCount + 1;
    }
    this.selectedBelongsToClients = [];
    if (this.headerBCheck.checked) {
      this.headerBCheck.checked = false;
    }
    if (!this.isNew) {
      this.loadingService.showLoader.next(true);
      let counter = 0;
      for (let x = 0; x < clients.length; x++) {
        // -----------------
        //  TEMPORARY ---->
        // -----------------
        let updateClientGroups = [];
        if (clients[x].groupIds) {
          clients[x].groupIds.splice(clients[x].groupIds.findIndex(group => group === this.currentGroup.id), 1);
          updateClientGroups = clients[x].groupIds;
        }
        let hasGroups = false;
        if (updateClientGroups.length > 0) {
          hasGroups = true;
        }
        // -----------------
        //  TEMPORARY ---->
        // -----------------º
        this.apiService.deleteDataObject('Groups/' + this.currentGroup.id + '/clients/rel', clients[x].id).pipe(takeUntil(this.onDestroy)).subscribe((res) => {
          // -----------------
          //  TEMPORARY ---->
          // -----------------
          this.apiService.editDataObject(clients[x].id, {groupIds: updateClientGroups, hasGroups: hasGroups}, 'Clients').pipe(takeUntil(this.onDestroy)).subscribe(() => {
            counter++;
            if (counter === clients.length) {
              this.presentToast('Clients removed from group succesfullly', 'green-snackbar');
              this.loadingService.showLoader.next(false);
            }
          }, () => {
            this.presentToast('Error removing client from group', 'red-snackbar');
            for (let y = 0; y < clients.length; y++) {
              const availableIndex = this.availableClientsList.findIndex(client => client.id === clients[y].id);
              this.belongsToClientsList.splice(0, 0, this.availableClientsList.splice(availableIndex ,1)[0]);
              this.belongsToCount = this.belongsToCount + 1;
              this.availableCount = this.availableCount - 1;
            }
            this.loadingService.showLoader.next(false);
          });
          // -----------------
          //  TEMPORARY ---->
          // -----------------
        }, () => {
          this.presentToast('Error removing clients from group', 'red-snackbar');
          for (let y = 0; y < clients.length; y++) {
            const availableIndex = this.availableClientsList.findIndex(client => client.id === clients[y].id);
            this.belongsToClientsList.splice(0, 0, this.availableClientsList.splice(availableIndex ,1)[0]);
              this.belongsToCount = this.belongsToCount + 1;
              this.availableCount = this.availableCount - 1;
          }
          this.loadingService.showLoader.next(false);
        });
      }
    }
  }
  // -------------------- //
  // Save / edit group    //
  // -------------------- //
  // perform request //
  performRequest() {
    if (this.name.status === 'INVALID') {
      this.presentToast('Error in form', 'yellow-snackbar');
    } else {
      if (this.isNew) {
        this.loadingService.showLoader.next(true);
        const group = {
          name: this.name.value,
          filters: {},
          branchId: this.branchService.currentBranch.getValue().id
        };
        this.apiService.addDataObject(group,'Groups').pipe(takeUntil(this.onDestroy)).subscribe((res: any) => {
          this.addClientsWhereNew(res.id);
        }, () => {
          this.loadingService.showLoader.next(false);
        });
      } else {
        this.apiService.editDataObject(this.currentGroup.id,{name: this.name.value},'Groups').pipe(takeUntil(this.onDestroy)).subscribe((res: any) => {
          this.presentToast('Group updated succesfullly', 'green-snackbar');
        }, () => {
          this.loadingService.showLoader.next(false);
        });
      }
    }
  }
  // add clients relations //
  addClientsWhereNew(groupId: string) {
    let counter = 0;
    if (this.belongsToClientsList.length > 0) {
      for (let x = 0; x < this.belongsToClientsList.length; x++) {
        const groupRelation = {
          groupId: groupId,
          clientId: this.belongsToClientsList[x].id
        };
        // -----------------
        //  TEMPORARY ---->
        // -----------------
        let updateClientGroups;
        if (this.belongsToClientsList[x].groupIds) {
          updateClientGroups = this.belongsToClientsList[x].groupIds;
          updateClientGroups.push(groupId);
        } else {
          updateClientGroups = [groupId];
        }
        const hasGroups = true;
        // -----------------
        //  TEMPORARY ---->
        // -----------------
        this.apiService.addDataRelation(groupRelation, 'Groups', 'clients/rel', groupId, this.belongsToClientsList[x].id).pipe(takeUntil(this.onDestroy)).subscribe((res) => {
          // -----------------
          //  TEMPORARY ---->
          // -----------------
          this.apiService.editDataObject(this.belongsToClientsList[x].id, {groupIds: updateClientGroups, hasGroups: hasGroups}, 'Clients').pipe(takeUntil(this.onDestroy)).subscribe(() => {
            counter++;
            if (counter === this.belongsToClientsList.length) {
              this.presentToast('Clients added to group succesfullly', 'green-snackbar');
              this.loadingService.showLoader.next(false);
            }
          }, () => {
            this.presentToast('Error adding clients to group', 'red-snackbar');
            this.loadingService.showLoader.next(false);
          });
          // -----------------
          //  TEMPORARY ---->
          // -----------------
        }, () => {
          this.loadingService.showLoader.next(false);
        });
      }
    } else {
      this.presentToast('Group created succesfullly', 'green-snackbar');
      this.loadingService.showLoader.next(false);
    }
  }
  // ---------------------//
  // PENDING SECTION //
  // ---------------------//
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
  // ----------------- //
  // open bottom sheet //
  // ----------------- //
  openProductsModal(years: any, client: string) {
    this.dialog.open(ProductsListComponent, {
      data: {
        client: client,
        years: years
      },
      autoFocus: false,
      width: '600px'
    });
  }
  // ---------------------- //
  // Go to groups component //
  // ---------------------- //
  goToGroups() {
    this.router.navigate(['groups']);
  }
  // -------------------- //
  // On destroy lifecycle //
  // -------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
