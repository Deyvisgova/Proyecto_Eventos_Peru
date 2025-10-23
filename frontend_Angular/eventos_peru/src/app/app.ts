import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navbar } from './componentes/navbar/navbar';
import { Slider } from './componentes/slider/slider';
import { PiePagina } from './componentes/pie-pagina/pie-pagina';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navbar, Slider, PiePagina],

  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  rutaActual = '';

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.rutaActual = this.router.url.replace('/', '');
    });
  }
}
