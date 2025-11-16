import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Servicio } from '../../../modelos/servicio';
import { ServicioService } from '../../../servicios/servicio.service';

@Component({
  selector: 'app-servicios-peo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './servicios-peo.html',
  styleUrls: ['./servicios-peo.css'],
})
export class ServiciosPeo implements OnInit {
  servicios: Servicio[] = [];
  cargando = false;
  error = '';

  constructor(private servicioService: ServicioService) {}

  ngOnInit(): void {
    this.cargarServicios();
  }

  cargarServicios(): void {
    this.cargando = true;
    this.error = '';
    this.servicioService.listar().subscribe({
      next: (resp) => {
        this.servicios = resp;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar servicios', err);
        this.error = 'No se pudo obtener la lista de servicios. Intenta nuevamente.';
        this.cargando = false;
      },
    });
  }

  obtenerNombreProveedor(servicio: Servicio): string {
    return (
      servicio.proveedor?.nombreEmpresa ||
      servicio.proveedor?.nombre ||
      'Proveedor sin registrar'
    );
  }

  obtenerNombreEvento(servicio: Servicio): string {
    return servicio.evento?.nombreEvento || servicio.evento?.nombre || 'Evento sin asignar';
  }
}
