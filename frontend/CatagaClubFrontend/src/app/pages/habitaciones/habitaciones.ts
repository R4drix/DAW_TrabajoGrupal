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

  // Placeholder de respaldo por si alguna habitación aún no tiene foto subida.
  private readonly imagenPorDefecto = 'habitaciones/placeholder.jpg';

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

  /** Todas las habitaciones, para la galería de la parte superior (vitrina, no reserva). */
  public get destacadas(): Habitacion[] {
    return this.habitaciones;
  }

  /** Foto única por número de habitación (101.jpg, 201.jpg, etc. en public/habitaciones/). */
  public imagenDe(h: Habitacion): string {
    return `habitaciones/${h.numero}.jpg`;
  }

  /** Si la foto de esa habitación no existe todavía, cae al placeholder en vez de romper el layout. */
  public onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.imagenPorDefecto;
  }

  public select(h: Habitacion): void {
    this.habitacionSeleccionada.set(h);
  }
  public deselect(): void {
    this.habitacionSeleccionada.set(null);
  }
}
