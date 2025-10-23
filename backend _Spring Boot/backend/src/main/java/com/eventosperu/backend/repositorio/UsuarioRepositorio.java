package com.eventosperu.backend.repositorio;

import com.eventosperu.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepositorio extends JpaRepository<Usuario, Integer> {

    // Buscar un usuario por su email
    @Query("SELECT u FROM Usuario u WHERE u.email = :email")
    Usuario buscarPorEmail(@Param("email") String email);

    // 👇 NUEVO: lo necesita el servicio para encontrar al usuario por su email
    Optional<Usuario> findByEmail(String email);

    // Verificar si existe un usuario con ese email
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM Usuario u WHERE u.email = :email")
    boolean existePorEmail(@Param("email") String email);
}
