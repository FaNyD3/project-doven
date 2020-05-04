import {Injectable, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from "../auth/auth.service";
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {first, takeUntil} from "rxjs/operators";
import {LocalForageService} from "../localForage/local-forage.service";
import {ApiService} from "../api/api.service";
// import {SharingService} from "../sharing/sharing.service";

@Injectable({
  providedIn: 'root'
})
export class BranchService implements OnDestroy {

  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  private onDestroy = new Subject<void>();
  public branchOptions: any[] = [];
  public currentBranch: BehaviorSubject<any> = new BehaviorSubject(false);
  public branchObservable: Observable<any>;
  public branchesLoaded: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public currentUserGroups: any[] = [];
  public firstLoad = true;

  // ----------------------//
  // Component constructor //
  // ----------------------//
  constructor(
      private authService: AuthService,
      private localForage: LocalForageService,
      private apiService: ApiService,
      // private sharingService: SharingService
  ) {
    /* OBTAIN BRANCH OPTIONS FROM LOGGED USER  */
    console.log(this.authService.currentUserValue);
    if (this.authService.currentUserValue) {
      this.getBranchOptions(this.authService.currentUserValue);
    } else {
      this.authService.userObservable.pipe(takeUntil(this.onDestroy)).subscribe((user) => {
        if (user) {
          this.getBranchOptions(user);
        }
      });
    }
  }

  // ----------------------------------------------------//
  // OBTAIN BRANCH OPTIONS DEPENDING ON LOGGED USER ROLE //
  // ----------------------------------------------------//
  private getBranchOptions(user: any) { // gymId en lugar de Id
    // tslint:disable-next-line: max-line-length
    // tslint:disable-next-line: deprecation
    // tslint:disable-next-line: max-line-length
    this.apiService.getDataObjects('Airstrips').pipe(takeUntil(this.onDestroy)).subscribe((airstrips: any) => { // antes de .pipe era , 'Airtrips)
    if (airstrips) {
      this.branchOptions = airstrips;
      this.getCurrentBranch();

    }
    console.log(airstrips);
    // console.log(res)
        // this.currentUserGroups = res.groups ? res.groups : [];
    }); // quite un ) antes de ;
  }


  // ------------------------------------------------------------------//
  // OBTAIN CURRENT SELECTED BRANCH FROM INDEXEDDB OR SELECT FIRST ONE //
  // ------------------------------------------------------------------//
  public getCurrentBranch() {
    this.localForage.getItem('currentBranch').then((localBranch) => {
     // console.log('local', localBranch);
      if (localBranch) {
        if (this.branchOptions.find(branch => branch.id === localBranch.id)) {
          this.currentBranch.next(localBranch);
        } else {
          this.currentBranch.next(this.branchOptions[0]);
        }
      } else {
        this.currentBranch.next(this.branchOptions[0]);
      }
      this.firstLoad = false;
      this.addObservables();
    }).catch((e) => {
      this.currentBranch.next(this.branchOptions[0]);
    });
  }

  // ---------------------------------------------------------------------------- //
  // ADD OBSERVABLES TO SELECTED BRANCH, THIS SAVES CURRENT SELECTED ON INDEXEDDB //
  // ---------------------------------------------------------------------------- //
  private addObservables() {
    this.branchObservable = this.currentBranch.asObservable();
    this.branchObservable.pipe(takeUntil(this.onDestroy)).subscribe((branch) => {
      // console.log('branchesObservable changed ', branch);
      if (!this.firstLoad) {
        /*
        this.sharingService.currentClient.next(0);
        this.sharingService.serviceData.next(false);
        this.sharingService.groupData = null;
        */
      }
      if (branch) {
        this.localForage.setItem('currentBranch', branch).then(() => {
          // manage success
        });
      }
    });
    this.branchesLoaded.next(true);
  }

  // --------------------- //
  // ON DESTROY LIFE CYCLE //
  // --------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
