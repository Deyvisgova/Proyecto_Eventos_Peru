import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReservaService } from '../../../servicios/reserva.service';
import { Reserva } from '../../../modelos/reserva';

@Component({
  selector: 'app-reservas-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservas.html',
  styleUrls: ['./reservas.css'],
})
export class ReservasAdmin implements OnInit {
  private reservaSrv = inject(ReservaService);

  reservas: Reserva[] = [];
  cargando = false;
  error = '';

  ngOnInit(): void {
    this.cargando = true;
    this.reservaSrv.listar().subscribe({
      next: (resp) => (this.reservas = Array.isArray(resp) ? resp : []),
      error: () => (this.error = 'No pudimos cargar las reservas'),
      complete: () => (this.cargando = false),
    });
  }
}
