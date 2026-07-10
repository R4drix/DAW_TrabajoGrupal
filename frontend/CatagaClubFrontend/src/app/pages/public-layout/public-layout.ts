import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// Importación con la ruta exacta hacia tu carpeta shared
import { Navbar } from '../../shared/navbar/navbar';
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer], // Registrados correctamente
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css'
})
export class PublicLayout{}