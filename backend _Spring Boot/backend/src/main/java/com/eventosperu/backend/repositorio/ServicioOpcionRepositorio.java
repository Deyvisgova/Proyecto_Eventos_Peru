package com.eventosperu.backend.repositorio;

import com.eventosperu.backend.model.ProveedorServicio;
import com.eventosperu.backend.model.ServicioOpcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServicioOpcionRepositorio extends JpaRepository<ServicioOpcion, Integer> {
    List<ServicioOpcion> findByProveedorServicio(ProveedorServicio proveedorServicio);
}
