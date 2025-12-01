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
  usuariosPorRol: Record<string, number> = { ADMIN: 0, CLIENTE: 0, PROVEEDOR: 0 };
  proveedoresPorEstado: Record<string, number> = {};
  catalogoPorEstado: Record<string, number> = {};
  reservasPorEstado: Record<string, number> = {};

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

  textoEstados(mapa: Record<string, number>, vacio: string): string {
    const pares = Object.entries(mapa);
    return pares.length ? pares.map(([k, v]) => `${k}: ${v}`).join(' · ') : vacio;
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
    const lineas = [
      ...this.portada(),
      ...this.bloqueUsuarios(),
      ...this.bloqueProveedores(),
      ...this.bloqueEventos(),
      ...this.bloqueCatalogo(),
      ...this.bloqueReservas(),
    ];

    this.descargarPdf('reporte-admin.pdf', lineas);
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

  private portada(): string[] {
    return [
      'Reporte administrativo detallado',
      `Generado: ${new Date().toLocaleString()}`,
      `Rango aplicado: ${this.rangoSeleccionado()}`,
      '------------------------------------------------------------',
      `Usuarios: ${this.resumen.usuarios} | Proveedores: ${this.resumen.proveedores}`,
      `Eventos: ${this.resumen.eventos} | Tipos de servicio: ${this.resumen.catalogo}`,
      `Reservas: ${this.resumen.reservas}`,
      '',
    ];
  }

  private bloqueUsuarios(): string[] {
    const lineas = ['Usuarios registrados'];
    lineas.push(`- Administradores: ${this.usuariosPorRol['ADMIN'] || 0}`);
    lineas.push(`- Proveedores: ${this.usuariosPorRol['PROVEEDOR'] || 0}`);
    lineas.push(`- Clientes: ${this.usuariosPorRol['CLIENTE'] || 0}`);

    const recientes = this.usuarios.slice(0, 5);
    if (recientes.length) {
      lineas.push('  Últimos usuarios:');
      recientes.forEach((u) => {
        const fecha = u.fechaRegistro ? this.fechaLegible(u.fechaRegistro) : 'Sin fecha';
        lineas.push(`    • ${u.nombre} (${u.email}) - ${u.rol} | ${fecha}`);
      });
    }
    lineas.push('');
    return lineas;
  }

  private bloqueProveedores(): string[] {
    const lineas = ['Proveedores'];
    Object.entries(this.proveedoresPorEstado).forEach(([estado, cantidad]) => {
      lineas.push(`- ${estado}: ${cantidad}`);
    });

    const ultimos = this.proveedores.slice(0, 5);
    if (ultimos.length) {
      lineas.push('  Últimos proveedores:');
      ultimos.forEach((p: any) => {
        const nombre = p.nombre || p.nombreEmpresa || p.razonSocial || 'Proveedor sin nombre';
        const estado = p.estado || 'Sin estado';
        lineas.push(`    • ${nombre} | Estado: ${estado}`);
      });
    }
    lineas.push('');
    return lineas;
  }

  private bloqueEventos(): string[] {
    const lineas = ['Eventos configurados'];
    if (!this.eventos.length) {
      lineas.push('- Sin eventos registrados');
      lineas.push('');
      return lineas;
    }
    this.eventos.slice(0, 8).forEach((e) => {
      lineas.push(`- ${e.nombreEvento || 'Evento'} (ID: ${e.idEvento})`);
    });
    if (this.eventos.length > 8) {
      lineas.push(`- ... y ${this.eventos.length - 8} eventos más`);
    }
    lineas.push('');
    return lineas;
  }

  private bloqueCatalogo(): string[] {
    const lineas = ['Catálogo de servicios'];
    Object.entries(this.catalogoPorEstado).forEach(([estado, cantidad]) => {
      lineas.push(`- ${estado}: ${cantidad}`);
    });
    const destacados = this.catalogo.slice(0, 6);
    if (destacados.length) {
      lineas.push('  Tipos destacados:');
      destacados.forEach((c) => {
        lineas.push(`    • ${c.nombre} (${c.estado})`);
      });
    }
    lineas.push('');
    return lineas;
  }

  private bloqueReservas(): string[] {
    const lineas = ['Reservas'];
    Object.entries(this.reservasPorEstado).forEach(([estado, cantidad]) => {
      lineas.push(`- ${estado}: ${cantidad}`);
    });
    lineas.push('  Detalle filtrado:');
    this.reservasFiltradas.forEach((reserva, index) => {
      const cliente = this.clienteNombre(reserva);
      const proveedor = this.proveedorNombre(reserva);
      const evento = this.eventoTitulo(reserva);
      const fecha = this.fechaLegible(reserva.fechaEvento ?? reserva.fechaReserva);
      const estado = reserva.estado ?? 'PENDIENTE';
      lineas.push(`    ${index + 1}. ${cliente} | ${proveedor} | ${evento} | ${fecha} | ${estado}`);
    });
    if (!this.reservasFiltradas.length) {
      lineas.push('    Sin reservas en el rango seleccionado');
    }
    lineas.push('');
    return lineas;
  }

  private descargarPdf(nombre: string, lineas: string[]): void {
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
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
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
}
