import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminNavbar } from '../../../shared/admin-navbar/admin-navbar'; // Asegura tu ruta de importación

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, AdminNavbar], // <-- Deja solo AdminNavbar y quita AdminFooter
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout { }