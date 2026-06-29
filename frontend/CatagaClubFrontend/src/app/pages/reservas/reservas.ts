import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';

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
  loading = true;
  errorMsg = '';

  ngOnInit(): void {
    this.api.getReservas().subscribe({
      next: (resp) => {
        this.reservas = resp.reservas ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = `No se pudo cargar las reservas (${err.status ?? 'sin status'}).`;
        this.loading = false;
      },
    });
  }

  badgeClass(estado: string): string {
    if (estado === 'activa') return 'bg-success';
    if (estado === 'finalizada') return 'bg-secondary';
    return 'bg-danger';
  }
}