import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";

import { Camara } from '../../services/models';
@Component({
  selector: 'app-sauna',
  imports: [RouterLink],
  templateUrl: './sauna.html',
  styleUrl: './sauna.css',
})
export class Sauna {
  public camaras: Camara[] = [
    {
      id: 1,
      tipo: "Sauna Seco",
      descripcion: "Calor seco con piedras volcánicas para eliminar toxinas y mejorar la circulación.",
      capacidad: 0,
      icon_class: "flame",
    },
    {
      id: 2,
      tipo: "Cámara de Vapor",
      descripcion: "Baño turco con sutiles aromas a eucalipto para purificar el sistema respiratorio.",
      capacidad: 80,
      icon_class: "wind",
    },
    {
      id: 3,
      tipo: "Jacuzzi & Relax",
      descripcion: "Aguas termales con chorros de hidromasaje para aliviar la tensión muscular.",
      capacidad: 120,
      icon_class: "bath",
    },
    {
      id: 4,
      tipo: "Camara privada",
      descripcion: "Un espacio exclusivo que ofrece total privacidad para una persona o un grupo de amigos",
      capacidad: 200,
      icon_class: "user-check",
    },
  ]
}
