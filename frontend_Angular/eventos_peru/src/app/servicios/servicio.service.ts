import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Servicio } from '../modelos/servicio';

@Injectable({ providedIn: 'root' })
export class ServicioService {
  private http = inject(HttpClient);
  private api = 'http://localhost:8080/api/servicios';

  listar(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(this.api);
  }
}
