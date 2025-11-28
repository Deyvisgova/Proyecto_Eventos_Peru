package com.eventosperu.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "email_notificacion")
public class EmailNotificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_email")
    private Integer idEmail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Column(name = "destinatario_email", nullable = false, length = 200)
    private String destinatarioEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Tipo tipo;

    @Column(nullable = false, length = 200)
    private String asunto;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String cuerpo;

    @Column(name = "datos_json", columnDefinition = "LONGTEXT")
    private String datosJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Estado estado = Estado.PENDIENTE;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_envio")
    private LocalDateTime fechaEnvio;

    @Column(name = "mensaje_error", length = 255)
    private String mensajeError;

    @PrePersist
    public void onCreate() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
    }

    public enum Tipo {
        PROVEEDOR_REGISTRO_PENDIENTE,
        PROVEEDOR_ESTADO_APROBADO,
        PROVEEDOR_ESTADO_RECHAZADO,
        PROVEEDOR_RESERVA_SOLICITUD,
        CLIENTE_RESERVA_DETALLE,
        TIPO_SERVICIO_PROPUESTO,
        TIPO_SERVICIO_APROBADO,
        TIPO_SERVICIO_RECHAZADO
    }

    public enum Estado {
        PENDIENTE,
        ENVIADO,
        ERROR
    }
}
