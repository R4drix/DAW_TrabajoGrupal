import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AdminService } from '../../../services/admin-service';
import { ApiService } from '../../../services/api.service';

// --- INTERFACES LOCALES ---
export interface ReservaAdmin {
  id: number;
  codigo?: string;
  cliente_nombre: string;
  cliente_correo: string;
  cliente_telefono: string;
  habitacion_numero: string | number;
  habitacion_tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  num_personas: number;
  total: string | number;
  estado: 'pendiente' | 'en_uso' | 'finalizado' | 'cancelada';
  notas?: string;
}

export interface RegistroSauna {
  id?: number;
  nombre_pagador: string;
  dni_pagador: string;
  cant_adultos: number;
  cant_ninos: number;
  total_personas?: number;
  total_pagado?: string;
  fecha_ingreso?: string;
  notas?: string;
}

export interface ActividadReciente {
  tipo: 'Habitación' | 'Reserva' | 'Sauna';
  titulo: string;
  subtitulo: string;
  monto: number;
  fecha: string;
  estadoBadge: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-home.html',
  styleUrls: ['./admin-home.css']
})
export class AdminHome implements OnInit {
  private apiAdmin = inject(AdminService);
  private apiReservas = inject(ApiService);
  private http = inject(HttpClient);

  private saunaUrl = 'http://localhost:8000/club/api/sauna/';

  // Estados reactivos
  public habitaciones = signal<any[]>([]);
  public reservas = signal<ReservaAdmin[]>([]);
  public registrosSauna = signal<RegistroSauna[]>([]);
  public cargando = signal<boolean>(true);

  // MÉTIRCAS CALCULADAS (KPIs)
  
  // 1. Habitaciones Ocupadas (Comprueba 'esta_ocupada' y 'ocupada')
  public habsOcupadas = computed(() => {
    return this.habitaciones().filter(h => h.esta_ocupada === true || h.ocupada === true).length;
  });

  // 2. Total Habitaciones
  public totalHabs = computed(() => this.habitaciones().length);

  // 3. Reservas Activas o Pendientes
  public reservasActivas = computed(() => {
    return this.reservas().filter(r => r.estado === 'en_uso' || r.estado === 'pendiente').length;
  });

  // 4. Personas en Sauna Hoy
  public personasSaunaHoy = computed(() => {
    return this.registrosSauna().reduce((acc, reg) => {
      return acc + (reg.cant_adultos || 0) + (reg.cant_ninos || 0);
    }, 0);
  });

  // 5. Recaudación Sauna
  public totalSaunaMonto = computed(() => {
    return this.registrosSauna().reduce((acc, reg) => {
      return acc + (parseFloat(reg.total_pagado || '0') || 0);
    }, 0);
  });

  // 6. Recaudación Reservas Concluidas o En Uso
  public totalReservasMonto = computed(() => {
    return this.reservas()
      .filter(r => r.estado === 'finalizado' || r.estado === 'en_uso')
      .reduce((acc, r) => acc + (parseFloat(r.total as string) || 0), 0);
  });

  // 7. Ingresos Totales
  public ingresosTotales = computed(() => {
    return this.totalSaunaMonto() + this.totalReservasMonto();
  });

  ngOnInit(): void {
    this.cargarTodo();
  }

  public cargarTodo(): void {
    this.cargando.set(true);

    // Carga de Habitaciones con mapeo flexible
    this.apiAdmin.getHabitaciones().subscribe({
      next: (resp: any) => {
        // Mapea según las posibles respuestas de la API
        const listaHabs = Array.isArray(resp) 
          ? resp 
          : (resp.data || resp.habitaciones || []);
        
        console.log('Habitaciones recibidas de la API:', listaHabs); // Para verificación en F12
        this.habitaciones.set(listaHabs);
      },
      error: (err) => console.error('Error habitaciones:', err)
    });

    // Carga de Reservas
    this.apiReservas.getReservas().subscribe({
      next: (data: any) => this.reservas.set(data || []),
      error: (err) => console.error('Error reservas:', err)
    });

    // Carga de Sauna
    this.http.get<RegistroSauna[]>(this.saunaUrl).subscribe({
      next: (data) => {
        this.registrosSauna.set(data || []);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error sauna:', err);
        this.cargando.set(false);
      }
    });
  }

  // Feed Consolidado de Actividades
  public get actividadReciente(): ActividadReciente[] {
    const lista: ActividadReciente[] = [];

    // Habitaciones ocupadas
    this.habitaciones()
      .filter(h => h.esta_ocupada === true || h.ocupada === true)
      .forEach(h => {
        lista.push({
          tipo: 'Habitación',
          titulo: `Habitación #${h.numero || h.id}`,
          subtitulo: `Huésped: ${h.cliente_nombre || 'Registrado'}`,
          monto: parseFloat(h.precio || 0),
          fecha: h.hora_ingreso || new Date().toISOString(),
          estadoBadge: 'badge-ocupado'
        });
      });

    // Registros de Sauna
    this.registrosSauna().forEach(s => {
      lista.push({
        tipo: 'Sauna',
        titulo: `Ingreso Sauna - ${s.nombre_pagador}`,
        subtitulo: `DNI: ${s.dni_pagador} (${s.cant_adultos} Ad. / ${s.cant_ninos} Niñ.)`,
        monto: parseFloat(s.total_pagado || '0'),
        fecha: s.fecha_ingreso || '',
        estadoBadge: 'badge-pagado'
      });
    });

    // Reservas
    this.reservas().slice(0, 5).forEach(r => {
      lista.push({
        tipo: 'Reserva',
        titulo: `Reserva: ${r.cliente_nombre}`,
        subtitulo: `Hab. ${r.habitacion_numero} (${r.habitacion_tipo})`,
        monto: parseFloat(r.total as string || '0'),
        fecha: r.fecha_inicio,
        estadoBadge: this.getReservaBadge(r.estado)
      });
    });

    return lista.slice(0, 8);
  }

  private getReservaBadge(estado: string): string {
    switch (estado) {
      case 'en_uso': return 'badge-ocupado';
      case 'finalizado': return 'badge-pagado';
      case 'cancelada': return 'badge-cancelado';
      default: return 'badge-pendiente';
    }
  }
}