import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoServicioService } from '../../../servicios/catalogo-servicio.service';
import { ProveedorServicioService } from '../../../servicios/proveedor-servicio.service';
import { CatalogoServicio, EstadoCatalogo, NuevoCatalogoServicioRequest } from '../../../modelos/catalogo-servicio';
import {
  EstadoProveedorServicio,
  ProveedorServicio,
  ProveedorServicioRequest,
  ServicioOpcion,
  ServicioOpcionRequest,
} from '../../../modelos/proveedor-servicio';

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
  opcionesPorServicio: Record<number, ServicioOpcion[]> = {};

  idProveedor = 1; // valor de ejemplo, enlazar con sesión cuando se integre auth
  nuevaOferta: ProveedorServicioRequest = {
    idProveedor: this.idProveedor,
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

  constructor(
    private catalogoServicio: CatalogoServicioService,
    private proveedorServicio: ProveedorServicioService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogo();
    this.cargarOfertas();
  }

  cargarCatalogo(): void {
    this.cargandoCatalogo = true;
    this.catalogoServicio.listar('ACTIVO' as EstadoCatalogo).subscribe({
      next: (lista) => {
        this.catalogoActivo = lista;
        if (lista.length) {
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

  cargarOfertas(): void {
    this.cargandoOfertas = true;
    this.proveedorServicio.listarPorProveedor(this.idProveedor).subscribe({
      next: (resp) => {
        this.ofertas = resp;
        this.ofertas.forEach((oferta) => this.prepararFormularioOpcion(oferta.idProveedorServicio));
        this.cargandoOfertas = false;
      },
      error: () => {
        this.error = 'No se pudo obtener tus servicios publicados.';
        this.cargandoOfertas = false;
      },
    });
  }

  registrarOferta(): void {
    if (!this.nuevaOferta.nombrePublico.trim() || !this.nuevaOferta.idCatalogo) {
      this.error = 'Elige un tipo de servicio y coloca un nombre público.';
      return;
    }
    this.nuevaOferta.idProveedor = this.idProveedor;
    this.proveedorServicio.crearOferta(this.nuevaOferta).subscribe({
      next: () => {
        this.mensaje = 'Servicio registrado. Añade opciones para detallar precios y variantes.';
        this.nuevaOferta = {
          idProveedor: this.idProveedor,
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
      next: (resp) => (this.opcionesPorServicio[oferta.idProveedorServicio] = resp),
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
    this.catalogoServicio.crearComoProveedor(this.nuevoTipoProveedor).subscribe({
      next: () => {
        this.mensaje = 'Tipo propuesto. El admin verá la solicitud en la cola de revisión.';
        this.nuevoTipoProveedor = { nombre: '', descripcion: '' };
      },
      error: () => {
        this.error = 'No se pudo enviar la propuesta de tipo.';
      },
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
}
