import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProveedorService } from '../../servicios/proveedor.service';

@Component({
  selector: 'app-proveedor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proveedor.html',
  styleUrls: ['./proveedor.css'],
})
export class Proveedor implements OnInit {
  private router = inject(Router);
  private proveedorSrv = inject(ProveedorService);

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
      this.empresa = this.extraerEmpresaLocal(u);
      this.estado = u.estado ?? '';

      const idUsuario = this.extraerIdUsuario(u);
      if (!this.empresa && idUsuario) {
        this.proveedorSrv.obtenerPorUsuario(idUsuario).subscribe({
          next: (prov: any) => {
            if (!prov) return;

            this.empresa =
              prov.nombreEmpresa ??
              prov.nombre_empresa ??
              prov.empresa ??
              '';

            if (!this.estado) {
              this.estado = prov.estado ?? '';
            }
          },
          error: (err) => {
            console.error('[proveedor] No se pudo cargar la empresa', err);
          },
        });
      }
    } catch {
      this.router.navigate(['/login']);
    }
  }

  cerrarSesion() {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  private extraerEmpresaLocal(u: any): string {
    return (
      u?.empresa ??
      u?.nombreEmpresa ??
      u?.nombre_empresa ??
      u?.razonSocial ??
      u?.nombre_o_razon_social ??
      ''
    );
  }

  private extraerIdUsuario(u: any): number | null {
    const rawId =
      u?.idUsuario ??
      u?.id_usuario ??
      u?.usuario?.idUsuario ??
      u?.usuario?.id_usuario ??
      null;

    const id = Number(rawId);
    return Number.isFinite(id) ? id : null;
  }
}
