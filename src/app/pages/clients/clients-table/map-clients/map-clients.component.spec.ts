import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapClientsComponent } from './map-clients.component';

describe('MapClientsComponent', () => {
  let component: MapClientsComponent;
  let fixture: ComponentFixture<MapClientsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapClientsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapClientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
