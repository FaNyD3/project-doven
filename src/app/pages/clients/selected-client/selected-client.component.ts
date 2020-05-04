import {
  AfterViewInit,
  Component,
  ElementRef, NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {SharingService} from "../../../services/sharing/sharing.service";
import {ApiService} from "../../../services/api/api.service";
import {ActivatedRoute, Router} from "@angular/router";import {QueryFactory} from "../../../tableQueries/queryFactory";
import {MatDialog, MatSnackBar, MatTabGroup} from "@angular/material";
import {CrudClientComponent} from "../clients-table/crud-client/crud-client.component";
import {takeUntil} from "rxjs/operators";
import {BehaviorSubject, Subject} from "rxjs";
import {FormControl} from "@angular/forms";
/*
import {DealComponent} from "../../../modals/deal/deal.component";
import {NoteComponent} from "../../../modals/note/note.component";
*/
import {BranchService} from "../../../services/branch/branch.service";
import {LoadingService} from "../../../services/loading/loading.service";
import {QuillEditorComponent} from "ngx-quill";
// import {RouteMapModalComponent} from "../../../modals/route-map-modal/route-map-modal.component";
import {AuthService} from "../../../services/auth/auth.service";
import {Title} from "@angular/platform-browser";
declare const google: any;

@Component({
  selector: 'app-selected-client',
  templateUrl: './selected-client.component.html',
  styleUrls: ['./selected-client.component.scss']
})
export class SelectedClientComponent implements OnInit, OnDestroy, AfterViewInit {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  /* manage component */
  @ViewChildren('displayData') displayElem: QueryList<any>;
  @ViewChildren('noData') noDisplayElem: QueryList<any>;
  @ViewChild(MatTabGroup, {static: false}) tabGroup: MatTabGroup;
  public displayData = new BehaviorSubject<boolean>(false);
  private onDestroy = new Subject<void>();
  public firstLoad = false; // Loader
  public client: any;
  private firstClient;
  private lastClient: number;
  public reload0 = false;
  public reload1 = false;
  public reload2 = false;
  private geocoder;
  private directionsService;
  private directionsRenderer;
  private clientIncludes = [
      { relation: 'attendances' },
  ];
  public id: number = 0;
  public isFavorite = false;
  public andObject: any[] = [];
  public searchParameters: any = {};
  public plantDistance = '0';
  public plantTime = '0 H';
  public routeObject;
  public plantOptions: any[] = [];
  public currentEditingProduct;
  @ViewChild('expandablePanel', {static: false}) expandablePanel: ElementRef;
  @ViewChild('dataWrapper', {static: false}) dataWrapper: ElementRef;
  public isBigSize = window.innerWidth > 959;
  public isSmallSize = window.innerWidth < 576;
  public isExpanded = false;
  public clientProducts: any[] = [];

  public yearOptions = this.generateYearsObject();
  public clientYearId = '';

  public childClientData = {yearNumber: this.getCurrentYear(), clientId: this.id};
  // --------------------------- //
  // Component constructor //
  // --------------------------- //
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
      private authService: AuthService,
      private titleService: Title
  ) {}
  public setTitle(newTitle: string) {
    this.titleService.setTitle( newTitle );
  }
  // -------------------------------------- //
  // Form inputs & validations declaration  //
  // -------------------------------------- //
  public yearControl = new FormControl({value: '', disabled: false});
  public plantControl = new FormControl({value: '', disabled: false});
  // --------------------- //
  // On view init cycle //
  // --------------------- //
  ngOnInit() {

    const id = window.location.href.split('clients/');
    this.id = parseInt(id[1].split('/')[0], 10);
    this.childClientData = {yearNumber: this.yearControl.value, clientId: this.id};
    // this.geocoder = new google.maps.Geocoder();
    // this.directionsService = new google.maps.DirectionsService();
    // this.directionsRenderer = new google.maps.DirectionsRenderer();

  }
  // --------------------- //
  // After view init cycle //
  // --------------------- //
  ngAfterViewInit() {
    this.yearControl.patchValue(this.getCurrentYear());
    this.displayData.asObservable().pipe(takeUntil(this.onDestroy)).subscribe((isData: boolean) => this.showData(isData));
    /* listener when data load finish */
    this.branchService.branchesLoaded.pipe(takeUntil(this.onDestroy)).subscribe((state) => {
      if (state) {
        this.branchService.branchObservable.pipe(takeUntil(this.onDestroy)).subscribe((data) => {
          this.startLoading();
        });
      }
    });

    /*
    this.yearControl.valueChanges.pipe(takeUntil(this.onDestroy)).subscribe((year) => {
      console.log('yearControl changed');
      this.childClientData = {yearNumber: year, clientId: this.id};
      this.apiService.getDataObjects('ClientYears?filter=' + JSON.stringify({
        where: {
          name: year,
          clientId: this.id
        }
      })).pipe(takeUntil(this.onDestroy)).subscribe((clientYear: any[]) => {
        if (clientYear[0]) {
          this.getClientProducts(clientYear[0].id);
          this.clientYearId = clientYear[0].id;
        } else {
          this.clientYearId = '-';
          this.clientProducts = [];
        }
      });
    }, err => {

    });
    */
  }

  // --------------------- //
  // Start loading process //
  // --------------------- //
  startLoading() {
    this.loadClient(this.id);
    this.setSearchParameters({
      /*
      tags: true,
      tagsObject: [
        'Test',
        'Test 2',
        'Test 3',
        'Test 4',
        'Test 5'
      ],
      tagsCount: 5,
      products: {
        productsNames: {
          inq: [
            'Producto',
            'Producto 2',
            'Producto 3',
            'Producto 4',
            'Producto 5',
          ]
        }
      },
      productsCount: 5,
      groups: {
        groups: {
          inq: [
            'Producto',
            'Producto 2',
            'Producto 3',
            'Producto 4',
            'Producto 5',
          ]
        }
      },
      groupsCount: 5,
      buyers: true,
      buyersObject: [
        'Buyer 1',
        'Buyer 2'
      ],
      buyersCount: 5,
      categories: {
        category: {
          inq: [
            'Categoria 1',
            'Categoria 2',
            'Categoria 3'
          ]
        }
      },
      categoryCount: 3,
      rates: {
        rate: {
          inq: [
            'Rate 1',
            'Rate 2',
            'Rate 3'
          ]
        }
      },
      ratesCount: 3,
      searchString: 'Texto',
      search: true
      */
    });
  }
  // ----------------------------- //
  // Set On window resize listener //
  // ----------------------------- //
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
  // --------------------------- //
  // Calculate distance to plant //
  // --------------------------- //
  calculateDistance(location){

  }
  // --------------------- //
  // Start loading process //
  // --------------------- //

  // ----------------------- //
  // Load plants from branch //
  // ----------------------- //
  loadPlants() {
    /*
    this.apiService.getDataObjects('Plants?filter=' + JSON.stringify({
      where: {
        branchId: this.branchService.currentBranch.getValue().id
      }
    })).pipe(takeUntil(this.onDestroy)).subscribe((data: any[]) => {
      this.plantOptions = data;
      // console.log('plants loaded');
      this.plantControl.patchValue(data[0]);
      this.calculateDistance(data[0].location);
    });
    this.setResizeListener();
    if (!this.isBigSize) {
    }
    */
  }
  // ------------------------ //
  // Format availableProducts //
  // ------------------------ //
  loadProductsAvailable(available: number) {
    if (available) {
      if (available > 999) {
        if (available > 999999) {
          return (available / 1000000).toFixed(1) + ' M';
        } else {
          return (available / 1000).toFixed(1) + ' K';
        }
      }
      return available.toFixed(1);
    }
    return 0;
  }
  // -------------------------------------- //
  // Method to preload filters from service //
  // -------------------------------------- //
  setSearchParameters(data: any) {
    this.searchParameters = data;
    this.andObject = [];
    if (data.search) {
      this.andObject.push(data.search);
    }
    if (data.branchId) {
      this.andObject.push(data.branchId);
    }
    if (data.categories) {
      this.andObject.push(data.categories);
    }
    if (data.tags) {
      this.andObject.push(data.tags);
    }
    if (data.buyers) {
      this.andObject.push(data.buyers);
    }
    if (data.products) {
      this.andObject.push({productsNames: data.products.productsNames});
    }
    if (data.groups) {
      this.andObject.push({groupIds: data.groups.groupIds});
    }
    if (data.rates) {
      this.andObject.push(data.rates);
    }
    if (data.place) {
      data.place.circleFilterCoords.forEach((circleFilter) => {
        this.andObject.push(circleFilter);
      });
    }
    if (data.searchAddress && data.searchAddress !== '') {
      this.andObject.push(data.searchAddress);
    }
    this.getLastClient();
  }
  // -------------------------- //
  // Method to load client data //
  // -------------------------- //
  loadClient(id: number) {
    this.apiService.getDataObjects('partners?filter=' + JSON.stringify({
      // include: this.clientIncludes
      where:{
        and:[
          {
            branchOfficeId: this.branchService.currentBranch.getValue().id
          },
          {
            number: id
          }
        ]
      },
    })).pipe(takeUntil(this.onDestroy)).subscribe(( partner: any) => {

      this.apiService.getDataObject('partners', partner[0].id + '?filter=' + JSON.stringify({
        include: this.clientIncludes
      })).pipe(takeUntil(this.onDestroy)).subscribe((client: any) => {
        // this.sharingService.serviceData.next(client);
        this.client = client;
        this.setTitle((this.client.name +  ' - client details'));
        if (this.firstLoad) {
          // this.loadPlants();
          this.firstLoad = false;
        }
        if (client.isFavorite !== undefined) {
          this.isFavorite = client.isFavorite;
        } else {
          this.isFavorite = false;
        }
        this.displayData.next(true);
      });

    });

  }
  // --------------------------------------------------//
  // Method to show  a new client                      //
  // --------------------------------------------------//
  loadOtherClient(id: number, next: boolean) {
    const currentValue = this.sharingService.currentClient.getValue() ? this.sharingService.currentClient.getValue() : 0;
    if (next && (currentValue + 1) <= this.lastClient) {
      this.sharingService.currentClient.next(currentValue + 1);
    } else if (!next && (currentValue - 1) > 0) {
      this.sharingService.currentClient.next(currentValue - 1);
    }
    const whereObject = {
      where:{
        and:[
          {
            branchOfficeId: this.branchService.currentBranch.getValue().id
          },
          {
            number: this.sharingService.currentClient.getValue()
          }
        ]
      },
      // where: andObject.length > 0 ? {and: andObject} : {},
      //skip: this.sharingService.currentClient.getValue(),
      limit: 1,
      // order: prevSearch.sorter ? prevSearch.sorter.active + ' ' + prevSearch.sorter.direction : 'id desc',
      // include: this.clientIncludes
    };

    this.apiService.getDataObjects('partners?filter=' + JSON.stringify(whereObject)).pipe(takeUntil(this.onDestroy)).subscribe((client: any) => {
      this.sharingService.serviceData.next(client[0]);
      this.client = client[0];
      this.setTitle((this.client.name +  ' - client details'));
      this.id = client[0].number;
      this.childClientData = {yearNumber: this.yearControl.value, clientId: client[0].id};
      this.router.navigate(['/clients/' + this.id]);
      if (this.firstLoad) {
        this.firstLoad = false;
      }
      if (client[0].isFavorite !== undefined) {
        this.isFavorite = client[0].isFavorite;
      } else {
        this.isFavorite = false;
      }
      this.calculateDistance(this.plantControl.value.location);
      /*
      this.apiService.getDataObjects('ClientYears?filter=' + JSON.stringify({
        where: {
          name: this.yearControl.value,
          clientId: this.id
        }
      })).pipe(takeUntil(this.onDestroy)).subscribe((clientYear: any[]) => {
        if (clientYear[0]) {
          this.getClientProducts(clientYear[0].id);
          this.clientYearId = clientYear[0].id;
        } else {
          this.clientYearId = '-';
          this.clientProducts = [];
        }
      });
      */
      this.displayData.next(true);
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
  // -------------------------------- //
  // Method to open edit client model //
  // -------------------------------- //
  openEdit(client: any) {
    const dialogRef = this.dialog.open(CrudClientComponent, {
      data: {
        client: client,
        title: 'Actualizar Socio',
        branch: this.branchService.currentBranch.getValue(),
        isNew: false
      },
      autoFocus: false,
      width: '1000px'
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(() => {
      this.loadClient(this.id);
    });
  }
  // ---------------------------- //
  // Method to get last client id //
  // ---------------------------- //
  getLastClient() {
    const whereObject = { and: this.andObject.length > 0 ? this.andObject : [{}] };
    this.apiService.getDataObjects('partners/count?where=' + JSON.stringify(
      {
        and:[
          {
            branchOfficeId: this.branchService.currentBranch.getValue().id
          }
        ]
      }
    )).pipe(takeUntil(this.onDestroy)).subscribe((clientsCount: any) => {
      this.lastClient = clientsCount.count;
    });
  }
  // ----------------------- //
  // Update child components //
  // ----------------------- //
  reload(child) {
    switch (child) {
      case 0:
        this.reload0 = !this.reload0;
        break;
      case 1:
        this.reload1 = !this.reload1;
        break;
      case 2:
        this.reload2 = !this.reload2;
        break;
    }
  }
  // -------------------- //
  // Method to open a new note modal //
  // -------------------- //
  newNote() {
    /*
    this.dialog.open(NoteComponent, {
      data: {
        client: this.sharingService.serviceData.getValue(),
        title: 'New note',
        isNew: true
      },
      autoFocus: false,
      width: '1000px'
    });
    */
  }
  // ----------------------------- //
  // Change client favorite method //
  // ----------------------------- //
  changeFavorite() {
    const editClient = { isFavorite: !this.isFavorite };
    this.apiService.editDataObject(this.client.id, editClient, 'Clients').pipe(takeUntil(this.onDestroy)).subscribe((updated: any) => {
      this.presentToast('Socio editado exitosamente', 'green-snackbar');
      this.isFavorite = updated.isFavorite;
      this.loadingService.showLoader.next(false);
    }, (e) => {
      this.presentToast('Conexion rechazada', 'red-snackbar');
      this.loadingService.showLoader.next(false);
    });
  }
  // ------------------------------ //
  // Method to control expand panel //
  // ------------------------------ //
  expandPanel() {
    /*
    if (!this.isExpanded) {
      if (!this.expandablePanel.nativeElement.classList.contains('expandedPanel')) {
        this.expandablePanel.nativeElement.classList.add('expandedPanel');
        if (!this.dataWrapper.nativeElement.classList.contains('expandedDataWrapper')) {
          this.dataWrapper.nativeElement.classList.add('expandedDataWrapper');
        }
      }
      this.isExpanded = true;
    } else {
      if (this.expandablePanel.nativeElement.classList.contains('expandedPanel')) {
        this.expandablePanel.nativeElement.classList.remove('expandedPanel');
        if (this.dataWrapper.nativeElement.classList.contains('expandedDataWrapper')) {
          this.dataWrapper.nativeElement.classList.remove('expandedDataWrapper');
        }
      }
      this.isExpanded = false;
    }
    */
  }
  // --------------------------------- //
  // Method to obtain clients products //
  // --------------------------------- //
  getClientProducts(yearId) {
    /*
    console.log('trying to load products ', yearId);
    if (yearId) {
      this.apiService.getDataObjects('ClientProducts?filter=' + JSON.stringify({
        where: {
          and: [
            {branchId: this.branchService.currentBranch.getValue().id},
            {clientYearId: yearId},
          ]
        },
        include: 'product'
      })).pipe(takeUntil(this.onDestroy)).subscribe((clientProducts: any[]) => {
        if (clientProducts.length > 0 ) {
          this.clientProducts = clientProducts;
        } else {
          this.clientProducts = [];
        }
      });
    }

    */
  }
  // ----------------- //
  // Open route method //
  // ----------------- //
  openRoute() {
    /*
    const dialogRef = this.dialog.open(RouteMapModalComponent, {
      data: {
        routeObject: this.routeObject ? this.routeObject : null,
        plantDistance: this.plantDistance,
        plantTime: this.plantTime,
        client: this.client,
        title: this.routeObject ? 'Route to plant' : 'Client location',
        plant: this.plantControl.value
      },
      autoFocus: false,
      width: '1000px'
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(() => {
      this.loadClient(this.id);
    });
    */
  }
  // ------------------- //
  // Edit product method //
  // ------------------- //
  editProduct(product: any) {
    let newVal: number = parseFloat((<HTMLInputElement>document.getElementById('editInput' + product.id)).value);
    if (newVal < 0) {
      newVal = 0;
    }
    this.apiService.editDataObject(product.id, { productAvailable: newVal }, 'ClientProducts').pipe(takeUntil(this.onDestroy)).subscribe(() => {
      this.presentToast('Product edited succesfullly', 'green-snackbar');
      this.getClientProducts({id: product.clientYearId});
    }, () => {
      this.presentToast('Connection rejected', 'red-snackbar');
    });
  }
  // ----------------- //
  // Show edit product //
  // ----------------- //
  setEditProduct(editId: string) {
    const elem = document.getElementById('edit'+ editId);
    if (elem.classList.contains('hidden')) {
      elem.classList.remove('hidden');
    }
  }
  // ---------------------------- //
  // Close edit product available //
  // ---------------------------- //
  closeEdit(editId: string) {
    const elem = document.getElementById('edit' + editId);
    if (!elem.classList.contains('hidden')) {
      elem.classList.add('hidden');
    }
  }
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


  // NEW YEARS FUNCTIONALITY
  // NEW YEARS FUNCTIONALITY
  // NEW YEARS FUNCTIONALITY
  // NEW YEARS FUNCTIONALITY
  // NEW YEARS FUNCTIONALITY
  // NEW YEARS FUNCTIONALITY
  // NEW YEARS FUNCTIONALITY
  // NEW YEARS FUNCTIONALITY
  // NEW YEARS FUNCTIONALITY

  generateYearsObject() {
    const years = [];
    const actualYear = this.getCurrentYear();
    for (let x = (actualYear + 3); x >= 2016; x--) {
      years.push(x);
    }
    return years;
  }

  getCurrentYear() {
    const date = new Date();
    let year = date.getFullYear();
    const currentWeek = this.validateYear(date);
    if (currentWeek >= 0 || currentWeek >= -0 ) {
      return year;
    } else {
      return (year - 1);
    }
  }

  validateYear(date: Date) {
    date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    date.setUTCDate(date.getUTCDate() - date.getUTCDay());
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),7,1));
    // @ts-ignore
    const weekNo = Math.ceil(( ( (date - yearStart) / 86400000) + 1)/7);
    return (weekNo + 1);
  }
  // -------------------- //
  // On destroy lifecycle //
  // -------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
