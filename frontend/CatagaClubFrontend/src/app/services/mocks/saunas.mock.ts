import { CamaraEstado } from '../models';

/**
 * MOCK — el backend todavía no tiene endpoint para camaras/saunas
 * ni un campo de ocupación en el modelo `Camara`.
 *
 * Compartido entre `AdminSauna` (vista completa) y `AdminHome`
 * (vista rápida del dashboard) para que ambos muestren los mismos
 * números mientras no exista `ApiService.getEstadoSaunas()`.
 *
 * Cuando ese endpoint exista, borrar este archivo y reemplazar los
 * usos por la llamada real dentro de un `ngOnInit`.
 */
export const MOCK_SAUNAS: CamaraEstado[] = [
  { id: 1, tipo: 'Sauna Finlandesa', descripcion: 'Calor seco, ideal para 4 personas', capacidad: 4, icon_class: 'ti ti-flame', esta_ocupada: true },
  { id: 2, tipo: 'Sauna Húmeda', descripcion: 'Vapor aromático relajante', capacidad: 6, icon_class: 'ti ti-droplet', esta_ocupada: false },
  { id: 3, tipo: 'Sauna Infrarroja', descripcion: 'Calor profundo de bajo impacto', capacidad: 2, icon_class: 'ti ti-sun', esta_ocupada: false },
  { id: 4, tipo: 'Sauna Privada VIP', descripcion: 'Uso exclusivo con jacuzzi', capacidad: 2, icon_class: 'ti ti-crown', esta_ocupada: true },
  { id: 5, tipo: 'Sauna Grupal', descripcion: 'Espacio amplio para grupos', capacidad: 8, icon_class: 'ti ti-users', esta_ocupada: false },
  { id: 6, tipo: 'Sauna Exterior', descripcion: 'Vista al jardín, calor seco', capacidad: 4, icon_class: 'ti ti-trees', esta_ocupada: false },
];
