import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

interface PasoWizard {
  label: string;
}

@Component({
  selector: 'app-reservar-wizard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservar.html',
  styleUrls: ['./reservar.css'],
})
export class ReservarWizard {
  readonly pasos: PasoWizard[] = [
    { label: 'Personas' },
    { label: 'Fecha' },
    { label: 'Habitación' },
    { label: 'Tus datos' },
  ];

  pasoActual = signal(0);
  personas = signal<number | null>(null);
  mostrarInputPersonas = signal(false);

  elegirPersonas(n: number): void {
    this.mostrarInputPersonas.set(false);
    this.personas.set(n);
  }

  activarInputPersonas(): void {
    this.mostrarInputPersonas.set(true);
  }

  actualizarPersonasCustom(event: Event): void {
    const valor = Number((event.target as HTMLInputElement).value);
    this.personas.set(valor > 0 ? valor : null);
  }

  /** Condición de completitud por paso. Se va llenando a medida que construimos cada paso. */
  pasoCompleto(): boolean {
    switch (this.pasoActual()) {
      case 0:
        return this.personas() !== null && this.personas()! > 0;
      default:
        return true; // TODO: reemplazar cuando Fecha/Habitación/Tus datos tengan campos reales
    }
  }

  irSiguiente(): void {
    if (!this.pasoCompleto()) return;
    if (this.pasoActual() < this.pasos.length - 1) {
      this.pasoActual.update((p) => p + 1);
    }
  }

  irAtras(): void {
    if (this.pasoActual() > 0) {
      this.pasoActual.update((p) => p - 1);
    }
  }
}
