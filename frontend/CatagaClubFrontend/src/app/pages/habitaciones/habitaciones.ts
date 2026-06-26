import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

  @Component({
    selector: 'app-habitaciones',
    imports: [RouterLink, NgFor],
    templateUrl: './habitaciones.html',
    styleUrl: './habitaciones.css',
  })
export class Habitaciones {



@Component({
  selector: 'app-habitaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './habitaciones.html',
  styleUrls: ['./habitaciones.css']
})
export class Habitaciones implements OnInit {
  
  // Esta estructura simula exactamente cómo te responderá tu base de datos (JSON)
  habitaciones = [
    {
      nombre: 'Habitación Simples (501-502-505)',
      descripcion: 'Espacio cómodo e ideal para el descanso individual o en pareja. Cuenta con todos los servicios esenciales.',
      fotos: [''],
      tarifas: [
        { tiempo: 'Por 4 Horas', precio: 50 },
        { tiempo: 'Por 4 Horas + Sauna', precio: 70 },
        { tiempo: 'Por 12 Horas', precio: 70 },
        { tiempo: '12 Horas + Sauna', precio: 90 }
      ]
    },
    {
      nombre: 'Habitación Matrimonial (506-507)',
      descripcion: 'Diseñada para brindar un ambiente cálido, privado y altamente confortable para parejas.',
      fotos: [''],
      tarifas: [
        { tiempo: 'Por 4 Horas', precio: 60 },
        { tiempo: 'Por 4 Horas + Sauna', precio: 80 },
        { tiempo: 'Por 12 Horas', precio: 80 },
        { tiempo: 'Por 12 Horas + Sauna', precio: 100 }
      ]
    },
    {
      nombre: 'Habitación Nupciales (601-602-603-604)',
      descripcion: 'Un ambiente elegante y decorado con delicadeza, ideal para celebrar ocasiones y noches memorables.',
      fotos: [''],
      tarifas: [
        { tiempo: 'Por 4 Horas', precio: 70 },
        { tiempo: 'Por 12 Horas', precio: 90 }
      ]
    },
    {
      nombre: 'Habitación Love (606)',
      descripcion: 'Habitación temática especial con acabados vanguardistas diseñados para avivar la pasión y el romance.',
      fotos: [''],
      tarifas: [
        { tiempo: 'Por 4 Horas', precio: 100 },
        { tiempo: 'Por 12 Horas', precio: 130 }
      ]
    },
    {
      nombre: 'Suite Manantial (504)',
      descripcion: 'Sofisticación y confort superior que incluye tina de hidromasajes para una experiencia de máxima relajación.',
      fotos: [''],
      tarifas: [
        { tiempo: 'Por 4 Horas', precio: 120 },
        { tiempo: 'Por 12 Horas', precio: 150 }
      ]
    },
    {
      nombre: 'Suite Oasis (503)',
      descripcion: 'Tu propio refugio de tranquilidad. Equipamiento premium y un diseño pensado en el descanso absoluto.',
      fotos: [''],
      tarifas: [
        { tiempo: 'Por 4 Horas', precio: 130 },
        { tiempo: 'Por 12 Horas', precio: 160 }
      ]
    },
    {
      nombre: 'Suite Presidencial (605)',
      descripcion: 'La suite más exclusiva del hotel. Amplitud extrema, acabados de lujo y servicios preferenciales inigualables.',
      fotos: [''],
      tarifas: [
        { tiempo: 'Por 4 Horas', precio: 150 },
        { tiempo: 'Por 12 Horas', precio: 180 }
      ]
    }
  ];

  // Guardará cuál objeto de la lista está visualizando el usuario
  habitacionSeleccionada: any;

  ngOnInit() {
    // Al abrir la página, muestra la primera habitación por defecto
    if (this.habitaciones.length > 0) {
      this.habitacionSeleccionada = this.habitaciones[0];
    }
  }

  // Cambia la información derecha al hacer clic en el menú izquierdo
  seleccionarHabitacion(habitacion: any) {
    this.habitacionSeleccionada = habitacion;
  }
}