package com.eventosperu.backend.model;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Relación de catálogo de servicios con los eventos donde aplica (tabla catalogo_evento_servicio).
 */
@Data
@Entity
@Table(name = "catalogo_evento_servicio")
public class CatalogoEventoServicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_catalogo_evento")
    private Integer idCatalogoEvento;

    @ManyToOne
    @JoinColumn(name = "id_evento", nullable = false)
    private Evento evento;

    @ManyToOne
    @JoinColumn(name = "id_catalogo", nullable = false)
    private CatalogoServicio catalogoServicio;
}
