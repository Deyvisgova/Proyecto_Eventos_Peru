package com.eventosperu.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idUsuario;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 100)
    private String email;
    

    @Column(name = "telefono", length = 20)

    private String celular;

    @Column(nullable = false, length = 255)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rol rol;

    private LocalDateTime fechaRegistro = LocalDateTime.now();

    public enum Rol {
        ADMIN,
        CLIENTE,
        PROVEEDOR
    }
}
