import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { DetalleReserva, Reserva } from '../../../modelos/reserva';
import { ReservaService } from '../../../servicios/reserva.service';
import { DetalleReservaService } from '../../../servicios/detalle-reserva.service';
import { ProveedorService } from '../../../servicios/proveedor.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reservas-proveedor',
  standalone: true,
  imports: [CommonModule],
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
        this.reservas = resp;
        resp.forEach((r) => this.cargarDetalle(r.idReserva));
      },
      error: () => (this.error = 'No pudimos cargar las reservas'),
      complete: () => (this.cargando = false),
    });
  }

  cargarDetalle(idReserva: number) {
    if (this.detalles[idReserva]) return;
    this.detalleSrv.listarPorReserva(idReserva).subscribe({
      next: (det) => (this.detalles[idReserva] = det),
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

  confirmar(reserva: Reserva) {
    this.reservaSrv.confirmar(reserva.idReserva).subscribe({
      next: (resp) => {
        this.reservas = this.reservas.map((r) => (r.idReserva === resp.idReserva ? resp : r));
        this.seleccionada = resp;
      },
      error: () => alert('No pudimos confirmar la reserva'),
    });
  }

  rechazar(reserva: Reserva) {
    this.reservaSrv.rechazar(reserva.idReserva).subscribe({
      next: (resp) => {
        this.reservas = this.reservas.map((r) => (r.idReserva === resp.idReserva ? resp : r));
        this.seleccionada = resp;
      },
      error: () => alert('No pudimos actualizar la reserva'),
    });
  }
}
