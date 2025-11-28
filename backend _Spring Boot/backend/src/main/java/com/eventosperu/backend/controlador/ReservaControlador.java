package com.eventosperu.backend.controlador;

import com.eventosperu.backend.model.Reserva;
import com.eventosperu.backend.model.Usuario;
import com.eventosperu.backend.model.Proveedor;
import com.eventosperu.backend.model.Evento;
import com.eventosperu.backend.repositorio.DetalleReservaRepositorio;
import com.eventosperu.backend.repositorio.ReservaRepositorio;
import com.eventosperu.backend.repositorio.UsuarioRepositorio;
import com.eventosperu.backend.repositorio.ProveedorRepositorio;
import com.eventosperu.backend.repositorio.EventoRepositorio;
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
    private EmailNotificacionServicio emailNotificacionServicio;

    @Autowired
    private EventoRepositorio eventoRepositorio;

    // Obtener todas las reservas
    @GetMapping
    public List<Reserva> obtenerReservas() {
        return reservaRepositorio.findAll();
    }

    // Crear una nueva reserva
    @PostMapping
    public Reserva guardarReserva(@RequestBody Reserva reserva) {
        if (reserva.getCliente() == null || reserva.getCliente().getIdUsuario() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cliente requerido");
        }

        if (reserva.getProveedor() == null || reserva.getProveedor().getIdProveedor() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Proveedor requerido");
        }

        if (reserva.getEvento() == null || reserva.getEvento().getIdEvento() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evento requerido");
        }

        Usuario cliente = usuarioRepositorio.findById(reserva.getCliente().getIdUsuario())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"));

        Proveedor proveedor = proveedorRepositorio.findById(reserva.getProveedor().getIdProveedor())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proveedor no encontrado"));

        Evento evento = eventoRepositorio.findById(reserva.getEvento().getIdEvento())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));

        reserva.setCliente(cliente);
        reserva.setProveedor(proveedor);
        reserva.setEvento(evento);

        if (reserva.getEstado() == null) {
            reserva.setEstado(Reserva.EstadoReserva.PENDIENTE);
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
                    reserva.setEvento(datosActualizados.getEvento());
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
        reserva.setFechaLimiteRechazo(ahora.plusDays(3));
        Reserva guardada = reservaRepositorio.save(reserva);

        String detalle = detalleReservaRepositorio.findByReserva(reserva).stream()
                .map(d -> String.format("- %s (cant: %d) S/ %.2f", d.getServicio().getNombreServicio(), d.getCantidad(), d.getPrecioUnitario()))
                .collect(Collectors.joining("\n"));

        String cuerpo = "¡Tu reserva fue confirmada!\n\n" +
                "Detalle:\n" + detalle + "\n\n" +
                "Fecha del evento: " + reserva.getFechaEvento() + "\n" +
                "Puedes rechazarla dentro de los próximos 3 días si algo no cuadra.";

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
