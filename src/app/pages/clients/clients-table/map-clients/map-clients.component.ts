import {AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl} from "@angular/forms";
import {ApiService} from "../../../../services/api/api.service";
import {ActivatedRoute, Router} from "@angular/router";
// import {QueryFactory} from "../../../../tableQueries/queryFactory";
import {MatBottomSheet, MatDialog, MatDialogRef, MatMenu, MatMenuTrigger} from "@angular/material";
import {takeUntil} from "rxjs/operators";
import {Subject} from "rxjs";
// import {BranchService} from "../../../../services/branch/branch.service";

import * as MarkerClusterer from "@google/markerclustererplus";
// import {ProductsListComponent} from "../../../../modals/products-list/products-list.component";
// import {SharingService} from "../../../../services/sharing/sharing.service";
declare const google: any;

@Component({
  selector: 'app-map-clients',
  templateUrl: './map-clients.component.html',
  styleUrls: ['./map-clients.component.scss']
})
export class MapClientsComponent implements OnInit, AfterViewInit, OnDestroy {
  // --------------------------- //
  // Local variables declaration //
  // --------------------------- //
  private onDestroy = new Subject<void>();
  public selectedClient: any = {};
  public markerCluster;
  map: any;
  circle = null;
  markers: any[] = [];
  currentClusterMarkers: any[] = [];
  prevPlace: any = {};
  public andObject: any[] = [];
  public circleObject: any[] = [];
  public searchParameters: any = {};
  // @ViewChild('menuTrigger') menuTrigger: MatMenuTrigger;
  // @ViewChild('extendedData') extendedData: ElementRef;
  constructor(
      private dialogRef: MatDialogRef<MapClientsComponent>,
      private apiService: ApiService,
      public router: Router,
      public route: ActivatedRoute,
      // public queryFactory: QueryFactory,
      public dialog: MatDialog,
      private bottomSheet: MatBottomSheet,
      // private branchService: BranchService,
      private zone: NgZone,
      // private sharingService: SharingService
  ) {}
  // -------------------------------------- //
  // Form inputs & validations declaration  //
  // -------------------------------------- //
  public search = new FormControl({value: '', disabled: false});
  public radius = new FormControl({value: 100, disabled: false});
  ngOnInit() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 20.6518948, lng: -103.407928},
      zoom: 1,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      gestureHandling: 'cooperative'
    });
  }

  ngAfterViewInit(): void {
    /* if has filters */
    /*
    const prevSearch = this.sharingService.newClientSearch.getValue();
    if (prevSearch) {
      this.setSearchParameters(prevSearch);
    }
    */
  }

  setSearchParameters(data: any) {
    this.searchParameters = data;
    this.andObject = [];
    if (data.search) {
      this.andObject.push(data.search);
    }
    if (data.branchId) {
      this.andObject.push(data.branchId);
    }
    if (data.categories) {
      this.andObject.push(data.categories);
    }
    if (data.tags) {
      this.andObject.push(data.tags);
    }
    if (data.buyers) {
      this.andObject.push(data.buyers);
    }
    if (data.products) {
      this.andObject.push({productsNames: data.products.productsNames});
    }
    if (data.groups) {
      this.andObject.push({groupIds: data.groups.groupIds});
    }
    if (data.rates) {
      this.andObject.push(data.rates);
    }
    if (data.searchAddress) {
      this.andObject.push(data.searchAddress);
    }
    if (data.place) {
      this.prevPlace = data.place;
      this.radius.patchValue(this.prevPlace.radius);
      this.setPreviousCircle();
    }

  }

  setPreviousCircle() {
    this.search.patchValue(this.prevPlace.formattedAddress);
    this.circle = new google.maps.Circle({
      strokeColor: '#f76b1c',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#f76b1c',
      fillOpacity: 0.45,
      map: this.map,
      center: { lat: this.prevPlace.location.lat, lng: this.prevPlace.location.lng },
      radius: this.prevPlace.radius * 1000
    });
    //this.circle.setCursor('default');
    this.circle.setMap(this.map);
    this.map.fitBounds(this.circle.getBounds());
    // this.loadClients();
  }

  setPoint(addressEvent) {
    if (this.circle !== null) {
      this.circle.setMap(null);
    }
    this.circle = new google.maps.Circle({
      strokeColor: '#f76b1c',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#f76b1c',
      fillOpacity: 0.45,
      map: this.map,
      center: { lat: addressEvent.lat, lng: addressEvent.lng },
      radius: this.radius.value * 1000
    });
    //this.circle.setCursor('default');
    this.circle.setMap(this.map);
    this.map.fitBounds(this.circle.getBounds());
    //Cthis.loadClients();
  }
  showMarkers() {
    for (const marker of this.markers) {
      marker.setMap(this.map);
    }
  }
  removeMarkers() {
    for (const marker of this.markers) {
      marker.setMap(null);
    }
    this.markers = [];
    if (this.markerCluster) {
      this.markerCluster.clearMarkers();
      this.markerCluster.setMap(null);
      this.markerCluster = null;
    }
  }
  setDistance() {
    const radius = this.radius.value * 1000;
    this.circle.setRadius(radius);
    this.map.fitBounds(this.circle.getBounds());
    //Cthis.loadClients();
  }


  openProductsModal(years: any, client: string) {
    /*
    this.dialog.open(ProductsListComponent, {
      data: {
        client: client,
        years: years
      },
      autoFocus: false,
      width: '600px'
    });
    */
  }
  // -------------------//
  // Close modal method //
  // -------------------//
  onNoClick(): void {
    this.dialogRef.close();
  }
  // -------------------- //
  // On destroy lifecycle //
  // -------------------- //
  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.unsubscribe();
  }
}
