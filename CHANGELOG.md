# Changelog

Todos los cambios notables de este proyecto se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Pendiente
- Mensajes privados entre participantes.
- Modo oscuro persistente por usuario.
- Internacionalización (i18n) ES/EN.

## [1.0.0] - 2026-09-08

### ✨ Añadido
- **Creación de grupos** con código único (`ULTRA-XXXX`) y código de
  administrador separado (`ADMIN-XXXXXX`).
- **Unirse a grupos** mediante código o enlace compartido.
- **Registro de participantes** con alias secreto y nombre real privado.
- **Códigos personales** hasheados (SHA-256 + salt) para autenticación
  sin contraseñas.
- **Recuperación de acceso** mediante (código grupo + alias + código personal).
- **Chat grupal en tiempo real** vía WebSocket (Socket.IO) con:
  - Mensajes en vivo con auto-scroll.
  - Indicador de mensajes nuevos.
  - Eliminar propios mensajes (admin puede eliminar cualquiera).
  - Anti-spam (5 mensajes / 5 segundos).
  - Límite de 500 caracteres por mensaje.
- **Sistema de adivinanzas** privado con validaciones de backend:
  - No se puede votar por uno mismo.
  - No se ven las respuestas de otros antes de la revelación.
  - Bloqueo automático al llegar la fecha/hora límite.
- **Cuenta regresiva** en vivo hasta la fecha de presentación.
- **Ranking** automático con manejo de empates y medallas 🥇🥈🥉.
- **Revelación animada** con Framer Motion + confeti CSS, botones
  "Revelar siguiente" / "Revelar todo".
- **Resultados personales** con detalle de aciertos/fallos por cada
  participante.
- **Panel de administración** completo:
  - Editar nombre, descripción, fecha y hora del grupo.
  - Cerrar/abrir inscripciones.
  - Iniciar revelación manualmente.
  - Expulsar participantes.
  - Compartir enlace de invitación.
  - Regenerar código de invitación.
- **Datos demo** con un clic desde la landing.
- **Diseño responsive mobile-first** con tema "mystery" (púrpura + dorado).
- **Soporte de zona horaria** por grupo (default `America/Bogota`).
- **Rate limiting** en endpoints sensibles (login, admin login).
- **Web Share API** para compartir enlaces desde móviles.

### 🔒 Seguridad
- Códigos privados hasheados con SHA-256 + salt aleatorio de 16 bytes.
- Cookies HttpOnly, SameSite=Lax para sesiones.
- Nombre real nunca expuesto públicamente antes de la revelación.
- Validaciones de autorización en backend para cada operación sensible.
- No se exponen datos privados en URLs, HTML público o APIs públicas.
