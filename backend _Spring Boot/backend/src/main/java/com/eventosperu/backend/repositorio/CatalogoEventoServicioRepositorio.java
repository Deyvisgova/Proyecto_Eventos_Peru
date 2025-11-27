package com.eventosperu.backend.repositorio;

import com.eventosperu.backend.model.CatalogoEventoServicio;
import com.eventosperu.backend.model.Evento;
import com.eventosperu.backend.model.CatalogoServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CatalogoEventoServicioRepositorio extends JpaRepository<CatalogoEventoServicio, Integer> {
    List<CatalogoEventoServicio> findByEvento(Evento evento);
    List<CatalogoEventoServicio> findByCatalogoServicio(CatalogoServicio catalogoServicio);

    void deleteByCatalogoServicio(CatalogoServicio catalogoServicio);
}
