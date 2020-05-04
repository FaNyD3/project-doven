import {
  AfterViewInit,
  Component,
  ElementRef, HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {SharingService} from "../../../../services/sharing/sharing.service";
import {ApiService} from "../../../../services/api/api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {QueryFactory} from "../../../../tableQueries/queryFactory";
import {MatDialog, MatPaginator, MatSnackBar, MatSort, MatTable, MatTableDataSource} from "@angular/material";
import {BranchService} from "../../../../services/branch/branch.service";
import {LoadingService} from "../../../../services/loading/loading.service";
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {AuthService} from "../../../../services/auth/auth.service";
import {BehaviorSubject, Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {ModalConfirmComponent} from "../../../../modals/modal-confirm/modal-confirm.component";
import {CrudClientComponent} from "../../../clients/clients-table/crud-client/crud-client.component";
import {Title} from "@angular/platform-browser";
import {EmployeeComponent} from "./employee/employee.component";
import {CustomDataSource} from "../../../../tableQueries/customDataSource";

@Component({
  selector: 'app-selected-plant',
  templateUrl: './selected-plant.component.html',
  styleUrls: ['./selected-plant.component.scss']
})
export class SelectedPlantComponent implements OnInit, AfterViewInit, OnDestroy {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  @ViewChildren('displayData') displayElem: QueryList<any>;
  @ViewChildren('noData') noDisplayElem: QueryList<any>;
  public displayData = new BehaviorSubject<boolean>(false);
  private onDestroy = new Subject<void>();
  public id: string;
  public firstLoad = true;
  public currentPlant: any = null;
  public isNew = true;
  public employeesData: any[] = [];
  /* manage table */
  public dataSource = this.employeesData;
  @ViewChild(MatSort, {static: false}) sort: MatSort;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator;
  @ViewChild(MatTable, {static: false}) employeesTable: MatTable<any>;
  public hourOptions = this.getHours();
  public displayedColumns: string[] = [
    'employee',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
    'button'
  ];
  /* manage responsive component */
  public showOnLarge = window.innerWidth > 960;
  public showBigTable = window.innerWidth > 1054;
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
  addForm = this.fb.group({
    name: new FormControl({value: '', disabled: false}, Validators.required),
    address: new FormControl({value: '', disabled: false}, Validators.required),
    grainWeek: new FormControl({value: this.currentPlant ? (this.currentPlant.hasGrainWeek ? this.currentPlant.hasGrainWeek : false) : false, disabled: false}, Validators.required),
  });
  scheduleForm = this.fb.group({
    startHour: new FormControl({value: '', disabled: false}),
    endHour: new FormControl({value: '', disabled: false}),
    days: new FormControl({value: '', disabled: false})
  });
  // ----------------- //
  // Listener OnResize //
  // ----------------- //
  @HostListener('window:resize') onResize() {
    let tempOnLarge;
    /* if firstLoad set change points */
    if (this.firstLoad ) {
      tempOnLarge = !this.showOnLarge;
    } else {
      tempOnLarge = window.innerWidth > 991;
    }
    /* if resize pass !showOnLarge point */
    if (tempOnLarge !== this.showOnLarge) {
      this.showOnLarge = window.innerWidth > 991;
    }
  }
  // ------------------ //
  // On view init cycle //
  // ------------------ //
  ngOnInit() {
    const id = window.location.href.split('plants/');
    this.id = id[1].split('/')[0];
    this.isNew = this.id === 'new';
  }
  // --------------------- //
  // After view init cycle //
  // --------------------- //
  ngAfterViewInit() {
    // this.setGoogleAutocompletes();
    this.displayData.asObservable().pipe(takeUntil(this.onDestroy)).subscribe((isData: boolean) => this.showData(isData));
    // this.setAvailableFiltersListeners();
    // this.setBelongsTpFiltersListeners();
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
  getHours() {
    const hoursObject: string[] = [];
    for (let x = 0; x < 24; x++) {
      if (x === 0) {
        hoursObject.push('12:00 AM');
      } else if (x === 12) {
        hoursObject.push('12:00 PM');
      } else if (x > 12) {
        hoursObject.push((x - 12)+ ':00 PM');
      } else {
        hoursObject.push(x + ':00 AM');
      }
    }
    return hoursObject;
  }
  // ------------------------------------------------------------ //
  // Function to avoid data losses when google event is triggered //
  // ------------------------------------------------------------ //
  patchAddress() {
    this.addForm.get('address').patchValue((<HTMLInputElement>document.getElementById('addressWrapper')).value);
  }
  // --------------------- //
  // Start loading process //
  // --------------------- //
  startLoading() {
    /* AVOID CHANGES BEFORE LOADED */
    console.log('start loading');
    setTimeout(() => {
      if (this.isNew) {
        this.setTitle('New plant - plants');
        /* if is new plant */
        if (this.firstLoad) {
          this.firstLoad = false;
        }
        this.displayData.next(true);
      } else {
        /* if is edit plant */
        if (this.sharingService.plantData !== null) {
          /* if service has plant data (is not first load page) */
          this.currentPlant = this.sharingService.plantData;
          console.log(this.currentPlant);
          this.setTitle(this.currentPlant.name + ' - plant details');
          this.addForm.patchValue({
            name: this.currentPlant.name,
            address: this.currentPlant.location,
            grainWeek: this.currentPlant.hasGrainWeek ? this.currentPlant.hasGrainWeek : false
          });
          /* if has schedule object */
          if (this.currentPlant.schedule) {
            if (this.currentPlant.schedule.plantSchedule) {
              this.scheduleForm.patchValue({
                startHour: this.currentPlant.schedule.plantSchedule.startHour,
                endHour: this.currentPlant.schedule.plantSchedule.endHour,
                days: this.currentPlant.schedule.plantSchedule.days,
              });
            }
            if (this.currentPlant.schedule.employees) {
              for (let x = 0; x < this.currentPlant.schedule.employees.length; x++) {
                this.employeesData.push(this.currentPlant.schedule.employees[x]);
              }
              this.employeesTable.renderRows();
            }
          }
          /* if is firstLoad */
          if (this.firstLoad) {
            this.firstLoad = false;
          }
          this.displayData.next(true);
        } else {
          /* if service hasn't group data (is first load page) */
          this.loadPlant(this.id);
        }
      }
    }, 100);
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
  // ----------------------------//
  // Add data object to database //
  // ----------------------------//
  performRequest() {
    if (this.addForm.status === 'INVALID') {
      this.presentToast('Error in form', 'yellow-snackbar');
    } else {
      const schedule = this.generateSchedule();
      if (this.isNew) {
        /* if is new */
        const newPlant = {
          name: this.addForm.get('name').value,
          location: this.addForm.get('address').value,
          branchId: this.branchService.currentBranch.getValue().id,
          hasGrainWeek: this.addForm.get('grainWeek').value,
          schedule: schedule ? schedule : {}
        };
        /* perform add request */
        this.apiService.addDataObject(newPlant, 'Plants').pipe(takeUntil(this.onDestroy)).subscribe(() => {
          this.presentToast('Plant created succesfullly', 'green-snackbar');
          this.loadingService.showLoader.next(false);
          this.router.navigate(['plants']);
        }, (e) => {
          console.log(e);
          this.presentToast('Connection rejected', 'red-snackbar');
          this.loadingService.showLoader.next(false);
        });
      } else {
        /* if is not new */
        const editPlant = {
          name: this.addForm.get('name').value,
          location: this.addForm.get('address').value,
          branchId: this.branchService.currentBranch.getValue().id,
          hasGrainWeek: this.addForm.get('grainWeek').value,
          schedule: schedule ? schedule : {}
        };
        // console.log(editPlant);
        /* perform edit request */
        this.apiService.editDataObject(this.currentPlant.id, editPlant, 'Plants').pipe(takeUntil(this.onDestroy)).subscribe(() => {
          this.presentToast('Plant edited succesfullly', 'green-snackbar');
          this.loadingService.showLoader.next(false);
          this.router.navigate(['plants']);
        }, (e) => {
          console.log(e);
          this.presentToast('Connection rejected', 'red-snackbar');
          this.loadingService.showLoader.next(false);
        });
      }
    }
  }
  // --------------------- //
  // Load group from server //
  // --------------------- //
  loadPlant(plantId: string) {
    /* load group from server */
    this.apiService.getDataObject('Plants', plantId + '?filter=' + JSON.stringify({
      include: []
    })).pipe(takeUntil(this.onDestroy)).subscribe((plant: any) => {
      console.log(plant);
      this.currentPlant = plant;
      this.setTitle(this.currentPlant.name + ' - plant details');
      /* set current plant on service */
      this.sharingService.plantData = plant;
      this.addForm.patchValue({
        name: plant.name,
        address: plant.location,
        grainWeek: plant.hasGrainWeek ? plant.hasGrainWeek : false
      });
      /* if has schedule object */
      if (this.currentPlant.schedule) {
        if (this.currentPlant.schedule.plantSchedule) {
          this.scheduleForm.patchValue({
            startHour: this.currentPlant.schedule.plantSchedule.startHour,
            endHour: this.currentPlant.schedule.plantSchedule.endHour,
            days: this.currentPlant.schedule.plantSchedule.days,
          });
        }
        if (this.currentPlant.schedule.employees) {
          for (let x = 0; x < this.currentPlant.schedule.employees.length; x++) {
            this.employeesData.push(this.currentPlant.schedule.employees[x]);
          }
          this.employeesTable.renderRows();
        }
      }
      if (this.firstLoad) {
        this.firstLoad = false;
      }
      this.displayData.next(true);
    });
  }
  // ------------------------------------- //
  // Generate schedule object, return: any //
  // ------------------------------------- //
  generateSchedule() {
    return {
      plantSchedule: {
        startHour: this.scheduleForm.get('startHour').value,
        endHour: this.scheduleForm.get('endHour').value,
        days: this.scheduleForm.get('days').value,
      },
      employees: this.employeesData
    };
  };
  // ----------------------------//
  // Present toast method //
  // ----------------------------//
  presentToast(message: string, style: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: [style],
      horizontalPosition: 'end',
      verticalPosition: document.documentElement.clientWidth >= 1050 ? 'top' : 'bottom'
    });
  }
  // -------------------------------//
  // Delete data object on database //
  // -------------------------------//
  deleteObject() {
    const dialogRef = this.dialog.open(ModalConfirmComponent, {
      data: {
        button: 'Delete',
        title: 'Plant',
        subtitle: '¿Are you sure about deleting this plant?',
        message: [
        ]
      },
      autoFocus: false
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe(result => {
      if (result !== undefined) {
        if (result.confirmation) {
          this.apiService.deleteDataObject('Plants', this.currentPlant.id).pipe(takeUntil(this.onDestroy)).subscribe(() => {
            this.presentToast('Plant deleted succesfullly', 'green-snackbar');
            this.router.navigate(['plants']);
          });
        }
      }
    });
  }

  // ---------------------- //
  // Go to groups component //
  // ---------------------- //
  goToPlants() {
    this.router.navigate(['plants']);
  }
  // ---------------------------------- //
  // Add new employee to plant schedule //
  // ---------------------------------- //
  newEmployee() {
    const dialogRef = this.dialog.open(EmployeeComponent, {
      data: {
        plantData: {
          startHour: this.scheduleForm.get('startHour').value,
          endHour: this.scheduleForm.get('endHour').value,
          days: this.scheduleForm.get('days').value
        },
        employeeData: {},
        title: 'New Employee',
        isNew: true
      },
      autoFocus: false,
      width: '1000px'
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe((result) => {
      if (result !== undefined) {
        if (result.employee) {
          this.employeesData.push(result.employee);
          this.employeesTable.renderRows();
          this.updateSchedule();
        }
      }
    });
  }
  openEmployee(data: any) {
    const dialogRef = this.dialog.open(EmployeeComponent, {
      data: {
        plantData: {
          startHour: this.scheduleForm.get('startHour').value,
          endHour: this.scheduleForm.get('endHour').value,
          days: this.scheduleForm.get('days').value
        },
        employeeData: data,
        title: 'Edit employee',
        isNew: false
      },
      autoFocus: false,
      width: '1000px'
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe((result) => {
      if (result !== undefined) {
        console.log(result.employee);
        console.log(this.employeesData);
        if (result.isDelete) {
          this.employeesData.splice(this.employeesData.findIndex(employee => employee.id === result.employee.id), 1);
          this.employeesTable.renderRows();
          this.updateSchedule();
        } else if (result.employee) {
          this.employeesData.splice(this.employeesData.findIndex(employee => employee.id === result.employee.id), 1);
          this.employeesData.push(result.employee);
          this.employeesTable.renderRows();
          this.updateSchedule();
        }
      }
    });
  }
  updateSchedule() {
    if (!this.isNew) {
      const schedule = this.generateSchedule();
      this.loadingService.showLoader.next(true);
      this.apiService.editDataObject(this.currentPlant.id,{schedule: schedule},'Plants').pipe(takeUntil(this.onDestroy)).subscribe(() => {
        this.presentToast('Schedule updated succesfullly', 'green-snackbar');
        this.loadingService.showLoader.next(false);
      }, (e) => {
        console.log(e);
        this.presentToast('Connection rejected', 'red-snackbar');
        this.loadingService.showLoader.next(false);
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
