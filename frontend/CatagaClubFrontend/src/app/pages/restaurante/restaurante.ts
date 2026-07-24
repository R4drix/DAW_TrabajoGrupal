import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface Plato {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string; // Django DecimalField suele llegar como string para evitar pérdida de precisión en JS
  imagen_url: string;
  categoria: string;
  disponible: boolean;
}

@Component({
  selector: 'app-restaurante',
  standalone: true,
  imports: [CommonModule], // Reemplazamos ReactiveFormsModule por CommonModule
  templateUrl: './restaurante.html',
  styleUrl: './restaurante.css',
})
export class Restaurante implements OnInit {
  private readonly http = inject(HttpClient);

  // Guardamos los platos en señales (signals) de Angular
  public platos = signal<Plato[]>([]);
  public cargando = signal(true);
  public error = signal<string | null>(null);

  // Guardamos la categoría que el usuario selecciona para filtrar
  public categoriaSeleccionada = signal<string>('todos');

  ngOnInit(): void {
    this.obtenerPlatos();
  }


/** Llama al backend de Django para traer todos los platos */
  public obtenerPlatos(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.http.get<Plato[]>(`${environment.apiBaseUrl}/platos/`).subscribe({
      next: (data) => {
        // Filtrar únicamente los platos marcados como disponibles
        const platosDisponibles = data.filter(plato => plato.disponible);
        this.platos.set(platosDisponibles);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener platos:', err);
        this.error.set('No pudimos cargar la carta en este momento. Inténtalo más tarde.');
        this.cargando.set(false);
      },
    });
  }

  /** Filtra los platos según la pestaña o botón de categoría seleccionado */
  public get platosFiltrados(): Plato[] {
    const categoria = this.categoriaSeleccionada();
    if (categoria === 'todos') {
      return this.platos();
    }
    return this.platos().filter(p => p.categoria === categoria);
  }

  /** Cambia el filtro actual */
  public filtrarPorCategoria(categoria: string): void {
    this.categoriaSeleccionada.set(categoria);
  }
}