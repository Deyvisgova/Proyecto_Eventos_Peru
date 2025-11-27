package com.eventosperu.backend.config;

import com.eventosperu.backend.model.CatalogoServicio;
import com.eventosperu.backend.model.Evento;
import com.eventosperu.backend.repositorio.CatalogoServicioRepositorio;
import com.eventosperu.backend.repositorio.EventoRepositorio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Sembrado básico: eventos principales y un set mínimo de tipos de servicio.
 */
@Component
public class DatosInicialesConfig implements CommandLineRunner {

    @Autowired
    private EventoRepositorio eventoRepositorio;

    @Autowired
    private CatalogoServicioRepositorio catalogoServicioRepositorio;

    @Override
    public void run(String... args) {
        crearEventosBase();
        crearCatalogoBase();
    }

    private void crearEventosBase() {
        List<String> eventosBase = Arrays.asList("Cumpleaños", "Aniversarios", "Corporativos");
        eventosBase.forEach(nombre -> {
            if (eventoRepositorio.findByNombreEvento(nombre) == null) {
                Evento evento = new Evento();
                evento.setNombreEvento(nombre);
                eventoRepositorio.save(evento);
            }
        });
    }

    private void crearCatalogoBase() {
        List<String> catalogoBase = Arrays.asList("Comida", "Decoración", "Local", "Música", "Hora Loca");
        catalogoBase.forEach(nombre -> {
            if (catalogoServicioRepositorio.findByNombre(nombre) == null) {
                CatalogoServicio catalogo = new CatalogoServicio();
                catalogo.setNombre(nombre);
                catalogo.setDescripcion("Tipo de servicio base creado por el administrador");
                catalogo.setCreadoPor(CatalogoServicio.FuenteCreacion.ADMIN);
                catalogo.setEstado(CatalogoServicio.EstadoCatalogo.ACTIVO);
                catalogoServicioRepositorio.save(catalogo);
            }
        });
    }
}
