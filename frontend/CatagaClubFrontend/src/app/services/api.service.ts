import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { from, Observable } from 'rxjs'; // Necesario para transformar las promesas de Supabase a Observables

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = 'https://ugiwznnjhbxihazmdmlw.supabase.co';
    const supabaseKey = 'sb_publishable_reQKQudn5ASJgH6LHb1t_Q_LD1RVoX8';
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Método de Autenticación Personalizada que usa el Login
  async loginAdministrador(usuario: string, contrasena: string) {
    const { data, error } = await this.supabase
      .from('usuarios_admin')
      .select('*')
      .eq('usuario', usuario)
      .eq('contrasena', contrasena)
      .single();

    if (error) throw new Error('Usuario o contraseña incorrectos.');
    return data;
  }


  getDashboard(): Observable<any> {
    return from(
      this.supabase.from('reservas').select('*').order('created_at', { ascending: false })
    );
  }

  getEstadoHabitaciones(): Observable<any> {
    return from(
      this.supabase.from('habitaciones').select('*')
    );
  }

  getReservas(): Observable<any> {
    // Retorna las reservas generales
    return from(
      this.supabase.from('reservas').select('*')
    );
  }

  getHabitaciones(): Observable<any> {
    return from(
      this.supabase.from('habitaciones').select('*').order('numero', { ascending: true })
    );
  }

  actualizarHabitacion(id: number, data: any): Observable<any> {
    return from(
      this.supabase.from('habitaciones').update(data).eq('id', id).select()
    );
  }
}