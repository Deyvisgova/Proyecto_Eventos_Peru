import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
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
  eventos: string[] = ['Cumpleaños', 'Matrimonio', 'Aniversario'];

  proveedores: ProveedorServicio[] = [];
  proveedoresFiltrados: ProveedorServicio[] = [];

  listadoProveedores: string[] = [];
  listadoServicios: string[] = [];
  listadoOpciones: string[] = [];

  selectedEventos = new Set<string>();
  selectedProveedores = new Set<string>();
  selectedServicios = new Set<string>();
  selectedOpciones = new Set<string>();
  busquedaProveedor = '';

  opcionesPorProveedor: Record<number, ServicioOpcion[]> = {};

  cargando = false;
  cargandoOpciones = false;
  error = '';

  modalVisible = false;
  proveedorSeleccionado: ProveedorServicio | null = null;
  opciones: ServicioOpcion[] = [];
  seleccion: Record<number, boolean> = {};
  fechaEvento = '';

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
    if (this.tipoEvento) {
      this.selectedEventos.add(this.tipoEvento.toLowerCase());
    }

    this.cargarServicios();
  }

  cargarServicios() {
    this.cargando = true;
    this.error = '';
    this.proveedorServicioSrv.listarVisibles().subscribe({
      next: (lista) => {
        this.proveedores = lista;
        this.prepararFiltrosBase();
        this.preCargarOpciones();
        this.aplicarFiltros();
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

  prepararFiltrosBase() {
    const proveedores = new Set<string>();
    const servicios = new Set<string>();
    const eventos = new Set<string>();

    this.proveedores.forEach((p) => {
      const nombreProveedor = (p.proveedor.nombreEmpresa || p.proveedor.nombre || '').trim();
      if (nombreProveedor) proveedores.add(nombreProveedor);
      const nombreServicio = (p.catalogoServicio?.nombre || p.nombrePublico || '').trim();
      if (nombreServicio) servicios.add(nombreServicio);
      const nombreEvento = p.catalogoServicio?.nombre?.trim();
      if (nombreEvento) eventos.add(nombreEvento);
    });

    this.listadoProveedores = Array.from(proveedores).sort();
    this.listadoServicios = Array.from(servicios).sort();
    if (eventos.size) {
      this.eventos = Array.from(eventos).sort();
    }
  }

  preCargarOpciones() {
    if (!this.proveedores.length) return;
    this.cargandoOpciones = true;
    const solicitudes = this.proveedores.map((p) =>
      this.proveedorServicioSrv
        .listarOpciones(p.idProveedorServicio)
        .pipe(map((ops) => ({ id: p.idProveedorServicio, opciones: ops.filter((o) => o.estado === 'ACTIVO') })))
    );

    forkJoin(solicitudes).subscribe({
      next: (respuesta) => {
        const opcionesSet = new Set<string>();
        respuesta.forEach((item) => {
          this.opcionesPorProveedor[item.id] = item.opciones;
          item.opciones.forEach((o) => opcionesSet.add(o.nombreOpcion));
        });
        this.listadoOpciones = Array.from(opcionesSet).sort();
        this.aplicarFiltros();
      },
      error: (err) => {
        console.error('No se pudieron cargar las opciones', err);
      },
      complete: () => {
        this.cargandoOpciones = false;
      },
    });
  }

  toggleSeleccion(valor: string, grupo: Set<string>) {
    const clave = valor.toLowerCase();
    if (grupo.has(clave)) {
      grupo.delete(clave);
    } else {
      grupo.add(clave);
    }
    this.aplicarFiltros();
  }

  limpiarGrupo(grupo: Set<string>) {
    grupo.clear();
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    const filtroTexto = this.busquedaProveedor.toLowerCase().trim();

    const coincideEvento = (p: ProveedorServicio) =>
      !this.selectedEventos.size ||
      this.selectedEventos.has((p.catalogoServicio?.nombre || '').toLowerCase());

    // 🧭 Actualizar listados dependientes del evento seleccionado
    const proveedoresPorEvento = this.proveedores.filter((p) => coincideEvento(p));

    const proveedoresSet = new Set<string>();
    const serviciosSet = new Set<string>();
    const opcionesSet = new Set<string>();

    proveedoresPorEvento.forEach((p) => {
      const nombreProveedor = (p.proveedor.nombreEmpresa || p.proveedor.nombre || '').trim();
      const nombreServicio = (p.catalogoServicio?.nombre || p.nombrePublico || '').trim();

      if (nombreProveedor) proveedoresSet.add(nombreProveedor);
      if (nombreServicio) serviciosSet.add(nombreServicio);

      const opcionesProveedor = this.opcionesPorProveedor[p.idProveedorServicio] || [];
      opcionesProveedor.forEach((o) => opcionesSet.add(o.nombreOpcion));
    });

    this.listadoProveedores = Array.from(proveedoresSet).sort();
    this.listadoServicios = Array.from(serviciosSet).sort();
    this.listadoOpciones = Array.from(opcionesSet).sort();

    // Eliminar selecciones que ya no estén disponibles por el filtro de evento
    this.selectedProveedores.forEach((prov) => {
      if (!this.listadoProveedores.some((p) => p.toLowerCase() === prov)) {
        this.selectedProveedores.delete(prov);
      }
    });

    this.selectedServicios.forEach((srv) => {
      if (!this.listadoServicios.some((s) => s.toLowerCase() === srv)) {
        this.selectedServicios.delete(srv);
      }
    });

    this.selectedOpciones.forEach((op) => {
      if (!this.listadoOpciones.some((o) => o.toLowerCase() === op)) {
        this.selectedOpciones.delete(op);
      }
    });

    this.proveedoresFiltrados = this.proveedores.filter((p) => {
      const nombreProveedor = (p.proveedor.nombreEmpresa || p.proveedor.nombre || '').toLowerCase();
      const nombreServicio = (p.catalogoServicio?.nombre || p.nombrePublico || '').toLowerCase();

      const coincideTexto =
        !filtroTexto ||
        nombreProveedor.includes(filtroTexto) ||
        nombreServicio.includes(filtroTexto) ||
        p.nombrePublico.toLowerCase().includes(filtroTexto);

      const coincideProveedor = !this.selectedProveedores.size || this.selectedProveedores.has(nombreProveedor);

      const coincideServicio =
        !this.selectedServicios.size ||
        this.selectedServicios.has(nombreServicio) ||
        this.selectedServicios.has(p.nombrePublico.toLowerCase());

      const opcionesProveedor = this.opcionesPorProveedor[p.idProveedorServicio] || [];
      const coincideOpciones =
        !this.selectedOpciones.size ||
        opcionesProveedor.some((o) => this.selectedOpciones.has(o.nombreOpcion.toLowerCase()));

      return coincideTexto && coincideEvento(p) && coincideProveedor && coincideServicio && coincideOpciones;
    });
  }

  verServicios(p: ProveedorServicio) {
    this.proveedorSeleccionado = p;
    this.modalVisible = true;
    this.opciones = [];
    this.seleccion = {};
    this.fechaEvento = '';

    this.proveedorServicioSrv.listarOpciones(p.idProveedorServicio).subscribe({
      next: (ops) => {
        this.opciones = ops.filter((o) => o.estado === 'ACTIVO');
        this.opciones.forEach((o) => (this.seleccion[o.idOpcion] = false));
        this.opcionesPorProveedor[p.idProveedorServicio] = this.opciones;
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
    this.fechaEvento = '';
  }
}
