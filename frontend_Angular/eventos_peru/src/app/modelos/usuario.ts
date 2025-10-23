// Modelo base del usuario
export interface Usuario {
  idUsuario: number | null; // opcional al crear (autoincrementa en DB)
  nombre: string;
  email: string;
  password?: string; // <-- IMPORTANTE: nombre que espera el backend
  rol: 'ADMIN' | 'CLIENTE';
  fechaRegistro: string | Date; // admitimos string 'YYYY-MM-DD' o Date
}
