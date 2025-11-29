import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ProveedorServicioService } from '../../../servicios/proveedor-servicio.service';
import { ProveedorService } from '../../../servicios/proveedor.service';
import { ProveedorServicio } from '../../../modelos/proveedor-servicio';
import { Reserva } from '../../../modelos/reserva';
import { ReservaService } from '../../../servicios/reserva.service';
import { DetalleReservaService } from '../../../servicios/detalle-reserva.service';
import { DetalleReserva } from '../../../modelos/reserva';

@Component({
  selector: 'app-inicio-proveedor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css'],
})
export class InicioProveedor implements OnInit {
  private router = inject(Router);
  private proveedorSrv = inject(ProveedorService);
  private proveedorServicioSrv = inject(ProveedorServicioService);
  private reservaSrv = inject(ReservaService);
  private detalleSrv = inject(DetalleReservaService);

  nombre = '';
  empresa = '';
  idProveedor: number | null = null;

  servicios: ProveedorServicio[] = [];
  reservas: Reserva[] = [];
  proximas: Reserva[] = [];

  kpi = {
    serviciosActivos: 0,
    serviciosTotales: 0,
    reservasPendientes: 0,
    reservasConfirmadas: 0,
    ingresosEstimados: 0,
  };

  estado = { cargando: false, error: '' };

  ngOnInit(): void {
    const raw = localStorage.getItem('usuario');

    if (!raw) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const u = JSON.parse(raw);

      if (u.rol !== 'PROVEEDOR') {
        this.router.navigate(['/login']);
        return;
      }

      this.nombre = u.nombre ?? u.name ?? '';
      this.empresa =
        u?.empresa ??
        u?.nombreEmpresa ??
        u?.nombre_empresa ??
        u?.razonSocial ??
        u?.nombre_o_razon_social ??
        '';

      const idProveedor =
        u?.idProveedor ?? u?.id_proveedor ?? u?.proveedor?.idProveedor ?? u?.proveedor?.id_proveedor;

      if (idProveedor) {
        this.inicializarDatos(Number(idProveedor));
      } else {
        const idUsuario =
          u?.idUsuario ?? u?.id_usuario ?? u?.usuario?.idUsuario ?? u?.usuario?.id_usuario ?? null;
        if (!idUsuario) {
          this.estado.error = 'No pudimos leer tu perfil de proveedor.';
          return;
        }
        this.proveedorSrv.obtenerPorUsuario(Number(idUsuario)).subscribe({
          next: (prov: any) => {
            const id = prov?.idProveedor ?? prov?.id_proveedor;
            if (id) {
              this.inicializarDatos(Number(id));
              this.empresa =
                this.empresa ||
                prov?.nombreEmpresa ||
                prov?.nombre_empresa ||
                prov?.razonSocial ||
                '';
            }
          },
          error: () => (this.estado.error = 'No pudimos cargar tu cuenta de proveedor'),
        });
      }
    } catch {
      this.router.navigate(['/login']);
    }
  }

  private inicializarDatos(idProveedor: number): void {
    this.idProveedor = idProveedor;
    this.estado.cargando = true;
    this.cargarServicios();
    this.cargarReservas();
  }

  private cargarServicios(): void {
    if (!this.idProveedor) return;
    this.proveedorServicioSrv.listarPorProveedor(this.idProveedor).subscribe({
      next: (lista) => {
        this.servicios = lista;
        this.kpi.serviciosTotales = lista.length;
        this.kpi.serviciosActivos = lista.filter((s) => s.estado === 'ACTIVO').length;
        this.estado.cargando = false;
      },
      error: () => (this.estado.error = 'No pudimos cargar tus servicios publicados'),
    });
  }

  private cargarReservas(): void {
    if (!this.idProveedor) return;
    this.reservaSrv.listarPorProveedor(this.idProveedor).subscribe({
      next: (lista) => {
        this.reservas = lista;
        this.kpi.reservasPendientes = lista.filter((r) => r.estado === 'PENDIENTE').length;
        this.kpi.reservasConfirmadas = lista.filter((r) => r.estado === 'CONFIRMADA').length;
        this.proximas = [...lista]
          .filter((r) => r.fechaEvento)
          .sort((a, b) => new Date(a.fechaEvento as any).getTime() - new Date(b.fechaEvento as any).getTime())
          .slice(0, 4);
        this.calcularIngresos(lista);
      },
      error: () => (this.estado.error = 'No pudimos cargar las reservas asociadas'),
    });
  }

  private calcularIngresos(reservas: Reserva[]): void {
    this.kpi.ingresosEstimados = 0;
    reservas.forEach((reserva) => {
      this.detalleSrv.listarPorReserva(reserva.idReserva).subscribe({
        next: (detalles: DetalleReserva[]) => {
          const subtotal = detalles.reduce(
            (acc, det) => acc + (det.cantidad || 0) * (det.precioUnitario || 0),
            0
          );
          this.kpi.ingresosEstimados = Number((this.kpi.ingresosEstimados + subtotal).toFixed(2));
        },
      });
    });
  }
}
