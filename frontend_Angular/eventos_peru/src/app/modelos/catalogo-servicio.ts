export type EstadoCatalogo = 'ACTIVO' | 'PENDIENTE' | 'RECHAZADO';
export type FuenteCatalogo = 'ADMIN' | 'PROVEEDOR';

export interface CatalogoServicio {
  idCatalogo: number;
  nombre: string;
  descripcion?: string;
  estado: EstadoCatalogo;
  creadoPor: FuenteCatalogo;
  fechaCreacion?: string;
  fechaRevision?: string;
  idAdminRevisor?: number;
  idProveedorSolicitante?: number;
  motivoRechazo?: string;
}

export interface NuevoCatalogoServicioRequest {
  nombre: string;
  descripcion?: string;
  idProveedorSolicitante?: number;
  idEventos?: number[];
}

export interface ModeracionCatalogoRequest {
  idAdminRevisor?: number;
  motivoRechazo?: string;
}
