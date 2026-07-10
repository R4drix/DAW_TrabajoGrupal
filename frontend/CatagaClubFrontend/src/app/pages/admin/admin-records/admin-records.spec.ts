import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRecords } from './admin-records';

describe('AdminRecords', () => {
  let component: AdminRecords;
  let fixture: ComponentFixture<AdminRecords>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRecords],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRecords);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
