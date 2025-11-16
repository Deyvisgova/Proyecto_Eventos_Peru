import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  private readonly eventosSignal = signal<Evento[]>([]);
  readonly terminoBusqueda = signal('');
  readonly eventosFiltrados = computed(() => {
    const termino = this.terminoBusqueda().trim().toLowerCase();
    const eventos = this.eventosSignal();

    if (!termino) {
      return eventos;
    }

    return eventos.filter((evento) => {
      const nombreNormalizado = (evento.nombreEvento ?? '').toLowerCase();
      return nombreNormalizado.includes(termino);
    });
  });

  cargando = false;

  nuevoEvento: Evento = this.crearEventoBase();
  eventoSeleccionado: Evento | null = null;
  eventoAEliminar: Evento | null = null;

  constructor(private readonly eventoService: EventoService) {}

  ngOnInit(): void {
    this.cargarEventos();
  }

  cargarEventos(): void {
    this.cargando = true;
    this.eventoService.obtenerEventos().subscribe({
      next: (data) => {
        const eventos = Array.isArray(data) ? data : [];
        this.eventosSignal.set(eventos);
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar eventos', error);
        this.cargando = false;
        alert('No se pudieron cargar los eventos.');
      },
    });
  }

  actualizarBusqueda(valor: string): void {
    this.terminoBusqueda.set(valor);
  }

  abrirModalNuevo(): void {
    this.nuevoEvento = this.crearEventoBase();
    this.abrirModal('modalNuevoEvento');
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
        this.cerrarModal('modalNuevoEvento');
      },
      error: (error) => {
        console.error('Error al registrar el evento', error);
        alert('No se pudo registrar el evento.');
      },
    });
  }

  abrirModalEditar(evento: Evento): void {
    this.eventoSeleccionado = { ...evento };
    this.abrirModal('modalEditarEvento');
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
          this.cerrarModal('modalEditarEvento');
        },
        error: (error) => {
          console.error('Error al actualizar evento', error);
          alert('No se pudo actualizar el evento.');
        },
      });
  }

  abrirModalEliminar(evento: Evento): void {
    this.eventoAEliminar = evento;
    this.abrirModal('modalEliminarEvento');
  }

  eliminarEvento(): void {
    if (!this.eventoAEliminar?.idEvento) {
      alert('No hay evento seleccionado.');
      return;
    }

    this.eventoService.eliminarEvento(this.eventoAEliminar.idEvento).subscribe({
      next: () => {
        this.cargarEventos();
        this.cerrarModal('modalEliminarEvento');
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

  private abrirModal(id: string): void {
    if (typeof document === 'undefined') {
      return;
    }
    const modalElement = document.getElementById(id);
    if (!modalElement) {
      return;
    }
    const instancia = bootstrap.Modal.getOrCreateInstance(modalElement);
    instancia.show();
  }

  private cerrarModal(id: string): void {
    if (typeof document === 'undefined') {
      return;
    }
    const modalElement = document.getElementById(id);
    if (!modalElement) {
      return;
    }
    bootstrap.Modal.getInstance(modalElement)?.hide();
  }
}
