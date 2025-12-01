package com.eventosperu.backend.model;

import jakarta.persistence.*;
import lombok.Data;

// Representa el evento que arma un cliente y guarda su nombre y código.
@Data
@Entity
@Table(name = "eventos")
public class Evento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idEvento;

    @Column(name = "nombre_evento", nullable = false, length = 50)
    private String nombreEvento;
}
