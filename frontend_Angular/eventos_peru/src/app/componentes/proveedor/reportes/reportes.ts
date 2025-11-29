import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProveedorService } from '../../../servicios/proveedor.service';
import { ProveedorServicioService } from '../../../servicios/proveedor-servicio.service';
import { ReservaService } from '../../../servicios/reserva.service';
import { DetalleReservaService } from '../../../servicios/detalle-reserva.service';
import { ProveedorServicio, ServicioOpcion } from '../../../modelos/proveedor-servicio';
import { DetalleReserva, Reserva } from '../../../modelos/reserva';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-reportes-proveedor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.css'],
})
export class ReportesProveedor implements OnInit {
  private router = inject(Router);
  private proveedorSrv = inject(ProveedorService);
  private proveedorServicioSrv = inject(ProveedorServicioService);
  private reservaSrv = inject(ReservaService);
  private detalleReservaSrv = inject(DetalleReservaService);

  idProveedor: number | null = null;
  servicios: ProveedorServicio[] = [];
  opcionesPorServicio: Record<number, ServicioOpcion[]> = {};
  reservas: Reserva[] = [];
  detallesPorReserva: Record<number, DetalleReserva[]> = {};
  totalMonto = 0;
  cargando = false;
  mensaje = '';

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
        if (this.idProveedor) {
          this.cargarDatos(this.idProveedor);
        }
      },
      error: () => {
        this.mensaje = 'No pudimos obtener tu cuenta de proveedor.';
      },
    });
  }

  recargar(): void {
    if (this.idProveedor) {
      this.cargarDatos(this.idProveedor);
    }
  }

  totalVariantes(): number {
    return Object.values(this.opcionesPorServicio).reduce((acc, lista) => acc + lista.length, 0);
  }

  private cargarDatos(idProveedor: number): void {
    this.cargando = true;
    this.mensaje = '';
    forkJoin({
      servicios: this.proveedorServicioSrv.listarPorProveedor(idProveedor),
      reservas: this.reservaSrv.listarPorProveedor(idProveedor),
    }).subscribe({
      next: ({ servicios, reservas }) => {
        this.servicios = servicios;
        this.reservas = reservas;

        const opciones$ = servicios.length
          ? forkJoin(servicios.map((s) => this.proveedorServicioSrv.listarOpciones(s.idProveedorServicio)))
          : of([] as ServicioOpcion[][]);

        const detalles$ = reservas.length
          ? forkJoin(reservas.map((r) => this.detalleReservaSrv.listarPorReserva(r.idReserva)))
          : of([] as DetalleReserva[][]);

        forkJoin({ opciones: opciones$, detalles: detalles$ }).subscribe({
          next: ({ opciones, detalles }) => {
            this.opcionesPorServicio = {};
            servicios.forEach((s, idx) => {
              this.opcionesPorServicio[s.idProveedorServicio] = opciones[idx] || [];
            });

            this.detallesPorReserva = {};
            this.totalMonto = 0;
            reservas.forEach((r, idx) => {
              const dets = detalles[idx] || [];
              this.detallesPorReserva[r.idReserva] = dets;
              this.totalMonto += dets.reduce(
                (suma, det) => suma + (det.precioUnitario || 0) * (det.cantidad || 1),
                0
              );
            });
            this.cargando = false;
          },
          error: () => {
            this.cargando = false;
            this.mensaje = 'No se pudieron cargar los detalles de variantes o reservas.';
          },
        });
      },
      error: () => {
        this.cargando = false;
        this.mensaje = 'No se pudo preparar la información de reportes.';
      },
    });
  }

  descargarTodo(): void {
    this.descargarComoPdf('reportes-completos.pdf', [this.seccionServicios(), this.seccionReservas()]);
  }

  descargarServicios(): void {
    this.descargarComoPdf('reportes-servicios.pdf', [this.seccionServicios()]);
  }

  descargarReservas(): void {
    this.descargarComoPdf('reportes-reservas.pdf', [this.seccionReservas()]);
  }

  private seccionServicios(): string {
    const listado = this.servicios
      .map((s) => {
        const variantes = (this.opcionesPorServicio[s.idProveedorServicio] || [])
          .map(
            (op) =>
              `    - ${op.nombreOpcion} (S/ ${op.precio}) ${
                op.urlFoto ? `| Imagen: ${op.urlFoto}` : '| Sin imagen'
              }`
          )
          .join('\n');

        return `• ${s.nombrePublico} (${s.catalogoServicio.nombre}) - ${s.estado}\n${
          variantes || '    - Sin variantes registradas'
        }`;
      })
      .join('\n');

    return `Servicios publicados (${this.servicios.length})\n${listado || 'Sin servicios'}`;
  }

  private seccionReservas(): string {
    const listado = this.reservas
      .map((r) => {
        const detalles = this.detallesPorReserva[r.idReserva] || [];
        const variantes = detalles
          .map((d) => `    - ${this.nombreOpcion(d)} x${d.cantidad} (S/ ${d.precioUnitario})`)
          .join('\n');
        return `• Reserva ${r.idReserva} (${r.estado}) - ${r.fechaEvento}\n${
          variantes || '    - Sin variantes registradas'
        }`;
      })
      .join('\n');

    return `Reservas (${this.reservas.length})\n${listado || 'Sin reservas'}\n\nMonto total estimado: S/ ${
      this.totalMonto.toFixed(2)
    }`;
  }

  private descargarComoPdf(nombre: string, secciones: string[]): void {
    if (this.cargando) {
      this.mensaje = 'Espera a que se terminen de cargar los datos.';
      return;
    }
    const contenido = secciones.filter(Boolean).join('\n\n');
    const blob = new Blob([contenido], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  private nombreOpcion(detalle: DetalleReserva): string {
    if (!detalle.opcion) return 'Opción sin nombre';
    return detalle.opcion.nombreOpcion || 'Opción sin nombre';
  }
}
