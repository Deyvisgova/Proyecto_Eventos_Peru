package com.eventosperu.backend.repositorio;

import com.eventosperu.backend.model.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProveedorRepositorio extends JpaRepository<Proveedor, Integer> {

    // Buscar proveedor por id_usuario (porque se relaciona con Usuario)
    Proveedor findByUsuario_IdUsuario(Integer idUsuario);
}
