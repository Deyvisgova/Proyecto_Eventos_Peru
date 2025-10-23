package com.eventosperu.backend.controlador;

import com.eventosperu.backend.model.TokensRecuperacion;
import com.eventosperu.backend.model.Usuario; // ajusta el paquete si difiere
import com.eventosperu.backend.model.dto.RecuperarPasswordRequest;
import com.eventosperu.backend.repositorio.TokensRecuperacionRepositorio;
import com.eventosperu.backend.repositorio.UsuarioRepositorio;
import com.eventosperu.backend.servicio.RecuperacionPasswordServicio;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class RecuperarPasswordControlador {

    private final RecuperacionPasswordServicio servicio;
    private final TokensRecuperacionRepositorio tokensRepo;
    private final UsuarioRepositorio usuarioRepo;

    public RecuperarPasswordControlador(RecuperacionPasswordServicio servicio,
                                        TokensRecuperacionRepositorio tokensRepo,
                                        UsuarioRepositorio usuarioRepo) {
        this.servicio = servicio;
        this.tokensRepo = tokensRepo;
        this.usuarioRepo = usuarioRepo;
    }

    // ==============================
    // 1️⃣ GENERAR TOKEN Y ENVIAR CORREO
    // ==============================
    @PostMapping("/recuperar-password")
    public ResponseEntity<Void> recuperar(@RequestBody RecuperarPasswordRequest request) {
        try {
            if (request != null && request.getEmail() != null && !request.getEmail().isBlank()) {
                servicio.enviarCorreoRecuperacion(request.getEmail().trim());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return ResponseEntity.ok().build();
    }

    // ==============================
    // 2️⃣ RESTABLECER CONTRASEÑA
    // ==============================
    @PostMapping("/restablecer-password")
    public ResponseEntity<String> restablecer(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String nueva = body.get("nuevaContrasena");

        // 🔹 LOGS para ver lo que llega desde el frontend
        System.out.println("========================================");
        System.out.println("[RESTABLECER] Token recibido desde el frontend: " + token);
        System.out.println("[RESTABLECER] Nueva contraseña recibida: " + nueva);
        System.out.println("========================================");

        if (token == null || token.isBlank() || nueva == null || nueva.isBlank()) {
            return ResponseEntity.badRequest().body("Datos incompletos");
        }

        // 🔹 Buscar token en la base de datos
        Optional<TokensRecuperacion> opt = tokensRepo.findByToken(token);
        System.out.println("[RESTABLECER] ¿Token existe en BD? => " + opt.isPresent());

        if (opt.isEmpty()) {
            System.out.println("[RESTABLECER] Token no encontrado en BD.");
            return ResponseEntity.badRequest().body("Token inválido");
        }

        TokensRecuperacion tr = opt.get();

        // 🔹 Imprimimos los datos del token
        System.out.println("[RESTABLECER] Token encontrado en BD:");
        System.out.println("   usado = " + tr.isUsado());
        System.out.println("   expira_en = " + tr.getExpiraEn());
        System.out.println("   fecha actual = " + LocalDateTime.now());

        // 🔹 Validar si está usado o vencido
        if (tr.isUsado() || tr.getExpiraEn().isBefore(LocalDateTime.now())) {
            System.out.println("[RESTABLECER] El token está vencido o ya fue usado.");
            return ResponseEntity.badRequest().body("Token expirado o usado");
        }

        // 🔹 Buscar usuario dueño del token
        Optional<Usuario> optUsuario = usuarioRepo.findById(tr.getIdUsuario());
        System.out.println("[RESTABLECER] ¿Usuario existe? => " + optUsuario.isPresent());

        if (optUsuario.isEmpty()) {
            System.out.println("[RESTABLECER] Usuario no encontrado para el token.");
            return ResponseEntity.badRequest().body("Usuario no encontrado");
        }

        Usuario u = optUsuario.get();

        /// 4) Cambiar contraseña con encriptación usando BCrypt
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String contrasenaEncriptada = encoder.encode(nueva);
        u.setPassword(contrasenaEncriptada);
        usuarioRepo.save(u);

        System.out.println("🔐 Contraseña encriptada con BCrypt y guardada correctamente.");


        // 🔹 Marcar token como usado
        tr.setUsado(true);
        tokensRepo.save(tr);

        System.out.println("[RESTABLECER] Contraseña cambiada y token marcado como usado ✅");

        return ResponseEntity.ok("Contraseña actualizada correctamente");
    }
}
