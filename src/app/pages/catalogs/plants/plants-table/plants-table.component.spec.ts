import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlantsTableComponent } from './plants-table.component';

describe('PlantsTableComponent', () => {
  let component: PlantsTableComponent;
  let fixture: ComponentFixture<PlantsTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlantsTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlantsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
