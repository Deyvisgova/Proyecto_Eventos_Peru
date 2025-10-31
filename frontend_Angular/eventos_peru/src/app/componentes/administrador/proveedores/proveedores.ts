import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

type Estado = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

interface ProveedorView {
  id: number;
  razonSocial: string;
  ruc: string;
  email: string;
  estado: Estado;
  createdAt?: string;
}

@Component({
  standalone: true,
  selector: 'app-proveedores',
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.html',
})
export class Proveedores implements OnInit {
  private http = inject(HttpClient);

  // 🔹 Comparador para ordenar lo más nuevo arriba
  private ordenarDesc = (a: ProveedorView, b: ProveedorView) =>
    (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || b.id - a.id;

  // 👉 Cambia esta URL si tu backend usa otra ruta/base o prefijo.
  private API = 'http://localhost:8080/api/proveedores';

  filtro = '';
  estado: '' | Estado = '';
  cargando = false;
  error = '';
  proveedores: ProveedorView[] = [];

  ngOnInit() {
    this.cargar();
  }

  private normalize(d: any): ProveedorView {
    // Acepta varios nombres posibles (y anidados) sin tocar tu HTML
    const id = d.id ?? d.idProveedor ?? d.proveedorId ?? d.id_proveedor ?? 0;

    const razonSocial = d.razonSocial ?? d.nombreEmpresa ?? d.empresa ?? d.nombre ?? '';

    const ruc = d.ruc ?? d.rucProveedor ?? d.numeroRuc ?? d.ruc_empresa ?? '';

    const email = d.email ?? d.correo ?? d.mail ?? d.usuario?.email ?? d.contacto?.email ?? '';

    const estado: Estado = (d.estado ?? d.estadoProveedor ?? d.status ?? 'PENDIENTE') as Estado;

    const createdAt = d.createdAt ?? d.fechaRegistro ?? d.fechaCreacion ?? d.created_at ?? '';

    return { id, razonSocial, ruc, email, estado, createdAt };
  }

  cargar() {
    this.cargando = true;
    this.error = '';

    this.http.get<any>(this.API).subscribe({
      next: (resp) => {
        // Si tu backend es paginado tipo Spring Page, toma resp.content
        const list = Array.isArray(resp) ? resp : resp?.content ?? [];
        const normalizados = list.map((d: any) => this.normalize(d));

        // Orden: lo más nuevo arriba (por createdAt y de respaldo por id)
        this.proveedores = normalizados.sort(this.ordenarDesc);

        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la lista de proveedores.';
        this.cargando = false;
      },
    });
  }

  proveedoresFiltrados() {
    const t = this.filtro.trim().toLowerCase();
    return this.proveedores.filter(
      (p) =>
        (this.estado ? p.estado === this.estado : true) &&
        (t ? [p.razonSocial, p.ruc, p.email].some((v) => v.toLowerCase().includes(t)) : true)
    );
  }

  // funciones para aprobar y rechazar
  private actualizarEstado(id: number, estado: Estado, motivo?: string) {
    this.cargando = true;
    return this.http.put<any>(`${this.API}/${id}/estado`, { estado, motivo });
  }

  aprobar(p: ProveedorView) {
    this.actualizarEstado(p.id, 'APROBADO').subscribe({
      next: (resp) => {
        // si el backend devuelve el proveedor actualizado, úsalo:
        p.estado = (resp?.estado ?? 'APROBADO') as Estado;
        this.cargando = false;
        // opcional: refrescar todo
        // this.cargar();
        alert('Proveedor aprobado');
      },
      error: () => {
        this.cargando = false;
        alert('No se pudo aprobar.');
      },
    });
  }

  rechazar(p: ProveedorView) {
    const motivo = prompt('Motivo del rechazo (opcional):') || undefined;
    this.actualizarEstado(p.id, 'RECHAZADO', motivo).subscribe({
      next: (resp) => {
        p.estado = (resp?.estado ?? 'RECHAZADO') as Estado;
        this.cargando = false;
        // opcional: refrescar todo
        // this.cargar();
        alert('Proveedor rechazado');
      },
      error: () => {
        this.cargando = false;
        alert('No se pudo rechazar.');
      },
    });
  }
}
