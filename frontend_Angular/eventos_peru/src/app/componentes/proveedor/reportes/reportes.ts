import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import { ProveedorService } from '../../../servicios/proveedor.service';
import { ProveedorServicioService } from '../../../servicios/proveedor-servicio.service';
import { ReservaService } from '../../../servicios/reserva.service';
import { DetalleReservaService } from '../../../servicios/detalle-reserva.service';
import { ProveedorServicio, ServicioOpcion } from '../../../modelos/proveedor-servicio';
import { DetalleReserva, Reserva } from '../../../modelos/reserva';
import { forkJoin, of } from 'rxjs';

interface SeccionPdf {
  titulo: string;
  lineas: string[];
  tipo?: 'tabla' | 'texto';
}

@Component({
  selector: 'app-reportes-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.css'],
})
export class ReportesProveedor implements OnInit {
  // Servicios para navegar y traer la información que alimenta el reporte.
  private router = inject(Router);
  private proveedorSrv = inject(ProveedorService);
  private proveedorServicioSrv = inject(ProveedorServicioService);
  private reservaSrv = inject(ReservaService);
  private detalleReservaSrv = inject(DetalleReservaService);

  // Datos básicos de la persona proveedora y sus registros.
  idProveedor: number | null = null;
  servicios: ProveedorServicio[] = [];
  opcionesPorServicio: Record<number, ServicioOpcion[]> = {};
  reservas: Reserva[] = [];
  reservasFiltradas: Reserva[] = [];
  detallesPorReserva: Record<number, DetalleReserva[]> = {};
  totalMonto = 0;
  totalMontoFiltrado = 0;
  resumenEstados: Record<string, number> = {};

  // Fechas de filtro y mensajes mostrados en pantalla.
  fechaInicio = '';
  fechaFin = '';
  cargando = false;
  mensaje = '';

  // Verifica que quien entra sea proveedor y dispara la carga inicial de datos.
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

  // Permite refrescar el reporte sin volver a iniciar sesión.
  recargar(): void {
    if (this.idProveedor) {
      this.cargarDatos(this.idProveedor);
    }
  }

  // Cuenta cuántas variantes tiene cada servicio en total.
  totalVariantes(): number {
    return Object.values(this.opcionesPorServicio).reduce((acc, lista) => acc + lista.length, 0);
  }

  // Busca los servicios, reservas y detalles que alimentan el reporte.
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

  // Filtra las reservas por fecha y recalcula montos y totales.
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

  // Descarga el PDF con todas las secciones.
  descargarTodo(): void {
    this.descargarComoPdf('reportes-completos.pdf', [this.portada(), this.seccionServicios(), this.seccionReservas()]);
  }

  // Descarga solo la parte de servicios y variantes.
  descargarServicios(): void {
    this.descargarComoPdf('reportes-servicios.pdf', [this.portada(), this.seccionServicios()]);
  }

  // Descarga únicamente la sección de reservas.
  descargarReservas(): void {
    this.descargarComoPdf('reportes-reservas.pdf', [this.portada(), this.seccionReservas()]);
  }

  private portada(): SeccionPdf {
    return {
      titulo: 'Reporte de proveedor',
      lineas: [
        `Generado: ${new Date().toLocaleString()}`,
        `Rango aplicado: ${this.rangoSeleccionado()}`,
        `Servicios publicados: ${this.servicios.length} | Variantes: ${this.totalVariantes()}`,
        `Reservas: ${this.reservasFiltradas.length}/${this.reservas.length} | Monto estimado: S/ ${this.totalMontoFiltrado.toFixed(2)}`,
        '',
      ],
    };
  }

  private seccionServicios(): SeccionPdf {
    const filas = this.servicios.map((s) => [
      s.nombrePublico,
      s.catalogoServicio?.nombre || 'Catálogo',
      this.opcionesPorServicio[s.idProveedorServicio]?.length || 0,
      s.estado,
    ]);

    return {
      titulo: 'Servicios y variantes',
      lineas: this.tabla(['Servicio', 'Tipo', 'Variantes', 'Estado'], filas),
      tipo: 'tabla',
    };
  }

  private seccionReservas(): SeccionPdf {
    const lineas: string[] = [];
    Object.entries(this.resumenEstados).forEach(([estado, cantidad]) => {
      lineas.push(`${estado}: ${cantidad}`);
    });
    lineas.push('');

    const filas = this.reservasFiltradas.map((r) => [
      r.idReserva,
      this.fechaLegible(r.fechaEvento || r.fechaReserva),
      r.estado || 'PENDIENTE',
      (this.detallesPorReserva[r.idReserva] || []).length,
      (this.detallesPorReserva[r.idReserva] || []).reduce(
        (suma, det) => suma + (det.precioUnitario || 0) * (det.cantidad || 1),
        0
      ),
    ]);

    lineas.push(...this.tabla(['ID', 'Fecha', 'Estado', '# ítems', 'Monto'], filas));
    lineas.push(`Monto total estimado: S/ ${this.totalMontoFiltrado.toFixed(2)}`);

    return { titulo: 'Reservas y pagos', lineas, tipo: 'tabla' };
  }

  private descargarComoPdf(nombre: string, secciones: SeccionPdf[]): void {
    if (this.cargando) {
      this.mensaje = 'Espera a que se terminen de cargar los datos.';
      return;
    }

    const doc = new jsPDF();
    let y = 22;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Reporte de proveedor', 105, y, { align: 'center' });
    y += 10;

    secciones.forEach((seccion) => {
      y = this.agregarSeccion(doc, seccion, y);
    });

    doc.save(nombre);
  }

  private agregarSeccion(doc: jsPDF, seccion: SeccionPdf, y: number): number {
    const margenX = 18;
    const salto = 8;

    if (y > 270) {
      doc.addPage();
      y = 22;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(seccion.titulo, margenX, y);
    y += 6;

    const fuente = seccion.tipo === 'tabla' ? 'Courier' : 'Helvetica';
    const tamano = seccion.tipo === 'tabla' ? 10 : 11;
    doc.setFont(fuente, 'normal');
    doc.setFontSize(tamano);

    seccion.lineas.forEach((linea) => {
      const partes = doc.splitTextToSize(linea, 170);
      partes.forEach((parte) => {
        if (y > 285) {
          doc.addPage();
          y = 22;
          doc.setFont(fuente, 'normal');
          doc.setFontSize(tamano);
        }
        doc.text(parte, margenX, y);
        y += salto;
      });
    });

    y += 4;
    return y;
  }

  private tabla(encabezados: (string | number)[], filas: (string | number)[][]): string[] {
    const maxAncho = 26;
    const anchos = encabezados.map((h, idx) => {
      const maxDato = filas.reduce((max, fila) => Math.max(max, String(fila[idx] ?? '').length), String(h).length);
      return Math.min(maxDato, maxAncho);
    });

    const separador = '+' + anchos.map((a) => '-'.repeat(a + 2)).join('+') + '+';
    const renderFila = (datos: (string | number)[]) =>
      '|'
        + datos
            .map((valor, i) => ` ${this.acortar(String(valor ?? ''), anchos[i]).padEnd(anchos[i], ' ')} `)
            .join('|')
        + '|';

    const salida = [separador, renderFila(encabezados), separador];
    if (!filas.length) {
      salida.push('| ' + 'Sin datos disponibles'.padEnd(anchos.reduce((a, b) => a + b + 3, -1), ' ') + '|');
    } else {
      filas.forEach((fila) => salida.push(renderFila(fila)));
    }
    salida.push(separador);
    return salida;
  }

  private acortar(texto: string, max: number): string {
    return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
  }

  // Texto que explica el rango de fechas aplicado al reporte.
  rangoSeleccionado(): string {
    if (!this.fechaInicio && !this.fechaFin) {
      return 'Todos los registros';
    }
    const inicio = this.fechaInicio ? new Date(this.fechaInicio).toLocaleDateString() : '—';
    const fin = this.fechaFin ? new Date(this.fechaFin).toLocaleDateString() : '—';
    return `${inicio} a ${fin}`;
  }

  // Formatea la fecha para que sea fácil de leer en la tabla.
  fechaLegible(valor?: string | Date | null): string {
    if (!valor) return 'Sin fecha';
    const fecha = new Date(valor);
    return isNaN(fecha.getTime()) ? 'Fecha inválida' : fecha.toLocaleDateString();
  }

  // Protege el nombre de cada opción por si viene vacío del backend.
  private nombreOpcion(detalle: DetalleReserva): string {
    if (!detalle.opcion) return 'Opción sin nombre';
    return detalle.opcion.nombreOpcion || 'Opción sin nombre';
  }
}
