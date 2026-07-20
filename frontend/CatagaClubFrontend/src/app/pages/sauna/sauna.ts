import { Component, inject, OnInit, signal } from '@angular/core';

import { Camara } from '../../services/models';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-sauna',
  imports: [],
  templateUrl: './sauna.html',
  styleUrl: './sauna.css',
})
export class Sauna implements OnInit {
  private readonly api = inject(ApiService);

  camaras: Camara[] = [];
  loading = signal(true);
  errorMsg = '';
  camaraSeleccionada = signal<Camara | null>(null);

  ngOnInit(): void {
    this.api.getCamaras().subscribe({
      next: (resp) => {
        this.camaras = resp.camaras ?? [];
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg = `No se pudo conectar con el backend (${err.status ?? 'sin status'}). Verifica que Django esté corriendo en :8000.`;
        this.loading.set(false);
      },
    });
  }

  /** Número de columnas de la grilla: se ajusta a la cantidad de cámaras (máx. 4 por fila) */
  public get columnas(): number {
    return this.camaras.length > 0 ? Math.min(this.camaras.length, 4) : 1;
  }

  public select(camara: Camara) {
    this.camaraSeleccionada.set(camara);
  }
  public deselect() {
    this.camaraSeleccionada.set(null);
  }
}
