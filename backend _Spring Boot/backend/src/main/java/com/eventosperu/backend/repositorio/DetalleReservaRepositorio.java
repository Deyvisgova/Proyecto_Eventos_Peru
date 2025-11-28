package com.eventosperu.backend.repositorio;

import com.eventosperu.backend.model.DetalleReserva;
import com.eventosperu.backend.model.Servicio;
import com.eventosperu.backend.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetalleReservaRepositorio extends JpaRepository<DetalleReserva, Integer> {

    // Buscar todos los detalles por reserva
    List<DetalleReserva> findByReserva(Reserva reserva);

    // Buscar todos los detalles por servicio
    List<DetalleReserva> findByServicio(Servicio servicio);
}
