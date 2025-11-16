import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navbar } from './componentes/navbar/navbar';
import { Slider } from './componentes/slider/slider';
import { PiePagina } from './componentes/pie-pagina/pie-pagina';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navbar, Slider, PiePagina],

  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  rutaActual = '';
  mostrarLayoutPublico = true;

  constructor(private router: Router) {
    this.actualizarEstadoLayout(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.actualizarEstadoLayout(event.urlAfterRedirects);
      });
  }

  private actualizarEstadoLayout(url: string): void {
    const ruta = url ?? '';
    this.rutaActual = ruta.replace(/^\//, '');
    this.mostrarLayoutPublico = !ruta.startsWith('/administrador');
  }
}
