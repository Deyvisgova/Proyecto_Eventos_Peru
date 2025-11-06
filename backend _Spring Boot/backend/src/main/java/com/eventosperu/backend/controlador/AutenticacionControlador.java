package com.eventosperu.backend.controlador;

import com.eventosperu.backend.model.Usuario;
import com.eventosperu.backend.repositorio.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@RestController
@RequestMapping("/api/auth")
public class AutenticacionControlador {

    private final UsuarioRepositorio usuarioRepositorio;

    public AutenticacionControlador(UsuarioRepositorio usuarioRepositorio) {
        this.usuarioRepositorio = usuarioRepositorio;
    }

    // Comprobación rápida
    @GetMapping("/ping")
    public String ping() { return "OK"; }

    // -------- REGISTRO --------
    @PostMapping("/register")
    public ResponseEntity<?> registrar(@RequestBody SolicitudRegistro req) {
        if (req == null || blank(req.nombre) || blank(req.email) || blank(req.password)) {
            return ResponseEntity.badRequest().body("Faltan campos");
        }
        if (usuarioRepositorio.existePorEmail(req.email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("El email ya está registrado");
        }

        var bCrypt = new BCryptPasswordEncoder();

        Usuario u = new Usuario();
        u.setNombre(req.nombre);
        u.setEmail(req.email);
        u.setPassword(bCrypt.encode(req.password));
        // Ajusta si en tu entidad 'rol' es enum; si es String, esto funciona:
        u.setRol(Usuario.Rol.CLIENTE);  // ✅


        usuarioRepositorio.save(u);
        return ResponseEntity.ok("Registro exitoso");
    }

    // -------- LOGIN --------
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody SolicitudLogin req) {
        Usuario u = usuarioRepositorio.buscarPorEmail(req.email);
        if (u == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email o contraseña incorrectos");

        var bCrypt = new BCryptPasswordEncoder();
        if (!bCrypt.matches(req.password, u.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email o contraseña incorrectos");
        }

        return ResponseEntity.ok(new UsuarioPublico(u.getIdUsuario(), u.getNombre(), u.getEmail(), u.getRol().name())); // ✅

    }

    // -------- DTOs --------
    public static class SolicitudRegistro { public String nombre; public String email; public String password; }
    public static class SolicitudLogin { public String email; public String password; }
    public static class UsuarioPublico {
        public Integer idUsuario; public String nombre; public String email; public String rol;
        public UsuarioPublico(Integer idUsuario, String nombre, String email, String rol) {
            this.idUsuario = idUsuario; this.nombre = nombre; this.email = email; this.rol = rol;
        }
    }

    private boolean blank(String s){ return s == null || s.trim().isEmpty(); }
}
