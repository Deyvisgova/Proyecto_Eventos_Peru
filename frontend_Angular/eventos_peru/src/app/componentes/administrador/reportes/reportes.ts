import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
import { forkJoin } from 'rxjs';
import { Reserva } from '../../../modelos/reserva';
import { Evento } from '../../../modelos/evento';
import { CatalogoServicio } from '../../../modelos/catalogo-servicio';
import { Usuario } from '../../../modelos/usuario';
import { ReservaService } from '../../../servicios/reserva.service';
import { UsuarioService } from '../../../servicios/usuario.service';
import { CatalogoServicioService } from '../../../servicios/catalogo-servicio.service';
import { EventoService } from '../../../servicios/evento.service';

interface Resumen {
  usuarios: number;
  proveedores: number;
  eventos: number;
  catalogo: number;
  reservas: number;
}

interface SeccionPdf {
  titulo: string;
  lineas: string[];
  tipo?: 'tabla' | 'texto';
}

@Component({
  selector: 'app-reportes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.css'],
})
export class ReportesAdmin implements OnInit {
  // Servicios que traen la información desde el backend.
  private reservaSrv = inject(ReservaService);
  private usuarioSrv = inject(UsuarioService);
  private catalogoSrv = inject(CatalogoServicioService);
  private eventoSrv = inject(EventoService);
  private http = inject(HttpClient);

  // Listas principales que se ven en pantalla y también alimentan los reportes.
  reservas: Reserva[] = [];
  reservasFiltradas: Reserva[] = [];
  usuarios: Usuario[] = [];
  proveedores: any[] = [];
  eventos: Evento[] = [];
  catalogo: CatalogoServicio[] = [];

  // Totales rápidos para mostrar el panorama general.
  resumen: Resumen = { usuarios: 0, proveedores: 0, eventos: 0, catalogo: 0, reservas: 0 };
  // Mapas sencillos para contar cuántos registros hay por cada estado o rol.
  usuariosPorRol: Record<string, number> = { ADMIN: 0, CLIENTE: 0, PROVEEDOR: 0 };
  proveedoresPorEstado: Record<string, number> = {};
  catalogoPorEstado: Record<string, number> = {};
  reservasPorEstado: Record<string, number> = {};

  // Fechas usadas para filtrar la información que se lista.
  fechaInicio = '';
  fechaFin = '';
  // Banderas para el estado de carga y errores en pantalla.
  cargando = false;
  error = '';

  // Apenas se abre la pantalla, se buscan los datos para mostrar los reportes.
  ngOnInit(): void {
    this.cargarDatos();
  }

  // Reúne en una sola llamada las listas que necesita el panel y maneja errores simples.
  cargarDatos(): void {
    this.cargando = true;
    this.error = '';

    forkJoin({
      reservas: this.reservaSrv.listar(),
      usuarios: this.usuarioSrv.getUsuarios(),
      catalogo: this.catalogoSrv.listar(),
      eventos: this.eventoSrv.obtenerEventos(),
      proveedores: this.http.get<any>('http://localhost:8080/api/proveedores'),
    }).subscribe({
      next: ({ reservas, usuarios, catalogo, eventos, proveedores }) => {
        this.reservas = reservas || [];
        this.usuarios = usuarios || [];
        this.catalogo = catalogo || [];
        this.eventos = eventos || [];
        this.proveedores = Array.isArray(proveedores)
          ? proveedores
          : proveedores?.content ?? [];

        this.resumen = {
          usuarios: this.usuarios.length,
          proveedores: this.proveedores.length,
          eventos: this.eventos.length,
          catalogo: this.catalogo.length,
          reservas: this.reservas.length,
        };

        this.calcularAgrupaciones();
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los datos para los reportes.';
        this.cargando = false;
      },
    });
  }

  // Calcula conteos rápidos que ayudan a resumir la información en tarjetas o listas.
  calcularAgrupaciones(): void {
    this.usuariosPorRol = { ADMIN: 0, CLIENTE: 0, PROVEEDOR: 0 };
    this.usuarios.forEach((u) => {
      const rol = (u.rol || 'CLIENTE').toUpperCase();
      this.usuariosPorRol[rol] = (this.usuariosPorRol[rol] || 0) + 1;
    });

    this.proveedoresPorEstado = {};
    this.proveedores.forEach((p) => {
      const estado = (p.estado || 'DESCONOCIDO').toUpperCase();
      this.proveedoresPorEstado[estado] = (this.proveedoresPorEstado[estado] || 0) + 1;
    });

    this.catalogoPorEstado = {};
    this.catalogo.forEach((c) => {
      const estado = (c.estado || 'PENDIENTE').toUpperCase();
      this.catalogoPorEstado[estado] = (this.catalogoPorEstado[estado] || 0) + 1;
    });
  }

  // Aplica el filtro de fechas a las reservas y vuelve a contar sus estados.
  aplicarFiltros(): void {
    const inicio = this.fechaInicio ? new Date(this.fechaInicio) : null;
    const fin = this.fechaFin ? new Date(this.fechaFin) : null;

    this.reservasFiltradas = this.reservas.filter((reserva) => {
      const fechaBase = reserva.fechaReserva ?? reserva.fechaEvento;
      const fecha = fechaBase ? new Date(fechaBase) : null;
      if (!fecha) return true;
      if (inicio && fecha < inicio) return false;
      if (fin) {
        const finCopia = new Date(fin);
        finCopia.setHours(23, 59, 59, 999);
        if (fecha > finCopia) return false;
      }
      return true;
    });

    this.reservasPorEstado = {};
    this.reservasFiltradas.forEach((r) => {
      const estado = (r.estado || 'PENDIENTE').toUpperCase();
      this.reservasPorEstado[estado] = (this.reservasPorEstado[estado] || 0) + 1;
    });
  }

  // Convierte los conteos en frases cortas que se muestran en las tarjetas.
  textoEstados(mapa: Record<string, number>, vacio: string): string {
    const pares = Object.entries(mapa);
    return pares.length ? pares.map(([k, v]) => `${k}: ${v}`).join(' · ') : vacio;
  }

  // Devuelve la frase del rango de fechas elegido por la persona usuaria.
  rangoSeleccionado(): string {
    if (!this.fechaInicio && !this.fechaFin) {
      return 'Todos los registros';
    }
    const inicio = this.fechaInicio ? new Date(this.fechaInicio).toLocaleDateString() : '—';
    const fin = this.fechaFin ? new Date(this.fechaFin).toLocaleDateString() : '—';
    return `${inicio} a ${fin}`;
  }

  // Prepara una fecha legible o un mensaje amigable cuando no hay dato.
  fechaLegible(valor: string | Date | undefined | null): string {
    if (!valor) return 'Sin fecha';
    const fecha = new Date(valor);
    return isNaN(fecha.getTime()) ? 'Fecha inválida' : fecha.toLocaleDateString();
  }

  // Devuelve el nombre de la clase CSS que pinta la etiqueta del estado.
  estadoEtiqueta(estado: string): string {
    switch (estado) {
      case 'CONFIRMADA':
        return 'confirmada';
      case 'CANCELADA':
        return 'cancelada';
      case 'RECHAZADA':
        return 'rechazada';
      default:
        return 'pendiente';
    }
  }

  // Genera el informe completo para administración.
  generarPdf(): void {
    const secciones: SeccionPdf[] = [
      this.portada('Reporte administrativo detallado'),
      this.bloqueUsuarios(),
      this.bloqueProveedores(),
      this.bloqueEventos(),
      this.bloqueCatalogo(),
      this.bloqueReservas(),
    ];

    this.descargarPdf('reporte-admin.pdf', secciones, 'Panel administrativo');
  }

  // Reporte centrado solo en usuarios.
  generarPdfUsuarios(): void {
    const secciones: SeccionPdf[] = [this.portadaBasica('Usuarios registrados'), this.bloqueUsuarios()];
    this.descargarPdf('usuarios.pdf', secciones, 'Usuarios del sistema');
  }

  // Reporte de proveedores inscritos.
  generarPdfProveedores(): void {
    const secciones: SeccionPdf[] = [this.portadaBasica('Proveedores'), this.bloqueProveedores()];
    this.descargarPdf('proveedores.pdf', secciones, 'Relación de proveedores');
  }

  // Reporte de eventos disponibles.
  generarPdfEventos(): void {
    const secciones: SeccionPdf[] = [this.portadaBasica('Eventos disponibles'), this.bloqueEventos()];
    this.descargarPdf('eventos.pdf', secciones, 'Eventos publicados');
  }

  // Reporte de servicios publicados en catálogo.
  generarPdfCatalogo(): void {
    const secciones: SeccionPdf[] = [this.portadaBasica('Catálogo de servicios'), this.bloqueCatalogo()];
    this.descargarPdf('catalogo-servicios.pdf', secciones, 'Catálogo de servicios');
  }

  // Reporte de reservas filtradas.
  generarPdfReservas(): void {
    const secciones: SeccionPdf[] = [this.portadaBasica('Reservas filtradas'), this.bloqueReservas()];
    this.descargarPdf('reservas.pdf', secciones, 'Reservas');
  }

  // Obtiene el nombre del cliente asegurando mostrar algo comprensible.
  clienteNombre(reserva: Reserva): string {
    return reserva.cliente?.nombre || reserva.cliente?.email || 'Cliente sin datos';
  }

  // Elige el mejor texto disponible para el proveedor.
  proveedorNombre(reserva: Reserva): string {
    const proveedor: any = reserva.proveedor;
    return proveedor?.nombre || proveedor?.nombreEmpresa || proveedor?.razonSocial || 'Proveedor';
  }

  // Devuelve un título corto para el evento.
  eventoTitulo(reserva: Reserva): string {
    const evento: any = reserva.evento;
    return evento?.tipo || evento?.nombre || 'Evento';
  }

  private portada(titulo: string): SeccionPdf {
    return {
      titulo,
      lineas: [
        `Generado: ${new Date().toLocaleString()}`,
        `Rango aplicado: ${this.rangoSeleccionado()}`,
        `Usuarios: ${this.resumen.usuarios} | Proveedores: ${this.resumen.proveedores}`,
        `Eventos: ${this.resumen.eventos} | Tipos de servicio: ${this.resumen.catalogo}`,
        `Reservas: ${this.resumen.reservas}`,
        '',
      ],
    };
  }

  private portadaBasica(titulo: string): SeccionPdf {
    return {
      titulo,
      lineas: [`Generado: ${new Date().toLocaleString()}`, `Rango aplicado: ${this.rangoSeleccionado()}`, ''],
    };
  }

  private bloqueUsuarios(): SeccionPdf {
    const lineas = [`Administradores: ${this.usuariosPorRol['ADMIN'] || 0}`];
    lineas.push(`Proveedores: ${this.usuariosPorRol['PROVEEDOR'] || 0}`);
    lineas.push(`Clientes: ${this.usuariosPorRol['CLIENTE'] || 0}`);
    lineas.push('');

    const tabla = this.tabla(
      ['Nombre', 'Email', 'Rol', 'Fecha'],
      this.usuarios.map((u) => [u.nombre || 'Sin nombre', u.email || 'Sin email', u.rol || 'Cliente', this.fechaLegible(u.fechaRegistro)])
    );
    lineas.push(...tabla);
    return { titulo: 'Usuarios registrados', lineas, tipo: 'tabla' };
  }

  private bloqueProveedores(): SeccionPdf {
    const lineas: string[] = [];
    Object.entries(this.proveedoresPorEstado).forEach(([estado, cantidad]) => {
      lineas.push(`${estado}: ${cantidad}`);
    });
    lineas.push('');

    const tabla = this.tabla(
      ['Proveedor', 'Estado', 'Usuario'],
      this.proveedores.map((p) => [p.nombre || p.razonSocial || 'Proveedor', p.estado || 'Sin estado', p.usuario?.email || 'Sin usuario'])
    );
    lineas.push(...tabla);
    return { titulo: 'Proveedores', lineas, tipo: 'tabla' };
  }

  private bloqueEventos(): SeccionPdf {
    const lineas: string[] = [];
    const tabla = this.tabla(
      ['Evento', 'ID', 'Nombre'],
      this.eventos.map((e) => [e.nombreEvento || 'Evento', String(e.idEvento ?? '-'), e.nombreEvento || ''])
    );
    lineas.push(...tabla);
    return { titulo: 'Eventos configurados', lineas, tipo: 'tabla' };
  }

  private bloqueCatalogo(): SeccionPdf {
    const lineas: string[] = [];
    Object.entries(this.catalogoPorEstado).forEach(([estado, cantidad]) => {
      lineas.push(`${estado}: ${cantidad}`);
    });
    lineas.push('');

    const tabla = this.tabla(
      ['Servicio', 'Estado', 'Descripción'],
      this.catalogo.map((c) => [c.nombre, c.estado ?? 'PENDIENTE', c.descripcion ?? ''])
    );
    lineas.push(...tabla);
    return { titulo: 'Catálogo de servicios', lineas, tipo: 'tabla' };
  }

  private bloqueReservas(): SeccionPdf {
    const lineas: string[] = [];
    Object.entries(this.reservasPorEstado).forEach(([estado, cantidad]) => {
      lineas.push(`${estado}: ${cantidad}`);
    });
    lineas.push('');

    const tabla = this.tabla(
      ['Cliente', 'Proveedor', 'Evento', 'Fecha', 'Estado'],
      this.reservasFiltradas.map((r) => [
        this.clienteNombre(r),
        this.proveedorNombre(r),
        this.eventoTitulo(r),
        this.fechaLegible(r.fechaEvento ?? r.fechaReserva),
        r.estado || 'PENDIENTE',
      ])
    );
    lineas.push(...tabla);
    return { titulo: 'Reservas', lineas, tipo: 'tabla' };
  }

  private descargarPdf(nombre: string, secciones: SeccionPdf[], titulo: string): void {
    const doc = new jsPDF();
    let y = 22;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(titulo, 105, y, { align: 'center' });
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

    seccion.lineas.forEach((linea: string) => {
      const partes = doc.splitTextToSize(linea, 170) as string[];
      partes.forEach((parte: string) => {
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

  private tabla(encabezados: string[], filas: (string | number)[][]): string[] {
    const maxAncho = 30;
    const anchos = encabezados.map((h, idx) => {
      const maxDato = filas.reduce((max, fila) => Math.max(max, String(fila[idx] ?? '').length), h.length);
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
}
