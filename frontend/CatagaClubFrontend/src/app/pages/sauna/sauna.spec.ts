import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sauna } from './sauna';

describe('Sauna', () => {
  let component: Sauna;
  let fixture: ComponentFixture<Sauna>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sauna],
    }).compileComponents();

    fixture = TestBed.createComponent(Sauna);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
