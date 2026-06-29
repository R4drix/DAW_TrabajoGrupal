export interface Habitacion {
  id: number;
  numero: number;
  tipo: string;
  precio_por_noche: number;
  capacidad: number;
  esta_ocupada: boolean;
}

export interface Reserva {
  id: number;
  cliente: string;
  habitacion: number;
  checkin: string;
  checkout: string;
  estado: 'activa' | 'finalizada' | 'cancelada';
  total: number;
}

export interface Consumo {
  id: number;
  cliente: string;
  plato: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  fecha: string;
}

export interface Dashboard {
  clientes: number;
  habitaciones_total: number;
  habitaciones_ocupadas: number;
  reservas_activas: number;
  ingresos_restaurante_hoy: number;
  consumos_hoy: number;
}

export interface ApiResponse<T> {
  ok: boolean;
  count?: number;
  [key: string]: any;
}