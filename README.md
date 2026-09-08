# 🕵️ Amigos Ultrasecretos

Aplicación web completa para organizar juegos de "Amigos Secretos / Ultrasecretos" entre un grupo de personas. Cada participante elige un **alias secreto**, chatea en tiempo real, e intenta descubrir quién está detrás de cada alias antes de la gran revelación.

**Sin cuentas. Sin contraseñas. Solo secretos.**

## ✨ Características principales

- **Sin registro de usuarios**: acceso mediante códigos privados personales.
- **Creación de grupos** con código único y enlace para compartir.
- **Códigos seguros**: grupo, personal y de administrador, todos hasheados en base de datos.
- **Chat grupal en tiempo real** (WebSocket + Socket.IO).
- **Sistema de adivinanzas** privado y validado en backend.
- **Cuenta regresiva en vivo** hasta la fecha de revelación.
- **Bloqueo automático** de respuestas al llegar la fecha/hora.
- **Ranking** automático con manejo de empates.
- **Revelación animada** con confeti y transiciones.
- **Panel de administración**: cambiar configuración, expulsar participantes, forzar revelación, regenerar código.
- **Mobile-first** y responsive.
- **Datos demo** para probar la app en un clic.

## 🚀 Cómo empezar

### Requisitos

- Node.js 18+ o Bun
- SQLite (incluido por defecto)

### Instalación

```bash
bun install
```

### Inicializar la base de datos

```bash
bun run db:push
```

### Ejecutar en modo desarrollo

```bash
bun run dev
```

La aplicación se sirve en `http://localhost:3000`.

El servicio WebSocket de chat corre automáticamente en el puerto 3003 (`mini-services/chat-service`).

### Variables de entorno

El archivo `.env` debe contener:

```
DATABASE_URL="file:./db/custom.db"
```

Para despliegue en producción con PostgreSQL, cambia el `datasource` en `prisma/schema.prisma` y la `DATABASE_URL`.

## 🧪 Probar la app

1. En la pantalla de inicio, haz clic en **"🎮 Crear grupo demo"**.
2. Verás los códigos de 5 participantes ficticios (El Zorro, La Rana, etc.) y el código de administrador.
3. Haz clic en **"Entrar al demo"** e ingresa con cualquiera de los códigos personales.
4. El demo incluye:
   - 8 mensajes pre-cargados en el chat
   - Adivinanzas pre-cargadas para cada participante
   - Fecha de revelación 2 horas en el futuro (forzar revelación desde el panel admin)
   - Ranking calculable

### Probar la revelación manualmente

1. Entra como administrador: `#/admin` → código del grupo + código admin.
2. Pestaña **Resumen** → botón **"Iniciar revelación"**.
3. Vuelve al dashboard como participante y entra a la pestaña **Revelación** y **Ranking**.

## 🗺️ Rutas (todas viven en `/` con hash routing)

| Ruta                          | Descripción                             |
| ----------------------------- | --------------------------------------- |
| `#/`                          | Landing page                            |
| `#/create`                    | Crear grupo                             |
| `#/join`                      | Buscar grupo por código                 |
| `#/join/:code`                | Unirse a un grupo específico            |
| `#/login`                     | Recuperar acceso (alias + código)       |
| `#/group/:code`               | Dashboard del grupo (requiere sesión)   |
| `#/admin`                     | Login de administrador                  |
| `#/admin/:code`               | Panel de administración                 |

## 🏗️ Arquitectura

```
.
├── prisma/
│   └── schema.prisma           # Definición de entidades (Group, Participant, Message, Guess)
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
│   │   └── views/              # Vistas principales (Landing, Create, Join, etc.)
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

## 🔐 Seguridad

- Los **códigos personales y de admin** se almacenan hasheados (SHA-256 + salt aleatorio).
- Las **cookies de sesión** son HttpOnly y SameSite=Lax.
- El **nombre real** de cada participante **nunca** se expone públicamente; solo se devuelve tras la revelación.
- Las **adivinanzas** son privadas: cada participante solo ve las propias (y la "answer key" solo cuando reveal=true).
- **Rate limiting** en endpoints sensibles (login: 5 intentos / 5 min).
- Validaciones en **backend** para impedir:
  - Votar por uno mismo
  - Cambiar respuestas después de la fecha límite
  - Ver respuestas de otros
  - Alias duplicados en el mismo grupo

## 🎮 Estados del grupo

| Estado         | Descripción                                  |
| -------------- | -------------------------------------------- |
| `REGISTRATION` | Inscripción abierta                          |
| `ACTIVE`       | Juego activo (con participantes)             |
| `LOCKED`       | No se permiten nuevos participantes          |
| `REVEAL`       | Revelación disponible (automático o manual)  |
| `FINISHED`     | Juego terminado                              |

La transición a `REVEAL` ocurre automáticamente al llegar la fecha/hora configurada, o puede ser forzada por el admin.

## 🛠️ Scripts

```bash
bun run dev         # Modo desarrollo
bun run lint        # ESLint
bun run db:push     # Aplicar schema a la base de datos
bun run db:reset    # Resetear la base de datos
bun run db:generate # Regenerar el cliente Prisma
```

## 🚢 Despliegue

### Vercel + Supabase

1. Sube el repositorio a Vercel.
2. Configura `DATABASE_URL` apuntando a Supabase Postgres.
3. Cambia el `datasource` en `prisma/schema.prisma` de `sqlite` a `postgresql`.
4. Ejecuta `bun run db:push` para crear las tablas.
5. Para el chat en tiempo real, despliega `mini-services/chat-service` en Railway/Render/Fly.io y actualiza la URL del socket en `src/hooks/use-chat-socket.ts`.

### Self-hosted

- Frontend + API: cualquier Node 18+ host (Docker, PM2, systemd).
- WebSocket: desplegar `mini-services/chat-service` en un host separado.
- DB: SQLite (desarrollo) o Postgres/MySQL (producción).

## 🧩 Modelo de datos

```
Group 1 ─┬─ N Participant
         ├─ N Message
         └─ N Guess

Participant 1 ─┬─ N Message        (autor)
               ├─ N Guess         (como adivinador)
               └─ N Guess         (como objetivo a adivinar)

Guess:
  - participantId       (quién adivina)
  - targetParticipantId (a quién intenta identificar)
  - guessedParticipantId (quién cree que es)
```

Restricciones únicas:
- `Group.code` (único global)
- `Participant(groupId, alias)` (no duplicados dentro del grupo)
- `Guess(groupId, participantId, targetParticipantId)` (una respuesta por objetivo)

## 📝 Licencia

Uso libre.
