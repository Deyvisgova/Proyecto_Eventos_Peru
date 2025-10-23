-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 23-10-2025 a las 00:07:56
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
-- Estructura de tabla para la tabla `correos_enviados`
--

CREATE TABLE `correos_enviados` (
  `id_correo` int(11) NOT NULL,
  `tipo` enum('RECUPERACION','RESERVA_CONFIRMADA') NOT NULL,
  `destinatario` varchar(120) NOT NULL,
  `asunto` varchar(150) NOT NULL,
  `cuerpo` text NOT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `id_reserva` int(11) DEFAULT NULL,
  `enviado_en` timestamp NULL DEFAULT NULL,
  `estado` enum('ENVIADO','ERROR') NOT NULL DEFAULT 'ENVIADO',
  `error_detalle` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_reserva`
--

CREATE TABLE `detalle_reserva` (
  `id_detalle` int(11) NOT NULL,
  `id_reserva` int(11) NOT NULL,
  `id_servicio` int(11) NOT NULL,
  `cantidad` int(11) DEFAULT 1,
  `precio_unitario` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `detalle_reserva`
--

INSERT INTO `detalle_reserva` (`id_detalle`, `id_reserva`, `id_servicio`, `cantidad`, `precio_unitario`) VALUES
(1, 1, 1, 1, 20),
(2, 1, 2, 1, 50);

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
  `estado` enum('PENDIENTE','APROBADO','RECHAZADO') DEFAULT 'PENDIENTE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `proveedores`
--

INSERT INTO `proveedores` (`id_proveedor`, `id_usuario`, `nombre_empresa`, `ruc`, `direccion`, `estado`) VALUES
(1, 22, 'recuerdos', '10701661601', 'urb .los jardines', 'APROBADO');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reservas`
--

CREATE TABLE `reservas` (
  `id_reserva` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `id_proveedor` int(11) NOT NULL,
  `fecha_evento` date NOT NULL,
  `estado` enum('PENDIENTE','CONFIRMADA','CANCELADA') DEFAULT 'PENDIENTE',
  `fecha_reserva` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `reservas`
--

INSERT INTO `reservas` (`id_reserva`, `id_cliente`, `id_proveedor`, `fecha_evento`, `estado`, `fecha_reserva`) VALUES
(1, 23, 1, '2025-10-15', 'CONFIRMADA', '2025-10-14 17:47:28');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicios`
--

CREATE TABLE `servicios` (
  `id_servicio` int(11) NOT NULL,
  `id_proveedor` int(11) NOT NULL,
  `id_evento` int(11) NOT NULL,
  `nombre_servicio` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` double NOT NULL,
  `url_foto` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `servicios`
--

INSERT INTO `servicios` (`id_servicio`, `id_proveedor`, `id_evento`, `nombre_servicio`, `descripcion`, `precio`, `url_foto`) VALUES
(1, 1, 1, 'Comida', 'Se brinda Arroz con pollo', 10, NULL),
(2, 1, 1, 'Decoración', 'se decora por metro cuadrado', 50, NULL),
(3, 1, 1, 'Hora loca ', 'se brinda 30 minutos de hora loca ', 30, NULL);

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

--
-- Volcado de datos para la tabla `tokens_recuperacion`
--

INSERT INTO `tokens_recuperacion` (`id_token`, `id_usuario`, `token`, `expira_en`, `usado`, `creado_en`) VALUES
(7, 33, '3ae555d6-6cdc-4f44-85f7-f8a208ef13e3', '2025-10-21 16:18:41', 1, '2025-10-21 21:08:41');

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
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `email`, `password`, `rol`, `fecha_registro`) VALUES
(18, 'carlosS', 'carlos@gmail.com', '$2a$10$tfdQKY6lMVWiljgkXS/JgukvaPxQrcHwvMCMK6mVxmCbeNgLK6iFa', 'ADMIN', '2025-10-13 10:34:21'),
(19, 'Pablo', 'pablo@gmail.com', '$2a$10$sNsLL3C8MVeGaUfKlT3pEOLtsF95b.r1iO1DrxMZqWTFZjNqxSe.6', 'ADMIN', '2025-10-14 12:30:20'),
(22, 'Proveedor', 'proveedor@gmail.com', '$2a$10$WOzwtoWCMVf89mp14gIvsOvz9g0Z7MvxA6.7dlbMbgXpqgvPYAe6O', 'PROVEEDOR', '2025-10-14 21:45:00'),
(23, 'Cliente', 'cliente@gmail.com', '$2a$10$bR7u4ZCb8dlWcwEIoOVcY.FjXP0Ckx0D7sO3AekLADrwbtZX5UITC', 'CLIENTE', '2025-10-14 16:47:31'),
(24, 'Administrador', 'administrador@gmail.com', '$2a$10$hqAYMy73ZOXhS9tpjpT3XeTPb4QtEchdHjjyccH7hwn1vigezzH/.', 'ADMIN', '2025-10-14 21:48:02'),
(26, 'Dilser', 'dil1995@gmail.com', '$2a$10$/pIC276eiLmnjE8qLUYmDejUvJtBLghrV8gpvrpmgPa.Of7esk4La', 'CLIENTE', '2025-10-17 05:47:23'),
(27, 'papa gova', 'papa@gmail.com', '$2a$10$bBo723dTaJH1yI/m8Q8BM.svnkzUxrJ6Mt1YNA7.Clm.njp65BU1O', 'CLIENTE', '2025-10-20 14:40:21'),
(33, 'Dilser Cabanillas rodriguez', 'CABANILLAS.ADM@GMAIL.COM', '$2a$10$cjiiBnH8IC.vquN9QMeQt.4TYfU8rv7zjz02THmEu3dT8hc.oQEHy', 'CLIENTE', '2025-10-21 21:08:12');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `correos_enviados`
--
ALTER TABLE `correos_enviados`
  ADD PRIMARY KEY (`id_correo`),
  ADD KEY `fk_ce_usuario` (`id_usuario`),
  ADD KEY `fk_ce_reserva` (`id_reserva`);

--
-- Indices de la tabla `detalle_reserva`
--
ALTER TABLE `detalle_reserva`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `id_reserva` (`id_reserva`),
  ADD KEY `id_servicio` (`id_servicio`);

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
-- Indices de la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD PRIMARY KEY (`id_reserva`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `id_proveedor` (`id_proveedor`);

--
-- Indices de la tabla `servicios`
--
ALTER TABLE `servicios`
  ADD PRIMARY KEY (`id_servicio`),
  ADD KEY `id_proveedor` (`id_proveedor`),
  ADD KEY `id_evento` (`id_evento`);

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
-- AUTO_INCREMENT de la tabla `correos_enviados`
--
ALTER TABLE `correos_enviados`
  MODIFY `id_correo` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `detalle_reserva`
--
ALTER TABLE `detalle_reserva`
  MODIFY `id_detalle` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `eventos`
--
ALTER TABLE `eventos`
  MODIFY `id_evento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  MODIFY `id_proveedor` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `reservas`
--
ALTER TABLE `reservas`
  MODIFY `id_reserva` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `servicios`
--
ALTER TABLE `servicios`
  MODIFY `id_servicio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `tokens_recuperacion`
--
ALTER TABLE `tokens_recuperacion`
  MODIFY `id_token` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `correos_enviados`
--
ALTER TABLE `correos_enviados`
  ADD CONSTRAINT `fk_ce_reserva` FOREIGN KEY (`id_reserva`) REFERENCES `reservas` (`id_reserva`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ce_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL;

--
-- Filtros para la tabla `detalle_reserva`
--
ALTER TABLE `detalle_reserva`
  ADD CONSTRAINT `detalle_reserva_ibfk_1` FOREIGN KEY (`id_reserva`) REFERENCES `reservas` (`id_reserva`),
  ADD CONSTRAINT `detalle_reserva_ibfk_2` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id_servicio`);

--
-- Filtros para la tabla `proveedores`
--
ALTER TABLE `proveedores`
  ADD CONSTRAINT `proveedores_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `reservas`
--
ALTER TABLE `reservas`
  ADD CONSTRAINT `reservas_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `reservas_ibfk_2` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`);

--
-- Filtros para la tabla `servicios`
--
ALTER TABLE `servicios`
  ADD CONSTRAINT `servicios_ibfk_1` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedores` (`id_proveedor`),
  ADD CONSTRAINT `servicios_ibfk_2` FOREIGN KEY (`id_evento`) REFERENCES `eventos` (`id_evento`);

--
-- Filtros para la tabla `tokens_recuperacion`
--
ALTER TABLE `tokens_recuperacion`
  ADD CONSTRAINT `fk_tr_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
