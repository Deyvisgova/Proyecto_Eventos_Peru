import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
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
  reservasFiltradas: Reserva[] = [];
  detallesPorReserva: Record<number, DetalleReserva[]> = {};
  totalMonto = 0;
  totalMontoFiltrado = 0;
  resumenEstados: Record<string, number> = {};

  fechaInicio = '';
  fechaFin = '';
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
        this.servicios = servicios || [];
        this.reservas = reservas || [];

        const opciones$ = this.servicios.length
          ? forkJoin(this.servicios.map((s) => this.proveedorServicioSrv.listarOpciones(s.idProveedorServicio)))
          : of([] as ServicioOpcion[][]);

        const detalles$ = this.reservas.length
          ? forkJoin(this.reservas.map((r) => this.detalleReservaSrv.listarPorReserva(r.idReserva)))
          : of([] as DetalleReserva[][]);

        forkJoin({ opciones: opciones$, detalles: detalles$ }).subscribe({
          next: ({ opciones, detalles }) => {
            this.opcionesPorServicio = {};
            this.servicios.forEach((s, idx) => {
              this.opcionesPorServicio[s.idProveedorServicio] = opciones[idx] || [];
            });

            this.detallesPorReserva = {};
            this.totalMonto = 0;
            this.reservas.forEach((r, idx) => {
              const dets = detalles[idx] || [];
              this.detallesPorReserva[r.idReserva] = dets;
              this.totalMonto += dets.reduce((suma, det) => suma + (det.precioUnitario || 0) * (det.cantidad || 1), 0);
            });
            this.cargando = false;
            this.aplicarFiltros();
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

  aplicarFiltros(): void {
    const inicio = this.fechaInicio ? new Date(this.fechaInicio) : null;
    const fin = this.fechaFin ? new Date(this.fechaFin) : null;

    this.reservasFiltradas = this.reservas.filter((reserva) => {
      const fechaBase = reserva.fechaEvento ?? reserva.fechaReserva;
      const fecha = fechaBase ? new Date(fechaBase) : null;
      if (!fecha) return true;
      if (inicio && fecha < inicio) return false;
      if (fin) {
        const limite = new Date(fin);
        limite.setHours(23, 59, 59, 999);
        if (fecha > limite) return false;
      }
      return true;
    });

    this.totalMontoFiltrado = this.reservasFiltradas.reduce((acum, r) => {
      const dets = this.detallesPorReserva[r.idReserva] || [];
      return acum + dets.reduce((suma, det) => suma + (det.precioUnitario || 0) * (det.cantidad || 1), 0);
    }, 0);

    this.resumenEstados = {};
    this.reservasFiltradas.forEach((r) => {
      const estado = (r.estado || 'PENDIENTE').toUpperCase();
      this.resumenEstados[estado] = (this.resumenEstados[estado] || 0) + 1;
    });
  }

  descargarTodo(): void {
    this.descargarComoPdf('reportes-completos.pdf', [this.portada(), this.seccionServicios(), this.seccionReservas()]);
  }

  descargarServicios(): void {
    this.descargarComoPdf('reportes-servicios.pdf', [this.portada(), this.seccionServicios()]);
  }

  descargarReservas(): void {
    this.descargarComoPdf('reportes-reservas.pdf', [this.portada(), this.seccionReservas()]);
  }

  private portada(): string[] {
    return [
      'Reporte de proveedor',
      `Generado: ${new Date().toLocaleString()}`,
      `Rango aplicado: ${this.rangoSeleccionado()}`,
      `Servicios publicados: ${this.servicios.length} | Variantes: ${this.totalVariantes()}`,
      `Reservas: ${this.reservasFiltradas.length}/${this.reservas.length} | Monto estimado: S/ ${this.totalMontoFiltrado.toFixed(2)}`,
      '',
    ];
  }

  private seccionServicios(): string[] {
    const lineas: string[] = ['Servicios y variantes'];
    this.servicios.forEach((s) => {
      const variantes = (this.opcionesPorServicio[s.idProveedorServicio] || [])
        .map((op) => `    - ${op.nombreOpcion} | S/ ${op.precio} | ${op.estado}`)
        .join('\n');

      lineas.push(`• ${s.nombrePublico} (${s.catalogoServicio.nombre}) - ${s.estado}`);
      lineas.push(variantes || '    - Sin variantes registradas');
    });

    if (!this.servicios.length) {
      lineas.push('Sin servicios registrados');
    }
    lineas.push('');
    return lineas;
  }

  private seccionReservas(): string[] {
    const lineas: string[] = ['Reservas y pagos'];
    Object.entries(this.resumenEstados).forEach(([estado, cantidad]) => {
      lineas.push(`- ${estado}: ${cantidad}`);
    });
    this.reservasFiltradas.forEach((r) => {
      const detalles = (this.detallesPorReserva[r.idReserva] || [])
        .map((d) => `    - ${this.nombreOpcion(d)} x${d.cantidad} (S/ ${d.precioUnitario})`)
        .join('\n');
      lineas.push(`• Reserva ${r.idReserva} (${r.estado}) - ${this.fechaLegible(r.fechaEvento || r.fechaReserva)}`);
      lineas.push(detalles || '    - Sin variantes registradas');
    });
    lineas.push(`Monto total estimado: S/ ${this.totalMontoFiltrado.toFixed(2)}`);
    lineas.push('');
    return lineas;
  }

  private descargarComoPdf(nombre: string, secciones: string[][]): void {
    if (this.cargando) {
      this.mensaje = 'Espera a que se terminen de cargar los datos.';
      return;
    }
    const lineas = secciones.flat();
    const header = '%PDF-1.4\n';
    const stream = this.construirStream(lineas);

    const objetos: string[] = [];
    objetos.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n');
    objetos.push('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n');
    objetos.push(
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n'
    );
    objetos.push(`4 0 obj << /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`);
    objetos.push('5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n');

    let cuerpo = header;
    const offsets: number[] = [];
    objetos.forEach((obj) => {
      offsets.push(cuerpo.length);
      cuerpo += obj;
    });

    const inicioXref = cuerpo.length;
    cuerpo += `xref\n0 ${objetos.length + 1}\n`;
    cuerpo += '0000000000 65535 f \n';
    offsets.forEach((off) => {
      cuerpo += `${off.toString().padStart(10, '0')} 00000 n \n`;
    });
    cuerpo += `trailer << /Size ${objetos.length + 1} /Root 1 0 R >>\n`;
    cuerpo += `startxref\n${inicioXref}\n%%EOF`;

    const blob = new Blob([cuerpo], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  private construirStream(lineas: string[]): string {
    let y = 800;
    const comandos = lineas.flatMap((texto) => {
      const partes = this.ajustarLinea(texto, 90);
      return partes.map((parte) => {
        const seguro = this.escaparPdf(parte);
        const comando = `BT /F1 11 Tf 50 ${y} Td (${seguro}) Tj ET`;
        y -= 16;
        return comando;
      });
    });
    return comandos.join('\n');
  }

  private ajustarLinea(texto: string, max: number): string[] {
    if (texto.length <= max) return [texto];
    const partes: string[] = [];
    let restante = texto;
    while (restante.length > max) {
      let corte = restante.lastIndexOf(' ', max);
      if (corte <= 0) corte = max;
      partes.push(restante.slice(0, corte));
      restante = restante.slice(corte).trimStart();
    }
    if (restante) partes.push(restante);
    return partes;
  }

  private escaparPdf(texto: string): string {
    return texto.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  rangoSeleccionado(): string {
    if (!this.fechaInicio && !this.fechaFin) {
      return 'Todos los registros';
    }
    const inicio = this.fechaInicio ? new Date(this.fechaInicio).toLocaleDateString() : '—';
    const fin = this.fechaFin ? new Date(this.fechaFin).toLocaleDateString() : '—';
    return `${inicio} a ${fin}`;
  }

  fechaLegible(valor?: string | Date | null): string {
    if (!valor) return 'Sin fecha';
    const fecha = new Date(valor);
    return isNaN(fecha.getTime()) ? 'Fecha inválida' : fecha.toLocaleDateString();
  }

  private nombreOpcion(detalle: DetalleReserva): string {
    if (!detalle.opcion) return 'Opción sin nombre';
    return detalle.opcion.nombreOpcion || 'Opción sin nombre';
  }
}
