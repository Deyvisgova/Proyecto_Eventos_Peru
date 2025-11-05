package com.eventosperu.backend.controlador;
import com.eventosperu.backend.model.Usuario;
import com.eventosperu.backend.repositorio.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class UsuarioControlador {

    private final UsuarioRepositorio usuarioRepositorio;

    public UsuarioControlador(UsuarioRepositorio usuarioRepositorio) {
        this.usuarioRepositorio = usuarioRepositorio;
    }
    // ------------------- LISTAR TODOS -------------------
    @GetMapping("/usuarios")
    public ResponseEntity<List<Usuario>> listar() {
        return ResponseEntity.ok(usuarioRepositorio.findAll());
    }
    // ------------------- OBTENER POR ID -------------------
    @GetMapping("/usuarios/{id}")
    public ResponseEntity<Usuario> obtener(@PathVariable Integer id) {
        return usuarioRepositorio.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    // ------------------- CREAR (ADMIN) -------------------
    @PostMapping("/usuarios")
    public ResponseEntity<?> crear(@RequestBody Usuario usuario) {
        // Validaciones simples
        if (isBlank(usuario.getNombre()) || isBlank(usuario.getEmail()) || isBlank(usuario.getPassword())) {
            return ResponseEntity.badRequest().body("Nombre, email y password son obligatorios");
        }
        if (usuarioRepositorio.existePorEmail(usuario.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("El email ya está registrado");
        }
        // Encriptar password si viene en claro
        var bCrypt = new BCryptPasswordEncoder();
        if (!isBcrypt(usuario.getPassword())) {
            usuario.setPassword(bCrypt.encode(usuario.getPassword()));
        }
        // Rol por defecto si no viene (ajusta si tu campo es enum)
        if (usuario.getRol() == null) {
            try {
                // Si es enum:
                usuario.setRol(Usuario.Rol.CLIENTE);
            } catch (Exception ignored) {
                // Si fuera String, descomenta lo siguiente y comenta lo de arriba:
                // usuario.setRol("CLIENTE");
            }
        }
        Usuario guardado = usuarioRepositorio.save(usuario);
        return ResponseEntity.ok(guardado);
    }
    // ------------------- ACTUALIZAR (ADMIN) -------------------
    @PutMapping("/usuarios/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Integer id, @RequestBody Usuario body) {
        Optional<Usuario> opt = usuarioRepositorio.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Usuario u = opt.get();
        // Evitar choque de email con otro usuario
        if (!isBlank(body.getEmail()) && !body.getEmail().equalsIgnoreCase(u.getEmail())
                && usuarioRepositorio.existePorEmail(body.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("El email ya está en uso por otro usuario");
        }
        if (!isBlank(body.getNombre())) u.setNombre(body.getNombre());
        if (!isBlank(body.getEmail())) u.setEmail(body.getEmail());

        // Rol (si tu campo es enum o String, ajusta)
        if (body.getRol() != null) {
            try {
                u.setRol(body.getRol());                 // enum Usuario.Rol
            } catch (Exception ignored) {
                // Si fuera String:
                // u.setRolString(body.getRolString());
            }
        }
        // Cambiar password solo si viene algo
        if (!isBlank(body.getPassword())) {
            String nuevo = body.getPassword();
            u.setPassword(isBcrypt(nuevo) ? nuevo : new BCryptPasswordEncoder().encode(nuevo));
        }

        Usuario actualizado = usuarioRepositorio.save(u);
        return ResponseEntity.ok(actualizado);
    }
    // ------------------- ELIMINAR (ADMIN) -------------------
    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        if (!usuarioRepositorio.existsById(id)) return ResponseEntity.notFound().build();
        usuarioRepositorio.deleteById(id);
        return ResponseEntity.noContent().build();
    }
    // ------------------- HELPERS -------------------
    private boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }
    private boolean isBcrypt(String s) { return s != null && (s.startsWith("$2a$") || s.startsWith("$2b$") || s.startsWith("$2y$")); }
}
