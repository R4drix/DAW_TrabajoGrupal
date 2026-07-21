import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

// Interfaz alineada exactamente con el modelo Django + Supabase
export interface Plato {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  imagen_url: string;
  categoria: string;
  disponible: boolean;
}

@Component({
  selector: 'app-admin-comidas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-comidas.html',
  styleUrls: ['./admin-comidas.css'],
})
export class AdminComidas implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  public placeholder = 'https://placehold.co/100x100/1e1e1e/ffffff?text=Plato';

  platos = signal<Plato[]>([]);
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  errorMsg = signal<string>('');

  isModalOpen = signal<boolean>(false);
  selectedPlato = signal<Plato | null>(null);

  mealForm!: FormGroup;

  // Claves alineadas con CATEGORIAS de tu modelo Django
  categorias = [
    { value: 'extras', label: 'Extras / Platos' },
    { value: 'guarniciones', label: 'Guarniciones' },
    { value: 'sandwiches', label: 'Sándwiches' },
    { value: 'salchipapas', label: 'Salchipapas' },
    { value: 'bebidas', label: 'Bebidas' },
    { value: 'bebidas_calientes', label: 'Bebidas Calientes' },
    { value: 'jugos', label: 'Jugos Naturales' },
    { value: 'cocteles', label: 'Cócteles' },
    { value: 'postres', label: 'Postres' },
    { value: 'frapps', label: 'Frapps' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.cargarPlatos();
  }

  private initForm(): void {
    this.mealForm = this.fb.group({
      id: [null],
      nombre: ['', Validators.required],
      descripcion: [''],
      precio: [0, [Validators.required, Validators.min(0.01)]],
      categoria: ['extras', Validators.required],
      disponible: [true],
      imagen_url: [''],
    });
  }

  cargarPlatos(): void {
    this.loading.set(true);
    this.api.getPlatos().subscribe({
      next: (data) => {
        this.platos.set(data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar platos:', err);
        this.errorMsg.set('No se pudo cargar la lista de platillos.');
        this.loading.set(false);
      },
    });
  }

  abrirEditar(plato: Plato): void {
    this.selectedPlato.set(plato);
    this.mealForm.patchValue({
      ...plato,
      precio: parseFloat(plato.precio) || 0
    });
    this.isModalOpen.set(true);
  }

  cerrarModal(): void {
    this.isModalOpen.set(false);
    this.selectedPlato.set(null);
    this.mealForm.reset();
  }

  guardarCambios(): void {
    if (this.mealForm.invalid) {
      this.mealForm.markAllAsTouched();
      return;
    }

    const formData = this.mealForm.value;
    this.saving.set(true);
    this.errorMsg.set('');

    this.api.actualizarPlato(formData.id, formData).subscribe({
      next: (resp) => {
        if (resp.ok && resp.plato) {
          const platoGuardado = resp.plato;
          
          this.platos.update((list) =>
            list.map((p) => (p.id === platoGuardado.id ? platoGuardado : p))
          );
          
          this.saving.set(false);
          this.cerrarModal();
        }
      },
      error: (err) => {
        console.error('Error al actualizar plato:', err);
        const msg = err.error?.error || 'Error al guardar el platillo en Supabase.';
        this.errorMsg.set(msg);
        this.saving.set(false);
      },
    });
  }

  getCategoriaLabel(key: string): string {
    const cat = this.categorias.find((c) => c.value === key);
    return cat ? cat.label : key;
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = this.placeholder;
  }
}