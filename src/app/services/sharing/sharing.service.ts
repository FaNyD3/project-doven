import {AfterViewInit, Injectable, OnInit} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})

export class SharingService {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  private onDestroy = new Subject<void>();

  public serviceData: BehaviorSubject<any> = new BehaviorSubject(false);

  public serviceDataObservable: Observable<any> = this.serviceData.asObservable();

  public newClientSearch: BehaviorSubject<any>;
  public currentClient: BehaviorSubject<number> = new BehaviorSubject(0);
  public groupData: any = null;
  public plantData: any = null;
  public clientsScroll: number = 0;
  constructor() {
    // console.log('setting clientSearch');
    this.newClientSearch = new BehaviorSubject(JSON.parse(localStorage.getItem('clientSearch')));
    this.currentClient = new BehaviorSubject(JSON.parse(localStorage.getItem('currentClient')) !== null ? JSON.parse(localStorage.getItem('currentClient')).value : 0);
    // console.log('init sharing observable');
    this.newClientSearch.asObservable().pipe(takeUntil(this.onDestroy)).subscribe((clientSearch) => {
      // console.log('clientSearch changed', clientSearch);
      if (clientSearch) {
        localStorage.setItem('clientSearch', JSON.stringify(clientSearch));
      } else {
        if (localStorage.getItem('clientSearch')) {
          localStorage.removeItem('clientSearch');
        }
      }
    });
    this.currentClient.asObservable().pipe(takeUntil(this.onDestroy)).subscribe((currentClient) => {
      // console.log('clientSearch changed', currentClient);
      if (currentClient) {
        localStorage.setItem('currentClient', JSON.stringify({value: currentClient}));
      } else {
        if (localStorage.getItem('currentClient')) {
          localStorage.removeItem('currentClient');
        }
      }
    });
  }
  // --------------------- //
  // ON DESTROY LIFE CYCLE //
  // --------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
