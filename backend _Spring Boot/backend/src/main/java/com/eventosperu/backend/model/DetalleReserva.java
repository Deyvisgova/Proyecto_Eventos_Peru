package com.eventosperu.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import com.eventosperu.backend.model.ServicioOpcion;
import com.eventosperu.backend.model.ProveedorServicio;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "detalle_reserva")
public class DetalleReserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idDetalle;

    @ManyToOne
    @JoinColumn(name = "id_reserva", nullable = false)
    private Reserva reserva;

    @ManyToOne
    @JoinColumn(name = "id_opcion", nullable = false)
    private ServicioOpcion opcion;

    @ManyToOne
    @JoinColumn(name = "id_servicio", nullable = false)
    private ProveedorServicio servicio;

    @Column(nullable = false)
    private Integer cantidad = 1;

    @Column(name = "precio_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;
}
