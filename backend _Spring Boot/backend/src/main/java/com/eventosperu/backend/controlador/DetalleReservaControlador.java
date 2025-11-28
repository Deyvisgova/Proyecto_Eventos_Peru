package com.eventosperu.backend.controlador;

import com.eventosperu.backend.model.DetalleReserva;
import com.eventosperu.backend.model.Reserva;
import com.eventosperu.backend.model.ServicioOpcion;
import com.eventosperu.backend.repositorio.DetalleReservaRepositorio;
import com.eventosperu.backend.repositorio.ReservaRepositorio;
import com.eventosperu.backend.repositorio.ServicioOpcionRepositorio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/detalles")
@CrossOrigin(origins = "*")
public class DetalleReservaControlador {

    @Autowired
    private DetalleReservaRepositorio detalleReservaRepositorio;

    @Autowired
    private ReservaRepositorio reservaRepositorio;

    @Autowired
    private ServicioOpcionRepositorio opcionRepositorio;

    // Obtener todos los detalles
    @GetMapping
    public List<DetalleReserva> obtenerDetalles() {
        return detalleReservaRepositorio.findAll();
    }

    // Crear un nuevo detalle
    @PostMapping
    public DetalleReserva guardarDetalle(@RequestBody DetalleReserva detalle) {
        if (detalle == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El detalle es obligatorio");
        }

        if (detalle.getReserva() == null || detalle.getReserva().getIdReserva() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe indicar la reserva");
        }

        Reserva reserva = reservaRepositorio.findById(detalle.getReserva().getIdReserva())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La reserva no existe"));
        detalle.setReserva(reserva);

        if (detalle.getOpcion() == null || detalle.getOpcion().getIdOpcion() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe elegir una opción de servicio");
        }

        ServicioOpcion opcion = opcionRepositorio.findById(detalle.getOpcion().getIdOpcion())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La opción de servicio no existe"));
        detalle.setOpcion(opcion);

        if (detalle.getPrecioUnitario() == null) {
            detalle.setPrecioUnitario(opcion.getPrecio());
        }

        return detalleReservaRepositorio.save(detalle);
    }

    // Buscar detalle por ID
    @GetMapping("/{id}")
    public DetalleReserva obtenerDetallePorId(@PathVariable Integer id) {
        return detalleReservaRepositorio.findById(id).orElse(null);
    }

    // Buscar detalles por reserva
    @GetMapping("/reserva/{idReserva}")
    public List<DetalleReserva> obtenerPorReserva(@PathVariable Integer idReserva) {
        Reserva reserva = reservaRepositorio.findById(idReserva).orElse(null);
        if (reserva == null) return List.of();
        return detalleReservaRepositorio.findByReserva(reserva);
    }

    // Buscar detalles por opción de servicio
    @GetMapping({"/opcion/{idOpcion}", "/servicio/{idOpcion}"})
    public List<DetalleReserva> obtenerPorOpcion(@PathVariable Integer idOpcion) {
        ServicioOpcion opcion = opcionRepositorio.findById(idOpcion).orElse(null);
        if (opcion == null) return List.of();
        return detalleReservaRepositorio.findByOpcion(opcion);
    }

    // Actualizar detalle
    @PutMapping("/{id}")
    public DetalleReserva actualizarDetalle(@PathVariable Integer id, @RequestBody DetalleReserva datosActualizados) {
        return detalleReservaRepositorio.findById(id)
                .map(detalle -> {
                    detalle.setCantidad(datosActualizados.getCantidad());
                    detalle.setPrecioUnitario(datosActualizados.getPrecioUnitario());
                    if (datosActualizados.getReserva() != null && datosActualizados.getReserva().getIdReserva() != null) {
                        reservaRepositorio.findById(datosActualizados.getReserva().getIdReserva())
                                .ifPresent(detalle::setReserva);
                    }

                    if (datosActualizados.getOpcion() != null && datosActualizados.getOpcion().getIdOpcion() != null) {
                        opcionRepositorio.findById(datosActualizados.getOpcion().getIdOpcion())
                                .ifPresent(detalle::setOpcion);
                    }
                    return detalleReservaRepositorio.save(detalle);
                })
                .orElse(null);
    }

    // Eliminar detalle
    @DeleteMapping("/{id}")
    public void eliminarDetalle(@PathVariable Integer id) {
        detalleReservaRepositorio.deleteById(id);
    }
}
