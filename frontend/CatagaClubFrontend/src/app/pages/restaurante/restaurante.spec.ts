import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Restaurante } from './restaurante';

describe('Restaurante', () => {
  let component: Restaurante;
  let fixture: ComponentFixture<Restaurante>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Restaurante],
    }).compileComponents();

    fixture = TestBed.createComponent(Restaurante);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
