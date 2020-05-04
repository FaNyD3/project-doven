// -----------------------------------//
// Dependencies and libraries imports //
// -----------------------------------//
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";
import {MatDialog, MatPaginator, MatSort} from "@angular/material";
import {ApiService} from "../../../services/api/api.service";
import {Router} from "@angular/router";
import {QueryFactory} from "../../../tableQueries/queryFactory";
import {BranchService} from "../../../services/branch/branch.service";
import {AuthService} from "../../../services/auth/auth.service";

@Component({
  selector: 'app-plants',
  templateUrl: './plants.component.html',
  styleUrls: ['./plants.component.scss']
})
export class PlantsComponent implements OnInit, AfterViewInit, OnDestroy {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  private onDestroy = new Subject<void>();
  // --------------------- //
  // Component constructor //
  // --------------------- //
  constructor(
      private apiService: ApiService,
      private authService: AuthService,
      public router: Router,
      public queryFactory: QueryFactory,
      public dialog: MatDialog,
      private branchService: BranchService
  ) { }
  // -------------------------------------- //
  // Form inputs & validations declaration  //
  // -------------------------------------- //
  // ------------------ //
  // On view init cycle //
  // ------------------ //
  ngOnInit() {
  }
  // --------------------- //
  // After view init cycle //
  // --------------------- //
  ngAfterViewInit() {
  }
  // -------------------- //
  // On destroy lifecycle //
  // -------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
