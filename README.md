# 🕵️ Amigos Ultrasecretos

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Made with Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2d3748?logo=prisma)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io)](https://socket.io/)

> ¿Crees saber quién se esconde detrás de cada alias? 🎭
>
> Aplicación web completa para organizar juegos de **Amigos Secretos /
> Ultrasecretos**. Cada participante elige un alias secreto, chatea en tiempo
> real e intenta descubrir quién está detrás de cada alias antes de la gran
> revelación.
>
> **Sin cuentas. Sin contraseñas. Solo secretos.**

---

## 📸 Capturas

| Landing | Crear grupo | Dashboard |
| :----: | :----: | :----: |
| ![Landing](./docs/screenshots/landing.png) | ![Crear](./docs/screenshots/create.png) | ![Dashboard](./docs/screenshots/dashboard.png) |

---

## ✨ Características

- 🔐 **Sin registro de usuarios** — acceso mediante códigos privados personales.
- 🎭 **Creación de grupos** con código único y enlace para compartir.
- 🛡️ **Códigos seguros** — grupo, personal y de administrador, todos hasheados
  (SHA-256 + salt) en base de datos.
- 💬 **Chat grupal en tiempo real** (WebSocket + Socket.IO).
- 🕵️ **Sistema de adivinanzas** privado y validado en backend.
- ⏳ **Cuenta regresiva en vivo** hasta la fecha de revelación.
- 🔒 **Bloqueo automático** de respuestas al llegar la fecha/hora.
- 🏆 **Ranking** automático con manejo de empates y medallas.
- 🎉 **Revelación animada** con confeti y transiciones suaves.
- ⚙️ **Panel de administración** completo: configuración, expulsar,
  forzar revelación, regenerar código, etc.
- 📱 **Mobile-first** y responsive (iPhone, Android, tablet, desktop).
- 🎮 **Modo demo** con un clic desde la landing.

---

## 🚀 Quick Start

### Requisitos

- [Node.js](https://nodejs.org/) 18+ o [Bun](https://bun.sh) 1.0+
- SQLite (incluido por defecto; para producción ver [Despliegue](#-despliegue))

### Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/TU_USUARIO/amigos-ultrasecretos.git
cd amigos-ultrasecretos

# 2. Instala dependencias
bun install

# 3. Configura variables de entorno
cp .env.example .env
# (el .env por defecto ya apunta a SQLite local, no necesitas cambiar nada)

# 4. Inicializa la base de datos
bun run db:push

# 5. ¡Arranca!
bun run dev
```

Abre <http://localhost:3000> y verás la landing. Para probar todo en un
clic, pulsa **"🎮 Crear grupo demo"**.

### Variables de entorno

| Variable         | Descripción                                  | Default                          |
| ---------------- | -------------------------------------------- | -------------------------------- |
| `DATABASE_URL`   | URL de conexión a la base de datos           | `file:./db/custom.db` (SQLite)   |
| `PORT`           | Puerto del servidor Next.js (opcional)      | `3000`                           |
| `NEXT_PUBLIC_BASE_URL` | URL pública canónica (opcional)        | _deriva del request_             |

Ver [`.env.example`](./.env.example) para ejemplos de Postgres / MySQL.

---

## 🧪 Probar la app

### Modo demo

1. En la landing, haz clic en **"🎮 Crear grupo demo"**.
2. Verás un panel con el grupo creado, los 5 participantes ficticios
   (El Zorro 🦊, La Rana 🐸, El Misterioso 🎩, El Fantasma 👻, El León 🦁)
   y sus códigos personales, más el código de administrador.
3. Pulsa **"Entrar al demo"** e inicia sesión con cualquiera de los códigos
   personales.

El demo incluye:
- 8 mensajes pre-cargados en el chat
- Adivinanzas pre-cargadas para cada participante
- Fecha de revelación 2 horas en el futuro (puedes forzarla desde el panel admin)

### Probar la revelación manualmente

1. Entra como administrador: enlace **Admin** del footer → código del grupo +
   código admin.
2. Pestaña **Resumen** → botón **"Iniciar revelación"**.
3. Vuelve al dashboard como participante y entra en **Revelación** y
   **Ranking**.

---

## 🗺️ Rutas

La app usa **hash routing** en una sola ruta Next.js (`/`):

| Ruta                | Descripción                             |
| ------------------- | --------------------------------------- |
| `#/`                | Landing page                            |
| `#/create`          | Crear grupo                             |
| `#/join`            | Buscar grupo por código                 |
| `#/join/:code`      | Unirse a un grupo específico            |
| `#/login`           | Recuperar acceso (alias + código)       |
| `#/group/:code`     | Dashboard del grupo (requiere sesión)   |
| `#/admin`           | Login de administrador                  |
| `#/admin/:code`     | Panel de administración                 |

---

## 🏗️ Arquitectura

```
.
├── prisma/
│   └── schema.prisma           # Group, Participant, Message, Guess
├── src/
│   ├── app/
│   │   ├── api/                # API routes (Next.js Route Handlers)
│   │   │   ├── groups/         # Crear y gestionar grupos
│   │   │   ├── auth/           # Login de participantes y admin
│   │   │   └── seed/demo       # Datos demo
│   │   ├── globals.css         # Tema "mystery" (púrpura + dorado)
│   │   ├── layout.tsx          # Layout raíz
│   │   └── page.tsx            # SPA router (hash-based)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   └── views/              # Vistas principales
│   ├── hooks/
│   │   ├── use-chat-socket.ts  # Hook para WebSocket del chat
│   │   ├── use-fetch.ts        # Hook genérico de fetch
│   │   └── use-route.ts        # Hook para hash routing
│   └── lib/
│       ├── codes.ts            # Generación y hashing de códigos
│       ├── db.ts               # Cliente Prisma
│       ├── group-state.ts      # Lógica de estado del grupo
│       ├── router.ts           # Parser de rutas hash
│       ├── session.ts          # Sesión por cookies + rate limiting
│       └── time.ts             # Conversión de zonas horarias y countdown
├── mini-services/
│   └── chat-service/           # Servicio WebSocket separado (puerto 3003)
└── Caddyfile                   # Gateway con proxy para el mini-servicio
```

### Modelo de datos

```
Group 1 ─┬─ N Participant
         ├─ N Message
         └─ N Guess

Participant 1 ─┬─ N Message        (autor)
               ├─ N Guess         (como adivinador)
               └─ N Guess         (como objetivo a adivinar)

Guess:
  - participantId        (quién adivina)
  - targetParticipantId   (a quién intenta identificar)
  - guessedParticipantId  (quién cree que es)
```

Restricciones únicas:
- `Group.code` (único global)
- `Participant(groupId, alias)` (no duplicados dentro del grupo)
- `Guess(groupId, participantId, targetParticipantId)` (una respuesta por objetivo)

---

## 🔐 Seguridad

- Los **códigos personales y de admin** se almacenan hasheados (SHA-256 + salt
  aleatorio de 16 bytes). El plaintext solo se devuelve **una vez** al crear el
  grupo o registrarse.
- Las **cookies de sesión** son `HttpOnly` y `SameSite=Lax`.
- El **nombre real** de cada participante **nunca** se expone públicamente; solo
  se devuelve tras la revelación.
- Las **adivinanzas** son privadas: cada participante solo ve las propias (y la
  "answer key" solo cuando `reveal === true`).
- **Rate limiting** en endpoints sensibles (login: 5 intentos / 5 min).
- Validaciones en **backend** para impedir:
  - Votar por uno mismo
  - Cambiar respuestas después de la fecha límite
  - Ver respuestas de otros
  - Alias duplicados en el mismo grupo
  - Suplantar a otro participante (necesitas su código personal)

---

## 🎮 Estados del grupo

| Estado         | Descripción                                  |
| -------------- | -------------------------------------------- |
| `REGISTRATION` | Inscripción abierta                          |
| `ACTIVE`       | Juego activo (con participantes)             |
| `LOCKED`       | No se permiten nuevos participantes          |
| `REVEAL`       | Revelación disponible (automático o manual)  |
| `FINISHED`     | Juego terminado                              |

La transición a `REVEAL` ocurre automáticamente al llegar la fecha/hora
configurada, o puede ser forzada por el admin.

---

## 🛠️ Scripts

```bash
bun run dev         # Modo desarrollo
bun run lint        # ESLint
bun run db:push     # Aplicar schema a la base de datos
bun run db:reset    # Resetear la base de datos
bun run db:generate # Regenerar el cliente Prisma
bun run build       # Build de producción (Next.js standalone)
```

---

## 🚢 Despliegue

### Vercel + Supabase (recomendado para frontend)

1. Sube el repositorio a GitHub.
2. Importa el proyecto en [Vercel](https://vercel.com/new).
3. Crea una base de datos Postgres en
   [Supabase](https://supabase.com/database).
4. En Vercel, configura la variable de entorno:
   ```
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?schema=public
   ```
5. Cambia el `provider` en `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"   // era "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
6. Ejecuta `bun run db:push` localmente con la `DATABASE_URL` de producción
   para crear las tablas.

### Servicio WebSocket (chat en tiempo real)

El servicio vive en `mini-services/chat-service/` y necesita su propio host
(Railway, Render, Fly.io, etc.) con puerto `3003` expuesto.

1. Despliega `mini-services/chat-service` en Railway.
2. Actualiza la URL del socket en `src/hooks/use-chat-socket.ts` si tu
   mini-servicio está en otro dominio (por defecto usa el proxy del mismo
   origen con `?XTransformPort=3003`).
3. En el gateway (Caddy / Nginx), configura el path `/` con `XTransformPort`
   para enrutar al puerto `3003` cuando sea necesario.

### Self-hosted (Docker / PM2 / systemd)

- **Frontend + API**: cualquier host con Node 18+.
- **WebSocket**: desplegar `mini-services/chat-service` en un host separado.
- **DB**: SQLite (desarrollo) o Postgres / MySQL (producción).

---

## 🧩 Roadmap

- [ ] Mensajes privados entre participantes.
- [ ] Internacionalización (i18n) ES/EN.
- [ ] Modo oscuro persistente.
- [ ] Notificaciones push para mensajes nuevos.
- [ ] Exportar ranking a PDF.
- [ ] Soporte multimedia (imágenes) en el chat.
- [ ] PWA con soporte offline básico.

¿Tienes una idea? Abre un [issue](../../issues/new) o revisa
[`CONTRIBUTING.md`](./CONTRIBUTING.md).

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor lee
[`CONTRIBUTING.md`](./CONTRIBUTING.md) y el
[`Código de Conducta`](./CODE_OF_CONDUCT.md) antes de abrir un PR.

```bash
# Fork + clone
git clone https://github.com/TU_USUARIO/amigos-ultrasecretos.git
cd amigos-ultrasecretos
bun install
cp .env.example .env
bun run db:push
bun run dev
```

---

## 📝 Changelog

Ver [`CHANGELOG.md`](./CHANGELOG.md).

---

## 📄 Licencia

[MIT](./LICENSE) © Amigos Ultrasecretos.
