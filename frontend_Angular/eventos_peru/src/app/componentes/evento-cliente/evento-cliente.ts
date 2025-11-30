import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import Swal from 'sweetalert2';
import { map, switchMap } from 'rxjs/operators';
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
import { DetalleReservaService } from '../../servicios/detalle-reserva.service';

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
  private detalleSrv = inject(DetalleReservaService);

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

  listadoProveedores: string[] = [];
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
  fechasPorOpcion: Record<number, string> = {};
  horasPorOpcion: Record<number, string> = {};
  fechaEvento = '';
  horaEvento = '12:00';
  agendando = false;
  mensajeAgendar = '';
  numeroReservaActual: number | null = null;
  ultimoConteoReserva = 0;

  private apiBaseImagenes = 'http://localhost:8080/';

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
    const candidatoId =
      usuario.idUsuario ??
      usuario.id_usuario ??
      usuario.id_cliente ??
      usuario.idcliente ??
      usuario.id;
    this.clienteId = Number.isFinite(Number(candidatoId)) ? Number(candidatoId) : null;

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

  private construirFechaLocal(fecha: string, hora: string) {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const [horas, minutos] = hora.split(':').map(Number);
    return new Date(anio || 0, (mes || 1) - 1, dia || 1, horas || 0, minutos || 0);
  }

  private formatearFechaISO(fecha: string, hora: string) {
    const fechaLocal = this.construirFechaLocal(fecha, hora);
    return `${fechaLocal.getFullYear()}-${String(fechaLocal.getMonth() + 1).padStart(2, '0')}-${String(
      fechaLocal.getDate()
    ).padStart(2, '0')}`;
  }

  private formatearFechaLegible(fecha: string) {
    const fechaLocal = this.construirFechaLocal(fecha, '00:00');
    return fechaLocal.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  logoProveedor(p: ProveedorServicio) {
    const proveedorPlano = p.proveedor as unknown as Record<string, unknown>;
    const posibleLogo =
      p.proveedor.logo ||
      p.proveedor.urlLogo ||
      proveedorPlano['logoUrl'] ||
      proveedorPlano['logo'];

    return typeof posibleLogo === 'string' ? this.resolverRutaImagen(posibleLogo) : '';
  }

  inicialProveedor(p: ProveedorServicio) {
    const nombre = p.proveedor.nombreEmpresa || p.proveedor.nombre || '?';
    return nombre.slice(0, 1).toUpperCase();
  }

  private resolverRutaImagen(ruta?: string | null) {
    if (!ruta) return '';
    if (/^https?:\/\//i.test(ruta) || ruta.startsWith('data:')) return ruta;
    const limpia = ruta.startsWith('/') ? ruta.slice(1) : ruta;
    return `${this.apiBaseImagenes}${limpia}`;
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

  get conteoVisibleCarrito(): number {
    return this.tieneSeleccion ? this.opcionesSeleccionadas.length : this.ultimoConteoReserva;
  }

  irAReservas() {
    this.router.navigate(['/cliente/reservas']);
  }

  urlImagenOpcion(opcion: ServicioOpcion) {
    const opcionPlano = opcion as unknown as Record<string, unknown>;
    const posiblesRutas = [
      opcion.urlFoto,
      opcionPlano['foto'],
      opcionPlano['imagen'],
      opcionPlano['url_foto'],
      opcionPlano['urlImagen'],
      opcion.proveedorServicio?.catalogoServicio?.['urlFoto'],
      opcion.proveedorServicio?.catalogoServicio?.['foto'],
      opcion.proveedorServicio?.['urlFoto'],
    ].filter((v): v is string => typeof v === 'string' && !!v.trim());

    const rutaElegida = posiblesRutas[0];
    const rutaResuelta = this.resolverRutaImagen(rutaElegida);
    return rutaResuelta || 'assets/servicios/placeholder-servicio.svg';
  }

  alternarOpcion(opcion: ServicioOpcion, activo: boolean) {
    this.seleccion[opcion.idOpcion] = activo;
    this.mensajeAgendar = '';
    if (!activo) {
      delete this.fechasPorOpcion[opcion.idOpcion];
      delete this.horasPorOpcion[opcion.idOpcion];
    }
  }

  actualizarFechaOpcion(opcion: ServicioOpcion, fecha: string) {
    this.fechasPorOpcion[opcion.idOpcion] = fecha;
    this.mensajeAgendar = '';
  }

  actualizarHoraOpcion(opcion: ServicioOpcion, hora: string) {
    this.horasPorOpcion[opcion.idOpcion] = hora;
    this.mensajeAgendar = '';
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
    const clave = grupo === this.selectedEventos ? this.normalizarEvento(valor) : valor.toLowerCase();
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

    const proveedoresSet = new Set<string>();
    proveedoresPorEvento.forEach((p) => {
      const nombreProveedor = (p.proveedor.nombreEmpresa || p.proveedor.nombre || '').trim();
      if (nombreProveedor) proveedoresSet.add(nombreProveedor);
    });
    this.listadoProveedores = Array.from(proveedoresSet).sort();

    // Asegurar que los proveedores seleccionados sigan disponibles
    this.selectedProveedores.forEach((prov) => {
      if (!this.listadoProveedores.some((p) => p.toLowerCase() === prov)) {
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
    this.fechasPorOpcion = {};
    this.horasPorOpcion = {};
    this.fechaEvento = '';
    this.horaEvento = '12:00';
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
    this.horaEvento = '12:00';
  }

  private obtenerIdReserva(reserva: Reserva | any): number | null {
    const candidato =
      reserva?.idReserva ?? reserva?.id_reserva ?? reserva?.id ?? reserva?.idReserva;
    return Number.isFinite(Number(candidato)) ? Number(candidato) : null;
  }

  agendarEvento() {
    if (!this.proveedorSeleccionado || !this.clienteId) {
      this.mensajeAgendar = 'Selecciona una fecha válida y asegúrate de haber iniciado sesión.';
      return;
    }

    if (!this.tieneSeleccion) {
      this.mensajeAgendar = 'Elige al menos un servicio u opción para agendar.';
      return;
    }

    const opcionesElegidas = [...this.opcionesSeleccionadas];

    const idEvento = this.obtenerIdsEventosSeleccionados()[0];
    if (!idEvento) {
      this.mensajeAgendar = 'Elige el tipo de evento para poder registrar la reserva.';
      return;
    }

    const faltaFecha = opcionesElegidas.find((op) => !this.fechasPorOpcion[op.idOpcion]);
    const faltaHora = opcionesElegidas.find((op) => !this.horasPorOpcion[op.idOpcion]);
    if (faltaFecha || faltaHora) {
      this.mensajeAgendar = 'Elige fecha y hora para cada opción seleccionada.';
      return;
    }

    this.agendando = true;
    this.mensajeAgendar = '';
    this.modalVisible = false;

    const idProveedor =
      this.proveedorSeleccionado.proveedor.idProveedor ??
      (this.proveedorSeleccionado.proveedor as any).id_proveedor ??
      (this.proveedorSeleccionado.proveedor as any).id;

    const solicitudes = opcionesElegidas.map((opcion) => {
      const fecha = this.fechasPorOpcion[opcion.idOpcion];
      const hora = this.horasPorOpcion[opcion.idOpcion];
      const fechaISO = this.formatearFechaISO(fecha, hora);

      const payload: Partial<Reserva> = {
        cliente: { idUsuario: this.clienteId } as any,
        proveedor: { idProveedor: Number(idProveedor) } as any,
        evento: { idEvento },
        fechaEvento: fechaISO,
        estado: 'PENDIENTE' as Reserva['estado'],
      };

      return this.reservaSrv.crear(payload).pipe(
        switchMap((reserva) => {
          const idReserva = this.obtenerIdReserva(reserva);
          if (!idReserva) return of(reserva);
          const detalle = this.prepararDetalles(idReserva, [opcion])[0];
          return this.detalleSrv.crear(detalle).pipe(map(() => reserva));
        })
      );
    });

    forkJoin(solicitudes).subscribe({
      next: (reservasCreadas) => {
        const ultima = reservasCreadas[reservasCreadas.length - 1];
        this.numeroReservaActual = this.obtenerIdReserva(ultima);
        this.ultimoConteoReserva = opcionesElegidas.length;
        this.finalizarAgendamiento(reservasCreadas[0]);
        this.reservasProveedor = [...this.reservasProveedor, ...reservasCreadas];
        this.generarCalendario();
      },
      error: (err) => {
        const mensajeBackend = err?.error?.message || err?.message;
        this.mensajeAgendar =
          mensajeBackend && typeof mensajeBackend === 'string'
            ? mensajeBackend
            : 'No pudimos agendar el evento. Inténtalo de nuevo más tarde.';
        this.agendando = false;
      },
    });
  }

  private prepararDetalles(idReserva: number, seleccionadas: ServicioOpcion[]) {
    return seleccionadas.map((op) => ({
      reserva: { idReserva } as any,
      opcion: { idOpcion: op.idOpcion ?? (op as any).id_opcion } as any,
      cantidad: 1,
      precioUnitario: op.precio ?? 0,
    }));
  }

  private finalizarAgendamiento(reserva: Reserva) {
    this.mensajeAgendar = '¡Listo! Tu solicitud fue registrada y el proveedor la revisará pronto.';
    this.agendando = false;

    const fechaLegible = this.formatearFechaLegible(String(reserva.fechaEvento));

    this.modalVisible = false;
    this.proveedorSeleccionado = null;
    this.opciones = [];
    this.seleccion = {};
    this.fechasPorOpcion = {};
    this.horasPorOpcion = {};
    this.fechaEvento = '';

    Swal.fire({
      icon: 'success',
      title: '¡Bienvenido a tu evento soñado!',
      html: `
        <p>Tu reserva para el <strong>${fechaLegible}</strong> fue registrada.</p>
        <p>Pronto el proveedor la confirmará. ¡Gracias por confiar en nosotros!</p>
      `,
      confirmButtonText: 'Listo',
      confirmButtonColor: '#6f42c1',
      backdrop: true,
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
    if (this.tieneSeleccion) {
      this.opcionesSeleccionadas.forEach((op) => {
        if (!this.fechasPorOpcion[op.idOpcion]) this.fechasPorOpcion[op.idOpcion] = fecha;
      });
    }
  }

  private esFechaPasada(fecha: Date) {
    return this.obtenerInicioDia(fecha) < this.hoy;
  }

  actualizarHoraGeneral(valor: string) {
    this.horaEvento = valor;
    this.mensajeAgendar = '';
    if (this.tieneSeleccion) {
      this.opcionesSeleccionadas.forEach((op) => {
        if (!this.horasPorOpcion[op.idOpcion]) this.horasPorOpcion[op.idOpcion] = valor;
      });
    }
  }
}
