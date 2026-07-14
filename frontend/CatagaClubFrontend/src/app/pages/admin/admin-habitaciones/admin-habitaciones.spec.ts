import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminHabitaciones } from './admin-habitaciones';

describe('AdminHabitaciones', () => {
  let component: AdminHabitaciones;
  let fixture: ComponentFixture<AdminHabitaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminHabitaciones],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminHabitaciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
