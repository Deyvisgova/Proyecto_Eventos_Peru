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
import { EventoService } from '../../servicios/evento.service';
import { CatalogoServicioService } from '../../servicios/catalogo-servicio.service';
import { CatalogoEventoServicio } from '../../modelos/catalogo-evento-servicio';
import { Evento } from '../../modelos/evento';
import { ReservaService } from '../../servicios/reserva.service';
import { Reserva } from '../../modelos/reserva';

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
  private eventoSrv = inject(EventoService);
  private catalogoSrv = inject(CatalogoServicioService);
  private reservaSrv = inject(ReservaService);

  nombre = '';
  clienteId: number | null = null;
  tipoEvento = '';
  tipoEventoLabel = '';
  eventosBase: string[] = ['Cumpleaños', 'Matrimonio', 'Aniversario'];
  eventos: string[] = [...this.eventosBase];
  eventosDisponibles: Evento[] = [];
  mapaCatalogoEventos: Record<number, number[]> = {};

  proveedores: ProveedorServicio[] = [];
  proveedoresFiltrados: ProveedorServicio[] = [];

  usuarioSesion: any = null;

  listadoProveedores: { nombre: string; logo?: string }[] = [];
  listadoServicios: string[] = [];
  listadoOpciones: string[] = [];

  selectedEventos = new Set<string>();
  selectedProveedores = new Set<string>();
  busquedaProveedor = '';

  opcionesPorProveedor: Record<number, ServicioOpcion[]> = {};

  reservasProveedor: Reserva[] = [];
  diasCalendario: { fecha: string; numero: number; estado: string; pasado: boolean }[] = [];
  mesActual = new Date();
  hoy = this.obtenerInicioDia(new Date());

  cargando = false;
  cargandoOpciones = false;
  error = '';

  modalVisible = false;
  proveedorSeleccionado: ProveedorServicio | null = null;
  opciones: ServicioOpcion[] = [];
  seleccion: Record<number, boolean> = {};
  fechaEvento = '';
  agendando = false;
  mensajeAgendar = '';

  ngOnInit() {
    // 🧠 Recuperar nombre y validar sesión
    const raw = localStorage.getItem('usuario');
    if (!raw) {
      this.router.navigate(['/login']);
      return;
    }
    const usuario = JSON.parse(raw);
    this.usuarioSesion = usuario;
    if (usuario.rol !== 'CLIENTE') {
      this.router.navigate(['/login']);
      return;
    }
    this.nombre = usuario.nombre ?? '';
    this.clienteId = usuario.idUsuario ?? usuario.id_usuario ?? null;

    // 🧠 Recuperar tipo de evento desde la URL
    this.tipoEvento = this.normalizarEvento(this.route.snapshot.paramMap.get('tipo') ?? '');
    if (this.tipoEvento) {
      this.selectedEventos.add(this.tipoEvento);
    }
    this.cargarServicios();
  }

  private obtenerInicioDia(fecha: Date) {
    const copia = new Date(fecha);
    copia.setHours(0, 0, 0, 0);
    return copia;
  }

  private obtenerInicioMes(fecha: Date) {
    const inicio = this.obtenerInicioDia(fecha);
    inicio.setDate(1);
    return inicio;
  }

  logoProveedor(p: ProveedorServicio) {
    const proveedorPlano = p.proveedor as unknown as Record<string, unknown>;
    const posibleLogo =
      p.proveedor.logo ||
      p.proveedor.urlLogo ||
      proveedorPlano['logoUrl'] ||
      proveedorPlano['logo'];

    return typeof posibleLogo === 'string' ? posibleLogo : '';
  }

  inicialProveedor(p: ProveedorServicio) {
    const nombre = p.proveedor.nombreEmpresa || p.proveedor.nombre || '?';
    return nombre.slice(0, 1).toUpperCase();
  }

  get opcionesSeleccionadas(): ServicioOpcion[] {
    return this.opciones.filter((o) => this.seleccion[o.idOpcion]);
  }

  get totalSeleccionado(): number {
    return this.opcionesSeleccionadas.reduce((acc, op) => acc + (op.precio || 0), 0);
  }

  get tieneSeleccion(): boolean {
    return this.opcionesSeleccionadas.length > 0;
  }

  cargarServicios() {
    this.cargando = true;
    this.error = '';

    forkJoin({
      eventos: this.eventoSrv.obtenerEventos(),
      relaciones: this.catalogoSrv.listarRelaciones(),
      servicios: this.proveedorServicioSrv.listarVisibles(),
    }).subscribe({
      next: ({ eventos, relaciones, servicios }) => {
        this.eventosDisponibles = eventos;
        if (eventos.length) {
          this.eventosBase = eventos.map((e) => e.nombreEvento);
          this.eventos = [...this.eventosBase];
        }

        this.mapaCatalogoEventos = this.armarMapa(relaciones);
        this.tipoEventoLabel = this.obtenerNombreEvento(this.tipoEvento);

        this.proveedores = servicios;
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
    this.eventos = [...this.eventosBase];
  }

  normalizarEvento(valor: string) {
    if (!valor) return '';
    return valor
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  }

  private obtenerNombreEvento(eventoNormalizado: string) {
    if (!eventoNormalizado) return '';
    const encontrado = this.eventosDisponibles.find(
      (e) => this.normalizarEvento(e.nombreEvento) === eventoNormalizado
    );
    if (encontrado) return encontrado.nombreEvento;

    return (
      this.eventosBase.find((e) => this.normalizarEvento(e) === eventoNormalizado) ||
      eventoNormalizado.charAt(0).toUpperCase() + eventoNormalizado.slice(1)
    );
  }

  private armarMapa(relaciones: CatalogoEventoServicio[]): Record<number, number[]> {
    const mapa: Record<number, number[]> = {};
    relaciones.forEach((rel) => {
      const idCatalogo = rel.catalogoServicio?.idCatalogo;
      const idEvento = rel.evento?.idEvento;
      if (!idCatalogo || !idEvento) return;
      if (!mapa[idCatalogo]) mapa[idCatalogo] = [];
      mapa[idCatalogo].push(idEvento);
    });
    return mapa;
  }

  claveProveedor(valor: string) {
    return valor.toLowerCase();
  }

  private obtenerIdsEventosSeleccionados(): number[] {
    return Array.from(this.selectedEventos)
      .map((nombre) =>
        this.eventosDisponibles.find((e) => this.normalizarEvento(e.nombreEvento) === nombre)?.idEvento
      )
      .filter((id): id is number => Number.isFinite(id));
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
    const clave = grupo === this.selectedEventos ? this.normalizarEvento(valor) : this.claveProveedor(valor);
    if (grupo.has(clave)) {
      grupo.delete(clave);
    } else {
      grupo.add(clave);
    }
    if (grupo === this.selectedEventos) {
      const [primero] = Array.from(grupo);
      this.tipoEvento = primero ?? '';
      this.tipoEventoLabel = this.obtenerNombreEvento(this.tipoEvento);
    }
    this.aplicarFiltros();
  }

  limpiarGrupo(grupo: Set<string>) {
    grupo.clear();
    if (grupo === this.selectedEventos) {
      this.tipoEvento = '';
      this.tipoEventoLabel = '';
    }
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    const filtroTexto = this.busquedaProveedor.toLowerCase().trim();

    const idsEventosSeleccionados = this.obtenerIdsEventosSeleccionados();

    const coincideEvento = (p: ProveedorServicio) => {
      if (!idsEventosSeleccionados.length || !Object.keys(this.mapaCatalogoEventos).length) return true;
      const eventosCatalogo = this.mapaCatalogoEventos[p.catalogoServicio?.idCatalogo] || [];
      return idsEventosSeleccionados.some((id) => eventosCatalogo.includes(id));
    };

    const proveedoresPorEvento = this.proveedores.filter((p) => coincideEvento(p));

    const proveedoresMap = new Map<string, { nombre: string; logo?: string }>();
    proveedoresPorEvento.forEach((p) => {
      const nombreProveedor = (p.proveedor.nombreEmpresa || p.proveedor.nombre || '').trim();
      if (!nombreProveedor) return;
      const clave = this.claveProveedor(nombreProveedor);
      const logo = this.logoProveedor(p);
      const existente = proveedoresMap.get(clave);
      if (!existente) {
        proveedoresMap.set(clave, { nombre: nombreProveedor, logo });
      } else if (logo && !existente.logo) {
        proveedoresMap.set(clave, { ...existente, logo });
      }
    });
    this.listadoProveedores = Array.from(proveedoresMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));

    // Asegurar que los proveedores seleccionados sigan disponibles
    this.selectedProveedores.forEach((prov) => {
      if (!this.listadoProveedores.some((p) => this.claveProveedor(p.nombre) === prov)) {
        this.selectedProveedores.delete(prov);
      }
    });

    const proveedoresSegunSeleccion = proveedoresPorEvento.filter((p) => {
      const nombreProveedor = (p.proveedor.nombreEmpresa || p.proveedor.nombre || '').toLowerCase();
      return !this.selectedProveedores.size || this.selectedProveedores.has(nombreProveedor);
    });

    const serviciosSet = new Set<string>();
    const opcionesSet = new Set<string>();
    proveedoresSegunSeleccion.forEach((p) => {
      const nombreServicio = (p.catalogoServicio?.nombre || p.nombrePublico || '').trim();
      if (nombreServicio) serviciosSet.add(nombreServicio);

      const opcionesProveedor = this.opcionesPorProveedor[p.idProveedorServicio] || [];
      opcionesProveedor.forEach((o) => opcionesSet.add(o.nombreOpcion));
    });

    this.listadoServicios = Array.from(serviciosSet).sort();
    this.listadoOpciones = Array.from(opcionesSet).sort();

    this.proveedoresFiltrados = proveedoresSegunSeleccion.filter((p) => {
      const nombreProveedor = (p.proveedor.nombreEmpresa || p.proveedor.nombre || '').toLowerCase();
      const nombreServicio = (p.catalogoServicio?.nombre || p.nombrePublico || '').toLowerCase();

      const coincideTexto =
        !filtroTexto ||
        nombreProveedor.includes(filtroTexto) ||
        nombreServicio.includes(filtroTexto) ||
        p.nombrePublico.toLowerCase().includes(filtroTexto) ||
        p.descripcionGeneral?.toLowerCase().includes(filtroTexto);

      return coincideTexto;
    });
  }

  verServicios(p: ProveedorServicio) {
    this.proveedorSeleccionado = p;
    this.modalVisible = true;
    this.opciones = [];
    this.seleccion = {};
    this.fechaEvento = '';
    this.reservasProveedor = [];
    this.diasCalendario = [];
    this.mesActual = this.obtenerInicioMes(new Date());
    this.hoy = this.obtenerInicioDia(new Date());
    this.mensajeAgendar = '';
    this.generarCalendario();

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

    const idProv = p.proveedor?.idProveedor;
    if (idProv) {
      this.reservaSrv.listarPorProveedor(idProv).subscribe({
        next: (r) => {
          this.reservasProveedor = r;
          this.generarCalendario();
        },
      });
    }
  }

  cerrarModal() {
    this.modalVisible = false;
    this.proveedorSeleccionado = null;
    this.opciones = [];
    this.seleccion = {};
    this.fechaEvento = '';
  }

  agendarEvento() {
    if (!this.proveedorSeleccionado || !this.fechaEvento || !this.clienteId) {
      this.mensajeAgendar = 'Selecciona una fecha válida y asegúrate de haber iniciado sesión.';
      return;
    }

    if (!this.tieneSeleccion) {
      this.mensajeAgendar = 'Elige al menos un servicio u opción para agendar.';
      return;
    }

    this.agendando = true;
    this.mensajeAgendar = '';

    const nombreCliente = this.nombre || '';
    const telefonoCliente =
      this.usuarioSesion?.celular || this.usuarioSesion?.telefono || this.usuarioSesion?.usuario?.celular || '';

    const detalles = this.opcionesSeleccionadas.map((op) => ({
      reserva: { idReserva: 0 } as any,
      cantidad: 1,
      precioUnitario: op.precio,
      opcion: { idOpcion: op.idOpcion } as any,
      nombreEvento: this.tipoEventoLabel || this.tipoEvento || 'Evento',
      nombreServicio:
        this.proveedorSeleccionado?.nombrePublico || this.proveedorSeleccionado?.catalogoServicio?.nombre || 'Servicio',
      nombreOpcion: op.nombreOpcion,
      nombreCliente,
      telefonoCliente,
      fechaEvento: this.fechaEvento,
      subtotal: op.precio,
      total: op.precio,
    }));

    const payload: Partial<Reserva> = {
      cliente: { idUsuario: this.clienteId } as any,
      proveedor: { idProveedor: this.proveedorSeleccionado.proveedor.idProveedor } as any,
      fechaEvento: this.fechaEvento,
      estado: 'PENDIENTE' as Reserva['estado'],
      detalles,
    };

    this.reservaSrv.crear(payload).subscribe({
      next: (resp) => {
        this.mensajeAgendar = '¡Listo! Tu solicitud fue registrada y el proveedor la revisará pronto.';
        this.reservasProveedor = [...this.reservasProveedor, resp];
        this.generarCalendario();
      },
      error: () => {
        this.mensajeAgendar = 'No pudimos agendar el evento. Inténtalo de nuevo más tarde.';
      },
      complete: () => {
        this.agendando = false;
      },
    });
  }

  generarCalendario() {
    const año = this.mesActual.getFullYear();
    const mes = this.mesActual.getMonth();
    const diasMes = new Date(año, mes + 1, 0).getDate();

    const mapa = new Map<string, string>();
    this.reservasProveedor.forEach((r) => {
      if (!r.fechaEvento) return;
      const clave = String(r.fechaEvento);
      const estadoActual = mapa.get(clave);
      if (r.estado === 'CONFIRMADA') {
        mapa.set(clave, 'confirmada');
      } else if (r.estado === 'PENDIENTE' && estadoActual !== 'confirmada') {
        mapa.set(clave, 'pendiente');
      } else if (!estadoActual) {
        mapa.set(clave, 'rechazada');
      }
    });

    const dias: { fecha: string; numero: number; estado: string; pasado: boolean }[] = [];
    for (let i = 1; i <= diasMes; i++) {
      const fecha = this.obtenerInicioDia(new Date(año, mes, i));
      const clave = fecha.toISOString().slice(0, 10);
      dias.push({ fecha: clave, numero: i, estado: mapa.get(clave) || '', pasado: this.esFechaPasada(fecha) });
    }
    this.diasCalendario = dias;
  }

  cambiarMes(delta: number) {
    const mesPropuesto = this.obtenerInicioMes(
      new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + delta, 1)
    );
    const mesMinimo = this.obtenerInicioMes(this.hoy);

    this.mesActual = mesPropuesto < mesMinimo ? mesMinimo : mesPropuesto;
    this.generarCalendario();
  }

  seleccionarDia(fecha: string) {
    const fechaSeleccionada = new Date(fecha);
    if (this.esFechaPasada(fechaSeleccionada)) {
      return;
    }
    this.fechaEvento = fecha;
    this.mensajeAgendar = '';
  }

  private esFechaPasada(fecha: Date) {
    return this.obtenerInicioDia(fecha) < this.hoy;
  }
}
