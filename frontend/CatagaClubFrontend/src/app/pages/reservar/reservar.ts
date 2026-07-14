import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { jsPDF } from 'jspdf';

interface PasoWizard {
  label: string;
}

interface DiaCalendario {
  fecha: Date;
  numero: number;
  deshabilitado: boolean;
}

type TipoHabitacion = 'Simple' | 'Doble' | 'Familiar' | 'Suite';

interface Habitacion {
  numero: string;
  tipo: TipoHabitacion;
  disponible: boolean;
  precio_por_noche: number;
  capacidad: number;
  imagen_principal: string;
}

@Component({
  selector: 'app-reservar-wizard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservar.html',
  styleUrls: ['./reservar.css'],
})
export class ReservarWizard {
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

  // --- Paso Habitación ---
  readonly tiposHabitacion: TipoHabitacion[] = ['Simple', 'Doble', 'Familiar', 'Suite'];

  // TODO: reemplazar por la disponibilidad y datos reales que vengan del backend (Django) según las fechas elegidas
  readonly habitaciones: Habitacion[] = [
    { numero: '101', tipo: 'Simple', disponible: true, precio_por_noche: 120, capacidad: 2, imagen_principal: '/habitaciones/101.jpg' },
    { numero: '102', tipo: 'Simple', disponible: false, precio_por_noche: 120, capacidad: 2, imagen_principal: '/habitaciones/102.jpg' },
    { numero: '201', tipo: 'Doble', disponible: true, precio_por_noche: 180, capacidad: 3, imagen_principal: '/habitaciones/201.jpg' },
    { numero: '202', tipo: 'Doble', disponible: false, precio_por_noche: 180, capacidad: 3, imagen_principal: '/habitaciones/202.jpg' },
    { numero: '203', tipo: 'Doble', disponible: true, precio_por_noche: 180, capacidad: 3, imagen_principal: '/habitaciones/203.jpg' },
    { numero: '301', tipo: 'Familiar', disponible: true, precio_por_noche: 250, capacidad: 5, imagen_principal: '/habitaciones/301.jpg' },
    { numero: '302', tipo: 'Familiar', disponible: false, precio_por_noche: 250, capacidad: 5, imagen_principal: '/habitaciones/302.jpg' },
    { numero: '401', tipo: 'Suite', disponible: true, precio_por_noche: 320, capacidad: 2, imagen_principal: '/habitaciones/401.jpg' },
    { numero: '402', tipo: 'Suite', disponible: false, precio_por_noche: 320, capacidad: 2, imagen_principal: '/habitaciones/402.jpg' },
    { numero: '403', tipo: 'Suite', disponible: true, precio_por_noche: 320, capacidad: 2, imagen_principal: '/habitaciones/403.jpg' },
  ];



  tipoSeleccionado = signal<TipoHabitacion | null>(null);
  habitacionSeleccionada = signal<Habitacion | null>(null);

  habitacionesDelTipo = computed(() =>
    this.habitaciones.filter((h) => h.tipo === this.tipoSeleccionado())
  );

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

    // Sin llegada, o ya había un rango completo: empieza una selección nueva
    if (!llegada || (llegada && this.fechaSalida())) {
      this.fechaLlegada.set(fecha);
      this.fechaSalida.set(null);
      return;
    }

    // Ya hay llegada, falta la salida
    if (fecha.getTime() > llegada.getTime()) {
      this.fechaSalida.set(fecha);
    } else if (fecha.getTime() < llegada.getTime()) {
      this.fechaLlegada.set(fecha);
      this.fechaSalida.set(null);
    }
    // Mismo día que la llegada: no se permite una estancia de 0 noches, no hace nada
  }

  esLlegada(dia: DiaCalendario | null): boolean {
    return !!dia && this.esMismoDia(dia.fecha, this.fechaLlegada());
  }

  esSalida(dia: DiaCalendario | null): boolean {
    return !!dia && this.esMismoDia(dia.fecha, this.fechaSalida());
  }

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
    if (!habitacion.disponible) return;
    this.habitacionSeleccionada.set(habitacion);
  }

  actualizarNombre(event: Event): void {
    this.nombreCliente.set((event.target as HTMLInputElement).value);
  }

  actualizarCorreo(event: Event): void {
    this.correoCliente.set((event.target as HTMLInputElement).value);
  }

  actualizarTelefono(event: Event): void {
    this.telefonoCliente.set((event.target as HTMLInputElement).value);
  }

  confirmarReserva(): void {
    if (!this.datosCompletos()) return;
    this.codigoReserva.set(this.generarCodigoReserva());
    this.reservaConfirmada.set(true);
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
  }

  generarFacturaPDF(): void {
    const habitacion = this.habitacionSeleccionada();
    if (!habitacion) return;

    const doc = new jsPDF();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Cátaga Club', 20, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Comprobante de Reserva', 20, 28);
    doc.line(20, 33, 190, 33);

    let y = 44;
    const fila = (etiqueta: string, valor: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(etiqueta, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(valor, 85, y);
      y += 8;
    };

    fila('Código de reserva:', this.codigoReserva());
    fila('Fecha de emisión:', new Date().toLocaleDateString('es-PE'));
    y += 3;
    fila('Cliente:', this.nombreCliente());
    fila('Correo:', this.correoCliente());
    fila('Teléfono:', this.telefonoCliente());
    y += 3;
    fila('Personas:', String(this.personas() ?? '-'));
    fila('Llegada:', this.formatearFecha(this.fechaLlegada()));
    fila('Salida:', this.formatearFecha(this.fechaSalida()));
    fila('Noches:', String(this.noches()));
    fila('Habitación:', `${habitacion.tipo} — N.º ${habitacion.numero}`);
    fila('Precio por noche:', `S/ ${habitacion.precio_por_noche}`);

    y += 2;
    doc.line(20, y, 190, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Total a pagar:', 20, y);
    doc.text(`S/ ${this.total()}`, 85, y);

    doc.save(`factura-${this.codigoReserva()}.pdf`);
  }

  private generarCodigoReserva(): string {
    const aleatorio = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CTG-${aleatorio}`;
  }

  private primerDiaDe(fecha: Date): Date {
    return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  }

  private sumarMeses(fecha: Date, cantidad: number): Date {
    return new Date(fecha.getFullYear(), fecha.getMonth() + cantidad, 1);
  }

  private esMismoDia(a: Date | null, b: Date | null): boolean {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  private diasDelMes(mes: Date): (DiaCalendario | null)[] {
    const anio = mes.getFullYear();
    const mesIndice = mes.getMonth();
    const primerDia = new Date(anio, mesIndice, 1);
    const totalDias = new Date(anio, mesIndice + 1, 0).getDate();

    // getDay(): 0=Domingo..6=Sábado. Se ajusta para que Lunes sea la primera columna.
    const desplazamiento = (primerDia.getDay() + 6) % 7;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const celdas: (DiaCalendario | null)[] = [];
    for (let i = 0; i < desplazamiento; i++) {
      celdas.push(null);
    }
    for (let d = 1; d <= totalDias; d++) {
      const fecha = new Date(anio, mesIndice, d);
      celdas.push({ fecha, numero: d, deshabilitado: fecha.getTime() < hoy.getTime() });
    }
    return celdas;
  }

  /** Condición de completitud por paso. Se va llenando a medida que construimos cada paso. */
  pasoCompleto(): boolean {
    switch (this.pasoActual()) {
      case 0:
        return this.personas() !== null && this.personas()! > 0;
      case 1:
        return this.fechaLlegada() !== null && this.fechaSalida() !== null;
      case 2:
        return this.habitacionSeleccionada() !== null;
      case 3:
        return this.datosCompletos();
      default:
        return true;
    }
  }

  irSiguiente(): void {
    if (!this.pasoCompleto()) return;
    if (this.pasoActual() < this.pasos.length - 1) {
      this.pasoActual.update((p) => p + 1);
    }
  }

  irAtras(): void {
    if (this.pasoActual() > 0) {
      this.pasoActual.update((p) => p - 1);
    }
  }
}
