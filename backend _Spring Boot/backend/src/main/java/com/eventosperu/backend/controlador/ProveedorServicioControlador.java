package com.eventosperu.backend.controlador;

import com.eventosperu.backend.model.*;
import com.eventosperu.backend.model.dto.ProveedorServicioRequest;
import com.eventosperu.backend.model.dto.ServicioOpcionRequest;
import com.eventosperu.backend.repositorio.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/proveedor-servicios")
@CrossOrigin(origins = "*")
public class ProveedorServicioControlador {

    @Autowired
    private ProveedorServicioRepositorio proveedorServicioRepositorio;

    @Autowired
    private ProveedorRepositorio proveedorRepositorio;

    @Autowired
    private CatalogoServicioRepositorio catalogoServicioRepositorio;

    @Autowired
    private ServicioOpcionRepositorio servicioOpcionRepositorio;

    /**
     * Lista completa de servicios registrados por proveedores.
     */
    @GetMapping
    public List<ProveedorServicio> listarTodo() {
        return proveedorServicioRepositorio.findAll();
    }

    /**
     * Lista solo servicios visibles al cliente (catalogo ACTIVO y servicio en estado ACTIVO).
     */
    @GetMapping("/visibles")
    public List<ProveedorServicio> listarVisibles() {
        return proveedorServicioRepositorio.findByCatalogoServicio_Estado(CatalogoServicio.EstadoCatalogo.ACTIVO)
                .stream()
                .filter(servicio -> servicio.getEstado() == ProveedorServicio.EstadoProveedorServicio.ACTIVO)
                .toList();
    }

    /**
     * Oferta por proveedor (útil para el panel del proveedor).
     */
    @GetMapping("/proveedor/{idProveedor}")
    public List<ProveedorServicio> listarPorProveedor(@PathVariable Integer idProveedor) {
        Optional<Proveedor> proveedorOpt = proveedorRepositorio.findById(idProveedor);
        if (proveedorOpt.isEmpty()) {
            return List.of();
        }
        return proveedorServicioRepositorio.findByProveedor(proveedorOpt.get());
    }

    /**
     * Registro de la oferta principal del proveedor. Se asocia a un tipo de catálogo y luego se le pueden agregar opciones.
     */
    @PostMapping
    public ProveedorServicio crear(@RequestBody ProveedorServicioRequest request) {
        Optional<Proveedor> proveedorOpt = proveedorRepositorio.findById(request.getIdProveedor());
        Optional<CatalogoServicio> catalogoOpt = catalogoServicioRepositorio.findById(request.getIdCatalogo());

        if (proveedorOpt.isEmpty() || catalogoOpt.isEmpty()) {
            return null;
        }

        ProveedorServicio servicio = new ProveedorServicio();
        servicio.setProveedor(proveedorOpt.get());
        servicio.setCatalogoServicio(catalogoOpt.get());
        servicio.setNombrePublico(request.getNombrePublico());
        servicio.setDescripcionGeneral(request.getDescripcionGeneral());
        servicio.setUrlFoto(request.getUrlFoto());
        return proveedorServicioRepositorio.save(servicio);
    }

    /**
     * Actualiza datos básicos de la oferta del proveedor (no altera el catálogo asociado).
     */
    @PutMapping("/{id}")
    public ProveedorServicio actualizar(@PathVariable Integer id, @RequestBody ProveedorServicioRequest request) {
        Optional<ProveedorServicio> servicioOpt = proveedorServicioRepositorio.findById(id);
        if (servicioOpt.isEmpty()) {
            return null;
        }
        ProveedorServicio servicio = servicioOpt.get();
        servicio.setNombrePublico(request.getNombrePublico());
        servicio.setDescripcionGeneral(request.getDescripcionGeneral());
        servicio.setUrlFoto(request.getUrlFoto());
        return proveedorServicioRepositorio.save(servicio);
    }

    /**
     * Pausa o reactiva una oferta sin perder las opciones configuradas.
     */
    @PutMapping("/{id}/estado")
    public ProveedorServicio cambiarEstado(@PathVariable Integer id, @RequestParam ProveedorServicio.EstadoProveedorServicio estado) {
        Optional<ProveedorServicio> servicioOpt = proveedorServicioRepositorio.findById(id);
        if (servicioOpt.isEmpty()) {
            return null;
        }
        ProveedorServicio servicio = servicioOpt.get();
        servicio.setEstado(estado);
        return proveedorServicioRepositorio.save(servicio);
    }

    /**
     * Opciones/variantes disponibles para una oferta específica.
     */
    @GetMapping("/{id}/opciones")
    public List<ServicioOpcion> listarOpciones(@PathVariable Integer id) {
        Optional<ProveedorServicio> servicioOpt = proveedorServicioRepositorio.findById(id);
        if (servicioOpt.isEmpty()) {
            return List.of();
        }
        return servicioOpcionRepositorio.findByProveedorServicio(servicioOpt.get());
    }

    /**
     * Registrar una nueva variante de servicio.
     */
    @PostMapping("/{id}/opciones")
    public ServicioOpcion crearOpcion(@PathVariable Integer id, @RequestBody ServicioOpcionRequest request) {
        Optional<ProveedorServicio> servicioOpt = proveedorServicioRepositorio.findById(id);
        if (servicioOpt.isEmpty()) {
            return null;
        }
        ProveedorServicio proveedorServicio = servicioOpt.get();
        ServicioOpcion opcion = new ServicioOpcion();
        opcion.setProveedorServicio(proveedorServicio);
        opcion.setNombreOpcion(request.getNombreOpcion());
        opcion.setDescripcion(request.getDescripcion());
        opcion.setPrecio(request.getPrecio());
        opcion.setDuracionMinutos(request.getDuracionMinutos());
        opcion.setStock(request.getStock());
        opcion.setUrlFoto(request.getUrlFoto());
        return servicioOpcionRepositorio.save(opcion);
    }

    /**
     * Actualiza una variante existente.
     */
    @PutMapping("/opciones/{idOpcion}")
    public ServicioOpcion actualizarOpcion(@PathVariable Integer idOpcion, @RequestBody ServicioOpcionRequest request) {
        Optional<ServicioOpcion> opcionOpt = servicioOpcionRepositorio.findById(idOpcion);
        if (opcionOpt.isEmpty()) {
            return null;
        }
        ServicioOpcion opcion = opcionOpt.get();
        opcion.setNombreOpcion(request.getNombreOpcion());
        opcion.setDescripcion(request.getDescripcion());
        opcion.setPrecio(request.getPrecio());
        opcion.setDuracionMinutos(request.getDuracionMinutos());
        opcion.setStock(request.getStock());
        opcion.setUrlFoto(request.getUrlFoto());
        return servicioOpcionRepositorio.save(opcion);
    }

    /**
     * Cambia el estado puntual de una opción (por ejemplo para marcarla como no disponible temporalmente).
     */
    @PutMapping("/opciones/{idOpcion}/estado")
    public ServicioOpcion cambiarEstadoOpcion(@PathVariable Integer idOpcion, @RequestParam ServicioOpcion.EstadoServicioOpcion estado) {
        Optional<ServicioOpcion> opcionOpt = servicioOpcionRepositorio.findById(idOpcion);
        if (opcionOpt.isEmpty()) {
            return null;
        }
        ServicioOpcion opcion = opcionOpt.get();
        opcion.setEstado(estado);
        return servicioOpcionRepositorio.save(opcion);
    }
}
