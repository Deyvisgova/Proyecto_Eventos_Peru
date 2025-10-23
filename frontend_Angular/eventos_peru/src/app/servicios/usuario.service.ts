import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../modelos/usuario'; // Modelo de datos

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  // ✅ URL base de la API (ya confirmada)
  private apiUrl = 'http://localhost:8080/api/usuarios';

  constructor(private http: HttpClient) {}

  // ==============================
  // 🔹 OBTENER TODOS LOS USUARIOS
  // ==============================
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  // ==============================
  // 🔹 AGREGAR NUEVO USUARIO
  // ==============================
  agregarUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  // ==============================
  // 🔹 ACTUALIZAR USUARIO EXISTENTE
  // ==============================
  actualizarUsuario(id: number, usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario);
  }

  // ==============================
  // 🔹 ELIMINAR USUARIO POR ID
  // ==============================
  eliminarUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
