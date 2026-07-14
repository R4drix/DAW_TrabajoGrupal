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
  private readonly imagenPorDefecto = '/habitaciones/placeholder.jpg';

  // Números de habitación cuya foto ya falló al cargar (para no reintentar en bucle).
  private readonly fotosFallidas = new Set<number>();

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
    if (this.fotosFallidas.has(h.numero)) {
      return this.imagenPorDefecto;
    }
    return `/habitaciones/${h.numero}.jpg`;
  }

  /**
   * Si la foto de esa habitación no existe todavía, marca el número como fallido para que
   * `imagenDe` devuelva el placeholder de forma estable. No tocamos el DOM directamente aquí:
   * si lo hiciéramos, el binding [src]="imagenDe(h)" lo pisaría en el siguiente ciclo de
   * detección de cambios (volviendo a la ruta rota) y quedaría en un parpadeo infinito.
   */
  public onImgError(h: Habitacion): void {
    if (this.fotosFallidas.has(h.numero)) return; // ya está en el placeholder, no seguir reintentando
    this.fotosFallidas.add(h.numero);
  }

  public select(h: Habitacion): void {
    this.habitacionSeleccionada.set(h);
  }
  public deselect(): void {
    this.habitacionSeleccionada.set(null);
  }
}
