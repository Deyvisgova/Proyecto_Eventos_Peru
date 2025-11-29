package com.eventosperu.backend.model.dto;

import com.eventosperu.backend.model.CatalogoServicio;
import lombok.Data;

import java.util.List;

/**
 * Payload para actualizar un tipo de servicio desde el panel admin.
 */
@Data
public class ActualizarCatalogoServicioRequest {
    private String nombre;
    private String descripcion;
    private CatalogoServicio.EstadoCatalogo estado;
    private List<Integer> idEventos;
}
