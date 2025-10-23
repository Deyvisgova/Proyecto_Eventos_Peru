package com.eventosperu.backend.repositorio;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.eventosperu.backend.model.TokensRecuperacion;

/**
 * Repositorio para consultar/guardar tokens de recuperación.
 */
public interface TokensRecuperacionRepositorio
        extends JpaRepository<TokensRecuperacion, Integer> {

    /**
     * Buscar un token por su valor (para validarlo cuando el usuario
     * abre el enlace del correo).
     */
    Optional<TokensRecuperacion> findByToken(String token);
}
