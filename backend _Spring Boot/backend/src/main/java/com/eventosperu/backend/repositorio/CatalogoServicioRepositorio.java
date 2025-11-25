package com.eventosperu.backend.repositorio;

import com.eventosperu.backend.model.CatalogoServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CatalogoServicioRepositorio extends JpaRepository<CatalogoServicio, Integer> {
    List<CatalogoServicio> findByEstado(CatalogoServicio.EstadoCatalogo estado);

    CatalogoServicio findByNombre(String nombre);
}
