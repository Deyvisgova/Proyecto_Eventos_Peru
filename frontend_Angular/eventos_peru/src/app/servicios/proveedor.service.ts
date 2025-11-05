import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private readonly API = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // 🔹 Proxy del backend para la consulta de RUC
  buscarRuc(ruc: string): Observable<{ nombre_empresa: string; direccion: string }> {
    return this.http.get<{ nombre_empresa: string; direccion: string }>(`${this.API}/ruc/${ruc}`);
  }

  // 🔹 Registrar proveedor (envía datos al backend)
  registrar(dto: any): Observable<any> {
    return this.http.post(`${this.API}/proveedores`, dto);
  }

  // 🔹 Obtener proveedor asociado a un usuario específico
  obtenerPorUsuario(idUsuario: number): Observable<any> {
    return this.http.get(`${this.API}/proveedores/usuario/${idUsuario}`);
  }
}
