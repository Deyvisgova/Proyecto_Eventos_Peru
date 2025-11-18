import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ProveedorService } from '../../servicios/proveedor.service'; // ✅ agregado para conexión backend

@Component({
  selector: 'app-registro-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-proveedor.html',
  styleUrl: './registro-proveedor.css',
})
export class RegistroProveedor {
  ruc: string = '';
  nombre_empresa: string = '';
  direccion: string = '';
  cargando: boolean = false; // 🌀 Para evitar doble envío

  constructor(private proveedorSrv: ProveedorService) {} // ✅ inyectamos el servicio

  // 🔑 Token de apiperu.dev
  private token = 'f3ba6fa1f3a2b2d1a6390dc06d831ebad2f218a9d3ba43e7f1f42b425dd03e26';

  // ✅ Buscar RUC automáticamente (no se toca)
  async buscarRuc() {
    if (!this.ruc || this.ruc.length !== 11) {
      alert('⚠️ El RUC debe tener 11 dígitos.');
      return;
    }

    try {
      const response = await fetch('https://apiperu.dev/api/ruc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ ruc: this.ruc }),
      });

      const data = await response.json();

      if (data.success) {
        this.nombre_empresa = data.data.nombre_o_razon_social;
        this.direccion = data.data.direccion_completa;
      } else {
        alert('❌ No se encontró información para este RUC.');
        this.nombre_empresa = '';
        this.direccion = '';
      }
    } catch (error) {
      console.error('Error al consultar RUC:', error);
      alert('❗ Error al conectar con la API de SUNAT.');
    }
  }

  // ✅ Registrar proveedor en tu base de datos real (Spring Boot)
  registrarProveedor() {
    if (!this.ruc || !this.nombre_empresa || !this.direccion) {
      alert('⚠️ Por favor completa todos los campos antes de registrar.');
      return;
    }

    // 🔹 Obtenemos el id del usuario logueado desde localStorage
    const raw = localStorage.getItem('usuario');
    let id_usuario = 0;

    if (raw) {
      try {
        const user = JSON.parse(raw);
        id_usuario = user.id_usuario ?? user.idUsuario ?? 0;
      } catch {
        id_usuario = 0;
      }
    }

    if (!id_usuario) {
      alert('No se encontró el usuario logueado.');
      return;
    }

    // 🔹 Datos a enviar al backend
    const dto = {
      usuario: { idUsuario: id_usuario }, // <- en vez de id_usuario plano
      ruc: this.ruc,
      nombreEmpresa: this.nombre_empresa, // <- camelCase que espera el backend
      direccion: this.direccion,
    };

    this.cargando = true;

    // 🔹 Enviar al backend real
    this.proveedorSrv.registrar(dto).subscribe({
      next: () => {
        this.cargando = false;

        Swal.fire({
          icon: 'success',
          title: 'Solicitud enviada 🎉',
          text: 'Su cuenta está pendiente de validación por el administrador.',
          confirmButtonText: 'Aceptar',
        });

        // Limpiar formulario
        this.ruc = '';
        this.nombre_empresa = '';
        this.direccion = '';
      },

      error: () => {
        this.cargando = false;

        Swal.fire({
          icon: 'warning',
          title: 'Solicitud en proceso',
          text: 'Su cuenta está en espera de validación. Por favor, tenga paciencia.',
          confirmButtonText: 'Aceptar',
        });
      },
    });
  }
  // 🔹 Método para obtener el id del usuario logueado
  private getIdUsuario(): number {
    const raw = localStorage.getItem('usuario');
    if (!raw) return 0;

    try {
      const usuario = JSON.parse(raw);
      // Soporta dos posibles nombres de campo
      if (usuario.id_usuario) return usuario.id_usuario;
      if (usuario.idUsuario) return usuario.idUsuario;
    } catch {
      // Si hay error al leer JSON, devolvemos 0
      return 0;
    }

    return 0;
  }
}
