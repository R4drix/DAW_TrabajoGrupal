import { CommonModule } from '@angular/common';
import { Component, computed, signal, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import { ApiService } from '../../services/api.service'; // Ajusta la ruta de tu servicio
import { Habitacion } from '../../services/models'; // 

interface PasoWizard { label: string; }
interface DiaCalendario { fecha: Date; numero: number; deshabilitado: boolean; }

type TipoHabitacion = 'Simple' | 'Doble' | 'Familiar' | 'Suite';



@Component({
  selector: 'app-reservar-wizard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservar.html',
  styleUrls: ['./reservar.css'],
})
export class ReservarWizard {
  private apiService = inject(ApiService); // Inyección del servicio

  readonly pasos: PasoWizard[] = [
    { label: 'Personas' },
    { label: 'Fecha' },
    { label: 'Habitación' },
    { label: 'Tus datos' },
  ];

  pasoActual = signal(0);
  personas = signal<number | null>(null);
  mostrarInputPersonas = signal(false);

  // --- Paso Fecha ---
  readonly diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  mesIzquierdo = signal<Date>(this.primerDiaDe(new Date()));
  fechaLlegada = signal<Date | null>(null);
  fechaSalida = signal<Date | null>(null);

  mesDerecho = computed(() => this.sumarMeses(this.mesIzquierdo(), 1));
  diasMesIzquierdo = computed(() => this.diasDelMes(this.mesIzquierdo()));
  diasMesDerecho = computed(() => this.diasDelMes(this.mesDerecho()));

  // --- Paso Habitación (Dinamizado) ---
  readonly tiposHabitacion: TipoHabitacion[] = ['Simple', 'Doble', 'Familiar', 'Suite'];
  
  // Ahora las habitaciones son una señal que empieza vacía
  habitaciones = signal<Habitacion[]>([]);
  tipoSeleccionado = signal<TipoHabitacion | null>(null);
  habitacionSeleccionada = signal<Habitacion | null>(null);

  habitacionesDelTipo = computed(() => {
    const seleccionado = this.tipoSeleccionado()?.toLowerCase();
    return this.habitaciones().filter((h) => h.tipo?.toLowerCase() === seleccionado);
  });
  // --- Paso Tus datos ---
  nombreCliente = signal('');
  correoCliente = signal('');
  telefonoCliente = signal('');
  reservaConfirmada = signal(false);
  codigoReserva = signal('');

  esUltimoPaso = computed(() => this.pasoActual() === this.pasos.length - 1);

  noches = computed(() => {
    const llegada = this.fechaLlegada();
    const salida = this.fechaSalida();
    if (!llegada || !salida) return 0;
    const msPorDia = 1000 * 60 * 60 * 24;
    return Math.round((salida.getTime() - llegada.getTime()) / msPorDia);
  });

  total = computed(() => {
    const habitacion = this.habitacionSeleccionada();
    return habitacion ? habitacion.precio_por_noche * this.noches() : 0;
  });

  datosCompletos = computed(
    () =>
      this.nombreCliente().trim().length > 0 &&
      this.correoCliente().trim().length > 0 &&
      this.telefonoCliente().trim().length > 0
  );

  // --- Métodos de Control ---
  elegirPersonas(n: number): void {
    this.mostrarInputPersonas.set(false);
    this.personas.set(n);
  }

  activarInputPersonas(): void {
    this.mostrarInputPersonas.set(true);
  }

  actualizarPersonasCustom(event: Event): void {
    const valor = Number((event.target as HTMLInputElement).value);
    this.personas.set(valor > 0 ? valor : null);
  }

  mesAnterior(): void {
    const hoy = new Date();
    const minimo = this.primerDiaDe(hoy);
    const candidato = this.sumarMeses(this.mesIzquierdo(), -1);
    if (candidato.getTime() >= minimo.getTime()) {
      this.mesIzquierdo.set(candidato);
    }
  }

  mesSiguiente(): void {
    this.mesIzquierdo.update((mes) => this.sumarMeses(mes, 1));
  }

  etiquetaMes(fecha: Date): string {
    const texto = fecha.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  seleccionarFecha(dia: DiaCalendario | null): void {
    if (!dia || dia.deshabilitado) return;
    const fecha = dia.fecha;
    const llegada = this.fechaLlegada();

    if (!llegada || (llegada && this.fechaSalida())) {
      this.fechaLlegada.set(fecha);
      this.fechaSalida.set(null);
      return;
    }

    if (fecha.getTime() > llegada.getTime()) {
      this.fechaSalida.set(fecha);
    } else if (fecha.getTime() < llegada.getTime()) {
      this.fechaLlegada.set(fecha);
      this.fechaSalida.set(null);
    }
  }

  // --- Carga dinámica desde la base de datos ---
  cargarHabitacionesDisponibles(): void {
    const llegada = this.fechaLlegada()?.toISOString().split('T')[0];
    const salida = this.fechaSalida()?.toISOString().split('T')[0];
    const cantPersonas = this.personas();

    if (llegada && salida && cantPersonas) {
      this.apiService.getHabitacionesDisponibles({
        personas: cantPersonas,
        llegada: llegada,
        salida: salida
      }).subscribe({
        next: (data) => this.habitaciones.set(data),
        error: (err) => console.error('Error cargando habitaciones de Supabase:', err)
      });
    }
  }

  irSiguiente(): void {
    if (!this.pasoCompleto()) return;
    
    // Si pasa del paso 1 (fechas) al paso 2 (habitaciones), dispara la consulta a Supabase
    if (this.pasoActual() === 1) {
      this.cargarHabitacionesDisponibles();
    }

    if (this.pasoActual() < this.pasos.length - 1) {
      this.pasoActual.update((p) => p + 1);
    }
  }

  esLlegada(dia: DiaCalendario | null): boolean { return !!dia && this.esMismoDia(dia.fecha, this.fechaLlegada()); }
  esSalida(dia: DiaCalendario | null): boolean { return !!dia && this.esMismoDia(dia.fecha, this.fechaSalida()); }
  esEnRango(dia: DiaCalendario | null): boolean {
    const llegada = this.fechaLlegada();
    const salida = this.fechaSalida();
    if (!dia || !llegada || !salida) return false;
    return dia.fecha.getTime() > llegada.getTime() && dia.fecha.getTime() < salida.getTime();
  }

  formatearFecha(fecha: Date | null): string {
    if (!fecha) return '—';
    return fecha.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  seleccionarTipo(tipo: TipoHabitacion): void {
    this.tipoSeleccionado.set(tipo);
    this.habitacionSeleccionada.set(null);
  }

  seleccionarHabitacion(habitacion: Habitacion): void {
    this.habitacionSeleccionada.set(habitacion);
  }

  actualizarNombre(event: Event): void { this.nombreCliente.set((event.target as HTMLInputElement).value); }
  actualizarCorreo(event: Event): void { this.correoCliente.set((event.target as HTMLInputElement).value); }
  actualizarTelefono(event: Event): void { this.telefonoCliente.set((event.target as HTMLInputElement).value); }

// Función helper para formatear Date a "YYYY-MM-DD" local sin desfase UTC
private formatearFechaISO(fecha: Date | null): string {
  if (!fecha) return '';
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

confirmarReserva(): void {
  if (!this.datosCompletos() || !this.habitacionSeleccionada()) return;

  // Formateamos las fechas sin que la conversión UTC reste un día
  const fechaLlegadaStr = this.formatearFechaISO(this.fechaLlegada());
  const fechaSalidaStr = this.formatearFechaISO(this.fechaSalida());

  const payloadReserva = {
    habitacion_numero: this.habitacionSeleccionada()?.numero,
    fecha_llegada: fechaLlegadaStr,
    fecha_salida: fechaSalidaStr,
    nombre_cliente: this.nombreCliente(),
    correo_cliente: this.correoCliente(),
    telefono_cliente: this.telefonoCliente(),
    total_pago: this.total(),
    cantidad_personas: this.personas()
  };

  this.apiService.crearReserva(payloadReserva).subscribe({
    next: (response: any) => {
      console.log('Reserva guardada con éxito:', response);
      
      const codigoFinal = response.codigo || this.generarCodigoReserva();
      
      this.codigoReserva.set(codigoFinal);
      this.reservaConfirmada.set(true);

      this.generarFacturaPDF();
    },
    error: (err: any) => {
      console.error('Error al guardar la reserva:', err);
      
      const codigoSimulado = this.generarCodigoReserva();
      this.codigoReserva.set(codigoSimulado);
      this.reservaConfirmada.set(true);
      this.generarFacturaPDF();
    }
  });
}

  nuevaReserva(): void {
    this.pasoActual.set(0);
    this.personas.set(null);
    this.mesIzquierdo.set(this.primerDiaDe(new Date()));
    this.fechaLlegada.set(null);
    this.fechaSalida.set(null);
    this.tipoSeleccionado.set(null);
    this.habitacionSeleccionada.set(null);
    this.nombreCliente.set('');
    this.correoCliente.set('');
    this.telefonoCliente.set('');
    this.reservaConfirmada.set(false);
    this.codigoReserva.set('');
    this.habitaciones.set([]);
  }

  generarFacturaPDF() {
    const doc = new jsPDF();

    // 1. Cabecera del PDF Estética
    doc.setFontSize(22);
    doc.text('CÁTAGA CLUB - COMPROBANTE DE RESERVA', 15, 20);
    
    // Línea divisoria
    doc.setLineWidth(0.5);
    doc.line(15, 25, 195, 25);

    // 2. Información del Cliente e Inmueble (Extrayendo de tus Signals sanamente)
    doc.setFontSize(12);
    
    const codigo = this.codigoReserva() || 'CTG-PENDIENTE';
    const habitacion = this.habitacionSeleccionada();

    doc.text(`Código de Reserva: ${codigo}`, 15, 40);
    doc.text(`Cliente: ${this.nombreCliente()}`, 15, 50);
    doc.text(`Correo: ${this.correoCliente()}`, 15, 60);
    doc.text(`Habitación: ${habitacion?.tipo || 'Seleccionada'} - Hab. ${habitacion?.numero || 'N/A'}`, 15, 70);
    doc.text(`Fecha Llegada: ${this.formatearFecha(this.fechaLlegada())}`, 15, 80);
    doc.text(`Fecha Salida: ${this.formatearFecha(this.fechaSalida())}`, 15, 90);
    
    // 3. Bloque del Precio Final
    doc.line(15, 95, 195, 95);
    doc.setFontSize(14);
    doc.text(`Total Pagado: S/ ${this.total()}.00`, 15, 105);

    // 4. Descargar el archivo
    doc.save(`reserva_${codigo}.pdf`);
  }
  private generarCodigoReserva(): string {
    const aleatorio = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CTG-${aleatorio}`;
  }

  private primerDiaDe(fecha: Date): Date { return new Date(fecha.getFullYear(), fecha.getMonth(), 1); }
  private sumarMeses(fecha: Date, cantidad: number): Date { return new Date(fecha.getFullYear(), fecha.getMonth() + cantidad, 1); }
  private esMismoDia(a: Date | null, b: Date | null): boolean {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  private diasDelMes(mes: Date): (DiaCalendario | null)[] {
    const anio = mes.getFullYear();
    const mesIndice = mes.getMonth();
    const primerDia = new Date(anio, mesIndice, 1);
    const totalDias = new Date(anio, mesIndice + 1, 0).getDate();
    const desplazamiento = (primerDia.getDay() + 6) % 7;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const celdas: (DiaCalendario | null)[] = [];
    for (let i = 0; i < desplazamiento; i++) { celdas.push(null); }
    for (let d = 1; d <= totalDias; d++) {
      const fecha = new Date(anio, mesIndice, d);
      celdas.push({ fecha, numero: d, deshabilitado: fecha.getTime() < hoy.getTime() });
    }
    return celdas;
  }

  pasoCompleto(): boolean {
    switch (this.pasoActual()) {
      case 0: return this.personas() !== null && this.personas()! > 0;
      case 1: return this.fechaLlegada() !== null && this.fechaSalida() !== null;
      case 2: return this.habitacionSeleccionada() !== null;
      case 3: return this.datosCompletos();
      default: return true;
    }
  }

  irAtras(): void {
    if (this.pasoActual() > 0) { this.pasoActual.update((p) => p - 1); }
  }
  
}



