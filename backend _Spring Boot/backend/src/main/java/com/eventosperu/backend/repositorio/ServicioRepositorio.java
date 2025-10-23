package com.eventosperu.backend.repositorio;

import com.eventosperu.backend.model.Servicio;
import com.eventosperu.backend.model.Proveedor;
import com.eventosperu.backend.model.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServicioRepositorio extends JpaRepository<Servicio, Integer> {

    // Buscar servicios por proveedor
    List<Servicio> findByProveedor(Proveedor proveedor);

    // Buscar servicios por evento
    List<Servicio> findByEvento(Evento evento);

    // Buscar servicios por proveedor y evento
    List<Servicio> findByProveedorAndEvento(Proveedor proveedor, Evento evento);
}
