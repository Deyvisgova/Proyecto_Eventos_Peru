package com.eventosperu.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Tabla catalogo_servicios: define los tipos generales de servicio (comida, decoración, etc.).
 * Se usa tanto por el administrador como por los proveedores para proponer nuevos tipos.
 */
@Data
@Entity
@Table(name = "catalogo_servicios")
public class CatalogoServicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_catalogo")
    private Integer idCatalogo;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoCatalogo estado = EstadoCatalogo.PENDIENTE;

    @Enumerated(EnumType.STRING)
    @Column(name = "creado_por", nullable = false)
    private FuenteCreacion creadoPor = FuenteCreacion.ADMIN;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "fecha_revision")
    private LocalDateTime fechaRevision;

    @Column(name = "id_admin_revisor")
    private Integer idAdminRevisor;

    @Column(name = "id_proveedor_solicitante")
    private Integer idProveedorSolicitante;

    @Column(name = "motivo_rechazo", length = 255)
    private String motivoRechazo;

    public enum EstadoCatalogo {
        ACTIVO, PENDIENTE, RECHAZADO
    }

    public enum FuenteCreacion {
        ADMIN, PROVEEDOR
    }
}
