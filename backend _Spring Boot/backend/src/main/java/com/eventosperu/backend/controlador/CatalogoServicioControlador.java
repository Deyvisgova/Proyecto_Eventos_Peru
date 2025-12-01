package com.eventosperu.backend.controlador;

import com.eventosperu.backend.model.*;
import com.eventosperu.backend.model.dto.ModeracionCatalogoRequest;
import com.eventosperu.backend.model.dto.ActualizarCatalogoServicioRequest;
import com.eventosperu.backend.model.dto.NuevoCatalogoServicioRequest;
import com.eventosperu.backend.repositorio.DetalleReservaRepositorio;
import com.eventosperu.backend.repositorio.CatalogoEventoServicioRepositorio;
import com.eventosperu.backend.repositorio.CatalogoServicioRepositorio;
import com.eventosperu.backend.repositorio.EventoRepositorio;
import com.eventosperu.backend.repositorio.ServicioOpcionRepositorio;
import com.eventosperu.backend.repositorio.ProveedorServicioRepositorio;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/catalogo-servicios")
@CrossOrigin(origins = "*")
public class CatalogoServicioControlador {

    @Autowired
    private CatalogoServicioRepositorio catalogoServicioRepositorio;

    @Autowired
    private CatalogoEventoServicioRepositorio catalogoEventoServicioRepositorio;

    @Autowired
    private EventoRepositorio eventoRepositorio;

    @Autowired
    private ProveedorServicioRepositorio proveedorServicioRepositorio;

    @Autowired
    private ServicioOpcionRepositorio servicioOpcionRepositorio;

    @Autowired
    private DetalleReservaRepositorio detalleReservaRepositorio;

    /**
     * Lista todo el catálogo (se puede filtrar por estado enviando ?estado=ACTIVO/PENDIENTE/RECHAZADO).
     */
    @GetMapping
    public List<CatalogoServicio> listar(@RequestParam(required = false) CatalogoServicio.EstadoCatalogo estado) {
        if (estado != null) {
            return catalogoServicioRepositorio.findByEstado(estado);
        }
        return catalogoServicioRepositorio.findAll();
    }

    /**
     * Cola de tipos propuestos por proveedores pendientes de moderación.
     */
    @GetMapping("/pendientes")
    public List<CatalogoServicio> pendientes() {
        return catalogoServicioRepositorio.findByEstado(CatalogoServicio.EstadoCatalogo.PENDIENTE);
    }

    /**
     * Registro directo de un tipo de servicio por el administrador (queda activo de inmediato).
     */
    @PostMapping("/admin")
    public CatalogoServicio crearComoAdmin(@RequestBody NuevoCatalogoServicioRequest request) {
        CatalogoServicio catalogo = new CatalogoServicio();
        catalogo.setNombre(request.getNombre());
        catalogo.setDescripcion(request.getDescripcion());
        catalogo.setCreadoPor(CatalogoServicio.FuenteCreacion.ADMIN);
        catalogo.setEstado(CatalogoServicio.EstadoCatalogo.ACTIVO);
        catalogo.setFechaRevision(LocalDateTime.now());
        catalogo = catalogoServicioRepositorio.save(catalogo);
        sincronizarEventos(catalogo, request.getIdEventos());
        return catalogo;
    }

    /**
     * Registro de un nuevo tipo solicitado por un proveedor. Queda en estado PENDIENTE hasta que el admin decida.
     */
    @PostMapping("/proveedor")
    public CatalogoServicio crearComoProveedor(@RequestBody NuevoCatalogoServicioRequest request) {
        CatalogoServicio catalogo = new CatalogoServicio();
        catalogo.setNombre(request.getNombre());
        catalogo.setDescripcion(request.getDescripcion());
        catalogo.setCreadoPor(CatalogoServicio.FuenteCreacion.PROVEEDOR);
        catalogo.setIdProveedorSolicitante(request.getIdProveedorSolicitante());
        catalogo.setEstado(CatalogoServicio.EstadoCatalogo.PENDIENTE);
        catalogo = catalogoServicioRepositorio.save(catalogo);
        sincronizarEventos(catalogo, request.getIdEventos());
        return catalogo;
    }

    /**
     * Lista las propuestas de tipos realizadas por un proveedor específico.
     */
    @GetMapping("/proveedor/{idProveedor}")
    public List<CatalogoServicio> propuestasPorProveedor(@PathVariable Integer idProveedor) {
        return catalogoServicioRepositorio.findByCreadoPorAndIdProveedorSolicitante(
                CatalogoServicio.FuenteCreacion.PROVEEDOR,
                idProveedor
        );
    }

    /**
     * Permite al administrador actualizar la información básica de un tipo de servicio.
     */
    @PutMapping("/{id}")
    public CatalogoServicio actualizar(@PathVariable Integer id, @RequestBody ActualizarCatalogoServicioRequest request) {
        Optional<CatalogoServicio> catalogoOpt = catalogoServicioRepositorio.findById(id);
        if (catalogoOpt.isEmpty()) {
            return null;
        }

        CatalogoServicio catalogo = catalogoOpt.get();
        if (request.getNombre() != null) {
            catalogo.setNombre(request.getNombre());
        }
        if (request.getDescripcion() != null) {
            catalogo.setDescripcion(request.getDescripcion());
        }
        if (request.getEstado() != null) {
            catalogo.setEstado(request.getEstado());
        }
        CatalogoServicio actualizado = catalogoServicioRepositorio.save(catalogo);

        if (request.getIdEventos() != null) {
            sincronizarEventos(actualizado, request.getIdEventos());
        }

        return actualizado;
    }

    /**
     * Permite al proveedor actualizar una propuesta rechazada y reenviarla a revisión.
     */
    @PutMapping("/proveedor/{idProveedor}/{idCatalogo}")
    public CatalogoServicio actualizarPropuesta(
            @PathVariable Integer idProveedor,
            @PathVariable Integer idCatalogo,
            @RequestBody NuevoCatalogoServicioRequest request
    ) {
        Optional<CatalogoServicio> catalogoOpt = catalogoServicioRepositorio.findById(idCatalogo);
        if (catalogoOpt.isEmpty()) {
            return null;
        }

        CatalogoServicio catalogo = catalogoOpt.get();
        boolean esDelProveedor = idProveedor.equals(catalogo.getIdProveedorSolicitante())
                && catalogo.getCreadoPor() == CatalogoServicio.FuenteCreacion.PROVEEDOR;

        if (!esDelProveedor) {
            return null;
        }

        catalogo.setNombre(request.getNombre());
        catalogo.setDescripcion(request.getDescripcion());
        catalogo.setEstado(CatalogoServicio.EstadoCatalogo.PENDIENTE);
        catalogo.setMotivoRechazo(null);
        catalogo.setFechaRevision(null);
        catalogo.setIdAdminRevisor(null);
        catalogo.setFechaCreacion(catalogo.getFechaCreacion() != null ? catalogo.getFechaCreacion() : LocalDateTime.now());
        catalogo = catalogoServicioRepositorio.save(catalogo);
        sincronizarEventos(catalogo, request.getIdEventos());
        return catalogo;
    }

    /**
     * El administrador aprueba un tipo propuesto. Todas las ofertas que dependan de él pasarán a ser visibles
     * porque ahora el catálogo tiene estado ACTIVO.
     */
    @PutMapping("/{id}/aprobar")
    public CatalogoServicio aprobar(@PathVariable Integer id, @RequestBody(required = false) ModeracionCatalogoRequest request) {
        Optional<CatalogoServicio> catalogoOpt = catalogoServicioRepositorio.findById(id);
        if (catalogoOpt.isEmpty()) {
            return null;
        }
        CatalogoServicio catalogo = catalogoOpt.get();
        catalogo.setEstado(CatalogoServicio.EstadoCatalogo.ACTIVO);
        catalogo.setFechaRevision(LocalDateTime.now());
        if (request != null) {
            catalogo.setIdAdminRevisor(request.getIdAdminRevisor());
        }
        catalogo.setMotivoRechazo(null);
        return catalogoServicioRepositorio.save(catalogo);
    }

    /**
     * El administrador rechaza el tipo propuesto y deja constancia del motivo para que el proveedor lo vea.
     */
    @PutMapping("/{id}/rechazar")
    public CatalogoServicio rechazar(@PathVariable Integer id, @RequestBody ModeracionCatalogoRequest request) {
        Optional<CatalogoServicio> catalogoOpt = catalogoServicioRepositorio.findById(id);
        if (catalogoOpt.isEmpty()) {
            return null;
        }
        CatalogoServicio catalogo = catalogoOpt.get();
        catalogo.setEstado(CatalogoServicio.EstadoCatalogo.RECHAZADO);
        catalogo.setFechaRevision(LocalDateTime.now());
        catalogo.setMotivoRechazo(request != null ? request.getMotivoRechazo() : null);
        if (request != null) {
            catalogo.setIdAdminRevisor(request.getIdAdminRevisor());
        }
        return catalogoServicioRepositorio.save(catalogo);
    }

    /**
     * Relaciona un tipo de servicio con un evento específico.
     */
    @PostMapping("/{idCatalogo}/eventos/{idEvento}")
    public CatalogoEventoServicio vincularEvento(@PathVariable Integer idCatalogo, @PathVariable Integer idEvento) {
        Optional<CatalogoServicio> catalogoOpt = catalogoServicioRepositorio.findById(idCatalogo);
        Optional<Evento> eventoOpt = eventoRepositorio.findById(idEvento);

        if (catalogoOpt.isEmpty() || eventoOpt.isEmpty()) {
            return null;
        }

        CatalogoEventoServicio relacion = new CatalogoEventoServicio();
        relacion.setCatalogoServicio(catalogoOpt.get());
        relacion.setEvento(eventoOpt.get());
        return catalogoEventoServicioRepositorio.save(relacion);
    }

    /**
     * Devuelve los tipos de servicio disponibles para un evento (solo los que estén ACTIVOS).
     */
    @GetMapping("/eventos/{idEvento}")
    public List<CatalogoServicio> listarPorEvento(@PathVariable Integer idEvento) {
        Optional<Evento> eventoOpt = eventoRepositorio.findById(idEvento);
        if (eventoOpt.isEmpty()) {
            return List.of();
        }
        return catalogoEventoServicioRepositorio.findByEvento(eventoOpt.get())
                .stream()
                .map(CatalogoEventoServicio::getCatalogoServicio)
                .filter(c -> c.getEstado() == CatalogoServicio.EstadoCatalogo.ACTIVO)
                .toList();
    }

    /**
     * Devuelve el mapa completo de relaciones catálogo-evento para que el frontend sincronice filtros.
     */
    @GetMapping("/eventos-mapa")
    public List<CatalogoEventoServicio> mapaCatalogoEvento() {
        return catalogoEventoServicioRepositorio.findAll();
    }

    /**
     * Elimina un tipo de servicio y sus relaciones con eventos.
     */
    @DeleteMapping("/{id}")
    @Transactional
    public void eliminar(@PathVariable Integer id) {
        Optional<CatalogoServicio> catalogoOpt = catalogoServicioRepositorio.findById(id);
        if (catalogoOpt.isEmpty()) {
            return;
        }
        CatalogoServicio catalogo = catalogoOpt.get();

        proveedorServicioRepositorio.findByCatalogoServicio(catalogo).forEach(servicio -> {
            servicioOpcionRepositorio.findByProveedorServicio(servicio).forEach(opcion -> {
                detalleReservaRepositorio.deleteAll(detalleReservaRepositorio.findByOpcion(opcion));
                servicioOpcionRepositorio.delete(opcion);
            });
            proveedorServicioRepositorio.delete(servicio);
        });

        catalogoEventoServicioRepositorio.deleteByCatalogoServicio(catalogo);
        catalogoServicioRepositorio.delete(catalogo);
    }

    private void sincronizarEventos(CatalogoServicio catalogo, List<Integer> idEventos) {
        catalogoEventoServicioRepositorio.deleteByCatalogoServicio(catalogo);
        if (idEventos == null || idEventos.isEmpty()) {
            return;
        }

        List<Evento> eventos = eventoRepositorio.findAllById(idEventos);
        eventos.forEach(evento -> {
            CatalogoEventoServicio relacion = new CatalogoEventoServicio();
            relacion.setCatalogoServicio(catalogo);
            relacion.setEvento(evento);
            catalogoEventoServicioRepositorio.save(relacion);
        });
    }
}
