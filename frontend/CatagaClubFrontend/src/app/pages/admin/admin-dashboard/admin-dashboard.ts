import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, RouterLink], // Dejamos RouterLink porque tu HTML usa routerLink
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  totalReservas: number = 0;
  totalHabitaciones: number = 0;
  totalConsumos: number = 0;
  recientes: any[] = [];

  ngOnInit() {
    // Aquí puedes meter tus datos simulados o llamadas a Supabase después
    this.recientes = [
      { id: 101, nombre: 'Carlos Mendoza', fecha: '2026-07-10', estado: 'Pendiente' }
    ];
    this.totalReservas = 1;
    this.totalHabitaciones = 8;
    this.totalConsumos = 3;
  }
}