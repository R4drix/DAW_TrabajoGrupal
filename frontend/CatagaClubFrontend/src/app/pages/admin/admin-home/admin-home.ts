import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../../services/api.service';
import { Dashboard, Habitacion, Reserva, Consumo, CamaraEstado } from '../../../services/models';
import { MOCK_SAUNAS } from '../../../services/mocks/saunas.mock';

interface QuickViewCard {
  title: string;
  icon: string;
  color: string;
  routerLink: string;
  stats: { label: string; value: string }[];
}

interface KpiCard {
  title: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
  icon: string;
}

interface RecentActivity {
  icon: string;
  title: string;
  description: string;
  time: string;
  color: string;
}

interface Point { x: number; y: number; }
interface MonthlyBar { month: string; booked: number; cancelled: number; bookedPct: number; cancelledPct: number; }
interface RatingRow { label: string; value: number; }

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, DatePipe, TitleCasePipe, RouterLink],
  templateUrl: './admin-home.html',
  styleUrl: './admin-home.css',
})
export class AdminHome implements OnInit {
  private readonly api = inject(ApiService);

  loading = signal<boolean>(true);
  errorMsg = signal<string>('');

  data: Dashboard | null = null;
  habitaciones: Habitacion[] = [];
  reservas: Reserva[] = [];
  consumos: Consumo[] = [];

  // MOCK — ver services/mocks/saunas.mock.ts. Reemplazar por datos reales
  // cuando exista un endpoint de saunas en el backend.
  saunas: CamaraEstado[] = MOCK_SAUNAS;

  kpis: KpiCard[] = [];
  quickViewCards: QuickViewCard[] = [];
  recentActivity: RecentActivity[] = [];
  monthlyBookings: MonthlyBar[] = [];
  ratingRows: RatingRow[] = [
    { label: 'Cleanliness', value: 8.8 },
    { label: 'Facilities', value: 9.1 },
    { label: 'Location', value: 9.0 },
    { label: 'Service', value: 8.7 },
    { label: 'Value', value: 8.9 },
  ];

  ocupacion = { total: 0, porcentaje: 0 };

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);
    this.errorMsg.set('');

    let pending = 4;
    let failed = false;
    const done = (err = false) => {
      if (err) failed = true;
      pending--;
      if (pending === 0) {
        if (failed && !this.data) {
          this.errorMsg.set('No se pudo cargar el dashboard.');
        }
        this.buildKpis();
        this.buildActivity();
        this.buildMonthlyBookings();
        this.buildQuickView();
        this.loading.set(false);
      }
    };

    this.api.getDashboard().subscribe({
      next: (resp) => { this.data = resp; done(); },
      error: () => { done(true); },
    });

    this.api.getEstadoHabitaciones().subscribe({
      next: (resp) => { this.habitaciones = resp.habitaciones || []; done(); },
      error: () => { done(true); },
    });

    this.api.getReservas().subscribe({
      next: (resp) => { this.reservas = resp.reservas || []; done(); },
      error: () => { done(true); },
    });

    this.api.getConsumos().subscribe({
      next: (resp) => { this.consumos = resp.consumos || []; done(); },
      error: () => { done(true); },
    });
  }

  private buildKpis(): void {
    const d = this.data;
    if (!d) return;

    const ingresosTotales = d.ingresos_restaurante_hoy * 30;
    const ocupacionPct = d.habitaciones_total > 0
      ? Math.round((d.habitaciones_ocupadas / d.habitaciones_total) * 100)
      : 0;

    this.kpis = [
      {
        title: 'Total Revenue',
        value: `$${ingresosTotales.toLocaleString('en-US')}`,
        delta: '3.41%',
        trend: 'up',
        icon: 'ti ti-coin',
      },
      {
        title: 'New Bookings',
        value: String(d.reservas_activas),
        delta: '2.28%',
        trend: 'up',
        icon: 'ti ti-calendar-plus',
      },
      {
        title: 'Check In',
        value: String(d.habitaciones_ocupadas),
        delta: '1.56%',
        trend: 'down',
        icon: 'ti ti-login',
      },
      {
        title: 'Check-Out',
        value: String(Math.max(0, d.habitaciones_total - d.habitaciones_ocupadas - 5)),
        delta: '0.97%',
        trend: 'up',
        icon: 'ti ti-logout',
      },
    ];

    this.ocupacion = {
      total: d.habitaciones_total,
      porcentaje: ocupacionPct,
    };
  }

  get habitacionesOcupadas(): number {
    return this.habitaciones.filter((h) => h.esta_ocupada).length;
  }

  get habitacionesDisponibles(): number {
    return this.habitaciones.filter((h) => !h.esta_ocupada).length;
  }

  get saunasOcupadas(): number {
    return this.saunas.filter((s) => s.esta_ocupada).length;
  }

  get saunasLibres(): number {
    return this.saunas.length - this.saunasOcupadas;
  }

  get platoTopHoy(): string {
    if (this.consumos.length === 0) return '—';
    const conteo = new Map<string, number>();
    this.consumos.forEach((c) => {
      conteo.set(c.plato, (conteo.get(c.plato) ?? 0) + (c.cantidad || 0));
    });
    const top = [...conteo.entries()].sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : '—';
  }

  /**
   * Arma las 4 tarjetas de "vista rápida" (Habitaciones, Comidas, Saunas,
   * Clientes) que se muestran arriba del dashboard, cada una con sus
   * métricas clave y un link a la vista completa correspondiente.
   */
  private buildQuickView(): void {
    const d = this.data;

    this.quickViewCards = [
      {
        title: 'Habitaciones',
        icon: 'ti ti-bed',
        color: '#3b82f6',
        routerLink: '/admin/rooms',
        stats: [
          { label: 'Ocupadas', value: String(this.habitacionesOcupadas) },
          { label: 'Disponibles', value: String(this.habitacionesDisponibles) },
          { label: 'Ocupación', value: `${this.ocupacion.porcentaje}%` },
        ],
      },
      {
        title: 'Comidas',
        icon: 'ti ti-tools-kitchen-2',
        color: '#10b981',
        routerLink: '/admin/comidas',
        stats: [
          { label: 'Ingresos hoy', value: `S/ ${(d?.ingresos_restaurante_hoy ?? 0).toFixed(2)}` },
          { label: 'Pedidos hoy', value: String(d?.consumos_hoy ?? this.consumos.length) },
          { label: 'Plato top', value: this.platoTopHoy },
        ],
      },
      {
        title: 'Saunas',
        icon: 'ti ti-flame',
        color: '#f59e0b',
        routerLink: '/admin/sauna',
        stats: [
          { label: 'Ocupadas', value: String(this.saunasOcupadas) },
          { label: 'Libres', value: String(this.saunasLibres) },
          { label: 'Total', value: String(this.saunas.length) },
        ],
      },
      {
        title: 'Clientes',
        icon: 'ti ti-users',
        color: '#8b5cf6',
        routerLink: '/admin/reservas',
        stats: [
          { label: 'Registrados', value: String(d?.clientes ?? 0) },
          { label: 'Reservas activas', value: String(d?.reservas_activas ?? 0) },
        ],
      },
    ];
  }

  private buildActivity(): void {
    const acts: RecentActivity[] = [];

    this.reservas.slice(0, 2).forEach((r) => {
      acts.push({
        icon: 'ti ti-calendar-check',
        title: 'Nueva reserva',
        description: `${r.cliente} — habitación ${r.habitacion}.`,
        time: this.fmtTime(r.checkin),
        color: '#3b82f6',
      });
    });

    this.consumos.slice(0, 2).forEach((c) => {
      acts.push({
        icon: 'ti ti-currency-dollar',
        title: 'Pago recibido',
        description: `Pago de S/ ${c.subtotal.toFixed(2)} por ${c.plato} (${c.cliente}).`,
        time: this.fmtTime(c.fecha),
        color: '#10b981',
      });
    });

    this.recentActivity = acts;
  }

  private buildMonthlyBookings(): void {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const seed = Math.max(1, this.data?.reservas_activas ?? 10);
    this.monthlyBookings = months.map((m, i) => {
      const booked = Math.round(seed * (0.6 + ((i * 13) % 9) / 12));
      const cancelled = Math.round(booked * 0.12);
      const max = seed * 1.3;
      return {
        month: m,
        booked,
        cancelled,
        bookedPct: Math.min(100, (booked / max) * 100),
        cancelledPct: Math.min(100, (cancelled / max) * 100),
      };
    });
  }

  private fmtTime(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
  }

  get guestsByDay(): { day: string; value: number }[] {
    const base = Math.max(10, Math.floor((this.data?.clientes ?? 50) / 7));
    return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, i) => ({
      day,
      value: base + (i % 3) * 12 + i * 5,
    }));
  }

  get maxGuestValue(): number {
    return Math.max(...this.guestsByDay.map((g) => g.value), 1);
  }

  getLinePoints(): string {
    const data = this.guestsByDay;
    const w = 320, h = 160, pad = 8;
    const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
    return data
      .map((g, i) => {
        const x = pad + i * stepX;
        const y = h - pad - (g.value / this.maxGuestValue) * (h - pad * 2);
        return `${x},${y}`;
      })
      .join(' ');
  }

  getDots(): Point[] {
    const data = this.guestsByDay;
    const w = 320, h = 160, pad = 8;
    const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
    return data.map((g, i) => {
      const x = pad + i * stepX;
      const y = h - pad - (g.value / this.maxGuestValue) * (h - pad * 2);
      return { x, y };
    });
  }

  get ultReservas(): Reserva[] {
    return this.reservas.slice(0, 5);
  }

  tipoHabitacion(habitacionId: number): string {
    const h = this.habitaciones.find((x) => x.id === habitacionId || x.numero === habitacionId);
    return h?.tipo ?? '—';
  }

  duracion(checkin: string, checkout: string): string {
    if (!checkin || !checkout) return '—';
    const a = new Date(checkin).getTime();
    const b = new Date(checkout).getTime();
    if (isNaN(a) || isNaN(b)) return '—';
    const days = Math.max(1, Math.round((b - a) / 86400000));
    return `${days} ${days === 1 ? 'Night' : 'Nights'}`;
  }
}
