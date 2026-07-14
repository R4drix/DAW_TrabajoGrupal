import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export interface Mesa {
  numero: number;
  capacidad: number;
  ubicacion?: string;
}

@Component({
  selector: 'app-restaurante',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './restaurante.html',
  styleUrl: './restaurante.css',
})
export class Restaurante {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  /** Resultado de la última búsqueda: null = aún no se ha buscado */
  public mesas = signal<Mesa[] | null>(null);
  public cargando = signal(false);
  public error = signal<string | null>(null);

  public reservaForm = this.fb.group({
    fecha: ['', Validators.required],
    hora: ['', Validators.required],
    personas: [2, [Validators.required, Validators.min(1), Validators.max(20)]],
  });

  /** Consulta al backend las mesas disponibles para la fecha, hora y número de personas indicados */
  public buscarMesas(): void {
    if (this.reservaForm.invalid) {
      this.reservaForm.markAllAsTouched();
      return;
    }

    const { fecha, hora, personas } = this.reservaForm.getRawValue();

    this.cargando.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('fecha', fecha ?? '')
      .set('hora', hora ?? '')
      .set('personas', personas ?? 0);

    this.http.get<Mesa[]>('/api/mesas/disponibles', { params }).subscribe({
      next: (mesasDisponibles) => {
        this.mesas.set(mesasDisponibles);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos consultar la disponibilidad. Inténtalo nuevamente.');
        this.cargando.set(false);
      },
    });
  }

  /** Punto de entrada para continuar con la reserva de una mesa concreta */
  public seleccionarMesa(mesa: Mesa): void {
    console.log('Mesa seleccionada para reservar:', mesa);
    // Aquí se puede abrir un modal o navegar al paso de confirmación de datos del comensal
  }
}