import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reserve } from './reserve';

describe('Reserve', () => {
  let component: Reserve;
  let fixture: ComponentFixture<Reserve>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reserve],
    }).compileComponents();

    fixture = TestBed.createComponent(Reserve);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
