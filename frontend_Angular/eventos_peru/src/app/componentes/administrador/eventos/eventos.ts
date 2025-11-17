import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { EventoService } from '../../../servicios/evento.service';
import { Evento } from '../../../modelos/evento';

declare const bootstrap: any;

@Component({
  selector: 'app-eventos-admin',
  standalone: true,
  templateUrl: './eventos.html',
  styleUrls: ['./eventos.css'],
  imports: [CommonModule, FormsModule],
})
export class Eventos implements OnInit {
  eventos: Evento[] = [];
  cargando = false;
  terminoBusqueda = '';

  nuevoEvento: Evento = this.crearEventoBase();
  eventoSeleccionado: Evento | null = null;
  eventoAEliminar: Evento | null = null;

  constructor(
    private readonly eventoService: EventoService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarEventos();
  }

  get eventosFiltrados(): Evento[] {
    const termino = this.terminoBusqueda.trim().toLowerCase();
    if (!termino) {
      return this.eventos;
    }

    return this.eventos.filter((evento) => {
      const nombreNormalizado = (evento.nombreEvento ?? '').toLowerCase();
      return nombreNormalizado.includes(termino);
    });
  }

  cargarEventos(): void {
    this.cargando = true;
    this.eventoService
      .obtenerEventos()
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          const eventos = Array.isArray(data) ? data : [];
          this.eventos = [...eventos].sort((a, b) =>
            (a.nombreEvento ?? '').localeCompare(b.nombreEvento ?? '', 'es', { sensitivity: 'base' })
          );
        },
        error: (error) => {
          console.error('Error al cargar eventos', error);
          alert('No se pudieron cargar los eventos.');
          this.eventos = [];
        },
      });
  }

  abrirModalNuevo(): void {
    this.nuevoEvento = this.crearEventoBase();
    const modal = new bootstrap.Modal(document.getElementById('modalNuevoEvento'));
    modal.show();
  }

  guardarEvento(): void {
    const nombre = this.nuevoEvento.nombreEvento?.trim();
    if (!nombre) {
      alert('El nombre del evento es obligatorio.');
      return;
    }

    this.eventoService.crearEvento({ idEvento: null, nombreEvento: nombre }).subscribe({
      next: () => {
        this.cargarEventos();
        bootstrap.Modal.getInstance(document.getElementById('modalNuevoEvento'))?.hide();
      },
      error: (error) => {
        console.error('Error al registrar el evento', error);
        alert('No se pudo registrar el evento.');
      },
    });
  }

  abrirModalEditar(evento: Evento): void {
    this.eventoSeleccionado = { ...evento };
    const modal = new bootstrap.Modal(document.getElementById('modalEditarEvento'));
    modal.show();
  }

  actualizarEvento(): void {
    if (!this.eventoSeleccionado?.idEvento) {
      alert('El evento seleccionado no es válido.');
      return;
    }

    const nombre = this.eventoSeleccionado.nombreEvento?.trim();
    if (!nombre) {
      alert('El nombre del evento es obligatorio.');
      return;
    }

    this.eventoService
      .actualizarEvento(this.eventoSeleccionado.idEvento, {
        idEvento: this.eventoSeleccionado.idEvento,
        nombreEvento: nombre,
      })
      .subscribe({
        next: () => {
          this.cargarEventos();
          bootstrap.Modal.getInstance(document.getElementById('modalEditarEvento'))?.hide();
        },
        error: (error) => {
          console.error('Error al actualizar evento', error);
          alert('No se pudo actualizar el evento.');
        },
      });
  }

  abrirModalEliminar(evento: Evento): void {
    this.eventoAEliminar = evento;
    const modal = new bootstrap.Modal(document.getElementById('modalEliminarEvento'));
    modal.show();
  }

  eliminarEvento(): void {
    if (!this.eventoAEliminar?.idEvento) {
      alert('No hay evento seleccionado.');
      return;
    }

    this.eventoService.eliminarEvento(this.eventoAEliminar.idEvento).subscribe({
      next: () => {
        this.cargarEventos();
        bootstrap.Modal.getInstance(document.getElementById('modalEliminarEvento'))?.hide();
        this.eventoAEliminar = null;
      },
      error: (error) => {
        console.error('Error al eliminar evento', error);
        alert('No se pudo eliminar el evento.');
      },
    });
  }

  private crearEventoBase(): Evento {
    return { idEvento: null, nombreEvento: '' };
  }

  trackByEventoId(index: number, evento: Evento): number | null {
    return evento.idEvento ?? index;
  }
}
