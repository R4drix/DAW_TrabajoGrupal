import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { ApiService } from '../../../services/api.service';
import { Consumo, Dashboard } from '../../../services/models';

interface PlatoTop {
  plato: string;
  cantidad: number;
  subtotal: number;
  pct: number;
}

@Component({
  selector: 'app-admin-comidas',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './admin-comidas.html',
  styleUrl: './admin-comidas.css',
})
export class AdminComidas implements OnInit {
  private readonly api = inject(ApiService);

  loading = signal<boolean>(true);
  errorMsg = signal<string>('');

  dashboard = signal<Dashboard | null>(null);
  consumos = signal<Consumo[]>([]);

  ingresosHoy = computed(() => this.dashboard()?.ingresos_restaurante_hoy ?? 0);
  pedidosHoy = computed(() => this.dashboard()?.consumos_hoy ?? this.consumos().length);
  ticketPromedio = computed(() => {
    const pedidos = this.pedidosHoy();
    return pedidos > 0 ? this.ingresosHoy() / pedidos : 0;
  });
  platosVendidos = computed(() =>
    this.consumos().reduce((acc, c) => acc + (c.cantidad || 0), 0)
  );

  platosTop = computed<PlatoTop[]>(() => {
    const map = new Map<string, { cantidad: number; subtotal: number }>();
    this.consumos().forEach((c) => {
      const prev = map.get(c.plato) ?? { cantidad: 0, subtotal: 0 };
      map.set(c.plato, {
        cantidad: prev.cantidad + (c.cantidad || 0),
        subtotal: prev.subtotal + (c.subtotal || 0),
      });
    });
    const rows = Array.from(map.entries()).map(([plato, v]) => ({ plato, ...v }));
    const max = Math.max(...rows.map((r) => r.cantidad), 1);
    return rows
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5)
      .map((r) => ({ ...r, pct: (r.cantidad / max) * 100 }));
  });

  pedidosRecientes = computed(() =>
    [...this.consumos()]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 8)
  );

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    this.errorMsg.set('');

    let pending = 2;
    let failed = false;
    const done = (err = false) => {
      if (err) failed = true;
      pending--;
      if (pending === 0) {
        if (failed && !this.dashboard()) {
          this.errorMsg.set('No se pudo cargar la información del restaurante.');
        }
        this.loading.set(false);
      }
    };

    this.api.getDashboard().subscribe({
      next: (resp) => { this.dashboard.set(resp); done(); },
      error: () => done(true),
    });

    this.api.getConsumos().subscribe({
      next: (resp) => { this.consumos.set(resp.consumos || []); done(); },
      error: () => done(true),
    });
  }
}
