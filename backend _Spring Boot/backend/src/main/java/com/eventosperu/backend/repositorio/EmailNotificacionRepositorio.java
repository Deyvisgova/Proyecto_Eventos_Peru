package com.eventosperu.backend.repositorio;

import com.eventosperu.backend.model.EmailNotificacion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailNotificacionRepositorio extends JpaRepository<EmailNotificacion, Integer> {
}
