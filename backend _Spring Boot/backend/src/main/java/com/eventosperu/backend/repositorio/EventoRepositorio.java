package com.eventosperu.backend.repositorio;

import com.eventosperu.backend.model.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventoRepositorio extends JpaRepository<Evento, Integer> {

    // Buscar evento por nombre
    Evento findByNombreEvento(String nombreEvento);
}
