package com.eventosperu.backend.controlador;

import com.eventosperu.backend.model.Proveedor;
import com.eventosperu.backend.repositorio.ProveedorRepositorio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/proveedores")
@CrossOrigin(origins = "*")
public class ProveedorControlador {

    @Autowired
    private ProveedorRepositorio proveedorRepositorio;

    // Obtener todos los proveedores
    @GetMapping
    public List<Proveedor> obtenerProveedores() {
        return proveedorRepositorio.findAll();
    }

    // Registrar un nuevo proveedor
    @PostMapping
    public Proveedor guardarProveedor(@RequestBody Proveedor proveedor) {
        return proveedorRepositorio.save(proveedor);
    }

    // Buscar proveedor por ID
    @GetMapping("/{id}")
    public Proveedor obtenerProveedorPorId(@PathVariable Integer id) {
        return proveedorRepositorio.findById(id).orElse(null);
    }

    // Actualizar proveedor existente
    @PutMapping("/{id}")
    public Proveedor actualizarProveedor(@PathVariable Integer id, @RequestBody Proveedor datosActualizados) {
        return proveedorRepositorio.findById(id)
                .map(proveedor -> {
                    proveedor.setNombreEmpresa(datosActualizados.getNombreEmpresa());
                    proveedor.setRuc(datosActualizados.getRuc());
                    proveedor.setDireccion(datosActualizados.getDireccion());
                    proveedor.setEstado(datosActualizados.getEstado());
                    return proveedorRepositorio.save(proveedor);
                })
                .orElse(null);
    }

    // Eliminar proveedor
    @DeleteMapping("/{id}")
    public void eliminarProveedor(@PathVariable Integer id) {
        proveedorRepositorio.deleteById(id);
    }
}
