package com.eventosperu.backend.controlador;

import com.eventosperu.backend.model.Evento;
import com.eventosperu.backend.repositorio.EventoRepositorio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/eventos")
@CrossOrigin(origins = "*")
public class EventoControlador {

    @Autowired
    private EventoRepositorio eventoRepositorio;

    // Obtener todos los eventos
    @GetMapping
    public List<Evento> obtenerEventos() {
        return eventoRepositorio.findAll();
    }

    // Registrar un nuevo evento
    @PostMapping
    public Evento guardarEvento(@RequestBody Evento evento) {
        return eventoRepositorio.save(evento);
    }

    // Buscar evento por ID
    @GetMapping("/{id}")
    public Evento obtenerEventoPorId(@PathVariable Integer id) {
        return eventoRepositorio.findById(id).orElse(null);
    }

    // Actualizar evento existente
    @PutMapping("/{id}")
    public Evento actualizarEvento(@PathVariable Integer id, @RequestBody Evento datosActualizados) {
        return eventoRepositorio.findById(id)
                .map(evento -> {
                    evento.setNombreEvento(datosActualizados.getNombreEvento());
                    return eventoRepositorio.save(evento);
                })
                .orElse(null);
    }

    // Eliminar evento
    @DeleteMapping("/{id}")
    public void eliminarEvento(@PathVariable Integer id) {
        eventoRepositorio.deleteById(id);
    }
}
