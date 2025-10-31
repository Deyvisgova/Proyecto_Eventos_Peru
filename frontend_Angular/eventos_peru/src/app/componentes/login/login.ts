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
      // Limpia cualquier dato viejo para no redirigir con un rol antiguo
      localStorage.removeItem('usuario');
      localStorage.removeItem('rol');
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
        // 1) Tomar el rol desde la respuesta (distintos formatos soportados)
        const rolCrudo =
          (u as any)?.rol ??
          (u as any)?.usuario?.rol ??
          (u as any)?.role ??
          (u as any)?.usuario?.role ??
          (u as any)?.authorities?.[0]?.authority ??
          '';

        // 2) Normalizar: ' ROLE_PROVEEDOR ' -> 'PROVEEDOR'
        let rol = String(rolCrudo).trim().toUpperCase();
        if (rol.startsWith('ROLE_')) rol = rol.substring(5);

        // 3) Guardar el usuario en localStorage con el ROL CORRECTO
        const usuarioConRolActualizado = { ...(u as any), rol };
        localStorage.setItem('usuario', JSON.stringify(usuarioConRolActualizado));
        localStorage.setItem('rol', rol); // por si algún guard lo lee así

        // (opcional) log para verificar qué llega
        console.log('[login] rolCrudo:', rolCrudo, ' -> rol:', rol);

        // 4) Redirigir por rol ya normalizado
        this.enviando = false;
        this.redirigirPorRol(rol);
      },

      error: () => {
        this.error = 'Email o contraseña incorrectos';
        this.enviando = false;
      },
    });
  }

  private redirigirPorRol(rol: string): void {
    let r = String(rol ?? '')
      .trim()
      .toUpperCase();
    if (r.startsWith('ROLE_')) r = r.substring(5); // ROLE_PROVEEDOR → PROVEEDOR

    console.log('[login] redirigirPorRol ->', r);

    if (r === 'ADMIN') {
      this.router.navigateByUrl('/administrador');
    } else if (r === 'PROVEEDOR') {
      console.log('[router] navegando a /proveedor');
      this.router.navigateByUrl('/proveedor');
    } else {
      this.router.navigateByUrl('/');
    }
  }
}
