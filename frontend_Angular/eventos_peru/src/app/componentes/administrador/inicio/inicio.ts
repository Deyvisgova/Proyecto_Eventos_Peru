import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';

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
export class InicioAdmin {
  kpis: KpiCard[] = [
    {
      titulo: 'Reservas activas',
      valor: '124',
      delta: '+8 vs. semana pasada',
      icono: 'bi bi-bookmark-check',
      color: 'azul',
      descripcion: 'Reservas confirmadas pendientes de evento',
    },
    {
      titulo: 'Eventos del mes',
      valor: '36',
      delta: '+3 vs. proyección',
      icono: 'bi bi-calendar3',
      color: 'verde',
      descripcion: 'Eventos programados dentro de los próximos 30 días',
    },
    {
      titulo: 'Nuevos proveedores',
      valor: '12',
      delta: '+2 aprobados',
      icono: 'bi bi-building-add',
      color: 'amarillo',
      descripcion: 'Solicitudes aceptadas durante los últimos 7 días',
    },
    {
      titulo: 'Ingresos estimados',
      valor: 'S/ 52,400',
      delta: '+6.3% crecimiento',
      icono: 'bi bi-graph-up-arrow',
      color: 'morado',
      descripcion: 'Ingresos calculados por reservas confirmadas',
    },
  ];

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
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'],
    datasets: [
      {
        data: [32, 45, 38, 50, 61, 55, 70, 68],
        label: 'Reservas confirmadas',
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        maxBarThickness: 38,
      },
      {
        data: [22, 28, 30, 40, 44, 46, 52, 48],
        label: 'Cotizaciones',
        backgroundColor: '#22c55e',
        borderRadius: 6,
        maxBarThickness: 38,
      },
    ],
  };

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  pieChartLabels = ['Corporativos', 'Sociales', 'Conciertos', 'Ferias'];

  pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: this.pieChartLabels,
    datasets: [
      {
        data: [35, 28, 22, 15],
        backgroundColor: ['#0ea5e9', '#8b5cf6', '#22c55e', '#f59e0b'],
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  pieChartType: ChartType = 'pie';
}
