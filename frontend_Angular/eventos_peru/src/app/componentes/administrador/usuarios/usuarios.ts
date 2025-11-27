import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../servicios/usuario.service';
import { Usuario } from '../../../modelos/usuario';

// Bootstrap (para usar los modales)
declare var bootstrap: any;

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.css'],
})
export class Usuarios {
  // ==============================
  // 🔹 VARIABLES PRINCIPALES
  // ==============================
  usuarios: Usuario[] = [];
  nuevo: Usuario = {} as Usuario;
  usuarioSeleccionado: Usuario = {} as Usuario;
  usuarioAEliminar: Usuario | null = null;

  constructor(private usuarioService: UsuarioService) {}

  // ==============================
  // 🔹 INICIALIZAR LISTA
  // ==============================
  ngOnInit() {
    this.cargarUsuarios();
  }

  // ==============================
  // 🔹 CARGAR USUARIOS DESDE API
  // ==============================
  cargarUsuarios() {
    this.usuarioService.getUsuarios().subscribe({
      next: (data: Usuario[]) => {
        this.usuarios = data;
      },
      error: (err: unknown) => console.error('❌ Error al cargar usuarios:', err),
    });
  }

  // ==============================
  // 🔹 ABRIR MODAL DE AGREGAR
  // ==============================
  abrirModalAgregar() {
    this.nuevo = { fechaRegistro: new Date().toISOString().slice(0, 10) } as any;
    const modal = new bootstrap.Modal(document.getElementById('modalAgregar'));
    modal.show();
  }

  // ===============================
  // 🔹 GUARDAR NUEVO USUARIO (POST)
  // ===============================
  guardarUsuario() {
    // ✅ Convertimos la fecha del input (2025-10-07) a formato ISO completo
    const fechaISO = new Date(`${this.nuevo.fechaRegistro}T00:00:00`).toISOString();

    // ✅ Armamos el payload EXACTAMENTE como lo pide el backend
    const payload = {
      idUsuario: null, // requerido según Swagger
      nombre: this.nuevo.nombre?.trim(),
      email: this.nuevo.email?.trim(),
      password: this.nuevo.password,
      rol: this.nuevo.rol,
      fechaRegistro: fechaISO, // formato ISO con hora
    };

    // ✅ Validamos campos requeridos
    if (
      !payload.nombre ||
      !payload.email ||
      !payload.password ||
      !payload.rol ||
      !payload.fechaRegistro
    ) {
      alert('Por favor completa todos los campos antes de guardar.');
      return;
    }

    // ✅ Llamamos al servicio
    this.usuarioService.agregarUsuario(payload).subscribe({
      next: (resp) => {
        this.cargarUsuarios(); // recarga la tabla
        bootstrap.Modal.getInstance(document.getElementById('modalAgregar'))?.hide(); // cierra el modal
        this.nuevo = {} as any; // limpia el formulario
        console.log('✅ Usuario agregado correctamente:', resp);
      },
      error: (err) => {
        console.error('❌ Error al guardar usuario:', err);
        alert('Error al guardar usuario. Verifica los datos o revisa el backend.');
      },
    });
  }

  // ===============================
  // 🔹 ABRIR MODAL DE EDITAR
  // ===============================
  abrirModalEditar(usuario: Usuario) {
    // Clonamos el usuario para no modificar la tabla directamente
    this.usuarioSeleccionado = { ...usuario };

    // 🧠 Convertimos la fecha del backend a formato "YYYY-MM-DD"
    if (this.usuarioSeleccionado.fechaRegistro) {
      const fecha = new Date(this.usuarioSeleccionado.fechaRegistro);
      this.usuarioSeleccionado.fechaRegistro = fecha.toISOString().slice(0, 10);
    }

    const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
    modal.show();
  }

  // ===============================
  // 🔹 ACTUALIZAR USUARIO EXISTENTE
  // ===============================
  actualizarUsuario() {
    const id = Number(this.usuarioSeleccionado.idUsuario);
    if (!id) {
      alert('El ID del usuario no es válido.');
      return;
    }

    const fechaRegistro = this.usuarioSeleccionado.fechaRegistro;
    if (!fechaRegistro) {
      alert('La fecha de registro no está disponible para actualizar al usuario.');
      return;
    }

    // Convertimos la fecha a formato ISO completo (con hora)
    const fechaISO = new Date(fechaRegistro).toISOString();

    // Armamos el payload exacto que Spring espera
    const payload = {
      idUsuario: id,
      nombre: this.usuarioSeleccionado.nombre?.trim(),
      email: this.usuarioSeleccionado.email?.trim(),
      password: this.usuarioSeleccionado.password || '',
      rol: this.usuarioSeleccionado.rol,
      fechaRegistro: fechaISO, // 👈 formato ISO válido para Spring
    };

    this.usuarioService.actualizarUsuario(id, payload).subscribe({
      next: (resp) => {
        this.cargarUsuarios();
        bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
        console.log('✅ Usuario actualizado correctamente:', resp);
      },
      error: (err) => {
        console.error('❌ Error al actualizar usuario:', err);
        alert('No se pudo actualizar el usuario. Revisa los datos o el backend.');
      },
    });
  }

  // ==============================
  // 🔹 ABRIR MODAL DE CONFIRMACIÓN
  // ==============================
  abrirModalEliminar(usuario: Usuario) {
    this.usuarioAEliminar = usuario;
    const modal = new bootstrap.Modal(document.getElementById('modalEliminar'));
    modal.show();
  }

  // ===============================
  // 🔹 CONFIRMAR ELIMINACIÓN
  // ===============================
  confirmarEliminacion() {
    // El ID puede ser undefined si no se seleccionó bien el usuario
    const id = Number(this.usuarioAEliminar?.idUsuario);

    // Guard clause: si no hay ID válido, no seguimos
    if (!Number.isFinite(id)) {
      alert('No hay un ID válido para eliminar.');
      return;
    }

    this.usuarioService.eliminarUsuario(id).subscribe({
      next: () => {
        this.cargarUsuarios();
        bootstrap.Modal.getInstance(document.getElementById('modalEliminar'))?.hide();
        this.usuarioAEliminar = null;
        console.log('🗑️ Usuario eliminado correctamente');
      },
      error: (err: unknown) => {
        console.error('❌ Error al eliminar usuario:', err);
        alert('No se pudo eliminar el usuario. Revisa el backend.');
      },
    });
  }
}
