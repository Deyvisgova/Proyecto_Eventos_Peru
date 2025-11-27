import { ProveedorBasico } from './proveedor-servicio';
import { Usuario } from './usuario';
import { Servicio } from './servicio';

type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA';

export interface Reserva {
  idReserva: number;
  cliente: Usuario;
  proveedor: ProveedorBasico;
  fechaEvento: string;
  estado: EstadoReserva;
  fechaReserva?: string;
  fechaConfirmacion?: string;
  fechaLimiteRechazo?: string;
  fechaRechazo?: string;
}

export interface DetalleReserva {
  idDetalle: number;
  reserva: { idReserva: number };
  servicio: Servicio;
  cantidad: number;
  precioUnitario: number;
}
