import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

import { CamaraEstado } from '../../../services/models';
import { MOCK_SAUNAS } from '../../../services/mocks/saunas.mock';

@Component({
  selector: 'app-admin-sauna',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-sauna.html',
  styleUrl: './admin-sauna.css',
})
export class AdminSauna {
  saunas = signal<CamaraEstado[]>(MOCK_SAUNAS);

  total = computed(() => this.saunas().length);
  ocupadas = computed(() => this.saunas().filter((s) => s.esta_ocupada).length);
  libres = computed(() => this.total() - this.ocupadas());

  /**
   * Alterna el estado localmente (solo front, no persiste).
   * Sirve para probar la UI mientras no exista el endpoint real.
   */
  toggleEstado(id: number): void {
    this.saunas.update((list) =>
      list.map((s) => (s.id === id ? { ...s, esta_ocupada: !s.esta_ocupada } : s))
    );
  }
}
