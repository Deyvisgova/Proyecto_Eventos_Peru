import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar {
  showNavbar = true;
  isLoggedIn = false;
  nombre = '';
  rol = '';

  constructor(private router: Router) {
    this.verificarSesion();

    // 🔁 Escuchar cambios de ruta (por si el login cambia el estado)
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.verificarSesion();
      const url = this.router.url;
      const enPanel = url.startsWith('/admin') || url.startsWith('/proveedor');
      this.showNavbar = !enPanel; // oculta si es panel
    });
  }

  // 🧠 Verifica si hay sesión activa
  verificarSesion() {
    const raw = localStorage.getItem('usuario');
    if (raw) {
      try {
        const user = JSON.parse(raw);
        this.isLoggedIn = true;
        this.nombre = user.nombre ?? '';
        this.rol = user.rol ?? '';
      } catch {
        this.isLoggedIn = false;
        this.nombre = '';
        this.rol = '';
      }
    } else {
      this.isLoggedIn = false;
      this.nombre = '';
      this.rol = '';
    }
  }

  // 🔴 Cierra sesión
  cerrarSesion() {
    localStorage.clear();
    sessionStorage.clear();
    this.isLoggedIn = false;
    this.nombre = '';
    this.router.navigate(['/login']);
  }

  goPanel() {
    if (this.rol === 'PROVEEDOR') {
      this.router.navigate(['/proveedor']);
    } else if (this.rol === 'ADMIN') {
      this.router.navigate(['/administrador']);
    }
  }
}
