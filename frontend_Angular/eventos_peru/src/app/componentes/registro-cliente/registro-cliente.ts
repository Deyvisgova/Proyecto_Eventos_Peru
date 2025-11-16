import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutenticacionService } from '../../servicios/autenticacion';

@Component({
  selector: 'app-registro-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-cliente.html',
  styleUrls: ['./registro-cliente.css'],
})
export class RegistroCliente {
  // Servicio
  private auth = inject(AutenticacionService);

  // Campos del formulario (deben coincidir con tu HTML)
  nombre: string = '';
  email: string = '';
  celular: string = '';
  password: string = '';
  confirmarPassword: string = '';

  // Estado UI
  enviando: boolean = false;
  errores: string[] = [];
  mensajeOk: string = '';

  registrarUsuario(): void {
    this.errores = [];
    this.mensajeOk = '';

    const nombre = (this.nombre || '').trim();
    const email = (this.email || '').trim();
    const celular = (this.celular || '').trim();
    const password = this.password || '';
    const confirmar = this.confirmarPassword || '';

    // Validaciones básicas
    if (!nombre) this.errores.push('El nombre es obligatorio.');
    if (!email) this.errores.push('El correo es obligatorio.');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      this.errores.push('El correo no es válido.');
    if (!celular) this.errores.push('El número de celular es obligatorio.');
    else if (!/^\d{9}$/.test(celular))
      this.errores.push('El celular debe tener 9 dígitos numéricos.');
    if (!password) this.errores.push('La contraseña es obligatoria.');
    else if (password.length < 6)
      this.errores.push('La contraseña debe tener al menos 6 caracteres.');
    if (password !== confirmar) this.errores.push('Las contraseñas no coinciden.');

    if (this.errores.length) return;

    // Llamada al backend
    this.enviando = true;
    this.auth.registrar({ nombre, email, password, celular }).subscribe({
      next: (texto) => {
        this.mensajeOk = texto || 'Registro exitoso';
        this.enviando = false;
        // Limpiar formulario
        this.nombre = '';
        this.email = '';
        this.celular = '';
        this.password = '';
        this.confirmarPassword = '';
      },
      error: (e) => {
        // Muestra el mensaje que envía el backend (409, 400, etc.)
        this.errores = [e?.error || 'No se pudo registrar. Intenta nuevamente.'];
        this.enviando = false;
      },
    });
  }
}
