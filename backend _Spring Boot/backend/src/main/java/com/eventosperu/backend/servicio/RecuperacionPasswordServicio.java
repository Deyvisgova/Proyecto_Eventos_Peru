package com.eventosperu.backend.servicio;

import com.eventosperu.backend.model.TokensRecuperacion;
import com.eventosperu.backend.model.Usuario;
import com.eventosperu.backend.repositorio.TokensRecuperacionRepositorio;
import com.eventosperu.backend.repositorio.UsuarioRepositorio;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Servicio encargado de generar el token, guardarlo y enviar el correo de recuperación.
 */
@Service
public class RecuperacionPasswordServicio {

    private final JavaMailSender mailSender;
    private final TokensRecuperacionRepositorio tokensRepo;
    private final UsuarioRepositorio usuarioRepo;

    // 🟢 URL del frontend (para el enlace del correo)
    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    // 🟢 Correo remitente (el que enviará los mensajes)
    @Value("${app.mail.from:no-reply@eventosperu.com}")
    private String from;

    // 🟢 Constructor con inyección de dependencias
    public RecuperacionPasswordServicio(JavaMailSender mailSender,
                                        TokensRecuperacionRepositorio tokensRepo,
                                        UsuarioRepositorio usuarioRepo) {
        this.mailSender = mailSender;
        this.tokensRepo = tokensRepo;
        this.usuarioRepo = usuarioRepo;
    }

    /**
     * Genera un token y envía un correo con el enlace para restablecer contraseña.
     * Si el correo no existe, no se muestra error (por seguridad).
     */
    public void enviarCorreoRecuperacion(String email) {
        System.out.println("📨 [SERVICIO] Solicitando recuperación para: " + email);

        // 1️⃣ Buscar el usuario por su email (ajustar si tu campo se llama 'correo')
        Optional<Usuario> optUsuario = usuarioRepo.findByEmail(email);

        if (optUsuario.isEmpty()) {
            System.out.println("⚠️ [SERVICIO] No existe un usuario con ese correo.");
            return; // no lanzamos error, simplemente no hacemos nada
        }

        Usuario usuario = optUsuario.get();

        // 2️⃣ Generar token aleatorio único
        String token = UUID.randomUUID().toString();

        // 3️⃣ Crear el registro para la tabla tokens_recuperacion
        TokensRecuperacion registro = new TokensRecuperacion();
        registro.setIdUsuario(usuario.getIdUsuario());
        registro.setToken(token);
        registro.setExpiraEn(LocalDateTime.now().plusMinutes(10)); // dura 10 min
        registro.setUsado(false); // 🟢 importante: asegurar que se guarde en 0 (no usado)
        registro.setCreadoEn(LocalDateTime.now());

        // 4️⃣ Guardar el token en la base de datos
        tokensRepo.save(registro);
        System.out.println("✅ [SERVICIO] Token guardado en BD: " + token);

        // 5️⃣ Construir el enlace completo
        String enlace = frontendUrl + "/recuperar-password/" + token;

        // 6️⃣ Crear y enviar el correo
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(from);
        mensaje.setTo(email);
        mensaje.setSubject("Recuperación de contraseña - Sistema de Eventos Perú");
        mensaje.setText(
                "Hola " + usuario.getNombre() + ",\n\n" +
                        "Recibimos una solicitud para restablecer tu contraseña.\n" +
                        "Haz clic en el siguiente enlace (válido por 10 minutos):\n\n" +
                        enlace + "\n\n" +
                        "Si no solicitaste esto, ignora este mensaje.\n\n" +
                        "Saludos,\nSistema de Eventos Perú."
        );

        try {
            mailSender.send(mensaje);
            System.out.println("📧 [SERVICIO] Correo de recuperación enviado correctamente a " + email);
        } catch (Exception e) {
            System.out.println("❌ [SERVICIO] Error al enviar el correo: " + e.getMessage());
        }
    }
}
