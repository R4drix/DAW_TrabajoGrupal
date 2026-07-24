import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
@Component({
  selector: 'app-admin-sauna',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-sauna.html',
  styleUrls: ['./admin-sauna.css']
})
export class AdminSauna implements OnInit {
  private apiUrl = `${environment.apiBaseUrl}/sauna/`;

  registros: RegistroSauna[] = [];
  cargando: boolean = false;
  

  // Formulario
  nuevoRegistro: RegistroSauna = {
    nombre_pagador: '',
    dni_pagador: '',
    cant_adultos: 1,
    cant_ninos: 0,
    notas: ''
  };

  // Tarifas
  PRECIO_ADULTO = 13;
  PRECIO_NINO = 9;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.obtenerRegistros();
  }

  obtenerRegistros(): void {
    this.cargando = true;
    this.http.get<RegistroSauna[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.registros = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar registros del sauna:', err);
        this.cargando = false;
      }
    });
  }

  get totalCalculado(): number {
    const ad = Number(this.nuevoRegistro.cant_adultos) || 0;
    const ni = Number(this.nuevoRegistro.cant_ninos) || 0;
    return (ad * this.PRECIO_ADULTO) + (ni * this.PRECIO_NINO);
  }

  guardarIngreso(): void {
    if (!this.nuevoRegistro.nombre_pagador || !this.nuevoRegistro.dni_pagador) {
      alert('Por favor complete el nombre y DNI del pagador.');
      return;
    }

    const fechaPeru = new Date().toLocaleString('sv-SE', { timeZone: 'America/Lima' }).replace(' ', 'T');

    const datosAEnviar: RegistroSauna = {
      ...this.nuevoRegistro,
      fecha_ingreso: fechaPeru,
      total_pagado: this.totalCalculado.toString()
    };

    this.http.post<RegistroSauna>(this.apiUrl, datosAEnviar).subscribe({
      next: (nuevoElementoCreado) => {
        // 1. Agregar el nuevo elemento al inicio de la lista local inmediatamente
        this.registros = [nuevoElementoCreado, ...this.registros];

        // 2. Limpiar el formulario
        this.limpiarFormulario();

        // 3. Volver a sincronizar con la BD por seguridad en segundo plano
        this.obtenerRegistros();
      },
      error: (err) => {
        alert('Error al registrar ingreso: ' + (err.error?.error || 'Error en el servidor'));
      }
    });
  }

  eliminarRegistro(id: number): void {
    if (confirm('¿Está seguro de eliminar este registro de ingreso?')) {
      this.http.delete(`${this.apiUrl}${id}/`).subscribe({
        next: () => {
          this.obtenerRegistros();
        },
        error: (err) => {
          alert('Error al eliminar registro');
        }
      });
    }
  }

  limpiarFormulario(): void {
    this.nuevoRegistro = {
      nombre_pagador: '',
      dni_pagador: '',
      cant_adultos: 1,
      cant_ninos: 0,
      notas: ''
    };
  }
}