import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { ApiService } from '../../services/api.service';
import { Reserva } from '../../services/models';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservas.html',
  styleUrls: ['./reservas.css'],
})
export class Reservas implements OnInit {
  private readonly api = inject(ApiService);

  reservas: Reserva[] = [];
  loading = signal<Boolean>(true);
  errorMsg = '';

  ngOnInit(): void {
    this.api.getReservas().subscribe({
      next: (resp) => {
        this.reservas = resp.reservas ?? [];
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg = `No se pudo cargar las reservas (${err.status ?? 'sin status'}).`;
        this.loading.set(false);
      },
    });
  }

  badgeClass(estado: string): string {
    if (estado === 'activa') return 'bg-success';
    if (estado === 'finalizada') return 'bg-secondary';
    return 'bg-danger';
  }
}