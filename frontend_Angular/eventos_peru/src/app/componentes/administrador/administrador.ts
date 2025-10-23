import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-administrador',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './administrador.html',
  styleUrl: './administrador.css',
})
export class Administrador {
  private router = inject(Router);

  nombre = '';

  ngOnInit() {
    const raw = localStorage.getItem('usuario');
    if (!raw) {
      this.router.navigate(['/login']);
      return;
    }
    try {
      const u = JSON.parse(raw);
      if (u.rol !== 'ADMIN') {
        this.router.navigate(['/login']);
        return;
      }
      this.nombre = u.nombre ?? '';
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
