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

  modalAbierto = false;
  modalEstado: Estado | null = null;
  modalProveedor: ProveedorView | null = null;
  modalAsunto = '';
  modalMensaje = '';
  modalError = '';
  modalEnviando = false;

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
  private actualizarEstado(id: number, estado: Estado, payload?: Record<string, any>) {
    this.cargando = true;
    this.error = '';
    const body = { estado, ...(payload ?? {}) };
    return this.http.put<any>(`${this.API}/${id}/estado`, body);
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
    this.abrirModal(p, 'APROBADO');
  }

  rechazar(p: ProveedorView) {
    this.abrirModal(p, 'RECHAZADO');
  }

  private abrirModal(proveedor: ProveedorView, estado: Estado) {
    this.modalProveedor = proveedor;
    this.modalEstado = estado;
    this.modalEnviando = false;
    this.modalError = '';
    this.modalAsunto = this.generarAsuntoPorEstado(estado);
    this.modalMensaje = estado === 'APROBADO' ? this.generarMensajeBienvenida(proveedor) : '';
    this.modalAbierto = true;
  }

  cerrarModalAccion() {
    this.modalAbierto = false;
    this.modalProveedor = null;
    this.modalEstado = null;
    this.modalMensaje = '';
    this.modalError = '';
  }

  confirmarCambioEstado() {
    if (!this.modalProveedor || !this.modalEstado) {
      return;
    }
    const mensaje = this.modalMensaje.trim();
    if (!mensaje) {
      this.modalError =
        this.modalEstado === 'RECHAZADO'
          ? 'Por favor indica los motivos del rechazo.'
          : 'El mensaje no puede estar vacío.';
      return;
    }

    const asunto = this.modalAsunto.trim() || this.generarAsuntoPorEstado(this.modalEstado);
    this.modalError = '';
    this.modalEnviando = true;

    const proveedorObjetivo = this.modalProveedor as ProveedorView;
    const estadoObjetivo = this.modalEstado as Estado;

    this.actualizarEstado(proveedorObjetivo.id, estadoObjetivo, {
      asunto,
      mensaje,
    }).subscribe({
      next: (resp) => {
        const actualizado = this.extraerProveedorActualizado(resp);
        const actualizadoLocal = this.actualizarEnMemoria(
          proveedorObjetivo,
          estadoObjetivo,
          actualizado ?? undefined
        );
        if (actualizadoLocal) {
          this.cargando = false;
        }
        this.modalEnviando = false;
        this.cerrarModalAccion();
        const texto =
          estadoObjetivo === 'APROBADO'
            ? 'Proveedor aprobado y correo de bienvenida enviado.'
            : 'Proveedor rechazado y correo notificado.';
        const tipo: TipoMensaje = estadoObjetivo === 'APROBADO' ? 'success' : 'info';
        this.mostrarMensaje(texto, tipo);
      },
      error: () => {
        this.cargando = false;
        this.modalEnviando = false;
        this.modalError = 'No se pudo completar la acción. Inténtalo nuevamente.';
        this.mostrarMensaje('No se pudo actualizar el estado del proveedor.', 'danger');
      },
    });
  }

  private generarAsuntoPorEstado(estado: Estado) {
    if (estado === 'APROBADO') {
      return 'Bienvenido a Eventos Perú';
    }
    if (estado === 'RECHAZADO') {
      return 'Actualización sobre tu registro';
    }
    return 'Actualización de estado';
  }

  private generarMensajeBienvenida(proveedor: ProveedorView) {
    const empresa = proveedor.razonSocial || 'socio';
    return `Hola ${empresa},\n\n¡Bienvenido a Eventos Perú! Tu registro ya fue aprobado. Desde ahora puedes ingresar al panel del proveedor, publicar tus servicios y responder a los clientes.\n\nGracias por confiar en nosotros.\nEquipo de Eventos Perú.`;
  }
}
