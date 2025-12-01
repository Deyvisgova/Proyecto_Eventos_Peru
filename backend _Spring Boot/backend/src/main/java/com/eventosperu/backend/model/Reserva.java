package com.eventosperu.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

// Representa la solicitud que hace un cliente a un proveedor para un evento,
// incluyendo fechas, estados y quiénes participan.
@Data
@Entity
@Table(name = "reservas")
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idReserva;

    @ManyToOne
    @JoinColumn(name = "id_cliente", nullable = false)
    private Usuario cliente;

    @ManyToOne
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor proveedor;

    @ManyToOne
    @JoinColumn(name = "id_evento", nullable = false)
    private Evento evento;

    @Column(name = "fecha_evento", nullable = false)
    private LocalDate fechaEvento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoReserva estado = EstadoReserva.PENDIENTE;

    @Column(name = "fecha_reserva")
    private LocalDateTime fechaReserva = LocalDateTime.now();

    @Column(name = "fecha_confirmacion")
    private LocalDateTime fechaConfirmacion;

    @Column(name = "fecha_limite_rechazo")
    private LocalDateTime fechaLimiteRechazo;

    @Column(name = "fecha_rechazo")
    private LocalDateTime fechaRechazo;

    public enum EstadoReserva {
        PENDIENTE,
        CONFIRMADA,
        CANCELADA
    }
}
