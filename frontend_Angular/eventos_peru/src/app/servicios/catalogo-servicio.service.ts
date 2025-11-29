import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CatalogoServicio,
  EstadoCatalogo,
  ModeracionCatalogoRequest,
  NuevoCatalogoServicioRequest,
} from '../modelos/catalogo-servicio';
import { CatalogoEventoServicio } from '../modelos/catalogo-evento-servicio';

@Injectable({ providedIn: 'root' })
export class CatalogoServicioService {
  private http = inject(HttpClient);
  private api = 'http://localhost:8080/api/catalogo-servicios';

  listar(estado?: EstadoCatalogo): Observable<CatalogoServicio[]> {
    let params = new HttpParams();
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http.get<CatalogoServicio[]>(this.api, { params });
  }

  listarPendientes(): Observable<CatalogoServicio[]> {
    return this.http.get<CatalogoServicio[]>(`${this.api}/pendientes`);
  }

  listarPorProveedor(idProveedor: number): Observable<CatalogoServicio[]> {
    return this.http.get<CatalogoServicio[]>(`${this.api}/proveedor/${idProveedor}`);
  }

  crearComoAdmin(dto: NuevoCatalogoServicioRequest): Observable<CatalogoServicio> {
    return this.http.post<CatalogoServicio>(`${this.api}/admin`, dto);
  }

  crearComoProveedor(dto: NuevoCatalogoServicioRequest): Observable<CatalogoServicio> {
    return this.http.post<CatalogoServicio>(`${this.api}/proveedor`, dto);
  }

  listarRelaciones(): Observable<CatalogoEventoServicio[]> {
    return this.http.get<CatalogoEventoServicio[]>(`${this.api}/eventos-mapa`);
  }

  actualizarPropuestaProveedor(
    idProveedor: number,
    idCatalogo: number,
    dto: NuevoCatalogoServicioRequest
  ): Observable<CatalogoServicio> {
    return this.http.put<CatalogoServicio>(`${this.api}/proveedor/${idProveedor}/${idCatalogo}`, dto);
  }

  aprobar(id: number, dto: ModeracionCatalogoRequest): Observable<CatalogoServicio> {
    return this.http.put<CatalogoServicio>(`${this.api}/${id}/aprobar`, dto);
  }

  rechazar(id: number, dto: ModeracionCatalogoRequest): Observable<CatalogoServicio> {
    return this.http.put<CatalogoServicio>(`${this.api}/${id}/rechazar`, dto);
  }

  actualizar(
    id: number,
    dto: Partial<Pick<CatalogoServicio, 'nombre' | 'descripcion' | 'estado'>>
  ): Observable<CatalogoServicio> {
    return this.http.put<CatalogoServicio>(`${this.api}/${id}`, dto);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
