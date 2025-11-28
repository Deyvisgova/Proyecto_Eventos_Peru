import { ProveedorBasico, ServicioOpcion } from './proveedor-servicio';
import { Usuario } from './usuario';

type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'RECHAZADA';

export interface Reserva {
  idReserva: number;
  cliente?: Usuario | null;
  proveedor?: ProveedorBasico | null;
  evento?: { idEvento: number } | null;
  fechaEvento: string | Date;
  estado: EstadoReserva;
  fechaReserva?: string | null;
  fechaConfirmacion?: string | null;
  fechaLimiteRechazo?: string | null;
  fechaRechazo?: string | null;
}

export interface DetalleReserva {
  idDetalle: number;
  reserva: { idReserva: number };
  opcion: ServicioOpcion;
  cantidad: number;
  precioUnitario: number;
}
