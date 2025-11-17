package com.eventosperu.backend.servicio;

import com.eventosperu.backend.model.EmailNotificacion;
import com.eventosperu.backend.model.Usuario;
import com.eventosperu.backend.repositorio.EmailNotificacionRepositorio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Service
public class EmailNotificacionServicio {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificacionServicio.class);

    private final EmailNotificacionRepositorio emailNotificacionRepositorio;
    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@eventosperu.com}")
    private String remitente;

    public EmailNotificacionServicio(EmailNotificacionRepositorio emailNotificacionRepositorio,
                                     JavaMailSender mailSender) {
        this.emailNotificacionRepositorio = emailNotificacionRepositorio;
        this.mailSender = mailSender;
    }

    public EmailNotificacion registrarYEnviar(Usuario usuario,
                                              String destinatario,
                                              EmailNotificacion.Tipo tipo,
                                              String asunto,
                                              String cuerpo,
                                              String datosJson) {
        if (!StringUtils.hasText(destinatario)) {
            log.warn("No se registró notificación: destinatario vacío");
            return null;
        }

        EmailNotificacion notificacion = new EmailNotificacion();
        notificacion.setUsuario(usuario);
        notificacion.setDestinatarioEmail(destinatario);
        notificacion.setTipo(tipo);
        notificacion.setAsunto(asunto);
        notificacion.setCuerpo(cuerpo);
        notificacion.setDatosJson(datosJson);
        notificacion.setEstado(EmailNotificacion.Estado.PENDIENTE);

        EmailNotificacion guardada = emailNotificacionRepositorio.save(notificacion);

        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setFrom(remitente);
            mensaje.setTo(destinatario);
            mensaje.setSubject(asunto);
            mensaje.setText(cuerpo);
            mailSender.send(mensaje);

            guardada.setEstado(EmailNotificacion.Estado.ENVIADO);
            guardada.setFechaEnvio(LocalDateTime.now());
            guardada.setMensajeError(null);
        } catch (Exception e) {
            guardada.setEstado(EmailNotificacion.Estado.ERROR);
            guardada.setMensajeError(e.getMessage());
            log.error("Error al enviar correo a {}: {}", destinatario, e.getMessage());
        }

        return emailNotificacionRepositorio.save(guardada);
    }
}
