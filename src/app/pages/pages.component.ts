import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {AuthService} from "../services/auth/auth.service";
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";
import {FormBuilder} from "@angular/forms";
import {ActivatedRoute} from "@angular/router";
import {LoadingService} from "../services/loading/loading.service";
import {ApiService} from "../services/api/api.service";
import {MatDialog} from "@angular/material";
import {BranchService} from "../services/branch/branch.service";
import {CrudClientComponent} from './clients/clients-table/crud-client/crud-client.component';
import {NoteComponent} from "../modals/note/note.component";
import {ReminderComponent} from "./reminders/reminder/reminder.component";

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss'],
  viewProviders: [
    BranchService
  ]
})
export class PagesComponent implements OnInit, OnDestroy, AfterViewInit {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  @ViewChild('orangeLine', {static: false}) orangeLine;
  @ViewChild('lineManager', {static: false}) lineManager;
  private onDestroy = new Subject<void>();
  public currentMenuIndex = 0;
  public branches: any[] = [];
  public currentBranch: any;
  public currentUser: any = false;
  public usersAccess = false;
  public configAccess = false;
  public logisticsAccess = false;
  public isBigSize = window.innerWidth > 1039;
  private lineHandler;
  // --------------------- //
  // Component constructor //
  // --------------------- //
  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private branchService: BranchService,
    private loadingService: LoadingService,
    private apiService: ApiService,
    public dialog: MatDialog,
  ) {

    this.authService.userObservable.pipe(takeUntil(this.onDestroy)).subscribe((data) => {
      this.currentUser = data ? data : false;
    });

    this.currentBranch = this.branches[0];
  }
  // --------------------- //
  // FormGroup declaration //
  // --------------------- //
  public menuForm = this.fb.group({
    // branch: new FormControl({value: '', disabled: false})
  });
  // --------------------- //
  // OnInit view init cycle //
  // --------------------- //
  ngOnInit() {
    // console.log('starting pagesComponent');
    /*if (this.authService.currentUserValue) {
      const userRole = this.authService.currentUserValue.user.role;
      this.usersAccess = userRole === 'generalAdmin' || userRole === 'branchAdmin';
      this.configAccess = userRole === 'generalAdmin';
      this.logisticsAccess = userRole === 'generalAdmin' || userRole === 'logistics';
      // console.log(this.authService.currentUserValue.user.role);
      // console.log(this.usersAccess);
    }*/
    this.authService.userObservable.pipe(takeUntil(this.onDestroy)).subscribe((user) => {
      if (user) {
        /*
        this.usersAccess = user.user.role === 'generalAdmin' || user.user.role === 'branchAdmin';
        this.configAccess = user.user.role === 'generalAdmin';
        this.logisticsAccess =  user.user.role === 'generalAdmin' ||  user.user.role === 'logistics';
        */
        // console.log(this.authService.currentUserValue.user.role);
        // console.log(this.usersAccess);
      }
    });
    /*if (this.branchService.branchesLoaded.getValue()) {
      // console.log('branch service has previous value');
      this.getBranchValues();
    }*/
    /*
    this.branchService.branchesLoaded.pipe(takeUntil(this.onDestroy)).subscribe((state) => {
      if (state) {
        // console.log('branch service has loaded after start');
        this.getBranchValues();
      }
    });
    */
    this.branchService.branchesLoaded.pipe(takeUntil(this.onDestroy)).subscribe((state) => {
      if (state) {
        // console.log('branch service has loaded after start');
        this.getBranchValues();
      }
    });
  }

  getBranchValues() {
    if (this.branchService.branchOptions.length > 0) {
      this.branches = this.branchService.branchOptions;
      this.currentBranch = this.branchService.currentBranch.getValue();
      // console.log( 'current branch', this.currentBranch );
    } else {
      this.branches = [];
    }
  }
  // --------------------- //
  // After view init cycle //
  // --------------------- //
  ngAfterViewInit(): void {
    this.isBigSize = window.innerWidth > 1039;
    this.setOrangeLine();
    window.addEventListener('resize', () => {
      this.isBigSize = window.innerWidth > 1039;
      clearTimeout(this.lineHandler);
      this.lineHandler = setTimeout(() => {
        this.moveOrangeLine(this.currentMenuIndex);
      }, 250);
    });
  }
  // ------------------------- //
  // Move orange line function //
  // ------------------------- //
  moveOrangeLine(index: number) {
    // console.log( index ); // comente
    if (this.isBigSize) {
      const iconWidth = window.innerWidth > 1350 ? 70 : 45;
      const pagesWrapperWidth = document.getElementById('pagesMenuWrapper').offsetWidth;
      const branchWidth = 55;
      const actualWidth = 120;
      if (index === 3 || index === 10) {
        this.setActiveManual(index);
      } else {
        this.removeActiveManual([3, 10]);
      }

      if (index > 3 && index < 10) {
        this.orangeLine.nativeElement.style.marginLeft = (pagesWrapperWidth + (iconWidth * (index - 4))) + 'px';
        this.orangeLine.nativeElement.classList.add('orangeLineMini');
      } else if (index === 10) {
        this.orangeLine.nativeElement.style.marginLeft = (pagesWrapperWidth + (iconWidth * 6)) + 'px';
        this.orangeLine.nativeElement.classList.remove('orangeLineMini');
      } else {
        this.orangeLine.nativeElement.style.marginLeft = actualWidth * index + 'px';
        this.orangeLine.nativeElement.classList.remove('orangeLineMini');
      }
      this.orangeLine.nativeElement.classList.add('moveLine');
      setTimeout(() => {
        this.orangeLine.nativeElement.classList.remove('moveLine');
      }, 300);

    }
  }
  // --------------------------------------- //
  // Set active when have child menu options //
  // --------------------------------------- //
  setActiveManual(index: number) {
    if (!document.getElementById('menuDiv' + index).classList.contains('active')) {
      document.getElementById('menuDiv' + index).classList.add('active');
    }
    const removeIndex = index === 3 ? 10 : 3;
    this.removeActiveManual([removeIndex]);
  }
  // ------------------------------------------ //
  // Remove active when have child menu options //
  // ------------------------------------------ //
  removeActiveManual(indexes: number[]) {
    for (const index of indexes) {
      if (document.getElementById('menuDiv' + index).classList.contains('active')) {
        document.getElementById('menuDiv' + index).classList.remove('active');
      }
    }
  }
  // -------------------------------- //
  // Set orange line depending of url //
  // -------------------------------- //
  setOrangeLine() {
    const currentIndex = this.route.snapshot.firstChild.data.orangeLine;
    this.moveOrangeLine(currentIndex);
    this.currentMenuIndex = currentIndex;
  }

  // ----------------------- //
  // Open cruds modals function //
  // ----------------------- //

  addNew(type: string) {

    let modalRef;
    let data;
    switch (type) {
      case 'note':
        modalRef = NoteComponent;
        data = {
          note: {},
          title: 'Nueva Nota',
          isNew: true,
          prevNote: {},
          branch: this.branchService.currentBranch.getValue()
        };
        break;
      case 'client':
        modalRef = CrudClientComponent;
        data = {
          client: {},
          title: 'Nuevo Pilot',
          branch: this.branchService.currentBranch.getValue(),
          isNew: true
        };
        break;
      case 'reminder':
        modalRef = ReminderComponent;
        data = {
          reminder: {},
          title: 'Nuevo Recordatorio',
          isNew: true
        };
        break;
        /*
      case 'lead':
        modalRef = ClientProductsModalComponent;
        data = {
          prevProduct: {},
          client: {},
          title: 'New lead',
          isNew: true
        };
        break;
      case 'deal':
        modalRef = DealComponent;
        data = {
          client: {},
          title: 'New deal',
          branch: this.branchService.currentBranch.getValue(),
          isNew: true
        };
        break;
        */
    }

    const dialogRef = this.dialog.open(modalRef, {
      data: data,
      autoFocus: false,
      width: '1000px'
    });
    dialogRef.afterClosed().pipe(takeUntil(this.onDestroy)).subscribe((result) => {
      if (result !== undefined) {
        if (result.changes) {
          // --
        }
      }
    });
  }

  // --------------------- //
  // Change current branch //
  // --------------------- //
  changeBranch(selectedBranch) {
    this.currentBranch = selectedBranch;
    this.branchService.currentBranch.next(selectedBranch);
  }
  // --------------------- //
  // Logout click function //
  // --------------------- //
  logout() {
    this.branchService.branchOptions = [];
    this.branchService.branchesLoaded.next(false);
    this.branchService.firstLoad = false;
    this.authService.logout(true);
  }
  validateUserName() {
    const userFragments = this.currentUser.user.name.split(' ');
    return userFragments[0];
  }
  // -------------------- //
  // On destroy lifecycle //
  // -------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }

}
