-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 16-11-2025 a las 13:59:49
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `eventos_peru`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `catalogo_evento_servicio`
--

CREATE TABLE `catalogo_evento_servicio` (
  `id_catalogo_evento` int(11) NOT NULL,
  `id_evento` int(11) NOT NULL,
  `id_catalogo` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `catalogo_servicios`
--

CREATE TABLE `catalogo_servicios` (
  `id_catalogo` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` enum('ACTIVO','PENDIENTE','RECHAZADO') DEFAULT 'PENDIENTE',
  `creado_por` enum('ADMIN','PROVEEDOR') DEFAULT 'ADMIN',
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_revision` datetime DEFAULT NULL,
  `id_admin_revisor` int(11) DEFAULT NULL,
  `motivo_rechazo` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_reserva`
--

CREATE TABLE `detalle_reserva` (
  `id_detalle` int(11) NOT NULL,
  `id_reserva` int(11) NOT NULL,
  `cantidad` int(11) DEFAULT 1,
  `precio_unitario` double NOT NULL,
  `id_opcion` int(11) NOT NULL,
  `id_servicio` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `email_notificacion`
--

CREATE TABLE `email_notificacion` (
  `id_email` int(11) NOT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `destinatario_email` varchar(200) NOT NULL,
  `tipo` enum('PROVEEDOR_REGISTRO_PENDIENTE','PROVEEDOR_ESTADO_APROBADO','PROVEEDOR_ESTADO_RECHAZADO','CLIENTE_RESERVA_DETALLE','TIPO_SERVICIO_PROPUESTO','TIPO_SERVICIO_APROBADO','TIPO_SERVICIO_RECHAZADO') NOT NULL,
  `asunto` varchar(200) NOT NULL,
  `cuerpo` text NOT NULL,
  `datos_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos_json`)),
  `estado` enum('PENDIENTE','ENVIADO','ERROR') DEFAULT 'PENDIENTE',
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_envio` datetime DEFAULT NULL,
  `mensaje_error` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `eventos`
--

CREATE TABLE `eventos` (
  `id_evento` int(11) NOT NULL,
  `nombre_evento` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `eventos`
--

INSERT INTO `eventos` (`id_evento`, `nombre_evento`) VALUES
(1, 'Cumpleaños'),
(2, 'Matrimonio'),
(3, 'Aniversario');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedores`
--

CREATE TABLE `proveedores` (
  `id_proveedor` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `nombre_empresa` varchar(150) NOT NULL,
  `ruc` varchar(20) NOT NULL,
  `direccion` varchar(200) NOT NULL,
  `estado` enum('PENDIENTE','APROBADO','RECHAZADO') DEFAULT 'PENDIENTE',
  `logo_url` varchar(255) DEFAULT NULL,
  `fecha_revision` datetime DEFAULT NULL,
  `id_admin_revisor` int(11) DEFAULT NULL,
  `motivo_rechazo` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `proveedores`
--

INSERT INTO `proveedores` (`id_proveedor`, `id_usuario`, `nombre_empresa`, `ruc`, `direccion`, `estado`, `logo_url`, `fecha_revision`, `id_admin_revisor`, `motivo_rechazo`) VALUES
(1, 22, 'recuerdos', '10701661601', 'urb .los jardines', 'RECHAZADO', NULL, NULL, NULL, NULL),
(2, 23, 'AUTOMOTRIZ J & V MOTOR\'S S.A.C.', '20602975623', 'AV. PROCERES DE LA INDEPENDEN NRO. 3437 INT. B  DPTO. 2DO, LIMA - LIMA - SAN JUAN DE LURIGANCHO', 'RECHAZADO', NULL, NULL, NULL, NULL),
(3, 35, 'CONECTATE AL MUNDO E.I.R.L.', '20494020824', 'CAR. BAÑOS TERMALES MZ. 30 LT. 13 SEC. SAN MATEO, SAN MARTIN - MOYOBAMBA - MOYOBAMBA', 'RECHAZADO', NULL, NULL, NULL, NULL),
(4, 36, 'EVENTOS CORPORATIVOS R & R E.I.R.L.', '20602218679', 'MELITON CARBAJAL NRO. 293, LIMA - LIMA - ATE', 'RECHAZADO', NULL, NULL, NULL, NULL),
(6, 37, 'TODO TECNOLOGIA PERU SOCIEDAD ANONIMA CERRADA - TODOTEC PERU S.A.C.', '20605542868', 'AV. MANUEL OLGUIN NRO. 209, LIMA - LIMA - SANTIAGO DE SURCO', 'PENDIENTE', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedor_servicio`
--

CREATE TABLE `proveedor_servicio` (
  `id_proveedor_servicio` int(11) NOT NULL,
  `id_proveedor` int(11) NOT NULL,
  `id_catalogo` int(11) NOT NULL,
  `nombre_publico` varchar(150) NOT NULL,
  `descripcion_general` text DEFAULT NULL,
  `url_foto` varchar(255) DEFAULT NULL,
  `estado` enum('ACTIVO','PAUSADO') DEFAULT 'ACTIVO',
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedor_servicio_tag`
--

CREATE TABLE `proveedor_servicio_tag` (
  `id_proveedor_servicio` int(11) NOT NULL,
  `id_tag` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reservas`
--

CREATE TABLE `reservas` (
  `id_reserva` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `fecha_evento` date NOT NULL,
  `estado` enum('PENDIENTE','CONFIRMADA','CANCELADA') DEFAULT 'PENDIENTE',
  `fecha_reserva` timestamp NOT NULL DEFAULT current_timestamp(),
  `id_proveedor` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicio_opcion`
--

CREATE TABLE `servicio_opcion` (
  `id_opcion` int(11) NOT NULL,
  `id_proveedor_servicio` int(11) NOT NULL,
  `nombre_opcion` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `duracion_minutos` int(11) DEFAULT NULL,
  `stock` int(11) DEFAULT NULL,
  `url_foto` varchar(255) DEFAULT NULL,
  `estado` enum('ACTIVO','NO_DISPONIBLE') DEFAULT 'ACTIVO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tags`
--

CREATE TABLE `tags` (
  `id_tag` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tokens_recuperacion`
--

CREATE TABLE `tokens_recuperacion` (
  `id_token` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expira_en` datetime NOT NULL,
  `usado` tinyint(1) NOT NULL DEFAULT 0,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('ADMIN','CLIENTE','PROVEEDOR') NOT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `telefono` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `email`, `password`, `rol`, `fecha_registro`, `telefono`) VALUES
(22, 'Proveedor', 'proveedor@gmail.com', '$2a$10$WOzwtoWCMVf89mp14gIvsOvz9g0Z7MvxA6.7dlbMbgXpqgvPYAe6O', 'CLIENTE', '2025-10-14 21:45:00', NULL),
(23, 'Cliente', 'cliente@gmail.com', '$2a$10$bR7u4ZCb8dlWcwEIoOVcY.FjXP0Ckx0D7sO3AekLADrwbtZX5UITC', 'CLIENTE', '2025-10-14 16:47:31', NULL),
(24, 'Administrador', 'administrador@gmail.com', '$2a$10$hqAYMy73ZOXhS9tpjpT3XeTPb4QtEchdHjjyccH7hwn1vigezzH/.', 'ADMIN', '2025-10-14 21:48:02', NULL),
(26, 'Dilser', 'dil1995@gmail.com', '$2a$10$/pIC276eiLmnjE8qLUYmDejUvJtBLghrV8gpvrpmgPa.Of7esk4La', 'CLIENTE', '2025-10-17 05:47:23', NULL),
(27, 'papa gova', 'papa@gmail.com', '$2a$10$bBo723dTaJH1yI/m8Q8BM.svnkzUxrJ6Mt1YNA7.Clm.njp65BU1O', 'CLIENTE', '2025-10-20 14:40:21', NULL),
(35, 'cliente Ramirez', 'clientee@gmail.com', '$2a$10$EpYfGxZE2hIFyJQ8sDFDMu.vpNkraGFQrJRhxeRnqlRLGfOOo8.s.', 'CLIENTE', '2025-10-31 05:03:24', NULL),
(36, 'ludith Farro Silva', 'ludizitacancer03@gmail.com', '$2a$10$HNgIqOb4UiYwphE2EV.Ph.q1v7AghW14xEV7GkgGkmi/7QllOsZbS', 'CLIENTE', '2025-11-05 19:57:31', NULL),
(37, 'Carlos el mozandero', 'carlitos@gmail.com', '$2a$10$dKJLXv1cO.2FwQ5yfQ5i.O8cXTaFE1g0Q6b2Ns5m2SRjLtwbPSL7u', 'CLIENTE', '2025-11-06 15:08:38', NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `catalogo_evento_servicio`
--
ALTER TABLE `catalogo_evento_servicio`
  ADD PRIMARY KEY (`id_catalogo_evento`),
  ADD KEY `id_evento` (`id_evento`),
  ADD KEY `id_catalogo` (`id_catalogo`);

--
-- Indices de la tabla `catalogo_servicios`
--
ALTER TABLE `catalogo_servicios`
  ADD PRIMARY KEY (`id_catalogo`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `detalle_reserva`
--
ALTER TABLE `detalle_reserva`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `id_reserva` (`id_reserva`),
  ADD KEY `fk_detalle_opcion` (`id_opcion`),
  ADD KEY `FKoj3v6c8wscwbjwwe4urglk56e` (`id_servicio`);

--
-- Indices de la tabla `email_notificacion`
--
ALTER TABLE `email_notificacion`
  ADD PRIMARY KEY (`id_email`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `eventos`
--
ALTER TABLE `eventos`
  ADD PRIMARY KEY (`id_evento`);

--
-- Indices de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  ADD PRIMARY KEY (`id_proveedor`),
  ADD UNIQUE KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `proveedor_servicio`
--
ALTER TABLE `proveedor_servicio`
  ADD PRIMARY KEY (`id_proveedor_servicio`),
  ADD KEY `id_proveedor` (`id_proveedor`),
  ADD KEY `id_catalogo` (`id_catalogo`);

--
-- Indices de la tabla `proveedor_servicio_tag`
--
ALTER TABLE `proveedor_servicio_tag`
  ADD PRIMARY KEY (`id_proveedor_servicio`,`id_tag`),
  ADD KEY `id_tag` (`id_tag`);

--
-- Indices de la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD PRIMARY KEY (`id_reserva`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `FK8qpftoyr7k6wd1kcfe329dieq` (`id_proveedor`);

--
-- Indices de la tabla `servicio_opcion`
--
ALTER TABLE `servicio_opcion`
  ADD PRIMARY KEY (`id_opcion`),
  ADD KEY `id_proveedor_servicio` (`id_proveedor_servicio`);

--
-- Indices de la tabla `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`id_tag`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `tokens_recuperacion`
--
ALTER TABLE `tokens_recuperacion`
  ADD PRIMARY KEY (`id_token`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `fk_tr_usuario` (`id_usuario`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `catalogo_evento_servicio`
--
ALTER TABLE `catalogo_evento_servicio`
  MODIFY `id_catalogo_evento` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `catalogo_servicios`
--
ALTER TABLE `catalogo_servicios`
  MODIFY `id_catalogo` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `detalle_reserva`
--
ALTER TABLE `detalle_reserva`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `email_notificacion`
--
ALTER TABLE `email_notificacion`
  MODIFY `id_email` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `eventos`
--
ALTER TABLE `eventos`
  MODIFY `id_evento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  MODIFY `id_proveedor` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `proveedor_servicio`
--
ALTER TABLE `proveedor_servicio`
  MODIFY `id_proveedor_servicio` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `reservas`
--
ALTER TABLE `reservas`
  MODIFY `id_reserva` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `servicio_opcion`
--
ALTER TABLE `servicio_opcion`
  MODIFY `id_opcion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tags`
--
ALTER TABLE `tags`
  MODIFY `id_tag` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tokens_recuperacion`
--
ALTER TABLE `tokens_recuperacion`
  MODIFY `id_token` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `catalogo_evento_servicio`
--
ALTER TABLE `catalogo_evento_servicio`
  ADD CONSTRAINT `catalogo_evento_servicio_ibfk_1` FOREIGN KEY (`id_evento`) REFERENCES `eventos` (`id_evento`),
  ADD CONSTRAINT `catalogo_evento_servicio_ibfk_2` FOREIGN KEY (`id_catalogo`) REFERENCES `catalogo_servicios` (`id_catalogo`);

--
-- Filtros para la tabla `detalle_reserva`
--
ALTER TABLE `detalle_reserva`
  ADD CONSTRAINT `FKoj3v6c8wscwbjwwe4urglk56e` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id_servicio`),
  ADD CONSTRAINT `detalle_reserva_ibfk_1` FOREIGN KEY (`id_reserva`) REFERENCES `reservas` (`id_reserva`),
  ADD CONSTRAINT `fk_detalle_opcion` FOREIGN KEY (`id_opcion`) REFERENCES `servicio_opcion` (`id_opcion`);

--
-- Filtros para la tabla `email_notificacion`
--
ALTER TABLE `email_notificacion`
  ADD CONSTRAINT `email_notificacion_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `proveedores`
--
ALTER TABLE `proveedores`
  ADD CONSTRAINT `proveedores_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `proveedor_servicio`
--
ALTER TABLE `proveedor_servicio`
  ADD CONSTRAINT `proveedor_servicio_ibfk_1` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`),
  ADD CONSTRAINT `proveedor_servicio_ibfk_2` FOREIGN KEY (`id_catalogo`) REFERENCES `catalogo_servicios` (`id_catalogo`);

--
-- Filtros para la tabla `proveedor_servicio_tag`
--
ALTER TABLE `proveedor_servicio_tag`
  ADD CONSTRAINT `proveedor_servicio_tag_ibfk_1` FOREIGN KEY (`id_proveedor_servicio`) REFERENCES `proveedor_servicio` (`id_proveedor_servicio`),
  ADD CONSTRAINT `proveedor_servicio_tag_ibfk_2` FOREIGN KEY (`id_tag`) REFERENCES `tags` (`id_tag`);

--
-- Filtros para la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD CONSTRAINT `FK8qpftoyr7k6wd1kcfe329dieq` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`),
  ADD CONSTRAINT `reservas_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `servicio_opcion`
--
ALTER TABLE `servicio_opcion`
  ADD CONSTRAINT `servicio_opcion_ibfk_1` FOREIGN KEY (`id_proveedor_servicio`) REFERENCES `proveedor_servicio` (`id_proveedor_servicio`);

--
-- Filtros para la tabla `tokens_recuperacion`
--
ALTER TABLE `tokens_recuperacion`
  ADD CONSTRAINT `fk_tr_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
