import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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

type TipoMensaje = 'success' | 'danger' | 'info';

interface Mensaje {
  texto: string;
  tipo: TipoMensaje;
}

@Component({
  standalone: true,
  selector: 'app-proveedores',
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.html',
})
export class Proveedores implements OnInit, OnDestroy {
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
  mensaje: Mensaje | null = null;

  private mensajeTimer?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.limpiarMensaje();
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
  private actualizarEstado(id: number, estado: Estado) {
    this.cargando = true;
    this.error = '';
    return this.http.put<any>(`${this.API}/${id}/estado`, { estado });
  }

  private mostrarMensaje(texto: string, tipo: TipoMensaje = 'info') {
    this.limpiarMensaje();
    this.mensaje = { texto, tipo };
    this.mensajeTimer = setTimeout(() => {
      this.cerrarMensaje();
    }, 4000);
  }

  cerrarMensaje() {
    this.limpiarMensaje();
    this.mensaje = null;
  }

  private limpiarMensaje() {
    if (this.mensajeTimer) {
      clearTimeout(this.mensajeTimer);
      this.mensajeTimer = undefined;
    }
  }

  private extraerProveedorActualizado(resp: any): ProveedorView | null {
    if (!resp) return null;

    if (Array.isArray(resp)) {
      return resp.length ? this.normalize(resp[0]) : null;
    }

    const posibleProveedor = resp.proveedor ?? resp.data ?? resp;
    if (typeof posibleProveedor !== 'object' || posibleProveedor === null) {
      return null;
    }

    try {
      return this.normalize(posibleProveedor);
    } catch {
      return null;
    }
  }

  private actualizarEnMemoria(
    original: ProveedorView,
    estado: Estado,
    reemplazo?: ProveedorView
  ): boolean {
    const idObjetivo = reemplazo?.id ?? original.id;
    const indice = this.proveedores.findIndex((prov) => prov.id === idObjetivo);
    if (indice === -1) {
      this.cargar();
      return false;
    }

    const base = reemplazo ?? this.proveedores[indice];
    const actualizado: ProveedorView = {
      ...base,
      id: base.id ?? original.id,
      estado,
    };

    const copia = [...this.proveedores];
    copia[indice] = actualizado;
    this.proveedores = copia.sort(this.ordenarDesc);
    return true;
  }

  aprobar(p: ProveedorView) {
    this.actualizarEstado(p.id, 'APROBADO').subscribe({
      next: (resp) => {
        const actualizado = this.extraerProveedorActualizado(resp);
        const actualizadoLocal = this.actualizarEnMemoria(p, 'APROBADO', actualizado ?? undefined);
        if (actualizadoLocal) {
          this.cargando = false;
        }
        this.mostrarMensaje('Proveedor aprobado correctamente.', 'success');
      },
      error: () => {
        this.cargando = false;
        this.error = 'No se pudo aprobar.';
        this.mostrarMensaje('No se pudo aprobar al proveedor.', 'danger');
      },
    });
  }

  rechazar(p: ProveedorView) {
    this.actualizarEstado(p.id, 'RECHAZADO').subscribe({
      next: (resp) => {
        const actualizado = this.extraerProveedorActualizado(resp);
        const actualizadoLocal = this.actualizarEnMemoria(p, 'RECHAZADO', actualizado ?? undefined);
        if (actualizadoLocal) {
          this.cargando = false;
        }
        this.mostrarMensaje('Proveedor rechazado.', 'info');
      },
      error: () => {
        this.cargando = false;
        this.error = 'No se pudo rechazar.';
        this.mostrarMensaje('No se pudo rechazar al proveedor.', 'danger');
      },
    });
  }
}
