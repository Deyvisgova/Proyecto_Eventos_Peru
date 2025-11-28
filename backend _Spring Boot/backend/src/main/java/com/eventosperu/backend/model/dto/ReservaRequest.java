package com.eventosperu.backend.model.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ReservaRequest {
    private Integer idCliente;
    private Integer idProveedor;
    private LocalDate fechaEvento;
    private List<Detalle> detalles;

    @Data
    public static class Detalle {
        private Integer idOpcion;
        private Integer cantidad;
        private Double precioUnitario;
    }
}
