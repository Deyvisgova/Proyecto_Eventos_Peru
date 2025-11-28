package com.eventosperu.backend.controlador;

import com.eventosperu.backend.model.DetalleReserva;
import com.eventosperu.backend.model.Reserva;
import com.eventosperu.backend.model.Usuario;
import com.eventosperu.backend.model.Proveedor;
import com.eventosperu.backend.model.ServicioOpcion;
import com.eventosperu.backend.repositorio.DetalleReservaRepositorio;
import com.eventosperu.backend.repositorio.ReservaRepositorio;
import com.eventosperu.backend.repositorio.UsuarioRepositorio;
import com.eventosperu.backend.repositorio.ProveedorRepositorio;
import com.eventosperu.backend.repositorio.ServicioOpcionRepositorio;
import com.eventosperu.backend.servicio.EmailNotificacionServicio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reservas")
@CrossOrigin(origins = "*")
public class ReservaControlador {

    @Autowired
    private ReservaRepositorio reservaRepositorio;

    @Autowired
    private UsuarioRepositorio usuarioRepositorio;

    @Autowired
    private ProveedorRepositorio proveedorRepositorio;

    @Autowired
    private DetalleReservaRepositorio detalleReservaRepositorio;

    @Autowired
    private ServicioOpcionRepositorio servicioOpcionRepositorio;

    @Autowired
    private EmailNotificacionServicio emailNotificacionServicio;

    // Obtener todas las reservas
    @GetMapping
    public List<Reserva> obtenerReservas() {
        return reservaRepositorio.findAll();
    }

    // Crear una nueva reserva
    @PostMapping
    public Reserva guardarReserva(@RequestBody Reserva reserva) {
        if (reserva.getDetalles() != null) {
            reserva.getDetalles().forEach(detalle -> {
                detalle.setReserva(reserva);

                if (detalle.getOpcion() != null && detalle.getOpcion().getIdOpcion() != null) {
                    ServicioOpcion opcionCompleta = servicioOpcionRepositorio
                            .findById(detalle.getOpcion().getIdOpcion())
                            .orElse(null);
                    if (opcionCompleta != null) {
                        detalle.setOpcion(opcionCompleta);
                        detalle.setNombreOpcion(detalle.getNombreOpcion() != null
                                ? detalle.getNombreOpcion()
                                : opcionCompleta.getNombreOpcion());
                        if (detalle.getNombreServicio() == null && opcionCompleta.getProveedorServicio() != null) {
                            detalle.setNombreServicio(opcionCompleta.getProveedorServicio().getNombrePublico());
                        }
                        if (detalle.getPrecioUnitario() == null && opcionCompleta.getPrecio() != null) {
                            detalle.setPrecioUnitario(opcionCompleta.getPrecio().doubleValue());
                        }
                    }
                }

                if (detalle.getNombreCliente() == null && reserva.getCliente() != null) {
                    detalle.setNombreCliente(reserva.getCliente().getNombre());
                }
                if (detalle.getTelefonoCliente() == null && reserva.getCliente() != null) {
                    detalle.setTelefonoCliente(reserva.getCliente().getCelular());
                }
                if (detalle.getFechaEvento() == null) {
                    detalle.setFechaEvento(reserva.getFechaEvento());
                }
                if (detalle.getNombreEvento() == null && detalle.getServicio() != null && detalle.getServicio().getEvento() != null) {
                    detalle.setNombreEvento(detalle.getServicio().getEvento().getNombreEvento());
                }
            });
        }

        return reservaRepositorio.save(reserva);
    }

    // Buscar una reserva por ID
    @GetMapping("/{id}")
    public Reserva obtenerReservaPorId(@PathVariable Integer id) {
        return reservaRepositorio.findById(id).orElse(null);
    }

    // Buscar reservas por cliente
    @GetMapping("/cliente/{idCliente}")
    public List<Reserva> obtenerPorCliente(@PathVariable Integer idCliente) {
        Usuario cliente = usuarioRepositorio.findById(idCliente).orElse(null);
        if (cliente == null) return List.of();
        return reservaRepositorio.findByCliente(cliente);
    }

    // Buscar reservas por proveedor
    @GetMapping("/proveedor/{idProveedor}")
    public List<Reserva> obtenerPorProveedor(@PathVariable Integer idProveedor) {
        Proveedor proveedor = proveedorRepositorio.findById(idProveedor).orElse(null);
        if (proveedor == null) return List.of();
        return reservaRepositorio.findByProveedor(proveedor);
    }

    // Buscar reservas por fecha
    @GetMapping("/fecha/{fecha}")
    public List<Reserva> obtenerPorFecha(@PathVariable String fecha) {
        LocalDate fechaEvento = LocalDate.parse(fecha);
        return reservaRepositorio.findByFechaEvento(fechaEvento);
    }

    // Actualizar una reserva
    @PutMapping("/{id}")
    public Reserva actualizarReserva(@PathVariable Integer id, @RequestBody Reserva datosActualizados) {
        return reservaRepositorio.findById(id)
                .map(reserva -> {
                    reserva.setFechaEvento(datosActualizados.getFechaEvento());
                    reserva.setEstado(datosActualizados.getEstado());
                    reserva.setCliente(datosActualizados.getCliente());
                    reserva.setProveedor(datosActualizados.getProveedor());
                    reserva.setFechaConfirmacion(datosActualizados.getFechaConfirmacion());
                    reserva.setFechaLimiteRechazo(datosActualizados.getFechaLimiteRechazo());
                    reserva.setFechaRechazo(datosActualizados.getFechaRechazo());
                    return reservaRepositorio.save(reserva);
                })
                .orElse(null);
    }

    // Eliminar una reserva
    @DeleteMapping("/{id}")
    public void eliminarReserva(@PathVariable Integer id) {
        reservaRepositorio.deleteById(id);
    }

    @PostMapping("/{id}/confirmar")
    public Reserva confirmar(@PathVariable Integer id) {
        Reserva reserva = reservaRepositorio.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));

        if (reserva.getEstado() != Reserva.EstadoReserva.PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo puedes confirmar reservas pendientes");
        }

        LocalDateTime ahora = LocalDateTime.now();
        reserva.setEstado(Reserva.EstadoReserva.CONFIRMADA);
        reserva.setFechaConfirmacion(ahora);

        LocalDateTime limiteRechazo = reserva.getFechaEvento() != null
                ? reserva.getFechaEvento().atStartOfDay().minusDays(3)
                : ahora.plusDays(3);
        reserva.setFechaLimiteRechazo(limiteRechazo);
        Reserva guardada = reservaRepositorio.save(reserva);

        List<DetalleReserva> detalles = detalleReservaRepositorio.findByReserva(reserva);
        String detalle = detalles.stream()
                .map(d -> {
                    String servicio = d.getNombreServicio();
                    if (servicio == null && d.getServicio() != null) {
                        servicio = d.getServicio().getNombreServicio();
                    }

                    String opcion = d.getNombreOpcion();
                    if (opcion == null && d.getOpcion() != null) {
                        opcion = d.getOpcion().getNombreOpcion();
                    }

                    double subtotal = d.getSubtotal() != null
                            ? d.getSubtotal()
                            : (d.getPrecioUnitario() != null ? d.getPrecioUnitario() : 0) * (d.getCantidad() != null ? d.getCantidad() : 0);

                    String etiquetaOpcion = opcion != null && !opcion.isBlank() ? " - " + opcion : "";
                    return String.format("• %s%s x%d - S/ %.2f",
                            servicio != null ? servicio : "Servicio",
                            etiquetaOpcion,
                            d.getCantidad() != null ? d.getCantidad() : 0,
                            subtotal);
                })
                .collect(Collectors.joining("\n"));

        double total = detalles.stream()
                .mapToDouble(d -> {
                    if (d.getSubtotal() != null) return d.getSubtotal();
                    double unit = d.getPrecioUnitario() != null ? d.getPrecioUnitario() : 0;
                    int qty = d.getCantidad() != null ? d.getCantidad() : 0;
                    return unit * qty;
                })
                .sum();

        String nombreEvento = detalles.stream()
                .findFirst()
                .map(d -> {
                    if (d.getNombreEvento() != null) return d.getNombreEvento();
                    if (d.getFechaEvento() != null) return "Evento";
                    if (d.getServicio() != null && d.getServicio().getEvento() != null) {
                        return d.getServicio().getEvento().getNombreEvento();
                    }
                    return "evento";
                })
                .orElse("evento");

        String nombreCliente = reserva.getCliente() != null ? reserva.getCliente().getNombre() : "cliente";
        String nombreProveedor = reserva.getProveedor() != null ? reserva.getProveedor().getNombreEmpresa() : "nuestro equipo";
        String fechaEventoTexto = reserva.getFechaEvento() != null ? reserva.getFechaEvento().toString() : "fecha por definir";

        String cuerpo = String.format(
                "Hola %s,\n\nConfirmamos tu reserva con %s para el %s.\n\nResumen del evento \"%s\":\n%s\n\nMonto total estimado: S/ %.2f\nPuedes rechazarla hasta el %s.",
                nombreCliente,
                nombreProveedor,
                fechaEventoTexto,
                nombreEvento,
                detalle.isBlank() ? "• Servicios pendientes de detalle" : detalle,
                total,
                guardada.getFechaLimiteRechazo().toLocalDate()
        );

        emailNotificacionServicio.registrarYEnviar(
                reserva.getCliente(),
                reserva.getCliente().getEmail(),
                com.eventosperu.backend.model.EmailNotificacion.Tipo.CLIENTE_RESERVA_DETALLE,
                "Confirmación de reserva",
                cuerpo,
                null
        );

        return guardada;
    }

    @PostMapping("/{id}/rechazar")
    public Reserva rechazar(@PathVariable Integer id) {
        Reserva reserva = reservaRepositorio.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));

        LocalDateTime ahora = LocalDateTime.now();
        boolean esPendiente = reserva.getEstado() == Reserva.EstadoReserva.PENDIENTE;
        boolean dentroDePlazo = reserva.getFechaLimiteRechazo() == null || !ahora.isAfter(reserva.getFechaLimiteRechazo());

        if (!esPendiente && !(reserva.getEstado() == Reserva.EstadoReserva.CONFIRMADA && dentroDePlazo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La reserva ya no puede ser rechazada");
        }

        reserva.setEstado(Reserva.EstadoReserva.CANCELADA);
        reserva.setFechaRechazo(ahora);
        return reservaRepositorio.save(reserva);
    }
}
