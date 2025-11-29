import { Routes } from '@angular/router';

export const routes: Routes = [
  /* ================== AUTENTICACIÓN ================== */
  { path: 'login', loadComponent: () => import('./componentes/login/login').then((m) => m.Login) },
  {
    path: 'registro-cliente',
    loadComponent: () =>
      import('./componentes/registro-cliente/registro-cliente').then((m) => m.RegistroCliente),
  },
  /* ================== RECUPERAR CONTRASEÑA ================== */
  {
    path: 'recuperar-password',
    loadComponent: () =>
      import('./componentes/recuperar-password/recuperar-password').then(
        (m) => m.RecuperarPassword
      ),
  },

  /* ================== REGISTRO PROVEEDOR ================== */
  {
    path: 'registro-proveedor',
    loadComponent: () =>
      import('./componentes/registro-proveedor/registro-proveedor').then(
        (m) => m.RegistroProveedor
      ),
  },

  /* ================== RECUPERAR CONTRASEÑA ================== */
  {
    path: 'recuperar-password/:token',
    loadComponent: () =>
      import('./componentes/recuperar-password/restablecer-password/restablecer-password').then(
        (m) => m.RestablecerPassword
      ),
  },

  /* ================== ADMINISTRADOR (con HIJAS) ==================
     ⬇⬇ Ajusta SOLO si tus nombres/carpeta difieren ⬇⬇
  */
  {
    path: 'administrador',
    loadComponent: () =>
      import('./componentes/administrador/administrador').then((m) => m.Administrador),
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },

      // Hijas típicas (CAMBIA si tus archivos/clases se llaman distinto)

      {
        path: 'inicio',
        loadComponent: () =>
          import('./componentes/administrador/inicio/inicio').then((m) => m.InicioAdmin),
      },

      {
        path: 'usuarios',
        loadComponent: () =>
          import('./componentes/administrador/usuarios/usuarios').then((m) => m.Usuarios),
      },
      {
        path: 'proveedores',
        loadComponent: () =>
          import('./componentes/administrador/proveedores/proveedores').then((m) => m.Proveedores),
      },
      {
        path: 'eventos',
        loadComponent: () =>
          import('./componentes/administrador/eventos/eventos').then((m) => m.Eventos),
      },
      {
        path: 'servicios',
        loadComponent: () =>
          import('./componentes/administrador/servicios-peo/servicios-peo').then((m) => m.ServiciosPeo),
      },
      {
        path: 'reservas',
        loadComponent: () =>
          import('./componentes/administrador/reservas/reservas').then((m) => m.ReservasAdmin),
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./componentes/administrador/configuracion/configuracion').then(
            (m) => m.ConfiguracionAdmin
          ),
      },
    ],
  },

  /* ================== PROVEEDOR ================== */
  {
    path: 'proveedor',
    loadComponent: () => import('./componentes/proveedor/proveedor').then((m) => m.Proveedor),
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      {
        path: 'inicio',
        loadComponent: () =>
          import('./componentes/proveedor/inicio/inicio').then((m) => m.InicioProveedor),
      },
      {
        path: 'catalogo-servicios',
        loadComponent: () =>
          import('./componentes/proveedor/catalogo-servicios/catalogo-servicios').then(
            (m) => m.CatalogoServicios
          ),
      },
      {
        path: 'reservas',
        loadComponent: () =>
          import('./componentes/proveedor/reservas/reservas').then((m) => m.ReservasProveedor),
      },
      {
        path: 'subir-logo',
        loadComponent: () =>
          import('./componentes/proveedor/subir-logo/subir-logo').then((m) => m.SubirLogo),
      },
    ],
  },

  /* ================== CLIENTE (PÁGINA PRINCIPAL) ================== */
  {
    path: '',
    loadComponent: () =>
      import('./componentes/contenido-principal/contenido-principal').then(
        (m) => m.ContenidoPrincipal
      ),
  },
  {
    path: 'cliente/evento/:tipo',
    loadComponent: () =>
      import('./componentes/evento-cliente/evento-cliente').then((m) => m.EventoCliente),
  },
  {
    path: 'cliente/reservas',
    loadComponent: () =>
      import('./componentes/evento-cliente/reservas-cliente/reservas-cliente').then(
        (m) => m.ReservasCliente
      ),
  },

  /* ================== CUALQUIER OTRA RUTA ================== */
  { path: '**', redirectTo: '' },
];
