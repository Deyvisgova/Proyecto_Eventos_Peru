package com.eventosperu.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Variantes del servicio ofertado por el proveedor (tabla servicio_opcion).
 */
@Data
@Entity
@Table(name = "servicio_opcion")
public class ServicioOpcion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_opcion")
    private Integer idOpcion;

    @ManyToOne
    @JoinColumn(name = "id_proveedor_servicio", nullable = false)
    private ProveedorServicio proveedorServicio;

    @Column(name = "nombre_opcion", nullable = false, length = 150)
    private String nombreOpcion;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @Column(name = "duracion_minutos")
    private Integer duracionMinutos;

    private Integer stock;

    @Column(name = "url_foto", length = 255)
    private String urlFoto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoServicioOpcion estado = EstadoServicioOpcion.ACTIVO;

    public enum EstadoServicioOpcion {
        ACTIVO, NO_DISPONIBLE
    }
}
