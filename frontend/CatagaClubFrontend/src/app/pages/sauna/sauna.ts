import { Component, inject, /*OnInit,*/ signal } from '@angular/core';
import { RouterLink } from "@angular/router";

import { Camara } from '../../services/models';
import { ApiService } from '../../services/api.service';
@Component({
  selector: 'app-sauna',
  imports: [RouterLink],
  templateUrl: './sauna.html',
  styleUrl: './sauna.css',
})
export class Sauna /*implements OnInit*/ {
  private readonly api = inject(ApiService);
  //camaras: Camara[] = [];
  loading = signal(false); // False por el momento
  errorMsg = 'No se pudo cargar las camaras del sauna';
  camaraSeleccionada: Camara | null = null

  /*
  ngOnInit(): void {
    this.api.getCamaras().subscribe({
      next: (resp: any) => {
        this.camaras = resp.camaras ?? [];
        this.loading.set(false);
      },
      error: (err: any) => {
        this.errorMsg = `No se pudo conectar con el backend (${err.status ?? 'sin status'}). Verifica que Django esté corriendo en :8765.`;
        this.loading.set(false);
      },
    })
  } Esto se usara cuando se implemente el endpoint de Camaras de sauna
  */
  
  camaras: Camara[] = [
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
  public seleccionarCamara(camara: Camara):void {
    this.camaraSeleccionada = camara;
  }
}
