import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DetalleReserva, Reserva } from '../../../modelos/reserva';
import { ReservaService } from '../../../servicios/reserva.service';
import { DetalleReservaService } from '../../../servicios/detalle-reserva.service';
import { ProveedorService } from '../../../servicios/proveedor.service';
import { Router } from '@angular/router';

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
  detalleCargando: Record<number, boolean> = {};
  seleccionada: Reserva | null = null;
  cargando = false;
  error = '';

  mostrarModal = false;
  tipoAccion: 'CONFIRMAR' | 'RECHAZAR' | null = null;
  motivoRechazo = '';

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
        resp.forEach((r) => this.cargarDetalle(r.idReserva));
      },
      error: () => (this.error = 'No pudimos cargar las reservas'),
      complete: () => (this.cargando = false),
    });
  }

  cargarDetalle(idReserva: number) {
    if (this.detalles[idReserva]?.length && !this.detalleCargando[idReserva]) return;
    this.detalleCargando[idReserva] = true;
    this.detalleSrv.listarPorReserva(idReserva).subscribe({
      next: (det) => (this.detalles[idReserva] = det),
      error: () => (this.detalles[idReserva] = []),
      complete: () => (this.detalleCargando[idReserva] = false),
    });
  }

  verDetalle(reserva: Reserva) {
    this.seleccionada = reserva;
    this.cargarDetalle(reserva.idReserva);
  }

  estadoClase(estado: string) {
    if (estado === 'CONFIRMADA') return 'estado confirmada';
    if (estado === 'PENDIENTE') return 'estado pendiente';
    return 'estado cancelada';
  }

  abrirModalAccion(reserva: Reserva, tipo: 'CONFIRMAR' | 'RECHAZAR') {
    this.verDetalle(reserva);
    this.tipoAccion = tipo;
    this.motivoRechazo = '';
    this.mostrarModal = true;
  }

  confirmarSeleccionada() {
    if (!this.seleccionada) return;
    this.reservaSrv.confirmar(this.seleccionada.idReserva).subscribe({
      next: (resp) => {
        this.reservas = this.reservas.map((r) => (r.idReserva === resp.idReserva ? resp : r));
        this.seleccionada = resp;
        this.mostrarModal = false;
      },
      error: () => alert('No pudimos confirmar la reserva'),
    });
  }

  rechazarSeleccionada() {
    if (!this.seleccionada) return;
    this.reservaSrv.rechazar(this.seleccionada.idReserva, this.motivoRechazo).subscribe({
      next: (resp) => {
        this.reservas = this.reservas.map((r) => (r.idReserva === resp.idReserva ? resp : r));
        this.seleccionada = resp;
        this.mostrarModal = false;
      },
      error: () => alert('No pudimos actualizar la reserva'),
    });
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.tipoAccion = null;
  }

  totalReserva(idReserva: number): number {
    const det = this.detalles[idReserva] || [];
    return det.reduce((acc, d) => acc + (d.cantidad || 0) * (d.precioUnitario || 0), 0);
  }
}
