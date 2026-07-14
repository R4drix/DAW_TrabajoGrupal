import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-admin-habitaciones',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DecimalPipe, DatePipe, FormsModule],
  templateUrl: './admin-habitaciones.html',
  styleUrl: './admin-habitaciones.css'
})
export class AdminHabitaciones implements OnInit {
  habitaciones: any[] = [];
  
  // Objeto temporal para los inputs individuales de cada tarjeta
  formCheckIn: { [key: number]: { nombre: string, noches: number } } = {};

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.obtenerHabitaciones();
  }

  obtenerHabitaciones() {
    this.api.getHabitaciones().subscribe({
      next: (resp: any) => {
        this.habitaciones = resp.data || [];
        
        // Inicializamos los formularios limpios para las tarjetas
        this.habitaciones.forEach(room => {
          if (!this.formCheckIn[room.id]) {
            this.formCheckIn[room.id] = { nombre: '', noches: 1 };
          }
        });
      },
      error: (err) => console.error('Error al cargar habitaciones:', err)
    });
  }

  registrarCheckIn(id: number) {
    const datos = this.formCheckIn[id];
    if (!datos.nombre.trim()) {
      alert('Por favor, ingresa el nombre del huésped.');
      return;
    }

    const ahora = new Date();
    const salida = new Date();
    salida.setDate(ahora.getDate() + datos.noches);

    this.api.actualizarHabitacion(id, {
      esta_ocupada: true,
      cliente_nombre: datos.nombre,
      hora_ingreso: ahora.toISOString(),
      hora_salida: salida.toISOString()
    }).subscribe({
      next: () => {
        alert('¡Check-In completado exitosamente!');
        this.formCheckIn[id] = { nombre: '', noches: 1 };
        this.obtenerHabitaciones();
      },
      error: (err) => alert('Error al procesar el ingreso.')
    });
  }

  liberarHabitacion(id: number) {
    if (!confirm('¿Estás seguro de liberar esta habitación?')) return;

    this.api.actualizarHabitacion(id, {
      esta_ocupada: false,
      cliente_nombre: null,
      hora_ingreso: null,
      hora_salida: null
    }).subscribe({
      next: () => {
        alert('Habitación liberada con éxito.');
        this.obtenerHabitaciones();
      },
      error: (err) => alert('Error al liberar la habitación.')
    });
  }
}