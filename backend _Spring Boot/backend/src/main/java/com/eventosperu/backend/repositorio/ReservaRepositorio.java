package com.eventosperu.backend.repositorio;

import com.eventosperu.backend.model.Reserva;
import com.eventosperu.backend.model.Usuario;
import com.eventosperu.backend.model.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReservaRepositorio extends JpaRepository<Reserva, Integer> {

    // Buscar reservas por cliente
    List<Reserva> findByCliente(Usuario cliente);

    // Buscar reservas por proveedor
    List<Reserva> findByProveedor(Proveedor proveedor);

    // Buscar reservas por fecha del evento
    List<Reserva> findByFechaEvento(LocalDate fechaEvento);
}
