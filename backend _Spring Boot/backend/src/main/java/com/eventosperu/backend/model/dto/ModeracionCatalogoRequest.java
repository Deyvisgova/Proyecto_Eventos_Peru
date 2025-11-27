package com.eventosperu.backend.model.dto;

import lombok.Data;

/**
 * Request para aprobar o rechazar un tipo de servicio propuesto.
 */
@Data
public class ModeracionCatalogoRequest {
    private Integer idAdminRevisor;
    private String motivoRechazo;
}
