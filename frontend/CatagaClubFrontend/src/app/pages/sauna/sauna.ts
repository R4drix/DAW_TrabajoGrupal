import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";

export interface Camara {
  name: string,
  desc: string,
  icon: string,
  router: string,
}
@Component({
  selector: 'app-sauna',
  imports: [RouterLink],
  templateUrl: './sauna.html',
  styleUrl: './sauna.css',
})
export class Sauna {
  public camaras: Camara[] = [
    {
      name: "Sauna Seco",
      desc: "Calor seco con piedras volcánicas para eliminar toxinas y mejorar la circulación.",
      icon: "flame",
      router: ""
    },
    {
      name: "Cámara de Vapor",
      desc: "Baño turco con sutiles aromas a eucalipto para purificar el sistema respiratorio.",
      icon: "wind",
      router: ""
    },
    {
      name: "Jacuzzi & Relax",
      desc: "Aguas termales con chorros de hidromasaje para aliviar la tensión muscular.",
      icon: "bath",
      router: ""
    }
  ]
}
