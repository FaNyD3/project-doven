import {
  AfterViewInit,
  Component, Input, OnDestroy,
  OnInit
} from '@angular/core';
// import {BranchService} from "../../services/branch/branch.service";
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";
import {Router} from "@angular/router";
import {ApiService} from "../../services/api/api.service";

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html'
})
export class ClientsComponent implements AfterViewInit, OnDestroy{
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  private onDestroy = new Subject<void>();
  private firstLoad = true;
  constructor(
      // private branchService: BranchService,
      private router: Router,
      private apiService: ApiService
  ) { }
  // ------------------ //
  // On view init cycle //
  // ------------------ //
  ngAfterViewInit() {
    /*
    if (this.branchService.branchesLoaded.getValue()) {
      this.setListeners();
    } else {
      const subs = this.branchService.branchesLoaded.pipe(takeUntil(this.onDestroy)).subscribe((state) => {
        if (state) {
          this.setListeners();
          subs.unsubscribe();
        }
      });
    }
    */
  }
  setListeners() {
    /*
    this.branchService.branchObservable.pipe(takeUntil(this.onDestroy)).subscribe((branch) => {
      console.log('clients component branchChanged', branch);
      if (branch && !this.firstLoad) {
        const nextRoute = this.router.url.split('/')[1];
        this.router.navigate(['/' + nextRoute]);
      } else if (this.firstLoad) {
        this.firstLoad = false;
      }
    });
    */
  }
  updateClients() {
    /*
    this.apiService.getDataObjects('Clients').pipe(takeUntil(this.onDestroy)).subscribe((clients: any[]) => {
      for (let x = 0; x < clients.length; x++) {
        let newLandNumber = clients[x].landNumber;
        if (newLandNumber !== 0) {
          newLandNumber = newLandNumber.replace(/\s+/g, '');
        }
        let newPhoneNumber = clients[x].phoneNumber;
        if (newPhoneNumber !== 0) {
          newPhoneNumber = newPhoneNumber.replace(/\s+/g, '');
        }
        this.apiService.editDataObject(clients[x].id,{landNumber: newLandNumber, phoneNumber: newPhoneNumber}, 'Clients').pipe(takeUntil(this.onDestroy)).subscribe(() => {
          console.log('client updated', x);
        });
      }
    });
    */
  }
  // ------------------ //
  // On destroy init cycle //
  // ------------------ //
  ngOnDestroy(): void {
    console.log('clients destroy 1');
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
