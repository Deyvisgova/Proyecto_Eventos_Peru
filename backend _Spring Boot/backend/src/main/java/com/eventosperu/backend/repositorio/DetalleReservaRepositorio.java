package com.eventosperu.backend.repositorio;

import com.eventosperu.backend.model.DetalleReserva;
import com.eventosperu.backend.model.Reserva;
import com.eventosperu.backend.model.ServicioOpcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetalleReservaRepositorio extends JpaRepository<DetalleReserva, Integer> {

    // Buscar todos los detalles por reserva
    List<DetalleReserva> findByReserva(Reserva reserva);

    // Buscar todos los detalles por opción de servicio
    List<DetalleReserva> findByOpcion(ServicioOpcion opcion);

    void deleteByOpcionIn(List<ServicioOpcion> opciones);
}
