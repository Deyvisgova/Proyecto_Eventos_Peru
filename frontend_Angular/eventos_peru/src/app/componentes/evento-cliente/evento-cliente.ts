import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import {
  ProveedorServicio,
  ServicioOpcion,
} from '../../modelos/proveedor-servicio';
import { ProveedorServicioService } from '../../servicios/proveedor-servicio.service';

@Component({
  selector: 'app-evento-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './evento-cliente.html',
  styleUrls: ['./evento-cliente.css'],
})
export class EventoCliente implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private proveedorServicioSrv = inject(ProveedorServicioService);

  nombre = '';
  tipoEvento = '';
  eventos = ['Cumpleaños', 'Matrimonio', 'Aniversario'];
  filtroEvento = '';
  filtroProveedor = '';

  proveedores: ProveedorServicio[] = [];
  proveedoresFiltrados: ProveedorServicio[] = [];

  cargando = false;
  error = '';

  modalVisible = false;
  proveedorSeleccionado: ProveedorServicio | null = null;
  opciones: ServicioOpcion[] = [];
  seleccion: Record<number, boolean> = {};

  ngOnInit() {
    // 🧠 Recuperar nombre y validar sesión
    const raw = localStorage.getItem('usuario');
    if (!raw) {
      this.router.navigate(['/login']);
      return;
    }
    const usuario = JSON.parse(raw);
    if (usuario.rol !== 'CLIENTE') {
      this.router.navigate(['/login']);
      return;
    }
    this.nombre = usuario.nombre ?? '';

    // 🧠 Recuperar tipo de evento desde la URL
    this.tipoEvento = this.route.snapshot.paramMap.get('tipo') ?? '';
    this.filtroEvento = this.tipoEvento;

    this.cargarServicios();
  }

  cargarServicios() {
    this.cargando = true;
    this.error = '';
    this.proveedorServicioSrv.listarVisibles().subscribe({
      next: (lista) => {
        this.proveedores = lista;
        this.proveedoresFiltrados = [...this.proveedores];
        this.filtrar();
      },
      error: (err) => {
        console.error('No se pudieron cargar los servicios', err);
        this.error = 'No pudimos cargar los servicios disponibles. Intenta nuevamente.';
      },
      complete: () => {
        this.cargando = false;
      },
    });
  }

  filtrar() {
    const fEvento = this.filtroEvento.toLowerCase();
    const fProv = this.filtroProveedor.toLowerCase();
    this.proveedoresFiltrados = this.proveedores.filter(
      (p) =>
        (p.nombrePublico.toLowerCase().includes(fProv) ||
          p.proveedor.nombreEmpresa?.toLowerCase().includes(fProv) ||
          p.proveedor.nombre?.toLowerCase().includes(fProv)) &&
        (fEvento === '' || this.eventos.includes(this.filtroEvento))
    );
  }

  verServicios(p: ProveedorServicio) {
    this.proveedorSeleccionado = p;
    this.modalVisible = true;
    this.opciones = [];
    this.seleccion = {};

    this.proveedorServicioSrv.listarOpciones(p.idProveedorServicio).subscribe({
      next: (ops) => {
        this.opciones = ops.filter((o) => o.estado === 'ACTIVO');
        this.opciones.forEach((o) => (this.seleccion[o.idOpcion] = false));
      },
      error: (err) => {
        console.error('No se pudieron cargar las opciones', err);
      },
    });
  }

  cerrarModal() {
    this.modalVisible = false;
    this.proveedorSeleccionado = null;
    this.opciones = [];
    this.seleccion = {};
  }

  cerrarSesion() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
