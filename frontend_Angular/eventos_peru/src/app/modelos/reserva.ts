import { ProveedorBasico } from './proveedor-servicio';
import { Usuario } from './usuario';
import { ServicioOpcion } from './proveedor-servicio';
import { Evento } from './evento';
import { CatalogoServicio } from './catalogo-servicio';

type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'RECHAZADA';

export interface Reserva {
  idReserva: number;
  cliente?: Usuario | null;
  evento?: Evento | null;
  proveedor?: ProveedorBasico | null;
  fechaEvento: string | Date;
  estado: EstadoReserva;
  fechaReserva?: string | null;
  fechaConfirmacion?: string | null;
  fechaLimiteRechazo?: string | null;
  fechaRechazo?: string | null;
  detalles?: DetalleReserva[];
}

export interface DetalleReserva {
  idDetalle?: number;
  reserva?: { idReserva: number };
  servicio?: Partial<CatalogoServicio> | null;
  opcion?: { idOpcion: number } | ServicioOpcion | null;
  cantidad: number;
  precioUnitario: number;
  nombreEvento?: string;
  nombreServicio?: string;
  nombreOpcion?: string;
  nombreCliente?: string;
  telefonoCliente?: string;
  fechaEvento?: string | Date;
  subtotal?: number;
  total?: number;
}
