package com.eventosperu.backend.controlador;

import com.eventosperu.backend.model.Servicio;
import com.eventosperu.backend.model.Proveedor;
import com.eventosperu.backend.model.Evento;
import com.eventosperu.backend.repositorio.ServicioRepositorio;
import com.eventosperu.backend.repositorio.ProveedorRepositorio;
import com.eventosperu.backend.repositorio.EventoRepositorio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/servicios")
@CrossOrigin(origins = "*")
public class ServicioControlador {

    @Autowired
    private ServicioRepositorio servicioRepositorio;

    @Autowired
    private ProveedorRepositorio proveedorRepositorio;

    @Autowired
    private EventoRepositorio eventoRepositorio;

    // Obtener todos los servicios
    @GetMapping
    public List<Servicio> obtenerServicios() {
        return servicioRepositorio.findAll();
    }

    // Registrar un nuevo servicio
    @PostMapping
    public Servicio guardarServicio(@RequestBody Servicio servicio) {
        return servicioRepositorio.save(servicio);
    }

    // Buscar servicio por ID
    @GetMapping("/{id}")
    public Servicio obtenerServicioPorId(@PathVariable Integer id) {
        return servicioRepositorio.findById(id).orElse(null);
    }

    // Buscar servicios por proveedor
    @GetMapping("/proveedor/{idProveedor}")
    public List<Servicio> obtenerPorProveedor(@PathVariable Integer idProveedor) {
        Proveedor proveedor = proveedorRepositorio.findById(idProveedor).orElse(null);
        if (proveedor == null) return List.of();
        return servicioRepositorio.findByProveedor(proveedor);
    }

    // Buscar servicios por evento
    @GetMapping("/evento/{idEvento}")
    public List<Servicio> obtenerPorEvento(@PathVariable Integer idEvento) {
        Evento evento = eventoRepositorio.findById(idEvento).orElse(null);
        if (evento == null) return List.of();
        return servicioRepositorio.findByEvento(evento);
    }

    // Actualizar un servicio
    @PutMapping("/{id}")
    public Servicio actualizarServicio(@PathVariable Integer id, @RequestBody Servicio datosActualizados) {
        return servicioRepositorio.findById(id)
                .map(servicio -> {
                    servicio.setNombreServicio(datosActualizados.getNombreServicio());
                    servicio.setDescripcion(datosActualizados.getDescripcion());
                    servicio.setPrecio(datosActualizados.getPrecio());
                    servicio.setUrlFoto(datosActualizados.getUrlFoto());
                    servicio.setProveedor(datosActualizados.getProveedor());
                    servicio.setEvento(datosActualizados.getEvento());
                    return servicioRepositorio.save(servicio);
                })
                .orElse(null);
    }

    // Eliminar servicio
    @DeleteMapping("/{id}")
    public void eliminarServicio(@PathVariable Integer id) {
        servicioRepositorio.deleteById(id);
    }
}
