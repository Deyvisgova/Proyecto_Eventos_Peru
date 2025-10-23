import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-evento-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evento-cliente.html',
})
export class EventoCliente implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}

  nombre = '';
  tipoEvento = '';
  eventos = ['Cumpleaños', 'Matrimonio', 'Aniversario'];
  filtroEvento = '';
  filtroProveedor = '';

  proveedores: any[] = [];
  proveedoresFiltrados: any[] = [];

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
    this.filtroEvento = this.tipoEvento;

    // 🔹 Datos simulados de proveedores
    this.proveedores = [
      {
        id: 1,
        nombre: 'Decoraciones Luna',
        descripcion: 'Decoración temática y ambientación.',
        imagen:
          'https://img.freepik.com/foto-gratis/arreglo-globos-coloridos-fiesta-cumpleanos_23-2149039580.jpg',
      },
      {
        id: 2,
        nombre: 'Catering Sol',
        descripcion: 'Buffet gourmet para toda ocasión.',
        imagen:
          'https://img.freepik.com/foto-gratis/comida-buffet-variedad-platos_23-2148758323.jpg',
      },
      {
        id: 3,
        nombre: 'Eventos Premium',
        descripcion: 'Organización integral de eventos.',
        imagen:
          'https://img.freepik.com/foto-gratis/mesa-cena-decoracion-elegante_23-2149007042.jpg',
      },
    ];
    this.proveedoresFiltrados = [...this.proveedores];
  }

  filtrar() {
    const fEvento = this.filtroEvento.toLowerCase();
    const fProv = this.filtroProveedor.toLowerCase();
    this.proveedoresFiltrados = this.proveedores.filter(
      (p) =>
        p.nombre.toLowerCase().includes(fProv) &&
        (fEvento === '' || this.eventos.includes(this.filtroEvento))
    );
  }

  verProveedor(id: number) {
    // 🟢 Navegar al detalle del proveedor
    this.router.navigate(['/cliente/proveedor', id]);
  }

  cerrarSesion() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
