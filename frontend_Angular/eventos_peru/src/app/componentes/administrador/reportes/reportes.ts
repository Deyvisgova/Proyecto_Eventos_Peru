import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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

@Component({
  selector: 'app-reportes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.css'],
})
export class ReportesAdmin implements OnInit {
  private reservaSrv = inject(ReservaService);
  private usuarioSrv = inject(UsuarioService);
  private catalogoSrv = inject(CatalogoServicioService);
  private eventoSrv = inject(EventoService);
  private http = inject(HttpClient);

  reservas: Reserva[] = [];
  reservasFiltradas: Reserva[] = [];
  usuarios: Usuario[] = [];
  proveedores: any[] = [];
  eventos: Evento[] = [];
  catalogo: CatalogoServicio[] = [];

  resumen: Resumen = { usuarios: 0, proveedores: 0, eventos: 0, catalogo: 0, reservas: 0 };

  fechaInicio = '';
  fechaFin = '';
  cargando = false;
  error = '';

  ngOnInit(): void {
    this.cargarDatos();
  }

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
        this.reservas = reservas;
        this.usuarios = usuarios;
        this.catalogo = catalogo;
        this.eventos = eventos;
        this.proveedores = Array.isArray(proveedores)
          ? proveedores
          : proveedores?.content ?? [];

        this.resumen = {
          usuarios: usuarios.length,
          proveedores: this.proveedores.length,
          eventos: eventos.length,
          catalogo: catalogo.length,
          reservas: reservas.length,
        };

        this.aplicarFiltros();
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los datos para los reportes.';
        this.cargando = false;
      },
    });
  }

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
  }

  rangoSeleccionado(): string {
    if (!this.fechaInicio && !this.fechaFin) {
      return 'Todos los registros';
    }
    const inicio = this.fechaInicio ? new Date(this.fechaInicio).toLocaleDateString() : '—';
    const fin = this.fechaFin ? new Date(this.fechaFin).toLocaleDateString() : '—';
    return `${inicio} a ${fin}`;
  }

  fechaLegible(valor: string | Date | undefined | null): string {
    if (!valor) return 'Sin fecha';
    const fecha = new Date(valor);
    return isNaN(fecha.getTime()) ? 'Fecha inválida' : fecha.toLocaleDateString();
  }

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

  generarPdf(): void {
    const lineas: string[] = [
      'Reporte general de la plataforma',
      `Generado: ${new Date().toLocaleString()}`,
      `Rango: ${this.rangoSeleccionado()}`,
      '',
      `Usuarios registrados: ${this.resumen.usuarios}`,
      `Proveedores: ${this.resumen.proveedores}`,
      `Eventos activos: ${this.resumen.eventos}`,
      `Tipos de servicio: ${this.resumen.catalogo}`,
      `Reservas totales: ${this.resumen.reservas}`,
      '',
      'Reservas filtradas:',
    ];

    this.reservasFiltradas.forEach((reserva, index) => {
      const cliente = this.clienteNombre(reserva);
      const proveedor = this.proveedorNombre(reserva);
      const evento = this.eventoTitulo(reserva);
      const fecha = this.fechaLegible(reserva.fechaEvento ?? reserva.fechaReserva);
      const estado = reserva.estado ?? 'PENDIENTE';

      lineas.push(
        `${index + 1}. ${cliente} | ${proveedor} | ${evento} | ${fecha} | ${estado}`
      );
    });

    const contenidoPdf = this.crearPdfPlano(lineas);
    const blob = new Blob([contenidoPdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte-general.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }

  clienteNombre(reserva: Reserva): string {
    return reserva.cliente?.nombre || reserva.cliente?.email || 'Cliente sin datos';
  }

  proveedorNombre(reserva: Reserva): string {
    const proveedor: any = reserva.proveedor;
    return proveedor?.nombre || proveedor?.nombreEmpresa || proveedor?.razonSocial || 'Proveedor';
  }

  eventoTitulo(reserva: Reserva): string {
    const evento: any = reserva.evento;
    return evento?.tipo || evento?.nombre || 'Evento';
  }

  private crearPdfPlano(lineas: string[]): string {
    const header = '%PDF-1.4\n';
    const objetos: string[] = [];

    const stream = this.construirStream(lineas);
    objetos.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n');
    objetos.push('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n');
    objetos.push(
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n'
    );
    objetos.push(
      `4 0 obj << /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`
    );
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

    return cuerpo;
  }

  private construirStream(lineas: string[]): string {
    let y = 800;
    const comandos = lineas.map((texto) => {
      const seguro = this.escaparPdf(texto);
      const comando = `BT /F1 12 Tf 50 ${y} Td (${seguro}) Tj ET`;
      y -= 16;
      return comando;
    });
    return comandos.join('\n');
  }

  private escaparPdf(texto: string): string {
    return texto.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }
}
