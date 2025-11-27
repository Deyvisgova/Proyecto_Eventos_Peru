package com.eventosperu.backend.model.dto;

import lombok.Data;

/**
 * Payload sencillo para registrar un tipo de servicio desde admin o proveedor.
 */
@Data
public class NuevoCatalogoServicioRequest {
    private String nombre;
    private String descripcion;
    private Integer idProveedorSolicitante;
}
