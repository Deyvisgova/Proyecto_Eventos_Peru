package com.eventosperu.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Oferta del proveedor asociada a un tipo de servicio del catálogo (tabla proveedor_servicio).
 */
@Data
@Entity
@Table(name = "proveedor_servicio")
public class ProveedorServicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_proveedor_servicio")
    private Integer idProveedorServicio;

    @ManyToOne
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor proveedor;

    @ManyToOne
    @JoinColumn(name = "id_catalogo", nullable = false)
    private CatalogoServicio catalogoServicio;

    @Column(name = "nombre_publico", nullable = false, length = 150)
    private String nombrePublico;

    @Column(name = "descripcion_general", columnDefinition = "TEXT")
    private String descripcionGeneral;

    @Column(name = "url_foto", length = 255)
    private String urlFoto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoProveedorServicio estado = EstadoProveedorServicio.ACTIVO;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    public enum EstadoProveedorServicio {
        ACTIVO, PAUSADO
    }
}
