import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './recuperar-password.html',
})
export class RecuperarPassword {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  enviando = false;
  mensaje = '';
  error = '';

  form = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
  });

  enviar() {
    if (this.form.invalid) return;

    this.enviando = true;
    this.mensaje = '';
    this.error = '';

    const email = this.form.value.correo;

    // 👇 conexión al backend Spring Boot
    this.http.post('http://localhost:8080/api/auth/recuperar-password', { email }).subscribe({
      next: () => {
        this.mensaje = 'Si te registraste, recibirás un enlace de recuperación.';
        this.enviando = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Hubo un error al enviar el correo. Intenta más tarde.';
        this.enviando = false;
      },
    });
  }
}
