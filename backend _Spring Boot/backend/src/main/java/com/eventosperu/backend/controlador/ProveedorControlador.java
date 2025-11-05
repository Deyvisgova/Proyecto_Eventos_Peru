package com.eventosperu.backend.controlador;

import com.eventosperu.backend.model.Proveedor;
import com.eventosperu.backend.model.Usuario;
import com.eventosperu.backend.repositorio.ProveedorRepositorio;
import com.eventosperu.backend.repositorio.UsuarioRepositorio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

@RestController
@RequestMapping("/api/proveedores")
@CrossOrigin(origins = "*")
public class ProveedorControlador {

    @Autowired
    private ProveedorRepositorio proveedorRepositorio;

    @Autowired
    private UsuarioRepositorio usuarioRepositorio;

    // Obtener todos los proveedores
    @GetMapping
    public List<Proveedor> obtenerProveedores() {
        return proveedorRepositorio.findAll();
    }

    // Buscar proveedor por ID de usuario (para panel del proveedor)
    @GetMapping("/usuario/{idUsuario}")
    public Proveedor obtenerProveedorPorIdUsuario(@PathVariable Integer idUsuario) {
        return proveedorRepositorio.findByUsuario_IdUsuario(idUsuario);
    }

    // Registrar un nuevo proveedor
    @PostMapping
    public Proveedor guardarProveedor(@RequestBody Proveedor proveedor) {
        return proveedorRepositorio.save(proveedor);
    }

    // Buscar proveedor por ID
    @GetMapping("/{id}")
    public Proveedor obtenerProveedorPorId(@PathVariable Integer id) {
        return proveedorRepositorio.findById(id).orElse(null);
    }

    // Actualizar proveedor existente
    @PutMapping("/{id}")
    public Proveedor actualizarProveedor(@PathVariable Integer id, @RequestBody Proveedor datosActualizados) {
        return proveedorRepositorio.findById(id)
                .map(proveedor -> {
                    proveedor.setNombreEmpresa(datosActualizados.getNombreEmpresa());
                    proveedor.setRuc(datosActualizados.getRuc());
                    proveedor.setDireccion(datosActualizados.getDireccion());
                    proveedor.setEstado(datosActualizados.getEstado());
                    return proveedorRepositorio.save(proveedor);
                })
                .orElse(null);
    }

    // Eliminar proveedor
    @DeleteMapping("/{id}")
    public void eliminarProveedor(@PathVariable Integer id) {
        proveedorRepositorio.deleteById(id);
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstado(@PathVariable Integer id, @RequestBody SolicitudEstado request) {
        Optional<Proveedor> proveedorOpt = proveedorRepositorio.findById(id);
        if (proveedorOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Proveedor no encontrado");
        }

        Proveedor.EstadoProveedor nuevoEstado = request.obtenerEstado();
        if (nuevoEstado == null) {
            return ResponseEntity.badRequest().body("Estado inválido");
        }

        Proveedor proveedor = proveedorOpt.get();
        proveedor.setEstado(nuevoEstado);

        Usuario usuario = proveedor.getUsuario();
        if (usuario != null) {
            if (nuevoEstado == Proveedor.EstadoProveedor.APROBADO) {
                usuario.setRol(Usuario.Rol.PROVEEDOR);
            } else if (nuevoEstado == Proveedor.EstadoProveedor.PENDIENTE
                    || nuevoEstado == Proveedor.EstadoProveedor.RECHAZADO) {
                usuario.setRol(Usuario.Rol.CLIENTE);
            }
            usuarioRepositorio.save(usuario);
        }

        Proveedor actualizado = proveedorRepositorio.save(proveedor);
        return ResponseEntity.ok(actualizado);
    }

    public static class SolicitudEstado {
        private String estado;

        public String getEstado() {
            return estado;
        }

        public void setEstado(String estado) {
            this.estado = estado;
        }

        public Proveedor.EstadoProveedor obtenerEstado() {
            if (estado == null) {
                return null;
            }
            try {
                return Proveedor.EstadoProveedor.valueOf(estado.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ex) {
                return null;
            }
        }
    }
}
