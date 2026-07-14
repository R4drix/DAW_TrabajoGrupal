import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Consumo, Dashboard, Habitacion, Reserva } from './models';

/**
 * Servicio único de acceso a la API del backend Django.
 * Centraliza la URL base y los endpoints para que cualquier componente
 * pueda consumirlos sin repetir configuración.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  // En desarrollo: Django corre en :8000 y Angular en :4200
  private readonly baseUrl = 'http://localhost:8000/club/api';
  private apiUrl = 'http://localhost:8000/club/api';

  getEstadoHabitaciones(): Observable<{ ok: boolean; count: number; habitaciones: Habitacion[] }> {
    return this.http.get<{ ok: boolean; count: number; habitaciones: Habitacion[] }>(`${this.baseUrl}/estado/`);
  }

  getReservas(): Observable<{ ok: boolean; count: number; reservas: Reserva[] }> {
    return this.http.get<{ ok: boolean; count: number; reservas: Reserva[] }>(`${this.baseUrl}/reservas/`);
  }

  getConsumos(): Observable<{ ok: boolean; count: number; consumos: Consumo[] }> {
    return this.http.get<{ ok: boolean; count: number; consumos: Consumo[] }>(`${this.baseUrl}/consumos/`);
  }

  getDashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${this.baseUrl}/dashboard/`);
  }

  getHabitacionesDisponibles(params: { personas: number; llegada: string; salida: string }): Observable<Habitacion[]> {
    return this.http.get<Habitacion[]>(`${this.apiUrl}/habitaciones/disponibles/`, { params });
  }

  crearReserva(reservaData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reservas/`, reservaData);
  }

}
