import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-proveedor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proveedor.html',
  styleUrls: ['./proveedor.css'],
})
export class Proveedor implements OnInit {
  private router = inject(Router);

  nombre = '';
  empresa = '';
  estado = '';

  ngOnInit() {
    const raw = localStorage.getItem('usuario');

    // 🧠 Si no hay sesión → al login
    if (!raw) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const u = JSON.parse(raw);

      // 🔐 Si no es proveedor → login
      if (u.rol !== 'PROVEEDOR') {
        this.router.navigate(['/login']);
        return;
      }

      // 🟡 Si está pendiente → aviso y login
      if (u.estado === 'PENDIENTE') {
        alert('Tu solicitud de proveedor aún está en revisión.');
        this.router.navigate(['/login']);
        return;
      }

      // ✅ Si pasa todo → guarda datos
      this.nombre = u.nombre ?? u.name ?? '';
      this.empresa =
        u.empresa ??
        u.nombreEmpresa ??
        u.nombre_empresa ??
        u.razonSocial ??
        u.nombre_o_razon_social ??
        '';
      this.estado = u.estado ?? '';
    } catch {
      this.router.navigate(['/login']);
    }
  }

  cerrarSesion() {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
