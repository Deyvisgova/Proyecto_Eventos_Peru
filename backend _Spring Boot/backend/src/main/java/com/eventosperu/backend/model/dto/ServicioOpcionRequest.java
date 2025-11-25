package com.eventosperu.backend.model.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * Payload para registrar o actualizar variantes de un servicio ofertado por el proveedor.
 */
@Data
public class ServicioOpcionRequest {
    private Integer idProveedorServicio;
    private String nombreOpcion;
    private String descripcion;
    private BigDecimal precio;
    private Integer duracionMinutos;
    private Integer stock;
    private String urlFoto;
}
