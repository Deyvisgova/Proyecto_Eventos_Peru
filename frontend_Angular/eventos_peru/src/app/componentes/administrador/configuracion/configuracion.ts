import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface PreferenciasAdmin {
  notificaciones: boolean;
  resaltarNuevos: boolean;
  modoOscuro: boolean;
  recordatorios: boolean;
}

@Component({
  selector: 'app-configuracion-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.html',
  styleUrls: ['./configuracion.css'],
})
export class ConfiguracionAdmin {
  preferencias: PreferenciasAdmin = {
    notificaciones: true,
    resaltarNuevos: true,
    modoOscuro: false,
    recordatorios: true,
  };

  constructor() {
    this.cargarPreferencias();
  }

  toggle(clave: keyof PreferenciasAdmin): void {
    this.preferencias[clave] = !this.preferencias[clave];
    this.guardar();
  }

  guardar(): void {
    localStorage.setItem('admin-preferencias', JSON.stringify(this.preferencias));
  }

  cargarPreferencias(): void {
    const guardadas = localStorage.getItem('admin-preferencias');
    if (guardadas) {
      this.preferencias = { ...this.preferencias, ...JSON.parse(guardadas) };
    }
  }
}
