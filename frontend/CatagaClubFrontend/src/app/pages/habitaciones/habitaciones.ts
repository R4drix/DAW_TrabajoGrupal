import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
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

  // Placeholders con URLs absolutas para evitar errores 404 en subrutas de Angular
 // Placeholders específicos para cada vista por si falla la carga física

public placeholders = {
  principal: 'https://placehold.co/600x400/1e1e1e/ffffff?text=principal',
  cama: 'https://placehold.co/600x400/1e1e1e/ffffff?text=cama',
  bano: 'https://placehold.co/600x400/1e1e1e/ffffff?text=bano',
  extra: 'https://placehold.co/600x400/1e1e1e/ffffff?text=extra'
}; 

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
        this.errorMsg = `No se pudo conectar con el backend (${err.status ?? 'sin status'}). Verifica que Django esté corriendo en :8000.`;
        this.loading.set(false);
      },
    });
  }

  /** Todas las habitaciones para la vitrina superior */
  public get destacadas(): Habitacion[] {
    return this.habitaciones;
  }

  /**
   * Resuelve la imagen principal de la habitación.
   * Si no está definida en la BD de Supabase, cae en el placeholder elegante.
   */
  public imagenDe(h: Habitacion): string {
    return h.imagen_principal || this.placeholders.principal;
  }

  /**
   * Captura errores de imágenes caídas y asigna el placeholder temático adecuado.
   * Al usar URLs absolutas desde 'this.placeholders', la consola no volverá a tirar 404.
   */
  public onImgError(event: Event, tipo: 'principal' | 'cama' | 'bano' | 'extra' = 'principal'): void {
    const img = event.target as HTMLImageElement;
    img.src = this.placeholders[tipo] || this.placeholders.principal;
  }

  public select(h: Habitacion): void {
    this.habitacionSeleccionada.set(h);
  }

  public deselect(): void {
    this.habitacionSeleccionada.set(null);
  }
}