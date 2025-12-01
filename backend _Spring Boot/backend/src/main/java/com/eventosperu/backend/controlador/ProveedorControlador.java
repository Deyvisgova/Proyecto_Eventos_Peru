package com.eventosperu.backend.controlador;

import com.eventosperu.backend.model.EmailNotificacion;
import com.eventosperu.backend.model.Proveedor;
import com.eventosperu.backend.model.Usuario;
import com.eventosperu.backend.repositorio.ProveedorRepositorio;
import com.eventosperu.backend.repositorio.UsuarioRepositorio;
import com.eventosperu.backend.servicio.EmailNotificacionServicio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

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

    @Autowired
    private EmailNotificacionServicio emailNotificacionServicio;

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

    @PostMapping("/{id}/logo")
    public ResponseEntity<?> subirLogo(
            @PathVariable Integer id,
            @RequestParam("file") MultipartFile archivo
    ) {
        Optional<Proveedor> proveedorOpt = proveedorRepositorio.findById(id);
        if (proveedorOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Proveedor no encontrado");
        }
        if (archivo.isEmpty()) {
            return ResponseEntity.badRequest().body("Archivo vacío");
        }

        try {
            Path destino = Paths.get("..", "frontend_Angular", "eventos_peru", "src", "assets", "logos_proveedores")
                    .toAbsolutePath()
                    .normalize();
            Files.createDirectories(destino);

            String nombreOriginal = StringUtils.cleanPath(archivo.getOriginalFilename());
            String prefijoFecha = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            String nombreArchivo = prefijoFecha + "_" + nombreOriginal;

            Path archivoDestino = destino.resolve(nombreArchivo);
            archivo.transferTo(archivoDestino.toFile());

            String rutaRelativa = Paths.get("assets", "logos_proveedores", nombreArchivo).toString().replace('\\', '/');
            Proveedor proveedor = proveedorOpt.get();
            proveedor.setLogoUrl(rutaRelativa);
            proveedorRepositorio.save(proveedor);

            return ResponseEntity.ok().body(java.util.Map.of(
                    "path", rutaRelativa,
                    "logoUrl", rutaRelativa
            ));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("No se pudo guardar el logo");
        }
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

        Usuario destinatario = proveedor.getUsuario();
        if (destinatario != null && StringUtils.hasText(destinatario.getEmail())) {
            EmailNotificacion.Tipo tipo = null;
            if (nuevoEstado == Proveedor.EstadoProveedor.APROBADO) {
                tipo = EmailNotificacion.Tipo.PROVEEDOR_ESTADO_APROBADO;
            } else if (nuevoEstado == Proveedor.EstadoProveedor.RECHAZADO) {
                tipo = EmailNotificacion.Tipo.PROVEEDOR_ESTADO_RECHAZADO;
            }

            if (tipo != null) {
                String asunto = StringUtils.hasText(request.getAsunto())
                        ? request.getAsunto().trim()
                        : generarAsuntoPorEstado(nuevoEstado);
                String mensaje = StringUtils.hasText(request.getMensaje())
                        ? request.getMensaje().trim()
                        : generarMensajePorEstado(proveedor, nuevoEstado);

                String datosJson = construirDatosJson(proveedor, nuevoEstado);
                emailNotificacionServicio.registrarYEnviar(
                        destinatario,
                        destinatario.getEmail(),
                        tipo,
                        asunto,
                        mensaje,
                        datosJson
                );
            }
        }

        return ResponseEntity.ok(actualizado);
    }

    public static class SolicitudEstado {
        private String estado;
        private String asunto;
        private String mensaje;

        public String getEstado() {
            return estado;
        }

        public void setEstado(String estado) {
            this.estado = estado;
        }

        public String getAsunto() {
            return asunto;
        }

        public void setAsunto(String asunto) {
            this.asunto = asunto;
        }

        public String getMensaje() {
            return mensaje;
        }

        public void setMensaje(String mensaje) {
            this.mensaje = mensaje;
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

    private String generarAsuntoPorEstado(Proveedor.EstadoProveedor estado) {
        if (estado == Proveedor.EstadoProveedor.APROBADO) {
            return "Bienvenido a Eventos Perú";
        }
        if (estado == Proveedor.EstadoProveedor.RECHAZADO) {
            return "Actualización sobre tu registro como proveedor";
        }
        return "Actualización de estado";
    }

    private String generarMensajePorEstado(Proveedor proveedor, Proveedor.EstadoProveedor estado) {
        String nombreEmpresa = proveedor.getNombreEmpresa() != null ? proveedor.getNombreEmpresa() : "proveedor";
        if (estado == Proveedor.EstadoProveedor.APROBADO) {
            return "Hola " + nombreEmpresa + ",\n\n" +
                    "¡Bienvenido a Eventos Perú! Tu registro ha sido aprobado y ya puedes ingresar al panel del proveedor para " +
                    "gestionar tus servicios y responder a los clientes.\n\n" +
                    "Gracias por confiar en nosotros.\n" +
                    "Equipo de Eventos Perú";
        }
        if (estado == Proveedor.EstadoProveedor.RECHAZADO) {
            return "Hola " + nombreEmpresa + ",\n\n" +
                    "Tras revisar tu solicitud, por el momento no podremos aprobar tu cuenta. " +
                    "Si tienes dudas o deseas compartir más información, puedes responder a este correo.\n\n" +
                    "Saludos,\nEquipo de Eventos Perú";
        }
        return "Hola " + nombreEmpresa + ", tu estado ha sido actualizado.";
    }

    private String construirDatosJson(Proveedor proveedor, Proveedor.EstadoProveedor estado) {
        Integer id = proveedor.getIdProveedor() != null ? proveedor.getIdProveedor() : 0;
        String empresa = proveedor.getNombreEmpresa() != null ? proveedor.getNombreEmpresa() : "";
        String empresaEscapada = empresa.replace("\"", "\\\"");
        return "{" +
                "\"proveedorId\":" + id + "," +
                "\"empresa\":\"" + empresaEscapada + "\"," +
                "\"estado\":\"" + estado.name() + "\"}";
    }
}
