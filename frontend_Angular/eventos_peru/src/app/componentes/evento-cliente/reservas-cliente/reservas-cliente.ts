import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DetalleReserva, Reserva } from '../../../modelos/reserva';
import { ReservaService } from '../../../servicios/reserva.service';
import { DetalleReservaService } from '../../../servicios/detalle-reserva.service';

@Component({
  selector: 'app-reservas-cliente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservas-cliente.html',
  styleUrls: ['./reservas-cliente.css'],
})
export class ReservasCliente implements OnInit {
  private reservaSrv = inject(ReservaService);
  private detalleSrv = inject(DetalleReservaService);
  private router = inject(Router);

  reservas: Reserva[] = [];
  detalles: Record<number, DetalleReserva[]> = {};
  cargando = false;
  error = '';
  nombre = '';

  ngOnInit(): void {
    const raw = localStorage.getItem('usuario');
    if (!raw) {
      this.router.navigate(['/login']);
      return;
    }

    const user = JSON.parse(raw);
    if (user.rol !== 'CLIENTE') {
      this.router.navigate(['/login']);
      return;
    }
    this.nombre = user.nombre ?? '';
    this.cargarReservas(user.idUsuario ?? user.id_usuario ?? null);
  }

  cargarReservas(idCliente: number | null) {
    if (!idCliente) return;
    this.cargando = true;
    this.reservaSrv.listarPorCliente(idCliente).subscribe({
      next: (resp) => {
        this.reservas = resp;
        resp.forEach((r) => this.cargarDetalle(r.idReserva));
      },
      error: (err) => {
        console.error('[reservas-cliente] Error al cargar', err);
        this.error = 'No pudimos cargar tus reservas.';
      },
      complete: () => (this.cargando = false),
    });
  }

  cargarDetalle(idReserva: number) {
    this.detalleSrv.listarPorReserva(idReserva).subscribe({
      next: (det) => (this.detalles[idReserva] = det),
      error: () => console.error('No se pudo cargar detalle de', idReserva),
    });
  }

  estadoClase(reserva: Reserva) {
    if (reserva.estado === 'CONFIRMADA') return 'estado confirmada';
    if (reserva.estado === 'PENDIENTE') return 'estado pendiente';
    return 'estado rechazada';
  }

  puedeRechazar(reserva: Reserva) {
    if (reserva.estado === 'PENDIENTE') return true;
    if (reserva.estado !== 'CONFIRMADA') return false;
    if (!reserva.fechaLimiteRechazo) return true;
    const limite = new Date(reserva.fechaLimiteRechazo);
    const ahora = new Date();
    return ahora <= limite;
  }

  rechazar(reserva: Reserva) {
    if (!this.puedeRechazar(reserva)) return;
    this.reservaSrv.rechazar(reserva.idReserva).subscribe({
      next: (resp) => {
        this.reservas = this.reservas.map((r) => (r.idReserva === resp.idReserva ? resp : r));
      },
      error: () => alert('No pudimos rechazar la reserva. Verifica el plazo de 3 días.'),
    });
  }
}
