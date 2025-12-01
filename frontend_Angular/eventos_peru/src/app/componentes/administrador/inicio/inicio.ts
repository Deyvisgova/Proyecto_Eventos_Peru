import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { forkJoin } from 'rxjs';
import { ReservaService } from '../../../servicios/reserva.service';
import { EventoService } from '../../../servicios/evento.service';
import { ProveedorServicioService } from '../../../servicios/proveedor-servicio.service';
import { Reserva } from '../../../modelos/reserva';
import { Evento } from '../../../modelos/evento';
import { ProveedorServicio } from '../../../modelos/proveedor-servicio';

interface KpiCard {
  titulo: string;
  valor: string;
  delta: string;
  icono: string;
  color: string;
  descripcion: string;
}

@Component({
  selector: 'app-inicio-admin',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
  providers: [provideCharts(withDefaultRegisterables())],
})
export class InicioAdmin implements OnInit {
  private reservaSrv = inject(ReservaService);
  private eventoSrv = inject(EventoService);
  private proveedorSrv = inject(ProveedorServicioService);

  kpis: KpiCard[] = [];
  cargando = true;
  error = '';
  ultimaActualizacion: Date | null = null;

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true } },
      tooltip: { intersect: false, mode: 'index' },
    },
    scales: {
      x: { ticks: { color: '#0f172a' }, grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: { color: '#0f172a' },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
    },
  };

  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  pieChartLabels: string[] = [];

  pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [],
  };

  pieChartType: ChartType = 'pie';

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando = true;
    this.error = '';

    forkJoin({
      reservas: this.reservaSrv.listar(),
      eventos: this.eventoSrv.obtenerEventos(),
      ofertas: this.proveedorSrv.listarVisibles(),
    }).subscribe({
      next: ({ reservas, eventos, ofertas }) => {
        this.kpis = this.construirKpis(reservas, eventos, ofertas);
        this.actualizarBarras(reservas);
        this.actualizarPie(reservas, eventos);
        this.cargando = false;
        this.ultimaActualizacion = new Date();
      },
      error: (err) => {
        console.error('No se pudieron cargar las métricas', err);
        this.error = 'No pudimos cargar las métricas en vivo. Intenta nuevamente en unos segundos.';
        this.cargando = false;
      },
    });
  }

  private construirKpis(reservas: Reserva[], eventos: Evento[], ofertas: ProveedorServicio[]): KpiCard[] {
    const fechaHoy = new Date();
    const activas = reservas.filter((r) => r.estado === 'CONFIRMADA' || r.estado === 'PENDIENTE');
    const confirmadas = reservas.filter((r) => r.estado === 'CONFIRMADA');

    const enMes = reservas.filter((r) => {
      const fecha = this.obtenerFecha(r.fechaEvento);
      return (
        fecha &&
        fecha.getMonth() === fechaHoy.getMonth() &&
        fecha.getFullYear() === fechaHoy.getFullYear() &&
        r.estado !== 'CANCELADA'
      );
    });

    const pendientesMes = enMes.filter((r) => r.estado === 'PENDIENTE');

    const proveedoresUnicos = new Set(
      ofertas.map((o) => o.proveedor?.idProveedor).filter((id): id is number => Number.isFinite(Number(id)))
    );

    const serviciosActivos = ofertas.length;
    const tiposEvento = eventos.length;

    return [
      {
        titulo: 'Reservas activas',
        valor: String(activas.length),
        delta: `${confirmadas.length} confirmadas`,
        icono: 'bi bi-bookmark-check',
        color: 'azul',
        descripcion: 'Incluye reservas confirmadas y pendientes',
      },
      {
        titulo: 'Eventos del mes',
        valor: String(enMes.length),
        delta: `${pendientesMes.length} pendientes por confirmar`,
        icono: 'bi bi-calendar3',
        color: 'verde',
        descripcion: 'Programados para este mes',
      },
      {
        titulo: 'Proveedores activos',
        valor: String(proveedoresUnicos.size),
        delta: `${serviciosActivos} servicios publicados`,
        icono: 'bi bi-building-check',
        color: 'amarillo',
        descripcion: 'Proveedores con ofertas visibles',
      },
      {
        titulo: 'Tipos de servicio',
        valor: String(tiposEvento),
        delta: `${serviciosActivos} ofertas vinculadas`,
        icono: 'bi bi-graph-up-arrow',
        color: 'morado',
        descripcion: 'Catálogo disponible para los clientes',
      },
    ];
  }

  private obtenerFecha(valor: string | Date | null | undefined): Date | null {
    if (!valor) return null;
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }

  private obtenerMesesRecientes(cantidad: number) {
    const meses: { label: string; mes: number; anio: number }[] = [];
    const base = new Date();
    for (let i = cantidad - 1; i >= 0; i--) {
      const fecha = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const label = fecha.toLocaleDateString('es-PE', { month: 'short' });
      meses.push({ label: label.charAt(0).toUpperCase() + label.slice(1), mes: fecha.getMonth(), anio: fecha.getFullYear() });
    }
    return meses;
  }

  private actualizarBarras(reservas: Reserva[]) {
    const meses = this.obtenerMesesRecientes(6);
    const confirmadas: number[] = Array(meses.length).fill(0);
    const pendientes: number[] = Array(meses.length).fill(0);

    reservas.forEach((r) => {
      const fecha = this.obtenerFecha(r.fechaEvento);
      if (!fecha) return;
      const idx = meses.findIndex((m) => m.mes === fecha.getMonth() && m.anio === fecha.getFullYear());
      if (idx === -1) return;
      if (r.estado === 'CONFIRMADA') confirmadas[idx] += 1;
      if (r.estado === 'PENDIENTE') pendientes[idx] += 1;
    });

    this.barChartData = {
      labels: meses.map((m) => m.label),
      datasets: [
        {
          data: confirmadas,
          label: 'Reservas confirmadas',
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          maxBarThickness: 38,
        },
        {
          data: pendientes,
          label: 'Reservas pendientes',
          backgroundColor: '#fbbf24',
          borderRadius: 6,
          maxBarThickness: 38,
        },
      ],
    };
  }

  private actualizarPie(reservas: Reserva[], eventos: Evento[]) {
    const mapaEventos = new Map<number, string>();
    eventos.forEach((e) => {
      if (Number.isFinite(Number(e.idEvento))) {
        mapaEventos.set(Number(e.idEvento), e.nombreEvento);
      }
    });

    const conteo = new Map<string, number>();
    reservas.forEach((r) => {
      const idEvento = (r.evento as any)?.idEvento;
      const nombre = mapaEventos.get(Number(idEvento));
      if (!nombre) return;
      conteo.set(nombre, (conteo.get(nombre) || 0) + 1);
    });

    if (!conteo.size) {
      this.pieChartLabels = ['Sin datos'];
      this.pieChartData = {
        labels: this.pieChartLabels,
        datasets: [
          {
            data: [1],
            backgroundColor: ['#cbd5e1'],
            borderColor: '#fff',
            borderWidth: 2,
          },
        ],
      };
      return;
    }

    const labels = Array.from(conteo.keys());
    const valores = labels.map((l) => conteo.get(l) || 0);
    const colores = ['#0ea5e9', '#8b5cf6', '#22c55e', '#f59e0b', '#f472b6', '#14b8a6'];

    this.pieChartLabels = labels;
    this.pieChartData = {
      labels,
      datasets: [
        {
          data: valores,
          backgroundColor: labels.map((_, idx) => colores[idx % colores.length]),
          borderColor: '#fff',
          borderWidth: 2,
        },
      ],
    };
  }
}
