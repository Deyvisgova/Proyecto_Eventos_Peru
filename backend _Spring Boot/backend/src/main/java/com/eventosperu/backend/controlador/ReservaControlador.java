package com.eventosperu.backend.controlador;

import com.eventosperu.backend.model.Reserva;
import com.eventosperu.backend.model.Usuario;
import com.eventosperu.backend.model.Proveedor;
import com.eventosperu.backend.repositorio.ReservaRepositorio;
import com.eventosperu.backend.repositorio.UsuarioRepositorio;
import com.eventosperu.backend.repositorio.ProveedorRepositorio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

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

    // Obtener todas las reservas
    @GetMapping
    public List<Reserva> obtenerReservas() {
        return reservaRepositorio.findAll();
    }

    // Crear una nueva reserva
    @PostMapping
    public Reserva guardarReserva(@RequestBody Reserva reserva) {
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
                    return reservaRepositorio.save(reserva);
                })
                .orElse(null);
    }

    // Eliminar una reserva
    @DeleteMapping("/{id}")
    public void eliminarReserva(@PathVariable Integer id) {
        reservaRepositorio.deleteById(id);
    }
}
