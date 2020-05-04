import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientDealsComponent } from './client-deals.component';

describe('ClientDealsComponent', () => {
  let component: ClientDealsComponent;
  let fixture: ComponentFixture<ClientDealsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClientDealsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientDealsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
