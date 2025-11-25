import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ProveedorServicio,
  ProveedorServicioRequest,
  ServicioOpcion,
  ServicioOpcionRequest,
} from '../modelos/proveedor-servicio';
import { EstadoProveedorServicio, EstadoServicioOpcion } from '../modelos/proveedor-servicio';

@Injectable({ providedIn: 'root' })
export class ProveedorServicioService {
  private http = inject(HttpClient);
  private api = 'http://localhost:8080/api/proveedor-servicios';

  listarPorProveedor(idProveedor: number): Observable<ProveedorServicio[]> {
    return this.http.get<ProveedorServicio[]>(`${this.api}/proveedor/${idProveedor}`);
  }

  crearOferta(dto: ProveedorServicioRequest): Observable<ProveedorServicio> {
    return this.http.post<ProveedorServicio>(this.api, dto);
  }

  actualizarOferta(id: number, dto: ProveedorServicioRequest): Observable<ProveedorServicio> {
    return this.http.put<ProveedorServicio>(`${this.api}/${id}`, dto);
  }

  cambiarEstadoOferta(id: number, estado: EstadoProveedorServicio): Observable<ProveedorServicio> {
    const params = new HttpParams().set('estado', estado);
    return this.http.put<ProveedorServicio>(`${this.api}/${id}/estado`, null, { params });
  }

  listarOpciones(idProveedorServicio: number): Observable<ServicioOpcion[]> {
    return this.http.get<ServicioOpcion[]>(`${this.api}/${idProveedorServicio}/opciones`);
  }

  crearOpcion(idProveedorServicio: number, dto: ServicioOpcionRequest): Observable<ServicioOpcion> {
    return this.http.post<ServicioOpcion>(`${this.api}/${idProveedorServicio}/opciones`, dto);
  }

  cambiarEstadoOpcion(idOpcion: number, estado: EstadoServicioOpcion): Observable<ServicioOpcion> {
    const params = new HttpParams().set('estado', estado);
    return this.http.put<ServicioOpcion>(`${this.api}/opciones/${idOpcion}/estado`, null, { params });
  }
}
