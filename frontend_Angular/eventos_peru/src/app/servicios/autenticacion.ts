import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private http = inject(HttpClient);
  private api = 'http://localhost:8080/api/auth';

  registrar(body: { nombre: string; email: string; password: string }) {
    // El backend devuelve texto: "Registro exitoso"
    return this.http.post(`${this.api}/register`, body, { responseType: 'text' });
  }

  login(body: { email: string; password: string }) {
    // El backend responde un JSON con idUsuario, nombre, email, rol
    return this.http.post<{ idUsuario: number; nombre: string; email: string; rol: string }>(
      `${this.api}/login`,
      body
    );
  }
}
