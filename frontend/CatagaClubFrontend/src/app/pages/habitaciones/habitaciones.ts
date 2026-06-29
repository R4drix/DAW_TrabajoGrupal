import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';

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
  habitacionSeleccionada: Habitacion | null = null;
  loading = true;
  errorMsg = '';

  ngOnInit(): void {
    this.api.getEstadoHabitaciones().subscribe({
      next: (resp) => {
        this.habitaciones = resp.habitaciones ?? [];
        this.habitacionSeleccionada = this.habitaciones[0] ?? null;
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = `No se pudo conectar con el backend (${err.status ?? 'sin status'}). Verifica que Django esté corriendo en :8765.`;
        this.loading = false;
      },
    });
  }

  seleccionarHabitacion(h: Habitacion): void {
    this.habitacionSeleccionada = h;
  }
}