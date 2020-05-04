import {Injectable, OnDestroy} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LoadingService implements OnDestroy {
  // ----------------------------- //
  // GLOBAL VARIABLES DECLARATION  //
  // ------------------------------ //
  private onDestroy = new Subject<void>();
  public showLoader: BehaviorSubject<boolean> = new BehaviorSubject(false);
  constructor() { }
  // ----------------------------------------------------------------- //
  // MAKE 'showLoader' AS OBSERVABLE (LISTEN CHANGES FROM OTHER FILES) //
  // ----------------------------------------------------------------- //
  public onLoaderChange(): Observable<boolean> {
    return this.showLoader.asObservable();
  }
  // --------------------- //
  // ON DESTROY LIFE CYCLE //
  // --------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
