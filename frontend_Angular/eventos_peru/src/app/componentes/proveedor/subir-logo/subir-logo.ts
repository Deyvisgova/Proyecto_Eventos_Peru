import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProveedorService } from '../../../servicios/proveedor.service';
import { Router } from '@angular/router';
import { ProveedorServicioService } from '../../../servicios/proveedor-servicio.service';
import { ReservaService } from '../../../servicios/reserva.service';
import { DetalleReservaService } from '../../../servicios/detalle-reserva.service';
import { ProveedorServicio, ServicioOpcion } from '../../../modelos/proveedor-servicio';
import { Reserva, DetalleReserva } from '../../../modelos/reserva';
import { forkJoin } from 'rxjs';

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
  private proveedorServicioSrv = inject(ProveedorServicioService);
  private reservaSrv = inject(ReservaService);
  private detalleReservaSrv = inject(DetalleReservaService);

  idProveedor: number | null = null;
  seleccion?: File;
  mensaje = '';
  subiendo = false;
  cargandoReportes = false;

  servicios: ProveedorServicio[] = [];
  reservas: Reserva[] = [];
  detallesPorReserva: Record<number, DetalleReserva[]> = {};
  totalMonto = 0;

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
          this.cargarDatosReportes(this.idProveedor);
        }
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

  private cargarDatosReportes(idProveedor: number) {
    this.cargandoReportes = true;
    forkJoin({
      servicios: this.proveedorServicioSrv.listarPorProveedor(idProveedor),
      reservas: this.reservaSrv.listarPorProveedor(idProveedor),
    }).subscribe({
      next: ({ servicios, reservas }) => {
        this.servicios = servicios;
        this.reservas = reservas;
        if (!reservas.length) {
          this.totalMonto = 0;
          this.detallesPorReserva = {};
          this.cargandoReportes = false;
          return;
        }

        const consultasDetalles = reservas.map((r) => this.detalleReservaSrv.listarPorReserva(r.idReserva));
        forkJoin(consultasDetalles).subscribe({
          next: (detallesList) => {
            this.detallesPorReserva = {};
            this.totalMonto = 0;
            reservas.forEach((r, idx) => {
              const detalles = detallesList[idx] || [];
              this.detallesPorReserva[r.idReserva] = detalles;
              this.totalMonto += detalles.reduce(
                (suma, det) => suma + (det.precioUnitario || 0) * (det.cantidad || 1),
                0
              );
            });
            this.cargandoReportes = false;
          },
          error: () => {
            this.cargandoReportes = false;
            this.mensaje = 'No se pudieron cargar los detalles de reservas para el reporte.';
          },
        });
      },
      error: () => {
        this.cargandoReportes = false;
        this.mensaje = 'No se pudieron cargar los reportes del proveedor.';
      },
    });
  }

  descargarReportes(): void {
    if (!this.idProveedor) {
      this.mensaje = 'Inicia sesión nuevamente para descargar tus reportes.';
      return;
    }
    if (this.cargandoReportes) {
      this.mensaje = 'Estamos preparando la información del reporte.';
      return;
    }

    const resumenServicios = this.servicios
      .map((s) => `• ${s.nombrePublico} (${s.catalogoServicio.nombre}) - Estado: ${s.estado}`)
      .join('\n');

    const resumenReservas = this.reservas
      .map((r) => {
        const detalles = this.detallesPorReserva[r.idReserva] || [];
        const variantes = detalles
          .map(
            (d) =>
              `    - ${this.nombreOpcion(d.opcion)} x${d.cantidad} (S/ ${d.precioUnitario}) => S/ ${
                (d.precioUnitario || 0) * (d.cantidad || 1)
              }`
          )
          .join('\n');
        return `• Reserva ${r.idReserva} (${r.estado}) - ${r.fechaEvento}
${variantes || '    - Sin variantes registradas'}`;
      })
      .join('\n');

    const contenido = `Reportes del proveedor ${this.idProveedor}\n\nServicios (${this.servicios.length})\n${
      resumenServicios || 'Sin servicios cargados'
    }\n\nReservas (${this.reservas.length})\n${resumenReservas || 'Sin reservas registradas'}\n\nMonto total estimado: S/ ${
      this.totalMonto.toFixed(2)
    }`;

    const blob = new Blob([contenido], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'reportes-proveedor.pdf';
    enlace.click();
    URL.revokeObjectURL(url);
  }

  private nombreOpcion(opcion?: ServicioOpcion | null): string {
    if (!opcion) return 'Opción sin nombre';
    return opcion.nombreOpcion || 'Opción sin nombre';
  }
}
