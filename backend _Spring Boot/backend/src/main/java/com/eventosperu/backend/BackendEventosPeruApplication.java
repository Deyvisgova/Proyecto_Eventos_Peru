package com.eventosperu.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// Punto de arranque de la aplicación. Se encarga de iniciar todo el proyecto
// para que las demás partes puedan trabajar.
@SpringBootApplication
public class BackendEventosPeruApplication {

    public static void main(String[] args) {
        // Lanza el proyecto y deja todo listo para atender pedidos.
        SpringApplication.run(BackendEventosPeruApplication.class, args);
    }

}
