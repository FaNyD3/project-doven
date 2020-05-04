// -----------------------------------//
// Dependencies and libraries imports //
// -----------------------------------//
import {AfterViewInit, ChangeDetectorRef, Component, Inject, OnInit} from '@angular/core';
import {Observable, Subject} from "rxjs";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSnackBar} from "@angular/material";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {ApiService} from "../../../../services/api/api.service";
import {LoadingService} from "../../../../services/loading/loading.service";
import {ModalConfirmComponent} from "../../../../modals/modal-confirm/modal-confirm.component";
import {debounceTime, startWith, switchMap, takeUntil} from "rxjs/operators";
// import {QueryFactory} from "../../../../tableQueries/queryFactory";

declare const google: any;

export interface dataIn {
  pilot: any;
  title: string;
  branch: any;
  isNew: boolean;
}

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
  selector: 'app-client',
  templateUrl: './crud-client.component.html',
  styleUrls: ['./crud-client.component.scss']
})
export class CrudClientComponent implements OnInit, AfterViewInit {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  private onDestroy = new Subject<void>();
  public branches: any[] = [];
  public userOptions: Observable<any>;
  // public clientProducts: any[] = [];
  // public clientProductsForms: FormGroup[] = [];
  public productOptions: Observable<any>;
  public newProduct = false;
  public isMediumSize = window.innerWidth >= 576 && window.innerWidth <= 991;
  public tags: string[] = [];
  private currentActive = 0;
  public isActive1 = false;
  public isActive2 = false;
  public isActive3 = false;
  public isActive4 = false;
  public isActive5 = false;
  public branchColor = "";
  public clientLocation = {
    lat: null,
    lng: null
  };
  private hasChanges = false;
  // --------------------- //
  // Component constructor //
  // --------------------- //
  constructor(
      private dialogRef: MatDialogRef<CrudClientComponent>,
      private fb: FormBuilder,
      private apiService: ApiService,
      private snackBar: MatSnackBar,
      private loadingService: LoadingService,
      // private queryFactory: QueryFactory,
      private dialog: MatDialog,
      @Inject(MAT_DIALOG_DATA) public dataIn: dataIn,
      private changeDetectorRef: ChangeDetectorRef
  ) { }
  // --------------------------------------//
  // Form inputs & validations declaration //
  // --------------------------------------//
  addForm = this.fb.group({
    name: new FormControl({value: '', disabled: false}, Validators.required),
    type: new FormControl({value: '', disabled: false}, Validators.required),
    lastName: new FormControl({value: '', disabled: false}, Validators.required),
    // address: new FormControl({value: '', disabled: false}),
    phone: new FormControl({value: '', disabled: false}),
    // landphone: new FormControl({value: '', disabled: false}),
    email: new FormControl({value: '', disabled: false}),
    password: new FormControl({value: '', disabled: false}, Validators.required),
    // rate: new FormControl({value: '', disabled: false}, Validators.required), // puse 
    // buyer: new FormControl({value: {name: ''}, disabled: false}),
    notes: new FormControl({value: '', disabled: false}),
    // town: new FormControl({value: '', disabled: false}),
    branch: new FormControl({value: this.dataIn.branch.name, disabled: true}),
    // acrerage: new FormControl({value: '', disabled: false}),
  });
  /*
  productForm = this.fb.group({
    products: new FormControl({value: '', disabled: false}, [Validators.required, objectValidator.validData]),
    productGrown: new FormControl({value: '', disabled: false}, Validators.required),
    productAvailable: new FormControl({value: '', disabled: false}, Validators.required),
    targetPrice: new FormControl({value: '', disabled: false}, Validators.required),
    units: new FormControl({value: '', disabled: false}, Validators.required),
    grade: new FormControl({value: '', disabled: false}, Validators.required)
  });
  */
  public tag = new FormControl({value: '', disabled: false});
  // ------------------ //
  // On view init cycle //
  // ------------------ //
  ngOnInit(): void {
    this.changeDetectorRef.markForCheck();
    console.log('dataIn',this.dataIn.branch);
    // this.branches = this.branchService.branchOptions;
    this.branchColor = this.dataIn.branch.color;
    if (!this.dataIn.isNew) {
      console.log( this.dataIn );
      this.tags = this.dataIn.pilot.tags ? this.dataIn.pilot.tags : [];
      this.addForm.patchValue({
        name: this.dataIn.pilot.name,
        type: this.dataIn.pilot.gender,
        lastName: this.dataIn.pilot.lastName ? this.dataIn.pilot.lastName : '',
        // address: this.dataIn.client.address ? this.dataIn.client.address : '',
        phone: this.dataIn.pilot.phone ? this.dataIn.pilot.phone: '',
        // landphone: this.dataIn.client.landNumber ? this.dataIn.client.landNumber: '',
         email: this.dataIn.pilot.email ? this.dataIn.pilot.email : '',
         password: this.dataIn.pilot.password ? this.dataIn.pilot.password : '',
         // rate: this.dataIn.pilot.rate ? this.dataIn.pilot.rate : '' // puse
        // buyer: this.dataIn.client.buyer ? this.dataIn.client.buyer : '',
        notes: this.dataIn.pilot.notes ? this.dataIn.pilot.notes : '',
        // town: this.dataIn.client.town ? this.dataIn.client.town : ''
      });
      /*
      if (this.dataIn.client.category === 'producer') {
        this.addForm.patchValue({
          acrerage: this.dataIn.client.acrerage
        });
      }
      */
      this.changeRate(this.dataIn.pilot.rate ? this.dataIn.pilot.rate : 0);
    }
    window.addEventListener('resize', () => {
      this.isMediumSize = window.innerWidth >= 576 && window.innerWidth <= 991;
    });
  }
  // --------------------- //
  // After view init cycle //
  // --------------------- //
  ngAfterViewInit() {
    /* on search change (managing 250 ms) */
    // @ts-ignore
    /*
    this.userOptions = this.addForm.get('buyer').valueChanges.pipe(
        debounceTime(250),
        startWith(''),
        switchMap(value => this.loadUserOptions(value))
    );
    */
  }
  // ---------------------------------------------------//
  // Method to display name and load id on autocomplete //
  // ---------------------------------------------------//
  displayFn(data?: any): string | undefined {
    return data ? data.name : undefined;
  }

  // --------------------------------------------//
  // Method to load buyers with the autocomplete //
  // --------------------------------------------//
  loadUserOptions(dataSearch: string) {
    /*
    const searchQuery = this.queryFactory.setSearchQuery(dataSearch, ['name']);
    const whereQuery = {
      and: [
        searchQuery

      ]
    };
    const getBuyersQuery = this.queryFactory.generateGetQuery('AppUsers', whereQuery, 25, 0, 'name ASC', ['branches']);
    return new Observable<any>((objs) => this.apiService.getDataObjects(getBuyersQuery).subscribe((data: any) => {
      objs.next(data)
    }));
    */
  }
  // ----------------------------//
  // Add data object to database //
  // ----------------------------//
  performRequest() {
    if (this.addForm.status === 'INVALID') {
      this.presentToast('Error en formulario', 'yellow-snackbar');
    } else {
      if (this.dataIn.isNew) {
        /* if is new */
        let newPilot: any = {
          name: this.addForm.get('name').value,
          type : this.addForm.get('type').value, // type = gender type = capitan or primer oficial
          lastName: this.addForm.get('lastName').value,
          branchOfficeId: this.dataIn.branch.id,
          // buyerId: this.addForm.get('buyer').value.id,
          email: this.addForm.get('email').value,
          phone: this.addForm.get('phone').value.replace(/\s+/g, ''),
          // landNumber: this.addForm.get('landphone').value.replace(/\s+/g, ''),
          // address: this.addForm.get('address').value, SI LO PONDRE PERO DESPUES
          // town: this.addForm.get('town').value,
          notes: this.addForm.get('notes').value,
          password: this.addForm.get('password').value,
          // acrerage: this.addForm.get('category').value === 'producer' ? this.addForm.get('acrerage').value : 0,
          tags: this.tags,
          rate: this.currentActive,
          /*
          location: {
            lat: this.clientLocation.lat,
            lng: this.clientLocation.lng,
          },
          */
          // hasGroups: false
        };

        /*
        if (this.addForm.get('category').value === 'producer') {
            newPilot.acrerage = this.addForm.get('acrerage').value
        }
        */
        this.loadingService.showLoader.next(true);
        /* perform add request */

        //this.apiService.addDataObject( newPilot, 'partners').pipe(takeUntil(this.onDestroy)).subscribe((client: any) => {
        console.log('PRUEBA1');
        console.log(newPilot);
        // tslint:disable-next-line: max-line-length
        this.apiService.addDataObject( newPilot, 'Admins').pipe(takeUntil(this.onDestroy)).subscribe((pilot: any) => { // le quite pilot:any adentro de subscribe
          this.presentToast('Piloto creado exitosamente', 'green-snackbar');
          this.loadingService.showLoader.next(false);
          // console.log('PRUEBA');
          // console.log(newPilot);
          this.hasChanges = true;
          this.onNoClick();
        }, ( error ) => {
          console.log( error );
          this.presentToast('Conneccion rechazada', 'red-snackbar');
          this.loadingService.showLoader.next(false);
        });
      } else {
        /* if is not new */
        let editPilot: any = {
          name: this.addForm.get('name').value,
          // gender: this.addForm.get('gender').value,
          type: this.addForm.get('type').value,
          lastName: this.addForm.get('lastName').value,
          branchOfficeId: this.dataIn.branch.id,
          // buyerId: this.addForm.get('buyer').value.id,
          email: this.addForm.get('email').value,
          password: this.addForm.get('password').value,
          phone: this.addForm.get('phone').value.replace(/\s+/g, ''),
          // landNumber: this.addForm.get('landphone').value.replace(/\s+/g, ''),
          // address: this.addForm.get('address').value, SI LO PONDRE PERO DESPUES
          // town: this.addForm.get('town').value,
          notes: this.addForm.get('notes').value,
          // acrerage: this.addForm.get('category').value === 'producer' ? this.addForm.get('acrerage').value : 0,
          tags: this.tags,
          rate: this.currentActive,
          /*
          location: {
            lat: this.clientLocation.lat,
            lng: this.clientLocation.lng,
          },
          */
          // hasGroups: false
        };
        /*
        if(this.clientLocation.lat && this.clientLocation.lng){
          editClient.location = {
            lat: this.clientLocation.lat,
            lng: this.clientLocation.lng,
          }
        }
        */
        /* perform edit request */
        this.apiService.editDataObject(this.dataIn.pilot.id, editPilot, 'Admins').pipe(takeUntil(this.onDestroy)).subscribe(() => {
          this.presentToast('Piloto actualizado exitosamente', 'green-snackbar');
          this.loadingService.showLoader.next(false);
          this.hasChanges = true;
          this.onNoClick();
        }, (e) => {
          this.presentToast('Conneccion rechazada', 'red-snackbar');
          this.loadingService.showLoader.next(false);
        });
      }
    }
  }
  // -------------------------------//
  // Delete data object on database //
  // -------------------------------//
  deleteObject() {
    const dialogRef = this.dialog.open(ModalConfirmComponent, {
      data: {
        button: 'Eliminar',
        title: 'Socio',
        subtitle: '¿ Estas seguro de eliminar a este Socio ?',
        message: [
        ]
      },
      autoFocus: false
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(result => {
      if (result !== undefined) {
        if (result.confirmation) {
          this.apiService.deleteDataObject('Admins', this.dataIn.pilot.id).pipe(takeUntil(this.onDestroy)).subscribe(() => {
            this.presentToast('Socio eliminado correctamente', 'green-snackbar');
            this.hasChanges = true;
            this.onNoClick();
          });
        }
      }
    });
  }
  // ----------------- //
  // Add tag to client //
  // ----------------- //
  addTag() {
    const selected = this.tag.value;
    if (selected !== '') {
      this.tags.push(selected);
      this.tag.patchValue('');
    }

  }
  removeTag(tag: string) {
    this.tags.splice(this.tags.findIndex(obj => obj === tag), 1);
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
  // --------------------------------//
  // Set address inputs from request //
  // --------------------------------//
  setAddress(addrObj) {
    console.log(addrObj, 'google obj' );
    this.addForm.patchValue({
      town: addrObj.locality,
      /*lat: addrObj.lat,
      lng: addrObj.lng,*/
      address: addrObj.selectedText
    });
    this.clientLocation.lat = addrObj.lat;
    this.clientLocation.lng = addrObj.lng;
  }
  // -------------------//
  // Toggle isFavourite //
  // -------------------//
  changeRate(rate: number) {
    this.currentActive = rate;
    for (let x = 1; x <= 5; x++) {
      if (rate < x) {
        this['isActive' + x] = false;
      } else {
        this['isActive' + x] = true;
      }
    }
  }
  // -------------------//
  // Close modal method //
  // -------------------//
  onNoClick(): void {
    this.dialogRef.close({changes: this.hasChanges});
  }
  // -------------------- //
  // On destroy lifecycle //
  // -------------------- //
  ngOnDestroy(): void {
    console.log('crudPilot destroys');
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
