import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contenido-principal',
  standalone: true,
  templateUrl: './contenido-principal.html',
  styleUrl: './contenido-principal.css',
})
export class ContenidoPrincipal {
  constructor(private router: Router) {}

  // 🔹 Función que se ejecuta al hacer clic en “Ver más”
  verEvento(tipoEvento: string) {
    const raw = localStorage.getItem('usuario');

    // 🟥 Si no hay sesión → enviamos al login
    if (!raw) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const usuario = JSON.parse(raw);

      // 🟥 Si el usuario no es cliente → también lo mandamos al login
      if (usuario.rol !== 'CLIENTE') {
        alert('Solo los clientes pueden acceder a los eventos.');
        this.router.navigate(['/login']);
        return;
      }

      // 🟢 Si pasa la validación, guardamos el tipo de evento y navegamos
      localStorage.setItem('tipoEventoSeleccionado', tipoEvento);
      this.router.navigate([`/cliente/evento/${tipoEvento.toLowerCase()}`]);
    } catch {
      alert('Ocurrió un error con tu sesión. Inicia sesión nuevamente.');
      this.router.navigate(['/login']);
    }
  }
}
