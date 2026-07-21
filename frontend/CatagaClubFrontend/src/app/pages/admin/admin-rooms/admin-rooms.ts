import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Habitacion } from '../../../services/models';

@Component({
  selector: 'app-admin-rooms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-rooms.html',
  styleUrls: ['./admin-rooms.css'],
})
export class AdminRooms implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  public placeholders = {
    principal: 'https://placehold.co/600x400/1e1e1e/ffffff?text=principal',
    cama: 'https://placehold.co/600x400/1e1e1e/ffffff?text=cama',
    bano: 'https://placehold.co/600x400/1e1e1e/ffffff?text=bano',
    extra: 'https://placehold.co/600x400/1e1e1e/ffffff?text=extra',
  };

  habitaciones = signal<Habitacion[]>([]);
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  errorMsg = signal<string>('');

  isModalOpen = signal<boolean>(false);
  selectedRoom = signal<Habitacion | null>(null);

  roomForm!: FormGroup;
  tiposHabitacion = ['Individual', 'Doble', 'Suite', 'Familiar'];

  ngOnInit(): void {
    this.initForm();
    this.cargarHabitaciones();
  }

  private initForm(): void {
    this.roomForm = this.fb.group({
      id: [null],
      numero: [null, [Validators.required, Validators.min(1)]],
      tipo: ['Doble', Validators.required],
      precio_por_noche: [null, [Validators.required, Validators.min(0.01)]],
      capacidad: [2, [Validators.required, Validators.min(1)]],
      esta_ocupada: [false],
      imagen_principal: [''],
      imagen_cama: [''],
      imagen_bano: [''],
      imagen_extra: [''],
    });
  }

  cargarHabitaciones(): void {
    this.loading.set(true);
    this.api.getEstadoHabitaciones().subscribe({
      next: (resp) => {
        this.habitaciones.set(resp.habitaciones ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(`No se pudo conectar con el backend (${err.status ?? 'sin status'}).`);
        this.loading.set(false);
      },
    });
  }

  abrirEditar(room: Habitacion): void {
    this.selectedRoom.set(room);
    this.roomForm.patchValue(room);
    this.isModalOpen.set(true);
  }

  cerrarModal(): void {
    this.isModalOpen.set(false);
    this.selectedRoom.set(null);
    this.roomForm.reset();
  }

  guardarCambios(): void {
    if (this.roomForm.invalid) {
      this.roomForm.markAllAsTouched();
      return;
    }

    const roomData = this.roomForm.value;
    this.saving.set(true);
    this.errorMsg.set('');

    // Petición a Django
    this.api.actualizarHabitacion(roomData.id, roomData).subscribe({
      next: (resp) => {
        if (resp.ok && resp.habitacion) {
          const habitacionGuardada = resp.habitacion;

          // Actualizamos la Signal local con los datos reales devueltos por Supabase
          this.habitaciones.update((list) =>
            list.map((h) => (h.id === habitacionGuardada.id ? habitacionGuardada : h))
          );

          this.saving.set(false);
          this.cerrarModal();
        }
      },
      error: (err) => {
        console.error('Error al actualizar habitación:', err);
        const msg = err.error?.error || 'No se pudieron guardar los cambios en la base de datos.';
        this.errorMsg.set(msg);
        this.saving.set(false);
      }
    });
  }

  public onImgError(event: Event, tipo: 'principal' | 'cama' | 'bano' | 'extra' = 'principal'): void {
    const img = event.target as HTMLImageElement;
    img.src = this.placeholders[tipo] || this.placeholders.principal;
  }
  
}