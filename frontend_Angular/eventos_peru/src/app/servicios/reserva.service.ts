import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reserva } from '../modelos/reserva';

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private http = inject(HttpClient);
  private api = 'http://localhost:8080/api/reservas';

  listar(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(this.api);
  }

  listarPorCliente(idCliente: number): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.api}/cliente/${idCliente}`);
  }

  listarPorProveedor(idProveedor: number): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.api}/proveedor/${idProveedor}`);
  }

  confirmar(idReserva: number): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.api}/${idReserva}/confirmar`, {});
  }

  rechazar(idReserva: number): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.api}/${idReserva}/rechazar`, {});
  }
}
