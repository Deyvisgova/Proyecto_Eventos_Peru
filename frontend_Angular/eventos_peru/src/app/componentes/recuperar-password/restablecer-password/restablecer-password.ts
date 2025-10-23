import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-restablecer-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './restablecer-password.html',
})
export class RestablecerPassword {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  enviando = false;
  mensaje = '';
  error = '';

  // 👇 OBTENEMOS EL TOKEN DESDE LA URL
  token = this.route.snapshot.paramMap.get('token') || '';

  form = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmar: ['', Validators.required],
    },
    { validators: this.coinciden }
  );

  coinciden(group: any) {
    const p = group.get('password')?.value;
    const c = group.get('confirmar')?.value;
    return p === c ? null : { noCoinciden: true };
  }

  guardar() {
    if (this.form.invalid) return;
    this.enviando = true;
    this.mensaje = '';
    this.error = '';

    const password = this.form.value.password as string;

    // ✅ LOGS PARA VERIFICAR
    console.log('TOKEN DE LA URL =>', this.token);
    console.log('PAYLOAD =>', { token: this.token, nuevaContrasena: password });

    this.http
      .post(
        'http://localhost:8080/api/auth/restablecer-password',
        {
          token: this.token,
          nuevaContrasena: password,
        },
        { responseType: 'text' }
      ) // 👈 importante: le decimos que espere texto plano
      .subscribe({
        next: (respuesta) => {
          console.log('Respuesta del backend:', respuesta);
          this.mensaje = 'Tu contraseña fue cambiada correctamente.';
          this.error = '';
          this.enviando = false;
          setTimeout(() => this.router.navigateByUrl('/login'), 1500);
        },
        error: (err) => {
          console.error('Error al restablecer:', err);
          this.error = 'El enlace no es válido o ha expirado.';
          this.enviando = false;
        },
      });
  }
}
