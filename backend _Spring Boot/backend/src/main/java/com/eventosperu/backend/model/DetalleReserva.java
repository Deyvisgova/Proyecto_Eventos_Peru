package com.eventosperu.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

/**
 * Detalle de los servicios contratados dentro de una reserva.
 */

@Data
@Entity
@Table(name = "detalle_reserva")
public class DetalleReserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idDetalle;

    @ManyToOne
    @JoinColumn(name = "id_reserva", nullable = false)
    @JsonIgnore
    private Reserva reserva;

    @ManyToOne
    @JoinColumn(name = "id_servicio")
    private Servicio servicio;

    @ManyToOne
    @JoinColumn(name = "id_opcion")
    private ServicioOpcion opcion;

    @Column(nullable = false)
    private Integer cantidad = 1;

    @Column(name = "precio_unitario", nullable = false)
    private Double precioUnitario;

    @Column(name = "nombre_evento", length = 150)
    private String nombreEvento;

    @Column(name = "nombre_servicio", length = 150)
    private String nombreServicio;

    @Column(name = "nombre_opcion", length = 150)
    private String nombreOpcion;

    @Column(name = "nombre_cliente", length = 150)
    private String nombreCliente;

    @Column(name = "telefono_cliente", length = 50)
    private String telefonoCliente;

    @Column(name = "fecha_evento")
    private LocalDate fechaEvento;

    @Column(name = "subtotal")
    private Double subtotal;

    @Column(name = "total")
    private Double total;

    @PrePersist
    @PreUpdate
    public void recalcularMontos() {
        double unitario = precioUnitario != null ? precioUnitario : 0.0;
        int qty = cantidad != null ? cantidad : 0;
        double calculado = unitario * qty;
        this.subtotal = calculado;
        this.total = calculado;
    }
}
