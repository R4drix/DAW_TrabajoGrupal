import { Component } from '@angular/core';

@Component({
  selector: 'app-sauna',
  imports: [],
  templateUrl: './sauna.html',
  styleUrl: './sauna.css',
})
export class Sauna {
  public camaras = [
    {
      camara: "Sauna Seco",
      description: "Calor seco con piedras volcánicas para eliminar toxinas y mejorar la circulación.",
      router: ""
    },
    {
      camara: "Cámara de Vapor",
      description: "Baño turco con sutiles aromas a eucalipto para purificar el sistema respiratorio.",
      router: ""
    },
    {
      camara: "Jacuzzi & Relax",
      description: "Aguas termales con chorros de hidromasaje para aliviar la tensión muscular.",
      router: ""
    }
  ]
}
