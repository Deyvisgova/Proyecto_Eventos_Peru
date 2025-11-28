import { CatalogoServicio } from './catalogo-servicio';

export type EstadoProveedorServicio = 'ACTIVO' | 'PAUSADO';
export type EstadoServicioOpcion = 'ACTIVO' | 'NO_DISPONIBLE';

export interface ProveedorBasico {
  idProveedor: number;
  nombre?: string;
  nombreEmpresa?: string;
  direccion?: string;
  logo?: string;
  urlLogo?: string;
  usuario?: {
    celular?: string;
    email?: string;
  };
}

export interface ProveedorServicio {
  idProveedorServicio: number;
  proveedor: ProveedorBasico;
  catalogoServicio: CatalogoServicio;
  nombrePublico: string;
  descripcionGeneral?: string;
  urlFoto?: string;
  estado: EstadoProveedorServicio;
}

export interface ServicioOpcion {
  idOpcion: number;
  proveedorServicio: { idProveedorServicio: number };
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
  urlFoto?: string;
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
