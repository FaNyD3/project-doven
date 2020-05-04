import {
    Component,
    ElementRef,
    HostListener,
    OnDestroy,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren
} from '@angular/core';
import { ChartDataSets, ChartOptions } from 'chart.js';
import {BaseChartDirective, Color, Label} from "ng2-charts";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {MatBottomSheet, MatDialog, MatPaginator, MatSnackBar, MatSort} from "@angular/material";
// import {CustomDataSource} from "../../tableQueries/customDataSource";
import {FormBuilder, FormControl} from "@angular/forms";
import {ApiService} from "../../services/api/api.service";
import { Router } from "@angular/router"; // quite ActivatedRoute,
// import {QueryFactory} from "../../tableQueries/queryFactory";
// import {SharingService} from "../../services/sharing/sharing.service";
// import {BranchService} from "../../services/branch/branch.service";
import {AuthService} from "../../services/auth/auth.service";
import {debounceTime, startWith, switchMap, takeUntil} from "rxjs/operators";
import {Title} from "@angular/platform-browser";
import {LoadingService} from "../../services/loading/loading.service";

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
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

    // ================================ COMPONENT CONFING AND VARIABLES ================================ //

    // --------------------------- //
    // Local variables declaration //
    // --------------------------- //
    /* manage component */
    private onDestroy = new Subject<void>();
    @ViewChildren('displayData') displayElem: QueryList<any>;
    @ViewChildren('noData') noDisplayElem: QueryList<any>;
    /* manage data */

    public clientOptions: Observable<any>;
    public clientBelongs: any[] = [];

    public productOptions: Observable<any>;
    public productBelongs: any[] = [];

    public allProductBelongs: any[] = [];
    public allLineChartColors: Color[] = [{ borderColor: 'rgba(255,255,255,0)', backgroundColor: 'rgba(255,255,255,0)' }];
    public allLineChartData: ChartDataSets[] = [{data: [], label: ''}];
    public allProducts = true;

    public buyerOptions: Observable<any>;

    public currentYear = new Date().getFullYear();
    public yearOptions = this.generateYearsObject();

    public displayData = new BehaviorSubject<boolean>(false);
    public firstLoad = true;

    public branchTrader: any;
    /* chart config */
    public lineChartLabels: Label[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    public lineChartOptions: (ChartOptions & { annotation: any }) = {
        responsive: true,
        annotation: {},
        maintainAspectRatio: false
    };
    public lineChartColors: Color[] = [{ borderColor: 'rgba(255,255,255,0)', backgroundColor: 'rgba(255,255,255,0)' }];
    public lineChartData: ChartDataSets[] = [{data: [], label: ''}];
    public lineChartLegend = false;
    public lineChartType = 'line';
    public lineChartPlugins = [];

    public statistics = {
        openLeads: 0,
        closedLeads: 0,
        openDeals: 0,
        shippingPeriod: 0,
        excecutedDeals: 0,
        canceledDeals: 0,
        reminders: 0
    };
    @ViewChildren(BaseChartDirective) charts: QueryList<BaseChartDirective>;
    public showOnLarge = window.innerWidth > 790;
    public showOnlySmall = window.innerWidth < 500;

    public allProductsObject: any[] = [];

    // -------------------------------------- //
    // Form inputs & validations declaration  //
    // -------------------------------------- //
    public clients = new FormControl({value: '', disabled: false});
    public buyer = new FormControl({value: '', disabled: false}, [objectValidator.validData]);
    public products = new FormControl({value: '',disabled: false});
    public yearControl = new FormControl({value: '',disabled: false});

    // --------------------------- //
    // Component constructor //
    // --------------------------- //
    constructor(
        private apiService: ApiService,
        public router: Router,
        // public route: ActivatedRoute, // comente
        // public queryFactory: QueryFactory,
        public dialog: MatDialog,
        private bottomSheet: MatBottomSheet,
        // private sharingService: SharingService,
        // private branchService: BranchService,
        private authService: AuthService,
        private titleService: Title,
        private loadingService: LoadingService,
        private fb: FormBuilder,
        private snackBar: MatSnackBar,
    ) {
        this.setTitle('Dashboard');
    }

    public setTitle(newTitle: string) {
        this.titleService.setTitle( newTitle );
    }

    // ================================ INIT COMPONENT HOOKS AND LISTENERS ================================ //

    // ----------------- //
    // Listener OnResize //
    // ----------------- //
    @HostListener('window:resize') onResize() {
        let tempOnLarge;
        let tempOnlySmall;
        /* if firstLoad set change points */
        if (this.firstLoad ) {
            tempOnLarge = !this.showOnLarge;
            tempOnlySmall = !this.showOnLarge;
        } else {
            tempOnLarge = window.innerWidth > 790;
            tempOnlySmall = window.innerWidth < 500;
        }
        /* if resize pass !showOnLarge point */
        if (tempOnLarge !== this.showOnLarge) {
            this.showOnLarge = window.innerWidth > 790;
        }
        if (tempOnlySmall !== this.showOnlySmall) {
            this.showOnlySmall = window.innerWidth < 500;
        }
    }
    // ------------------ //
    // On view init cycle //
    // ------------------ //
    ngOnInit() {
        // currentWeekIndex for grain weeks
        this.currentWeekIndex = this.getCurrentWeek(new Date());
        this.grainLineChartLabels = [
            'Week ' + (this.currentWeekIndex + 1),
            'Week ' + (this.currentWeekIndex + 2),
            'Week ' + (this.currentWeekIndex + 3),
            'Week ' + (this.currentWeekIndex + 4),
        ];
        // this.loadAllProducts();
    }

    // --------------------- //
    // After view init cycle //
    // --------------------- //
    ngAfterViewInit() {
        if (this.obtainUserPermitions() === 'branchTrader') {
            this.setBranchListener();
        } else {
            this.addListeners();
            this.excecuteRequests();
        }
    }

    private setBranchListener() {
      /*
        this.branchService.branchesLoaded.asObservable().pipe(takeUntil(this.onDestroy)).subscribe((loaded) => {
            if (loaded) {
                this.setFixedBuyer();
                this.addListeners();
                this.excecuteRequests();
            }
        });
        */
    }

    setFixedBuyer() {
        this.buyer.patchValue(this.authService.currentUserValue.user);
        this.branchTrader = this.authService.currentUserValue.user;
        this.buyer.disable();
    }

    addListeners() {
        /* on user search change (managing 250 ms) */
      /*
        this.buyerOptions = this.buyer.valueChanges.pipe(
            debounceTime(250),
            startWith(''),
            switchMap(value => this.loadUserOptions(value))
        );

        this.productOptions = this.products.valueChanges.pipe(
            debounceTime(250),
            startWith(''),
            switchMap(value => this.loadProductOptions(value))
        );
        this.clientOptions = this.clients.valueChanges.pipe(
            debounceTime(250),
            startWith(''),
            switchMap(value => this.loadClientOptions(value))
        );

        this.yearControl.valueChanges.pipe(takeUntil(this.onDestroy)).subscribe((year) => {
            this.loadChartData(year);
        }), err => {

        };

        this.yearControl.patchValue(new Date().getFullYear());
        */
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
        for (let x = 0; x < this.productBelongs.length; x++) {
            andObject.push({ id: { neq: this.productBelongs[x].id } });
        }
        const whereQuery = {
            and: andObject
        };

        const getProductsQuery = this.queryFactory.generateGetQuery('Products', whereQuery, 1000, 0, 'name ASC', []);
        // // console.log('loadProductOptions');
        return new Observable<any>((objs) => this.apiService.getDataObjects(getProductsQuery).subscribe((data: any[]) => {
            data.forEach((product) => {
                product.color = this.getRandomColor();
            });
            if (this.firstLoad) {
                this.allProductBelongs = [];
                data.forEach((product) => {
                    this.allProductBelongs.push(product);
                    if (this.allProductBelongs.length === 1) {
                        this.allLineChartColors = [{ borderColor: product.color, backgroundColor: 'rgba(255,255,255,0)' }];
                        this.allLineChartData = [{data: [0,0,0,0,0,0,0,0,0,0,0,0], label: product.name}];
                    } else {
                        this.allLineChartColors.push({ borderColor: product.color, backgroundColor: 'rgba(255,255,255,0)' });
                        this.allLineChartData.push({data: [0,0,0,0,0,0,0,0,0,0,0,0], label: product.name});
                    }
                    this.charts.toArray()[0].update();
                });
                this.loadChartData(this.yearControl.value);
                this.firstLoad = false;
            }
            objs.next(data);
        }));
        */
    }

    // --------------------------------------------//
    // Method to load clients with the autocomplete //
    // --------------------------------------------//
    loadClientOptions(dataSearch: string) {
      /*
        const searchQuery = this.queryFactory.setSearchQuery(dataSearch, ['name']);
        const andObject: any[] = [
            searchQuery
        ];
        for (let x = 0; x < this.clientBelongs.length; x++) {
            andObject.push({ id: { neq: this.clientBelongs[x].id } });
        }
        if (this.obtainUserPermitions() === 'branchAdmin') {
            andObject.push(this.obtainBranchesFilter());
        } else if (this.obtainUserPermitions() === 'branchTrader') {
            andObject.push(this.obtainBranchesFilter());
            andObject.push({ buyerId: this.branchTrader.id });
        }
        /*if (this.buyer.valid) {
          andObject.push({ buyerId: this.buyer.value.id });
        }*/
      /*
        const getProductsQuery = this.queryFactory.generateGetQuery('Clients', {and: andObject}, 25, 0, 'name ASC', ['branch']);
        // // console.log('loadClientOptions');
        return new Observable<any>((objs) => this.apiService.getDataObjects(getProductsQuery).subscribe((data: any[]) => {
            objs.next(data);
        }));
        */
    }

    // --------------------------------------------//
    // Method to load buyers with the autocomplete //
    // --------------------------------------------//
    loadUserOptions(dataSearch: string) {
        /* AÑADIR FILTRO POR BRANCH DEPENDIENDO USER PERMITIONS */
      /*
        const searchQuery = this.queryFactory.setSearchQuery(dataSearch, ['name']);
        const andObject: any[] = [
            searchQuery
        ];
        if (this.obtainUserPermitions() === 'branchAdmin') {
            andObject.push({
                or: [
                    { role: 'branchTrader' },
                    { role: 'branchAdmin' },
                ]
            });
        }
        const getBuyersQuery = this.queryFactory.generateGetQuery('AppUsers', {and: andObject}, 25, 0, 'name ASC', ['branches']);
        // // console.log('loadUserOptions');
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
    // ------------------------------------------------------------------ //
    // Method to validate if buyers match with logged user branch options //
    // ------------------------------------------------------------------ //
    validateUserWithBranches(user: any) {
      /*
        for (let x = 0; x < this.branchService.branchOptions.length; x++) {
            const userBranches: any[] = user.branches;
            if (userBranches.findIndex(branch => branch.id === this.branchService.branchOptions[x].id) !== -1) {
                return true;
            }
        }
        return false;
        */
    }
    // ------------------------------------------------------//
    // Method to obtain logged user permitions role //
    // ------------------------------------------------------//
    obtainUserPermitions() {
        // return this.authService.currentUserValue.user.role;
      return 'General';
    }
    // ------------------------------------------------------//
    // Method to obtain logged user branches filter //
    // ------------------------------------------------------//
    obtainBranchesFilter() {
      /*
        const branchFilter: any[] = [];
        for (let x = 0; x < this.branchService.branchOptions.length; x++) {
            branchFilter.push({
                branchId: this.branchService.branchOptions[x].id
            });
        }
        return { or: branchFilter };
        */
    }
    // ------------------------- //
    // Method to load chart data //
    // ------------------------- //
    loadChartData(year: any) {
      /*
        const dealsAndObject = [];
        if (this.productBelongs.length > 0) {
            this.allProducts = false;
            const orDealsProducts = [];
            for (let x = 0; x < this.productBelongs.length; x++) {
                orDealsProducts.push({ productId: this.productBelongs[x].id });
            }
            dealsAndObject.push({ or: orDealsProducts });
        } else {
            this.allProducts = true;
        }
        if (this.clientBelongs.length > 0) {
            const orDealsClients = [];
            for (let x = 0; x < this.clientBelongs.length; x++) {
                orDealsClients.push({ clientId: this.clientBelongs[x].id });
            }
            dealsAndObject.push({ or: orDealsClients });
        }
        if (this.obtainUserPermitions() === 'branchAdmin') {
            dealsAndObject.push({ branchId: this.branchService.currentBranch.getValue().id });
            if (this.buyer.valid && typeof this.buyer.value === 'object') {
                dealsAndObject.push({ buyerId: this.buyer.value.id });
            }
        } else if (this.obtainUserPermitions() === 'branchTrader') {
            dealsAndObject.push({ buyerId: this.buyer.value.id });
            dealsAndObject.push({ branchId: this.branchService.currentBranch.getValue().id });
        } else {
            if (this.buyer.valid && typeof this.buyer.value === 'object') {
                dealsAndObject.push({ buyerId: this.buyer.value.id });
            }
        }

        dealsAndObject.push( {createdAt: {lt: new Date((year + 1),0,1, 0, 0)}} );
        dealsAndObject.push( {createdAt: {gt: new Date((year - 1),11,31, 23, 59)}} );

        // // console.log('Load chart data');
        this.apiService.getDataObjects('Deals?filter=' + JSON.stringify({
            where: {
                and: dealsAndObject
            },
            fields: ['id', 'createdAt', 'productId', 'quantity']
        })).pipe(takeUntil(this.onDestroy)).subscribe((deals: any) => {
            // // console.log('deals to load on chart ', deals);
            this.resetChartData();
            if (deals.length > 0) {
                for (let x = 0; x < deals.length; x++) {
                    // // // // console.log(productIndex);
                    const monthIndex = new Date(deals[x].createdAt).getMonth();
                    if (this.allProducts) {
                        const productIndex = this.allProductBelongs.findIndex(product => product.id === deals[x].productId);
                        if (productIndex !== -1) {
                            const newChartData = {data: this.allLineChartData[productIndex].data};
                            newChartData.data[monthIndex] += deals[x].quantity;
                            this.allLineChartData[productIndex].data = newChartData.data;
                        }
                    } else {
                        const productIndex = this.productBelongs.findIndex(product => product.id === deals[x].productId);
                        if (productIndex !== -1) {
                            const newChartData = {data: this.lineChartData[productIndex].data};
                            newChartData.data[monthIndex] += deals[x].quantity;
                            this.lineChartData[productIndex].data = newChartData.data;
                        }
                    }
                    // // // console.log(this.allProductBelongs);
                    // // // console.log(this.allLineChartData);
                    // // // console.log(this.lineChartData);
                }
            }
            this.charts.toArray()[0].update();
        });
        */
    }

    resetChartData() {
        if (this.allProducts) {
            for (let x = 0; x < this.allLineChartData.length; x++) {
                for (let y = 0; y < this.allLineChartData[x].data.length; y++) {
                    this.allLineChartData[x].data[y] = 0;
                }
            }
            this.charts.toArray()[0].update();
        } else {
            for (let x = 0; x < this.lineChartData.length; x++) {
                for (let y = 0; y < this.lineChartData[x].data.length; y++) {
                    this.lineChartData[x].data[y] = 0;
                }
            }
            this.charts.toArray()[0].update();
        }
    }


    // ----------------------------//
    // Add user to reminder relation //
    // ----------------------------//
    addProduct() {
      /*
        const selected = this.products.value;
        if (selected !== '' && typeof selected === 'object') {
            // // // // console.log(selected);
            this.productBelongs.push(selected);
            if (this.productBelongs.length === 1) {
                this.lineChartColors = [{ borderColor: selected.color, backgroundColor: 'rgba(255,255,255,0)' }];
                this.lineChartData = [{data: [0,0,0,0,0,0,0,0,0,0,0,0], label: selected.name}];
            } else {
                this.lineChartColors.push({ borderColor: selected.color, backgroundColor: 'rgba(255,255,255,0)' });
                this.lineChartData.push({data: [0,0,0,0,0,0,0,0,0,0,0,0], label: selected.name});
            }
            this.charts.toArray()[0].update();
            this.loadChartData(this.yearControl.value);
            this.products.patchValue('');
        }
        */
    }
    // ----------------------------//
    // Remove user from reminder relation //
    // ----------------------------//
    removeProduct(product: any) {
        const index = this.productBelongs.findIndex(obj => obj.id === product.id);
        this.lineChartData.splice(index, 1);
        this.lineChartColors.splice(index, 1);
        this.productBelongs.splice(index, 1);
        if (this.productBelongs.length === 0) {
            this.loadChartData(this.yearControl.value);
        }
        this.products.patchValue('');
    }
    // ----------------------------//
    // Add user to reminder relation //
    // ----------------------------//
    addClient() {
        const selected = this.clients.value;
        if (selected !== '' && typeof selected === 'object') {
            this.clientBelongs.push(selected);
            this.loadChartData(this.yearControl.value);
            this.clients.patchValue('');
        }
    }
    // ----------------------------//
    // Remove user from reminder relation //
    // ----------------------------//
    removeClient(client: any) {
        const index = this.clientBelongs.findIndex(obj => obj.id === client.id);
        this.clientBelongs.splice(index, 1);
        this.loadChartData(this.yearControl.value);
        this.clients.patchValue('');
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

    excecuteRequests(){
      /*
        console.log('executing requests');
        this.getOpenLeads();
        this.getClosedLeads();
        this.getOpenDeals();
        this.getDealsInShippingPeriod();
        this.getExcecutedDeals();
        this.getCanceledDeals();
        this.getReminders();
        */
    }
    // ----------------------------//
    // Get indicators //
    // ----------------------------//
    //Open leads
    getOpenLeads(){
      /*
        const getProductsQuery = this.queryFactory.generateGetCountQuery('Deals', this.queryFactory.setAndQuery(['branchId', 'isLead', 'isCanceled'], [this.branchService.currentBranch.getValue().id, true, false]));
        console.log(getProductsQuery);
        // // console.log('Get open Deals');
        this.apiService.getDataObjects(getProductsQuery).pipe(takeUntil(this.onDestroy)).subscribe((data: any) => {
            this.statistics['openLeads'] = data.count
        });
    }
    //Leads lost
    getClosedLeads(){
        const getProductsQuery = this.queryFactory.generateGetCountQuery('Deals', this.queryFactory.setAndQuery(['branchId', 'isLead', 'isCanceled'], [this.branchService.currentBranch.getValue().id, true, true]));
        // // console.log('getClosedLeads');
        this.apiService.getDataObjects(getProductsQuery).pipe(takeUntil(this.onDestroy)).subscribe((data: any) => {
            this.statistics['canceledLeads'] = data.count
        });
        */
    }
    //Open Deals
    getOpenDeals(){
      /*
        const getProductsQuery = this.queryFactory.generateGetCountQuery('Deals', this.queryFactory.setAndQuery(['branchId', 'isDeal', 'isCanceled', 'isDone'], [this.branchService.currentBranch.getValue().id, true, false, false]));
        // // console.log('getOpenDeals');
        this.apiService.getDataObjects(getProductsQuery).pipe(takeUntil(this.onDestroy)).subscribe((data: any) => {
            this.statistics['openDeals'] = data.count
        });
        */
    }
    //Deals in shipping period
    getDealsInShippingPeriod(){
      /*
        //let whereObj = this.queryFactory.setAndQuery(['branchId', 'isDeal', 'isCanceled'], [this.branchService.currentBranch.getValue().id, true, false]);
        const andObject = this.queryFactory.setAndQuery(['branchId', 'isDeal', 'isCanceled', 'isDone'], [this.branchService.currentBranch.getValue().id, true, false, false]);
        const whereObj = this.queryFactory.setComplexAndQuery([
            {
                shipmentTo: {
                    gte: new Date()
                }
            },
            {
                shipmentFrom: {
                    lte: new Date()
                }
            },
            andObject
        ]);
        const getProductsQuery = this.queryFactory.generateGetCountQuery('Deals', whereObj);
        // // // // console.log(getProductsQuery);
        // // console.log('getDealsInShippingPeriod');
        this.apiService.getDataObjects(getProductsQuery).pipe(takeUntil(this.onDestroy)).subscribe((data: any) => {
            this.statistics['shippingPeriod'] = data.count
        });
    }
    //Excecuted Deals
    getExcecutedDeals(){
        const getProductsQuery = this.queryFactory.generateGetCountQuery('Deals', this.queryFactory.setAndQuery(['branchId', 'isDeal', 'isDone'], [this.branchService.currentBranch.getValue().id, true, true]));
        // // console.log('getExcecutedDeals');
        this.apiService.getDataObjects(getProductsQuery).pipe(takeUntil(this.onDestroy)).subscribe((data: any) => {
            this.statistics['excecutedDeals'] = data.count
        });
    }
    //Canceled Deals
    getCanceledDeals(){
        const getProductsQuery = this.queryFactory.generateGetCountQuery('Deals', this.queryFactory.setAndQuery(['branchId', 'isDeal', 'isCanceled'], [this.branchService.currentBranch.getValue().id, true, true]));
        // // console.log('getCanceledDeals');
        this.apiService.getDataObjects(getProductsQuery).pipe(takeUntil(this.onDestroy)).subscribe((data: any) => {
            this.statistics['canceledDeals'] = data.count
        });
    }
    //Get reminders
    getReminders(){
        const whereObj = this.queryFactory.setComplexAndQuery([
            {
                date: {
                    gte: new Date()
                }
            },
            {
                sent: false
            }
        ]);
        const getProductsQuery = this.queryFactory.generateGetCountQuery('Reminders', whereObj);
        // // console.log('getReminders');
        this.apiService.getDataObjects(getProductsQuery).pipe(takeUntil(this.onDestroy)).subscribe((data: any) => {
            this.statistics['reminders'] = data.count
        });
        */
    }
    // -------------------- //
    // On destroy lifecycle //
    // -------------------- //
    ngOnDestroy(): void {
        this.onDestroy.next();
        this.onDestroy.unsubscribe();
    }

    // GRAIN WEEKS //
    // GRAIN WEEKS //
    // GRAIN WEEKS //
    // GRAIN WEEKS //
    // GRAIN WEEKS //
    // GRAIN WEEKS //
    // GRAIN WEEKS //
    // GRAIN WEEKS //
    // GRAIN WEEKS //
    // GRAIN WEEKS //
    // GRAIN WEEKS //
    // GRAIN WEEKS //
    // GRAIN WEEKS //
    // GRAIN WEEKS //


    /* chart config */
    public grainLineChartLabels: Label[] = ['Week' , 'Week', 'Week', 'Week'];
    public grainLineChartOptions: (ChartOptions & { annotation: any }) = {
        responsive: true,
        annotation: {},
        maintainAspectRatio: false
    };
    public grainLineChartColors: Color[] = [{ borderColor: 'rgba(255,255,255,0)', backgroundColor: 'rgba(255,255,255,0)' }];
    public grainLineChartData: ChartDataSets[] = [{data: [], label: ''}];

    public dateStartPivot = new Date(2019, 6, 28);
    public dateEndPivot = new Date(2019, 7, 3);
    public currentMonth: any[] = [{},{},{},{}];
    public currentDate: Date;
    public currentGrainYear = this.getCurrentGrainYear();
    public currentWeekIndex = 0;
    private weeksPerPage = 4;
    grainForm = this.fb.group({});

    public grainWeekData: any = {};

    public topFourProducts: any[] = [];


    /* red lentils, large green peas */

    loadAllProducts() {
        // Load total products //
        this.apiService.getDataObjects('Products').pipe(takeUntil(this.onDestroy)).subscribe((products: any[]) => {
            this.allProductsObject = products;
            this.loadWeeks(this.currentGrainYear);
        });
    }

    loadWeeks(year: any) {
      /*
        this.validateWeekLength();
        // this.loadingService.showLoader.next(true);
        const currentBranchId = this.branchService.currentBranch.getValue().id;
        this.apiService.getDataObjects('GrainWeeks?filter=' + JSON.stringify({
            where: {
                and: [
                    {year: year},
                    {or: [
                        {week: this.currentWeekIndex},
                        {week: (this.currentWeekIndex + 1)},
                        {week: (this.currentWeekIndex + 2)},
                        {week: (this.currentWeekIndex + 3)},
                    ]},
                    // {branchId: currentBranchId}
                ]
            },
            // skip: this.currentWeekIndex, // depending on current showing weeks
            // limit: this.weeksPerPage,// only load 4 weeks
            order: 'week asc'
        })).pipe(takeUntil(this.onDestroy)).subscribe((grainWeeks: any[]) => {
            // // console.log(grainWeeks);
            if (grainWeeks) {
                // // console.log(grainWeeks);
                this.processData(grainWeeks);
            } else {
                this.resetGrainGraph()
            }

        }, error => {
            this.loadingService.showLoader.next(false);
        });
        */
    }

    processData(resGrainWeeks: any[]) {
        this.grainWeekData = {
            [this.currentWeekIndex]: {},
            [this.currentWeekIndex + 1]: {},
            [this.currentWeekIndex + 2]: {},
            [this.currentWeekIndex + 3]: {},
        };
        this.allProductsObject.forEach( (product) => {
            for (let x = 0; x < 4; x++) {
                this.grainWeekData[this.currentWeekIndex + x][product.id] = { valueAtPlant: 0, valueForSale: 0 };
            }
        });

        for (let weekIndex = 0; weekIndex < resGrainWeeks.length; weekIndex++) { // recorremos todos los objectos de grainWeeks
            for (let productIndex = 0; productIndex < resGrainWeeks[weekIndex].products.length; productIndex++) { // recorremos los productos de cada grainWeek
                const product = resGrainWeeks[weekIndex].products[productIndex];
                this.grainWeekData[resGrainWeeks[weekIndex].week][product.id].valueAtPlant += product.valueAtPlant ? product.valueAtPlant : 0;
                this.grainWeekData[resGrainWeeks[weekIndex].week][product.id].valueForSale += product.valueForSale ? product.valueForSale : 0;
            }
        }

        this.topFourProducts = this.obtainTopFour();

        console.log(this.topFourProducts);

        // WHILE 4 PRODUCTS ARE DEFINED

        for (let x = 0; x < this.weeksPerPage; x++) {
            this.topFourProducts.forEach((product: any) => {
                this.grainForm.addControl('week-' + x + '-available-' + product.productId, new FormControl({value: '', disabled: false}));
                this.grainForm.addControl('week-' + x + '-product-' + product.productId, new FormControl({value: '', disabled: false}));
            });
        }
        this.patchData();
    }

    obtainTopFour() {
        console.log(this.allProducts);
        let tempValues: any[] = [
            { productId: this.allProductsObject[0].id, valueAtPlant: -1 },
            { productId: this.allProductsObject[1].id, valueAtPlant: -1 },
            { productId: this.allProductsObject[2].id, valueAtPlant: -1 },
            { productId: this.allProductsObject[3].id, valueAtPlant: -1 }];
        // // console.log('trying to sort products ',this.grainWeekData[this.currentWeekIndex + 3]);
        for (let productId in this.grainWeekData[this.currentWeekIndex + 3]) { // recorremos los productos guardados las grainweek actual
            const currentProduct = this.grainWeekData[this.currentWeekIndex + 3][productId]; // asignamos el valor del producto en una variable
            if (currentProduct.valueAtPlant > tempValues[3].valueAtPlant) {
                for (let x = 0; x < tempValues.length; x++) {
                    for (let y = 0; y < (tempValues.length - 1); y++) {
                        if (tempValues[y].valueAtPlant < tempValues[y + 1].valueAtPlant) {
                            const temp = tempValues[y];
                            tempValues[y] = tempValues[y + 1];
                            tempValues[y + 1] = temp;
                        }
                    }
                }
            }
        }
        return tempValues;
    }

    public grainColors = [
        '#3E41FF', '#73B1FF',
        '#FF8300', '#FFA856',
        '#007A20', '#81C490',
        '#544343', '#6A5755'
    ];

    patchData() {
       // // console.log('patching data');
        let cont = 0;
        // // console.log(this.grainForm.controls);
        for (let week in this.grainWeekData) {
            for (let x = 0; x < this.topFourProducts.length; x++) {
                this.grainForm.patchValue({
                    ['week-' + cont + '-available-' + this.topFourProducts[x].productId]: this.grainWeekData[week][this.topFourProducts[x].productId].valueAtPlant,
                    ['week-' + cont + '-product-' + this.topFourProducts[x].productId]: this.grainWeekData[week][this.topFourProducts[x].productId].valueForSale,
                });
            }
            cont++;
        }

        for (let x = 0, y = 0; x < 4; x++, y+=2) {
            this.grainLineChartColors.push({ borderColor: this.grainColors[y], backgroundColor: 'rgba(255,255,255,0)' });
            this.grainLineChartData.push({data: [
                this.grainWeekData[this.currentWeekIndex][this.topFourProducts[x].productId].valueAtPlant,
                this.grainWeekData[this.currentWeekIndex + 1][this.topFourProducts[x].productId].valueAtPlant,
                this.grainWeekData[this.currentWeekIndex + 2][this.topFourProducts[x].productId].valueAtPlant,
                this.grainWeekData[this.currentWeekIndex + 3][this.topFourProducts[x].productId].valueAtPlant
            ], label: this.obtainProductName(this.topFourProducts[x].productId) + ', at plants'});

            this.grainLineChartColors.push({ borderColor: this.grainColors[y + 1], backgroundColor: 'rgba(255,255,255,0)' });
            this.grainLineChartData.push({data: [
                    this.grainWeekData[this.currentWeekIndex][this.topFourProducts[x].productId].valueForSale,
                    this.grainWeekData[this.currentWeekIndex + 1][this.topFourProducts[x].productId].valueForSale,
                    this.grainWeekData[this.currentWeekIndex + 2][this.topFourProducts[x].productId].valueForSale,
                    this.grainWeekData[this.currentWeekIndex + 3][this.topFourProducts[x].productId].valueForSale
            ], label: this.obtainProductName(this.topFourProducts[x].productId) + ', for sale'});
            // // console.log('loop');
            this.charts.toArray()[1].update();
        }
    }

    resetGrainGraph() {
        for (let x = 0, y = 0; x < 4; x++, y+=2) {
            this.grainLineChartColors.push({ borderColor: this.grainColors[y], backgroundColor: 'rgba(255,255,255,0)' });
            this.grainLineChartData.push({data: [
                    0,0,0,0
                ], label: this.obtainProductName(this.topFourProducts[x].productId) + ', at plants'});

            this.grainLineChartColors.push({ borderColor: this.grainColors[y + 1], backgroundColor: 'rgba(255,255,255,0)' });
            this.grainLineChartData.push({data: [
                    0,0,0,0
                ], label: this.obtainProductName(this.topFourProducts[x].productId) + ', for sale'});
            // // console.log('loop');
            this.charts.toArray()[1].update();
        }
    }

    obtainProductName(productId: string) {
        const tempProduct = this.allProductsObject.find((product) => product.id === productId);
        return  tempProduct? tempProduct.name : 'N/A';
    }

    validateWeekLength() {
        if (this.currentWeekIndex <= 3) {
            this.currentWeekIndex = 0;
        } else if (this.currentWeekIndex >= 48) {
            this.currentWeekIndex = 48;
        }
    }

    // NEW YEARS FUNCTIONALITY
    generateYearsObject() {
        const years = [];
        const actualYear = new Date().getFullYear();
        for (let x = (actualYear + 3); x >= 2016; x--) {
            years.push(x);
        }
        return years;
    }

    getCurrentGrainYear() {
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

    getCurrentWeek(date: Date) {
        // Copy date so don't modify original
        date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        // Set to nearest Thursday: current date + 4 - current day number
        // Make Sunday's day number 7
        date.setUTCDate(date.getUTCDate() - date.getUTCDay());
        // Get first day of year
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(),7,1));
        // Calculate full weeks to nearest Thursday
        // @ts-ignore
        let weekNo = Math.ceil(( ( (date - yearStart) / 86400000) + 1)/7);
        // Return array of year and week number
        if (weekNo < 0) {
            weekNo = 52 + weekNo;
        }
        return (weekNo - 3);
    }

    obtainStartDay(weekIndex) {
        const selectedYear = this.currentGrainYear;
        if (selectedYear < this.dateStartPivot.getFullYear()) {
            let startDate = new Date(this.dateStartPivot);
            const weekFactor = 52 - weekIndex;
            const yearFactor = this.dateStartPivot.getFullYear() - selectedYear;
            startDate.setDate(startDate.getDate() - (7 * (weekFactor * yearFactor)));
            return startDate;
        } else if (selectedYear === this.dateStartPivot.getFullYear()) {
            let startDate = new Date(this.dateStartPivot);
            const weekFactor = weekIndex;
            startDate.setDate(startDate.getDate() + (7 * weekFactor));
            return startDate;
        } else {
            let startDate = new Date(this.dateStartPivot);
            const weekFactor = weekIndex;
            const yearFactor = this.dateStartPivot.getFullYear() + (selectedYear - this.dateStartPivot.getFullYear());
            startDate.setDate(startDate.getDate() + (7 * (weekFactor * yearFactor)));
            return startDate;
        }
    }

    obtainEndDay(weekIndex) {
        const selectedYear = this.currentGrainYear;
        if (selectedYear < this.dateEndPivot.getFullYear()) {
            let endDate = new Date(this.dateEndPivot); // 7/3/2019
            const weekFactor = 52 - weekIndex; // 3
            const yearFactor = this.dateEndPivot.getFullYear() - selectedYear;
            endDate.setDate(endDate.getDate() - ((7 * weekFactor) * yearFactor));
            return endDate;
        } else if (selectedYear === this.dateEndPivot.getFullYear()) {
            let endDate = new Date(this.dateEndPivot);
            const weekFactor = weekIndex;
            endDate.setDate(endDate.getDate() + (7 * weekFactor));
            return endDate;
        } else {
            let endDate = new Date(this.dateEndPivot);
            const weekFactor = weekIndex;
            const yearFactor = this.dateStartPivot.getFullYear() + (selectedYear - this.dateStartPivot.getFullYear());
            endDate.setDate(endDate.getDate() + (7 * (weekFactor * yearFactor)));
            return endDate;
        }
    }

    formattDate(tempDate: Date) {
        const date = new Date(tempDate);
        return ((date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear());
    }

    // ---------------------//
    // Present toast method //
    // ---------------------//
    presentToast(message: string, style: string) {
        this.snackBar.open(message, 'Close', {
            duration: 3000,
            panelClass: [style],
            horizontalPosition: 'end',
            verticalPosition: document.documentElement.clientWidth >= 1050 ? 'top' : 'bottom'
        });
    }

}
