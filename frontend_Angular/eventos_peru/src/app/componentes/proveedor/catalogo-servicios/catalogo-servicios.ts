import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoServicioService } from '../../../servicios/catalogo-servicio.service';
import { ProveedorServicioService } from '../../../servicios/proveedor-servicio.service';
import { ProveedorService } from '../../../servicios/proveedor.service';
import {
  CatalogoServicio,
  EstadoCatalogo,
  NuevoCatalogoServicioRequest,
} from '../../../modelos/catalogo-servicio';
import {
  EstadoProveedorServicio,
  ProveedorServicio,
  ProveedorServicioRequest,
  ServicioOpcion,
  ServicioOpcionRequest,
} from '../../../modelos/proveedor-servicio';
import { EventoService } from '../../../servicios/evento.service';
import { Evento } from '../../../modelos/evento';

type CarpetaDestino = 'servicios' | 'opciones';

@Component({
  selector: 'app-catalogo-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo-servicios.html',
  styleUrls: ['./catalogo-servicios.css'],
})
export class CatalogoServicios implements OnInit {
  catalogoActivo: CatalogoServicio[] = [];
  ofertas: ProveedorServicio[] = [];
  propuestas: CatalogoServicio[] = [];
  opcionesPorServicio: Record<number, ServicioOpcion[]> = {};
  edicionOferta: Record<number, ProveedorServicioRequest> = {};
  edicionOpcion: Record<number, ServicioOpcionRequest> = {};
  propuestasEdicion: Record<number, NuevoCatalogoServicioRequest> = {};

  eventos: Evento[] = [];
  eventosSeleccionadosPropuesta = new Set<number>();

  idProveedor: number | null = null;
  nuevaOferta: ProveedorServicioRequest = {
    idProveedor: 0,
    idCatalogo: 0,
    nombrePublico: '',
    descripcionGeneral: '',
    urlFoto: '',
  };

  nuevaOpcion: Record<number, ServicioOpcionRequest> = {};
  nuevoTipoProveedor: NuevoCatalogoServicioRequest = { nombre: '', descripcion: '' };

  mensaje = '';
  error = '';
  cargandoCatalogo = false;
  cargandoOfertas = false;
  cargandoPropuestas = false;
  cargandoProveedor = false;
  previsualizaciones: Record<string, string> = {};

  constructor(
    private catalogoServicio: CatalogoServicioService,
    private proveedorServicio: ProveedorServicioService,
    private proveedorService: ProveedorService,
    private eventoService: EventoService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogo();
    this.resolverProveedor();
    this.cargarEventos();
  }

  private cargarEventos(): void {
    this.eventoService.obtenerEventos().subscribe({
      next: (lista) => (this.eventos = lista),
      error: () => (this.error = 'No se pudieron cargar los eventos para las propuestas.'),
    });
  }

  private resolverProveedor(): void {
    const raw = localStorage.getItem('usuario');
    if (!raw) {
      this.error = 'Inicia sesión nuevamente para gestionar tus servicios.';
      return;
    }

    try {
      const usuario = JSON.parse(raw);
      const proveedorId = this.extraerIdProveedor(usuario);
      if (proveedorId) {
        this.fijarProveedor(proveedorId);
        return;
      }

      const idUsuario = this.extraerIdUsuario(usuario);
      if (!idUsuario) {
        this.error = 'No pudimos identificar tu cuenta de proveedor.';
        return;
      }

      this.cargandoProveedor = true;
      this.proveedorService.obtenerPorUsuario(idUsuario).subscribe({
        next: (prov) => {
          const id = prov?.idProveedor ?? prov?.id_proveedor ?? prov?.id;
          if (id) {
            this.fijarProveedor(Number(id));
          } else {
            this.error = 'No se encontró tu perfil de proveedor aprobado.';
          }
          this.cargandoProveedor = false;
        },
        error: () => {
          this.error = 'No se pudo cargar tu perfil de proveedor.';
          this.cargandoProveedor = false;
        },
      });
    } catch (e) {
      this.error = 'No se pudo leer tu sesión. Vuelve a iniciar sesión.';
    }
  }

  private fijarProveedor(id: number): void {
    this.idProveedor = id;
    this.nuevaOferta.idProveedor = id;
    this.cargarOfertas();
    this.cargarPropuestas();
  }

  private extraerIdUsuario(usuario: any): number | null {
    const rawId =
      usuario?.idUsuario ??
      usuario?.id_usuario ??
      usuario?.usuario?.idUsuario ??
      usuario?.usuario?.id_usuario ??
      null;
    const id = Number(rawId);
    return Number.isFinite(id) ? id : null;
  }

  private extraerIdProveedor(usuario: any): number | null {
    const rawId =
      usuario?.idProveedor ??
      usuario?.id_proveedor ??
      usuario?.proveedor?.idProveedor ??
      usuario?.proveedor?.id_proveedor ??
      null;
    const id = Number(rawId);
    return Number.isFinite(id) ? id : null;
  }

  cargarCatalogo(): void {
    this.cargandoCatalogo = true;
    this.catalogoServicio.listar('ACTIVO' as EstadoCatalogo).subscribe({
      next: (lista) => {
        this.catalogoActivo = lista;
        if (lista.length && !this.nuevaOferta.idCatalogo) {
          this.nuevaOferta.idCatalogo = lista[0].idCatalogo;
        }
        this.cargandoCatalogo = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el catálogo activo.';
        this.cargandoCatalogo = false;
      },
    });
  }

  async seleccionarArchivo(
    evento: Event,
    carpeta: CarpetaDestino,
    contexto:
      | { tipo: 'oferta-nueva' }
      | { tipo: 'oferta-edicion'; id: number }
      | { tipo: 'opcion-nueva'; id: number }
      | { tipo: 'opcion-edicion'; id: number }
  ): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;

    const ruta = await this.guardarEnAssets(archivo, carpeta);
    const clavePreview = `${carpeta}-${archivo.name}`;
    if (this.previsualizaciones[clavePreview]) {
      URL.revokeObjectURL(this.previsualizaciones[clavePreview]);
    }
    this.previsualizaciones[clavePreview] = URL.createObjectURL(archivo);

    switch (contexto.tipo) {
      case 'oferta-nueva':
        this.nuevaOferta.urlFoto = ruta;
        break;
      case 'oferta-edicion':
        if (this.edicionOferta[contexto.id]) {
          this.edicionOferta[contexto.id].urlFoto = ruta;
        }
        break;
      case 'opcion-nueva':
        if (this.nuevaOpcion[contexto.id]) {
          this.nuevaOpcion[contexto.id].urlFoto = ruta;
        }
        break;
      case 'opcion-edicion':
        if (this.edicionOpcion[contexto.id]) {
          this.edicionOpcion[contexto.id].urlFoto = ruta;
        }
        break;
    }

    this.mensaje = `Archivo guardado como ${ruta}.`;
    input.value = '';
  }

  private async guardarEnAssets(archivo: File, carpeta: CarpetaDestino): Promise<string> {
    const nombreLimpio = archivo.name.replace(/\s+/g, '_');
    const rutaRelativa = `assets/${carpeta}/${nombreLimpio}`;

    if (typeof (window as any).showDirectoryPicker === 'function') {
      try {
        const directorio = await (window as any).showDirectoryPicker();
        const subcarpeta = await directorio.getDirectoryHandle(carpeta, { create: true });
        const archivoHandle = await subcarpeta.getFileHandle(nombreLimpio, { create: true });
        const writable = await archivoHandle.createWritable();
        await writable.write(archivo);
        await writable.close();
        return rutaRelativa;
      } catch (e) {
        console.warn('No se pudo escribir en assets con File System Access API', e);
      }
    }

    await this.guardarEnLocalStorage(rutaRelativa, archivo);
    return rutaRelativa;
  }

  private async guardarEnLocalStorage(clave: string, archivo: File): Promise<void> {
    const contenidoBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(archivo);
    });

    try {
      localStorage.setItem(clave, contenidoBase64);
    } catch (e) {
      console.warn('No se pudo persistir el archivo en localStorage', e);
    }
  }

  cargarOfertas(): void {
    if (!this.idProveedor) {
      return;
    }
    this.cargandoOfertas = true;
    this.proveedorServicio.listarPorProveedor(this.idProveedor).subscribe({
      next: (resp) => {
        this.ofertas = resp;
        this.ofertas.forEach((oferta) => {
          this.prepararFormularioOpcion(oferta.idProveedorServicio);
          this.prepararEdicionOferta(oferta);
        });
        this.cargandoOfertas = false;
      },
      error: () => {
        this.error = 'No se pudo obtener tus servicios publicados.';
        this.cargandoOfertas = false;
      },
    });
  }

  registrarOferta(): void {
    if (!this.idProveedor) {
      this.error = 'No pudimos validar tu perfil de proveedor.';
      return;
    }
    if (!this.nuevaOferta.nombrePublico.trim() || !this.nuevaOferta.idCatalogo) {
      this.error = 'Elige un tipo de servicio y coloca un nombre público.';
      return;
    }
    this.nuevaOferta.idProveedor = this.idProveedor!;
    this.proveedorServicio.crearOferta(this.nuevaOferta).subscribe({
      next: () => {
        this.mensaje = 'Servicio registrado. Añade opciones para detallar precios y variantes.';
        this.nuevaOferta = {
          idProveedor: this.idProveedor ?? 0,
          idCatalogo: this.nuevaOferta.idCatalogo,
          nombrePublico: '',
          descripcionGeneral: '',
          urlFoto: '',
        };
        this.cargarOfertas();
      },
      error: () => {
        this.error = 'No se pudo registrar el servicio.';
      },
    });
  }

  actualizarOferta(oferta: ProveedorServicio): void {
    const dto = this.edicionOferta[oferta.idProveedorServicio];
    if (!dto || !dto.nombrePublico.trim()) {
      this.error = 'Completa el nombre público del servicio.';
      return;
    }
    this.proveedorServicio.actualizarOferta(oferta.idProveedorServicio, dto).subscribe({
      next: () => {
        this.mensaje = 'Servicio actualizado correctamente.';
        this.cargarOfertas();
      },
      error: () => (this.error = 'No se pudo actualizar el servicio.'),
    });
  }

  eliminarOferta(oferta: ProveedorServicio): void {
    if (!confirm('¿Deseas eliminar esta oferta y sus opciones?')) return;
    this.proveedorServicio.eliminarOferta(oferta.idProveedorServicio).subscribe({
      next: () => {
        this.mensaje = 'Servicio eliminado.';
        this.cargarOfertas();
      },
      error: () => (this.error = 'No se pudo eliminar el servicio.'),
    });
  }

  cambiarEstado(oferta: ProveedorServicio, estado: EstadoProveedorServicio): void {
    this.proveedorServicio.cambiarEstadoOferta(oferta.idProveedorServicio, estado).subscribe({
      next: () => {
        this.mensaje = `Servicio ${estado === 'PAUSADO' ? 'pausado' : 'activado'}.`;
        this.cargarOfertas();
      },
      error: () => {
        this.error = 'No se pudo actualizar el estado del servicio.';
      },
    });
  }

  cargarOpciones(oferta: ProveedorServicio): void {
    this.proveedorServicio.listarOpciones(oferta.idProveedorServicio).subscribe({
      next: (resp) => {
        this.opcionesPorServicio[oferta.idProveedorServicio] = resp;
        resp.forEach((op) => this.prepararEdicionOpcion(op));
      },
      error: () => (this.error = 'No se pudieron cargar las variantes del servicio.'),
    });
  }

  agregarOpcion(oferta: ProveedorServicio): void {
    const dto = this.nuevaOpcion[oferta.idProveedorServicio];
    if (!dto || !dto.nombreOpcion?.trim() || dto.precio == null) {
      this.error = 'Completa el nombre y el precio de la opción.';
      return;
    }
    this.proveedorServicio.crearOpcion(oferta.idProveedorServicio, dto).subscribe({
      next: () => {
        this.mensaje = 'Opción agregada.';
        this.nuevaOpcion[oferta.idProveedorServicio] = {
          nombreOpcion: '',
          descripcion: '',
          precio: 0,
          duracionMinutos: undefined,
          stock: undefined,
          urlFoto: '',
        };
        this.cargarOpciones(oferta);
      },
      error: () => {
        this.error = 'No se pudo agregar la opción.';
      },
    });
  }

  actualizarOpcion(opcion: ServicioOpcion): void {
    const dto = this.edicionOpcion[opcion.idOpcion];
    if (!dto || !dto.nombreOpcion?.trim()) {
      this.error = 'Completa el nombre de la opción.';
      return;
    }
    dto.idProveedorServicio = opcion.proveedorServicio.idProveedorServicio;
    this.proveedorServicio.actualizarOpcion(opcion.idOpcion, dto).subscribe({
      next: () => {
        this.mensaje = 'Opción actualizada.';
        this.cargarOpciones({ idProveedorServicio: opcion.proveedorServicio.idProveedorServicio } as ProveedorServicio);
      },
      error: () => (this.error = 'No se pudo actualizar la opción.'),
    });
  }

  eliminarOpcion(opcion: ServicioOpcion): void {
    if (!confirm('¿Eliminar esta opción?')) return;
    this.proveedorServicio.eliminarOpcion(opcion.idOpcion).subscribe({
      next: () => {
        this.mensaje = 'Opción eliminada.';
        const servicioId = opcion.proveedorServicio.idProveedorServicio;
        this.cargarOpciones({ idProveedorServicio: servicioId } as ProveedorServicio);
      },
      error: () => (this.error = 'No se pudo eliminar la opción.'),
    });
  }

  cambiarEstadoOpcion(opcion: ServicioOpcion, estado: string): void {
    this.proveedorServicio.cambiarEstadoOpcion(opcion.idOpcion, estado as any).subscribe({
      next: () => {
        this.mensaje = 'Estado de la opción actualizado.';
        const servicioId = opcion.proveedorServicio.idProveedorServicio;
        this.cargarOpciones({ idProveedorServicio: servicioId } as ProveedorServicio);
      },
      error: () => (this.error = 'No se pudo actualizar la opción.'),
    });
  }

  proponerTipo(): void {
    if (!this.nuevoTipoProveedor.nombre.trim()) {
      this.error = 'Indica el nombre del nuevo tipo.';
      return;
    }
    if (!this.idProveedor) {
      this.error = 'No pudimos validar tu perfil de proveedor.';
      return;
    }

    if (!this.eventosSeleccionadosPropuesta.size) {
      this.error = 'Selecciona para qué eventos aplica el servicio que estás proponiendo.';
      return;
    }
    const payload: NuevoCatalogoServicioRequest = {
      ...this.nuevoTipoProveedor,
      idProveedorSolicitante: this.idProveedor,
      idEventos: Array.from(this.eventosSeleccionadosPropuesta),
    };
    this.catalogoServicio.crearComoProveedor(payload).subscribe({
      next: () => {
        this.mensaje = 'Tipo propuesto. El admin verá la solicitud en la cola de revisión.';
        this.nuevoTipoProveedor = { nombre: '', descripcion: '' };
        this.eventosSeleccionadosPropuesta.clear();
        this.cargarPropuestas();
      },
      error: () => {
        this.error = 'No se pudo enviar la propuesta de tipo.';
      },
    });
  }

  cargarPropuestas(): void {
    if (!this.idProveedor) {
      return;
    }
    this.cargandoPropuestas = true;
    this.catalogoServicio.listarPorProveedor(this.idProveedor).subscribe({
      next: (lista) => {
        this.propuestas = lista;
        lista.forEach((p) => this.prepararEdicionPropuesta(p));
        this.cargandoPropuestas = false;
      },
      error: () => {
        this.error = 'No se pudo cargar tus propuestas de servicios.';
        this.cargandoPropuestas = false;
      },
    });
  }

  reenviarPropuesta(catalogo: CatalogoServicio): void {
    if (!this.idProveedor) return;
    const dto = this.propuestasEdicion[catalogo.idCatalogo];
    if (!dto || !dto.nombre.trim()) {
      this.error = 'Indica el nombre del servicio que quieres reenviar.';
      return;
    }
    dto.idProveedorSolicitante = this.idProveedor;
    this.catalogoServicio
      .actualizarPropuestaProveedor(this.idProveedor, catalogo.idCatalogo, dto)
      .subscribe({
        next: () => {
          this.mensaje = 'Propuesta actualizada y enviada a revisión.';
          this.cargarPropuestas();
        },
        error: () => (this.error = 'No se pudo actualizar la propuesta.'),
      });
  }

  private prepararFormularioOpcion(id: number): void {
    if (!this.nuevaOpcion[id]) {
      this.nuevaOpcion[id] = {
        nombreOpcion: '',
        descripcion: '',
        precio: 0,
        duracionMinutos: undefined,
        stock: undefined,
        urlFoto: '',
      };
    }
  }

  private prepararEdicionOferta(oferta: ProveedorServicio): void {
    this.edicionOferta[oferta.idProveedorServicio] = {
      idProveedor: oferta.proveedor?.idProveedor ?? this.idProveedor ?? 0,
      idCatalogo: oferta.catalogoServicio.idCatalogo,
      nombrePublico: oferta.nombrePublico,
      descripcionGeneral: oferta.descripcionGeneral,
      urlFoto: oferta.urlFoto ?? '',
    };
  }

  private prepararEdicionOpcion(opcion: ServicioOpcion): void {
    this.edicionOpcion[opcion.idOpcion] = {
      idProveedorServicio: opcion.proveedorServicio.idProveedorServicio,
      nombreOpcion: opcion.nombreOpcion,
      descripcion: opcion.descripcion,
      precio: opcion.precio,
      duracionMinutos: opcion.duracionMinutos ?? undefined,
      stock: opcion.stock ?? undefined,
      urlFoto: opcion.urlFoto ?? '',
    };
  }

  private prepararEdicionPropuesta(catalogo: CatalogoServicio): void {
    this.propuestasEdicion[catalogo.idCatalogo] = {
      nombre: catalogo.nombre,
      descripcion: catalogo.descripcion,
      idProveedorSolicitante: this.idProveedor ?? undefined,
    };
  }

  toggleEvento(idEvento: number, set: Set<number>): void {
    if (set.has(idEvento)) {
      set.delete(idEvento);
    } else {
      set.add(idEvento);
    }
  }

  seleccionarTodosEventos(): void {
    this.eventosSeleccionadosPropuesta = new Set(this.eventos.map((e) => e.idEvento));
  }
}
