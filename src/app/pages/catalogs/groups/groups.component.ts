import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {takeUntil} from "rxjs/operators";
import {BranchService} from "../../../services/branch/branch.service";
import {Router} from "@angular/router";
import {Subject} from "rxjs";

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnInit, AfterViewInit, OnDestroy {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  private onDestroy = new Subject<void>();
  private firstLoad = true;
  constructor(
      private branchService: BranchService,
      private router: Router
  ) {}
  ngOnInit() {

  }
  ngAfterViewInit(): void {
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
  }
  setListeners() {
    this.branchService.branchObservable.pipe(takeUntil(this.onDestroy)).subscribe((branch) => {
      console.log('clients component branchChanged', branch);
      if (branch && !this.firstLoad) {
        const nextRoute = this.router.url.split('/')[1];
        this.router.navigate(['/' + nextRoute]);
      } else if (this.firstLoad) {
        this.firstLoad = false;
      }
    });
  }
  // ------------------ //
  // On destroy init cycle //
  // ------------------ //
  ngOnDestroy(): void {
    console.log('clients destroy');
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
