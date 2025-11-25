import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CatalogoServicio,
  EstadoCatalogo,
  ModeracionCatalogoRequest,
  NuevoCatalogoServicioRequest,
} from '../../../modelos/catalogo-servicio';
import { CatalogoServicioService } from '../../../servicios/catalogo-servicio.service';

@Component({
  selector: 'app-servicios-peo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './servicios-peo.html',
  styleUrls: ['./servicios-peo.css'],
})
export class ServiciosPeo implements OnInit {
  catalogo: CatalogoServicio[] = [];
  pendientes: CatalogoServicio[] = [];
  filtroEstado: EstadoCatalogo | 'TODOS' = 'ACTIVO';
  nuevoTipo: NuevoCatalogoServicioRequest = { nombre: '', descripcion: '' };
  motivosRechazo: Record<number, string> = {};
  idAdminRevisor = 1; // Placeholder para enlazar con sesión de admin

  cargandoCatalogo = false;
  cargandoPendientes = false;
  mensaje = '';
  error = '';

  constructor(private catalogoServicio: CatalogoServicioService) {}

  ngOnInit(): void {
    this.cargarCatalogo();
    this.cargarPendientes();
  }

  cargarCatalogo(): void {
    this.cargandoCatalogo = true;
    this.mensaje = '';
    this.error = '';
    const estado = this.filtroEstado === 'TODOS' ? undefined : this.filtroEstado;
    this.catalogoServicio.listar(estado).subscribe({
      next: (lista) => {
        this.catalogo = lista;
        this.cargandoCatalogo = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el catálogo de servicios.';
        this.cargandoCatalogo = false;
      },
    });
  }

  cargarPendientes(): void {
    this.cargandoPendientes = true;
    this.catalogoServicio.listarPendientes().subscribe({
      next: (lista) => {
        this.pendientes = lista;
        this.cargandoPendientes = false;
      },
      error: () => {
        this.error = 'No se pudo cargar la cola de tipos propuestos.';
        this.cargandoPendientes = false;
      },
    });
  }

  registrarTipo(): void {
    if (!this.nuevoTipo.nombre.trim()) {
      this.error = 'El nombre del servicio es obligatorio.';
      return;
    }

    this.catalogoServicio.crearComoAdmin(this.nuevoTipo).subscribe({
      next: () => {
        this.mensaje = 'Tipo de servicio creado y activado.';
        this.nuevoTipo = { nombre: '', descripcion: '' };
        this.cargarCatalogo();
      },
      error: () => {
        this.error = 'No se pudo registrar el tipo de servicio.';
      },
    });
  }

  aprobar(catalogo: CatalogoServicio): void {
    const payload: ModeracionCatalogoRequest = { idAdminRevisor: this.idAdminRevisor };
    this.catalogoServicio.aprobar(catalogo.idCatalogo, payload).subscribe({
      next: () => {
        this.mensaje = `Se aprobó "${catalogo.nombre}".`;
        this.cargarCatalogo();
        this.cargarPendientes();
      },
      error: () => {
        this.error = 'No se pudo aprobar el tipo propuesto.';
      },
    });
  }

  rechazar(catalogo: CatalogoServicio): void {
    const motivo = (this.motivosRechazo[catalogo.idCatalogo] || '').trim();
    if (!motivo) {
      this.error = 'Ingresa un motivo de rechazo para notificar al proveedor.';
      return;
    }
    const payload: ModeracionCatalogoRequest = {
      idAdminRevisor: this.idAdminRevisor,
      motivoRechazo: motivo,
    };

    this.catalogoServicio.rechazar(catalogo.idCatalogo, payload).subscribe({
      next: () => {
        this.mensaje = `Se rechazó "${catalogo.nombre}".`;
        this.motivosRechazo[catalogo.idCatalogo] = '';
        this.cargarCatalogo();
        this.cargarPendientes();
      },
      error: () => {
        this.error = 'No se pudo rechazar el tipo propuesto.';
      },
    });
  }

  badgeClase(estado: EstadoCatalogo): string {
    return estado === 'ACTIVO' ? 'badge-exito' : estado === 'RECHAZADO' ? 'badge-error' : 'badge-aviso';
  }
}
