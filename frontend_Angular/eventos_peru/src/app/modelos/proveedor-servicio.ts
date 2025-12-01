import { CatalogoServicio } from './catalogo-servicio';
import { Evento } from './evento';

export type EstadoProveedorServicio = 'ACTIVO' | 'PAUSADO';
export type EstadoServicioOpcion = 'ACTIVO' | 'NO_DISPONIBLE';

export interface ProveedorBasico {
  idProveedor: number;
  nombre?: string;
  nombreEmpresa?: string;
  direccion?: string;
  logo?: string;
  urlLogo?: string;
  logoUrl?: string;
  logo_url?: string;
  usuario?: {
    celular?: string;
    email?: string;
  };
}

export interface ProveedorServicio {
  idProveedorServicio: number;
  proveedor: ProveedorBasico;
  catalogoServicio: CatalogoServicio & { evento?: Evento };
  nombrePublico: string;
  descripcionGeneral?: string;
  estado: EstadoProveedorServicio;
}

type ProveedorServicioLigero = {
  idProveedorServicio: number;
  catalogoServicio?: CatalogoServicio & { evento?: Evento };
  nombrePublico?: string;
};

export interface ServicioOpcion {
  idOpcion: number;
  proveedorServicio?: ProveedorServicioLigero | (ProveedorServicio & { catalogoServicio?: CatalogoServicio & { evento?: Evento } });
  nombreOpcion: string;
  descripcion?: string;
  precio: number;
  duracionMinutos?: number;
  stock?: number;
  urlFoto?: string;
  estado: EstadoServicioOpcion;
}

export interface ProveedorServicioRequest {
  idProveedor: number;
  idCatalogo: number;
  nombrePublico: string;
  descripcionGeneral?: string;
}

export interface ServicioOpcionRequest {
  idProveedorServicio?: number;
  nombreOpcion: string;
  descripcion?: string;
  precio: number;
  duracionMinutos?: number;
  stock?: number;
  urlFoto?: string;
}
