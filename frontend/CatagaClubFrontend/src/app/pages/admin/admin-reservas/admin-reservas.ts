import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

export interface ReservaAdmin {
  id: number;
  codigo?: string;
  cliente_nombre: string;
  cliente_correo: string;
  cliente_telefono: string;
  habitacion_numero: string | number;
  habitacion_tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  num_personas: number;
  total: string | number;
  estado: 'pendiente' | 'en_uso' | 'finalizado' | 'cancelada';
  notas?: string;
}

@Component({
  selector: 'app-admin-reservas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-reservas.html',
  styleUrls: ['./admin-reservas.css'],
})
export class AdminReservas implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  reservas = signal<ReservaAdmin[]>([]);
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  errorMsg = signal<string>('');

  isModalOpen = signal<boolean>(false);
  selectedReserva = signal<ReservaAdmin | null>(null);

  reservaForm!: FormGroup;

  estados = [
    { value: 'pendiente', label: 'Pendiente (Próxima)' },
    { value: 'en_uso', label: 'En Uso (Hospedado ahora)' },
    { value: 'finalizado', label: 'Finalizado (Check-out completado)' },
    { value: 'cancelada', label: 'Cancelada' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.cargarReservas();
  }

  private initForm(): void {
    this.reservaForm = this.fb.group({
      id: [null],
      estado: ['pendiente', Validators.required],
      total: [0, [Validators.required, Validators.min(0)]],
      notas: [''],
    });
  }

  cargarReservas(): void {
    this.loading.set(true);
    this.api.getReservas().subscribe({
      next: (data: any) => {
        this.reservas.set(data ?? []);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error cargando reservas:', err);
        this.errorMsg.set('No se pudieron obtener las reservas del servidor.');
        this.loading.set(false);
      },
    });
  }

  verDetalles(reserva: ReservaAdmin): void {
    this.selectedReserva.set(reserva);
    this.reservaForm.patchValue({
      id: reserva.id,
      estado: reserva.estado || 'pendiente',
      total: parseFloat(reserva.total as string) || 0,
      notas: reserva.notas || '',
    });
    this.isModalOpen.set(true);
  }

  cerrarModal(): void {
    this.isModalOpen.set(false);
    this.selectedReserva.set(null);
    this.reservaForm.reset();
  }

  guardarCambios(): void {
    if (this.reservaForm.invalid) return;

    const { id, estado, total, notas } = this.reservaForm.value;
    this.saving.set(true);

    this.api.actualizarReserva(id, { estado, total, notas }).subscribe({
      next: () => {
        this.reservas.update((list) =>
          list.map((r) => (r.id === id ? { ...r, estado, total, notas } : r))
        );
        this.saving.set(false);
        this.cerrarModal();
      },
      error: (err: any) => {
        console.error('Error al actualizar reserva:', err);
        this.saving.set(false);
      },
    });
  }

  cancelarReserva(id: number): void {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;

    this.api.actualizarReserva(id, { estado: 'cancelada' }).subscribe({
      next: () => {
        this.reservas.update((list) =>
          list.map((r) => (r.id === id ? { ...r, estado: 'cancelada' } : r))
        );
        alert('Reserva marcada como cancelada');
      },
      error: (err: any) => console.error('Error al cancelar:', err),
    });
  }

  eliminarReserva(id: number): void {
    if (!confirm('ATENCIÓN: ¿Quieres ELIMINAR permanentemente esta reserva? Esta acción no se puede deshacer.')) return;

    this.api.eliminarReserva(id).subscribe({
      next: () => {
        this.reservas.update((list) => list.filter((r) => r.id !== id));
        alert('Reserva eliminada de la base de datos');
      },
      error: (err: any) => console.error('Error al eliminar:', err),
    });
  }

  imprimirComprobante(id: number): void {
    window.open(`http://localhost:8000/club/reservas/${id}/cuenta/`, '_blank');
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'en_uso':     return 'pill-en-uso';    
      case 'pendiente':  return 'pill-pendiente'; 
      case 'finalizado': return 'pill-finalizado';
      case 'cancelada':  return 'pill-cancelada'; 
      default:           return 'pill-pendiente';
    }
  }
}