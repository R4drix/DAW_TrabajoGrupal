export interface User {
  nombre: string,
  email: string,
  membresia: string,
  reservasActivas: string,
  permisoAdmin: boolean,
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface LoginResponse {
  ok: boolean;
  user?: AuthUser;
  error?: string;
}
export interface Habitacion {
  id: number;
  numero: number;
  tipo: string;
  precio_por_noche: number;
  esta_ocupada: boolean;
  capacidad: number;
  imagen_principal: string;
  imagen_cama: string;
  imagen_bano: string;
  imagen_extra: string;
}

export interface Camara {
  id: number;
  tipo: string;
  descripcion: string;
  capacidad: number;
  icon_class: string;
}

/**
 * TODO(backend): el modelo Camara aún no tiene un campo de ocupación
 * ni un endpoint que lo exponga. Esta interfaz extiende Camara con el
 * campo que vamos a necesitar (`esta_ocupada`) para que, cuando exista
 * el endpoint real, solo haya que apuntar ApiService ahí y borrar el
 * mock en AdminSaunas.
 */
export interface CamaraEstado extends Camara {
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
