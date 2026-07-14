import { CommonModule } from '@angular/common';
import { Component, OnInit, Signal, inject, signal } from '@angular/core';

import { ApiService } from '../../services/api.service';
import { Habitacion } from '../../services/models';

@Component({
  selector: 'app-habitaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './habitaciones.html',
  styleUrls: ['./habitaciones.css'],
})
export class Habitaciones implements OnInit {
  private readonly api = inject(ApiService);

  habitaciones: Habitacion[] = [];
  loading = signal(true);
  errorMsg = '';
  habitacionSeleccionada = signal<Habitacion | null>(null);

  ngOnInit(): void {
    this.api.getEstadoHabitaciones().subscribe({
      next: (resp) => {
        this.habitaciones = resp.habitaciones ?? [];
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg = `No se pudo conectar con el backend (${err.status ?? 'sin status'}). Verifica que Django esté corriendo en :8765.`;
        this.loading.set(false);
      },
    });
  }
  public select(h: Habitacion): void {
    this.habitacionSeleccionada.set(h);
  }
  public deselect(): void {
    this.habitacionSeleccionada.set(null);
  }
}
