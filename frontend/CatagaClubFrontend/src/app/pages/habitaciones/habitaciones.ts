import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

  @Component({
    selector: 'app-habitaciones',
    imports: [RouterLink],
    templateUrl: './habitaciones.html',
    styleUrl: './habitaciones.css',
  })
export class Habitaciones {



  habitaciones = [

    {
      nombre:'Suite Premium',
      precio:150,
      descripcion:'Habitación con jacuzzi.'
    },

    {
      nombre:'Habitación Familiar',
      precio:220,
      descripcion:'Ideal para familias.'
    },

    {
      nombre:'Habitación Ejecutiva',
      precio:180,
      descripcion:'Perfecta para negocios.'
    }

  ];

}