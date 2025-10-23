import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // ⬅️ importado
import { AutenticacionService } from '../../servicios/autenticacion';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule], // ⬅️ agregado RouterModule
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AutenticacionService);
  private router = inject(Router);

  formularioLogin = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(6)]],
  });

  enviando = false;
  error = '';

  ngOnInit(): void {
    try {
      const guardado = localStorage.getItem('usuario');
      if (guardado) {
        const u = JSON.parse(guardado);
        if (u?.rol) this.redirigirPorRol(u.rol);
      }
    } catch {}
  }

  // Tu HTML llama a este método: (ngSubmit)="ingresar()"
  ingresar(): void {
    this.error = '';

    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      return;
    }

    const correo = this.formularioLogin.value.correo!.trim();
    const contrasena = this.formularioLogin.value.contrasena!;

    this.enviando = true;
    this.auth.login({ email: correo, password: contrasena }).subscribe({
      next: (u) => {
        // u = { idUsuario, nombre, email, rol }
        localStorage.setItem('usuario', JSON.stringify(u));
        this.enviando = false;
        this.redirigirPorRol(u.rol); // ← redirige según rol
      },
      error: () => {
        this.error = 'Email o contraseña incorrectos';
        this.enviando = false;
      },
    });
  }

  private redirigirPorRol(rol: string): void {
    const r = (rol || '').toUpperCase();
    if (r === 'ADMIN') this.router.navigateByUrl('/administrador'); // tu panel admin ya existe
    else if (r === 'PROVEEDOR')
      this.router.navigateByUrl('/proveedor'); // panel que acabamos de crear
    else this.router.navigateByUrl('/'); // cliente: página principal
  }
}
