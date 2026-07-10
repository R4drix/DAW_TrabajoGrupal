import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // <-- CRÍTICO: Debe estar importado

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // <-- Deja solo RouterOutlet aquí para limpiar los componentes fijos
  templateUrl: './app.html', // o './app.component.html'
  styleUrl: './app.css'
})
export class App { }