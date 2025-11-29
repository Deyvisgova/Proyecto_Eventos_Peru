import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReservaService } from '../../../servicios/reserva.service';
import { DetalleReservaService } from '../../../servicios/detalle-reserva.service';
import { DetalleReserva, Reserva } from '../../../modelos/reserva';

@Component({
  selector: 'app-reservas-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservas.html',
  styleUrls: ['./reservas.css'],
})
export class ReservasAdmin implements OnInit {
  private reservaSrv = inject(ReservaService);
  private detalleSrv = inject(DetalleReservaService);

  reservas: Reserva[] = [];
  detalles: Record<number, DetalleReserva[]> = {};
  cargando = false;
  error = '';

  ngOnInit(): void {
    this.cargarReservas();
  }

  cargarReservas(): void {
    this.cargando = true;
    this.error = '';
    this.reservaSrv.listar().subscribe({
      next: (resp) => {
        this.reservas = resp;
        resp.forEach((r) => this.cargarDetalle(r.idReserva));
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las reservas.';
        this.cargando = false;
      },
    });
  }

  cargarDetalle(idReserva: number): void {
    this.detalleSrv.listarPorReserva(idReserva).subscribe({
      next: (det) => (this.detalles[idReserva] = det),
      error: () => console.error('No se pudo cargar detalle de', idReserva),
    });
  }

  totalServicios(idReserva: number): number {
    return this.detalles[idReserva]?.reduce((acc, det) => acc + det.cantidad, 0) ?? 0;
  }

  totalEstimado(idReserva: number): number {
    return (
      this.detalles[idReserva]?.reduce((acc, det) => acc + det.cantidad * det.precioUnitario, 0) ?? 0
    );
  }

  etiquetaEstado(reserva: Reserva): string {
    const estado = reserva.estado;
    return estado === 'CONFIRMADA'
      ? 'confirmada'
      : estado === 'CANCELADA'
        ? 'cancelada'
        : estado === 'RECHAZADA'
          ? 'rechazada'
          : 'pendiente';
  }

  proveedorNombre(reserva: Reserva): string {
    return (
      reserva.proveedor?.nombre ||
      reserva.proveedor?.nombreEmpresa ||
      reserva.proveedor?.usuario?.email ||
      'Proveedor sin nombre'
    );
  }

  clienteNombre(reserva: Reserva): string {
    return reserva.cliente?.nombre || reserva.cliente?.email || 'Cliente no especificado';
  }
}
