import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';

import { ApiService } from '../../services/api.service';
import { Dashboard } from '../../services/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  data: Dashboard | null = null;
  loading = true;
  errorMsg = '';

  ngOnInit(): void {
    this.api.getDashboard().subscribe({
      next: (resp) => {
        this.data = resp;
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = `No se pudo cargar el dashboard (${err.status ?? 'sin status'}).`;
        this.loading = false;
      },
    });
  }
}