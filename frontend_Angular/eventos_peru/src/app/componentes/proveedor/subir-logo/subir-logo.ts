import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProveedorService } from '../../../servicios/proveedor.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-subir-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subir-logo.html',
  styleUrls: ['./subir-logo.css'],
})
export class SubirLogo implements OnInit {
  private proveedorSrv = inject(ProveedorService);
  private router = inject(Router);

  idProveedor: number | null = null;
  seleccion?: File;
  mensaje = '';
  subiendo = false;

  ngOnInit(): void {
    const raw = localStorage.getItem('usuario');
    if (!raw) {
      this.router.navigate(['/login']);
      return;
    }

    const usuario = JSON.parse(raw);
    if (usuario.rol !== 'PROVEEDOR') {
      this.router.navigate(['/login']);
      return;
    }

    const idUsuario =
      usuario?.idUsuario ?? usuario?.id_usuario ?? usuario?.usuario?.idUsuario ?? usuario?.usuario?.id_usuario;
    if (!idUsuario) {
      this.router.navigate(['/login']);
      return;
    }

    this.proveedorSrv.obtenerPorUsuario(Number(idUsuario)).subscribe({
      next: (prov) => {
        this.idProveedor = prov?.idProveedor ?? prov?.id_proveedor ?? null;
      },
      error: () => (this.mensaje = 'No pudimos obtener tus datos de proveedor.'),
    });
  }

  manejarArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.seleccion = file ?? undefined;
    this.mensaje = '';
  }

  subir() {
    if (!this.idProveedor || !this.seleccion) {
      this.mensaje = 'Selecciona un archivo válido.';
      return;
    }
    this.subiendo = true;
    this.mensaje = '';

    this.proveedorSrv.subirLogo(this.idProveedor, this.seleccion).subscribe({
      next: (resp) => {
        this.mensaje = `Logo guardado en: ${resp.path}`;
        this.seleccion = undefined;
      },
      error: () => (this.mensaje = 'No pudimos subir tu logo, intenta nuevamente.'),
      complete: () => (this.subiendo = false),
    });
  }
}
