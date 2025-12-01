package com.eventosperu.backend.repositorio;

import com.eventosperu.backend.model.CatalogoServicio;
import com.eventosperu.backend.model.Proveedor;
import com.eventosperu.backend.model.ProveedorServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProveedorServicioRepositorio extends JpaRepository<ProveedorServicio, Integer> {
    List<ProveedorServicio> findByProveedor(Proveedor proveedor);
    List<ProveedorServicio> findByCatalogoServicio_Estado(CatalogoServicio.EstadoCatalogo estado);
    List<ProveedorServicio> findByEstado(ProveedorServicio.EstadoProveedorServicio estado);
    List<ProveedorServicio> findByCatalogoServicio(CatalogoServicio catalogoServicio);
    boolean existsByCatalogoServicio(CatalogoServicio catalogoServicio);
}
