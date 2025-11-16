export interface ServicioRelacionado {
  id?: number;
  nombre?: string;
}

export interface Servicio {
  idServicio: number;
  nombreServicio: string;
  descripcion?: string;
  precio: number;
  urlFoto?: string;
  proveedor?: ServicioRelacionado & { nombreEmpresa?: string; contacto?: string };
  evento?: ServicioRelacionado & { nombreEvento?: string; tipo?: string };
}
