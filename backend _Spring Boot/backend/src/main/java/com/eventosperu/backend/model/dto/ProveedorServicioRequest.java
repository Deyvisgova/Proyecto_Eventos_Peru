package com.eventosperu.backend.model.dto;

import lombok.Data;

/**
 * Payload para registrar o actualizar la oferta de un proveedor.
 */
@Data
public class ProveedorServicioRequest {
    private Integer idProveedor;
    private Integer idCatalogo;
    private String nombrePublico;
    private String descripcionGeneral;
    private String urlFoto;
}
