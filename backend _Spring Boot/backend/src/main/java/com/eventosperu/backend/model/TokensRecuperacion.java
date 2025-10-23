package com.eventosperu.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entidad que mapea la tabla `tokens_recuperacion`.
 * Aquí guardamos cada token de recuperación de contraseña,
 * con su usuario, fecha de expiración y si ya fue usado.
 */
@Entity
@Table(name = "tokens_recuperacion")
public class TokensRecuperacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_token")
    private Integer idToken; // PK autoincremental

    @Column(name = "id_usuario", nullable = false)
    private Integer idUsuario; // FK a usuarios.id_usuario

    @Column(name = "token", nullable = false, unique = true)
    private String token; // El token enviado por correo

    @Column(name = "expira_en", nullable = false)
    private LocalDateTime expiraEn; // Fecha/hora límite para usar el token

    @Column(name = "usado", nullable = false)
    private boolean usado = false; // true si ya fue utilizado

    @Column(name = "creado_en")
    private LocalDateTime creadoEn = LocalDateTime.now(); // cuándo se generó

    // ===== Getters y Setters =====
    public Integer getIdToken() { return idToken; }
    public Integer getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Integer idUsuario) { this.idUsuario = idUsuario; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public LocalDateTime getExpiraEn() { return expiraEn; }
    public void setExpiraEn(LocalDateTime expiraEn) { this.expiraEn = expiraEn; }
    public boolean isUsado() { return usado; }
    public void setUsado(boolean usado) { this.usado = usado; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
    public void setCreadoEn(LocalDateTime creadoEn) { this.creadoEn = creadoEn; }
}
