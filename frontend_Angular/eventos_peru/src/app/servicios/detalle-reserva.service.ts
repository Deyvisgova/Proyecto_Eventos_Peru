import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetalleReserva } from '../modelos/reserva';

@Injectable({ providedIn: 'root' })
export class DetalleReservaService {
  private http = inject(HttpClient);
  private api = 'http://localhost:8080/api/detalles';

  listarPorReserva(idReserva: number): Observable<DetalleReserva[]> {
    return this.http.get<DetalleReserva[]>(`${this.api}/reserva/${idReserva}`);
  }
}
