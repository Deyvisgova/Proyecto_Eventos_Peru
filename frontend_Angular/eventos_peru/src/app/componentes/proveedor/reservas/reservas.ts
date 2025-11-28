import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DetalleReserva, Reserva } from '../../../modelos/reserva';
import { ReservaService } from '../../../servicios/reserva.service';
import { DetalleReservaService } from '../../../servicios/detalle-reserva.service';
import { ProveedorService } from '../../../servicios/proveedor.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reservas-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservas.html',
  styleUrls: ['./reservas.css'],
})
export class ReservasProveedor implements OnInit {
  private reservaSrv = inject(ReservaService);
  private detalleSrv = inject(DetalleReservaService);
  private proveedorSrv = inject(ProveedorService);
  private router = inject(Router);

  idProveedor: number | null = null;
  reservas: Reserva[] = [];
  detalles: Record<number, DetalleReserva[]> = {};
  seleccionada: Reserva | null = null;
  detalleAbierto: number | null = null;
  modalVisible = false;
  modoAccion: 'confirmar' | 'cancelar' | null = null;
  cuerpoCorreo = '';
  reservaEnAccion: Reserva | null = null;
  cargando = false;
  error = '';

  ngOnInit(): void {
    const raw = localStorage.getItem('usuario');
    if (!raw) {
      this.router.navigate(['/login']);
      return;
    }
    const user = JSON.parse(raw);
    if (user.rol !== 'PROVEEDOR') {
      this.router.navigate(['/login']);
      return;
    }

    const idUsuario = user.idUsuario ?? user.id_usuario ?? null;
    if (idUsuario) {
      this.proveedorSrv.obtenerPorUsuario(idUsuario).subscribe({
        next: (prov: any) => {
          this.idProveedor = prov?.idProveedor ?? prov?.id_proveedor ?? null;
          if (this.idProveedor) this.cargarReservas();
        },
        error: () => (this.error = 'No pudimos cargar tus datos de proveedor'),
      });
    }
  }

  cargarReservas() {
    if (!this.idProveedor) return;
    this.cargando = true;
    this.reservaSrv.listarPorProveedor(this.idProveedor).subscribe({
      next: (resp) => {
        if (!Array.isArray(resp)) {
          console.warn('[reservas-proveedor] Respuesta inesperada', resp);
          this.reservas = [];
          this.error = 'No pudimos leer las reservas del proveedor.';
          return;
        }

        this.reservas = resp;
        resp.forEach((r) => this.cargarDetalle(r.idReserva)?.subscribe());
      },
      error: () => (this.error = 'No pudimos cargar las reservas'),
      complete: () => (this.cargando = false),
    });
  }

  cargarDetalle(idReserva: number): Observable<DetalleReserva[]> {
    if (this.detalles[idReserva]) return of(this.detalles[idReserva]);
    return this.detalleSrv.listarPorReserva(idReserva).pipe(
      tap((det) => (this.detalles[idReserva] = det))
    );
  }

  verDetalle(reserva: Reserva) {
    this.detalleAbierto = this.detalleAbierto === reserva.idReserva ? null : reserva.idReserva;
    this.seleccionada = this.detalleAbierto ? reserva : null;
    this.cargarDetalle(reserva.idReserva)?.subscribe();
  }

  estadoClase(estado: string) {
    if (estado === 'CONFIRMADA') return 'estado confirmada';
    if (estado === 'PENDIENTE') return 'estado pendiente';
    return 'estado cancelada';
  }

  abrirModal(reserva: Reserva, modo: 'confirmar' | 'cancelar') {
    this.reservaEnAccion = reserva;
    this.modoAccion = modo;
    this.modalVisible = true;
    this.cuerpoCorreo = '';
    this.cargarDetalle(reserva.idReserva)?.subscribe((det) => {
      if (modo === 'confirmar') {
        this.cuerpoCorreo = this.construirCuerpoCorreo(reserva, det);
      }
    });
  }

  cerrarModal() {
    this.modalVisible = false;
    this.modoAccion = null;
    this.reservaEnAccion = null;
    this.cuerpoCorreo = '';
  }

  construirCuerpoCorreo(reserva: Reserva, det: DetalleReserva[] = []) {
    const servicios = det.length
      ? det
          .map(
            (d) =>
              `• ${d.servicio?.nombreServicio || 'Servicio reservado'} (${d.cantidad} x S/ ${
                d.precioUnitario?.toFixed(2) || '0.00'
              })`
          )
          .join('\n')
      : '• Servicios pendientes de confirmar';

    const nombreEvento =
      det.find((d) => d.servicio?.evento?.nombreEvento)?.servicio.evento?.nombreEvento || 'Evento reservado';

    return `Hola ${reserva.cliente?.nombre || 'cliente'},

¡Tu reserva fue confirmada! Estos son los datos principales:
• Fecha: ${new Date(reserva.fechaEvento).toLocaleDateString()}
• Evento: ${nombreEvento}
• Estado: ${reserva.estado}
• Servicios:
${servicios}
• Contacto del proveedor: ${
      reserva.proveedor?.usuario?.email || 'sin correo'
    } / ${reserva.proveedor?.usuario?.celular || 'sin teléfono'}

Gracias por confiar en nosotros.`;
  }

  ejecutarAccion() {
    if (!this.reservaEnAccion || !this.modoAccion) return;
    if (this.modoAccion === 'confirmar') {
      this.confirmarReserva(this.reservaEnAccion);
    } else {
      this.rechazarReserva(this.reservaEnAccion);
    }
  }

  confirmarReserva(reserva: Reserva) {
    this.reservaSrv.confirmar(reserva.idReserva).subscribe({
      next: (resp) => {
        this.reservas = this.reservas.map((r) => (r.idReserva === resp.idReserva ? resp : r));
        this.seleccionada = resp;
        this.cerrarModal();
      },
      error: () => alert('No pudimos confirmar la reserva'),
    });
  }

  rechazarReserva(reserva: Reserva) {
    this.reservaSrv.rechazar(reserva.idReserva).subscribe({
      next: (resp) => {
        this.reservas = this.reservas.map((r) => (r.idReserva === resp.idReserva ? resp : r));
        this.seleccionada = resp;
        this.cerrarModal();
      },
      error: () => alert('No pudimos actualizar la reserva'),
    });
  }
}
