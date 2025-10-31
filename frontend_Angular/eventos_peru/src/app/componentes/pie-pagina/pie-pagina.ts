import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
@Component({
  selector: 'app-pie-pagina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pie-pagina.html',
  styleUrl: './pie-pagina.css',
})
export class PiePagina {
  showFooter = true;
  yearActual = new Date().getFullYear(); // ✅ CORRECTO

  private getRol(): string {
    const raw = localStorage.getItem('usuario');
    if (!raw) return 'ANON';
    try {
      const u = JSON.parse(raw);
      // adapta si tu login guarda 'rol'
      return (u.rol || u.role || '').toUpperCase();
    } catch {
      return 'ANON';
    }
  }
  constructor(private router: Router) {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      const url = this.router.url;
      this.showFooter = !(
        url.startsWith('/admin') ||
        url.startsWith('/administrador') ||
        url.startsWith('/proveedor') ||
        url.startsWith('/panel-admin')
      );
    });
  }
  // 👇
  irARegistroProveedor(): void {
    const rol = this.getRol();

    if (rol === 'ANON') {
      alert('Debes iniciar sesión primero para registrarte como proveedor.');
      this.router.navigate(['/login']);
      return;
    }
    // bloquear si NO es cliente
    if (rol === 'ADMIN' || rol === 'PROVEEDOR') {
      alert('Esta inscripción es solo para CLIENTES.');
      return;
    }

    // cliente: permitir
    this.router.navigate(['/registro-proveedor']);
  }
}
