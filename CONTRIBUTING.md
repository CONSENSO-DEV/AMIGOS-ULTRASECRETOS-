# 🤝 Contribuir a Amigos Ultrasecretos

¡Gracias por tu interés en contribuir! Este documento describe cómo hacerlo.

## 🐛 Reportar bugs

Antes de abrir un issue, por favor:

1. Busca en [issues existentes](../../issues) para evitar duplicados.
2. Si no existe, abre uno nuevo incluyendo:
   - **Descripción clara** del problema.
   - **Pasos para reproducirlo**.
   - **Comportamiento esperado** vs. **comportamiento actual**.
   - **Screenshots** si aplica.
   - **Entorno**: navegador, OS, versión de Node/Bun.

## ✨ Proponer mejoras

Las ideas para nuevas funcionalidades son bienvenidas. Abre un issue con el
prefijo `[Feature]` y describe:

- Qué problema resuelve.
- Por qué es útil para el proyecto.
- Posibles alternativas que hayas considerado.

## 🔧 Setup de desarrollo

```bash
# Clona tu fork
git clone https://github.com/TU_USUARIO/amigos-ultrasecretos.git
cd amigos-ultrasecretos

# Instala dependencias
bun install

# Configura variables de entorno
cp .env.example .env

# Inicializa la base de datos
bun run db:push

# Inicia el servidor de desarrollo
bun run dev
```

El servicio WebSocket de chat se inicia automáticamente junto con el dev
server en el puerto `3003`. Si lo necesitas arrancar manualmente:

```bash
cd mini-services/chat-service
bun install
bun run dev
```

## 📋 Convenciones

### Código

- **TypeScript estricto** en todo el proyecto.
- **ESLint**: ejecuta `bun run lint` antes de hacer commit.
- **Estilo de nombres**: `camelCase` para variables/funciones, `PascalCase`
  para componentes y tipos, `SCREAMING_SNAKE_CASE` para constantes.
- **Sin `any`** salvo justificación clara en un comentario.

### Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<scope>): <descripción>

[opcional: cuerpo]

[opcional: pie]
```

Tipos más usados:

| Tipo       | Uso                                          |
| ---------- | -------------------------------------------- |
| `feat`     | Nueva funcionalidad                          |
| `fix`      | Corrección de bug                            |
| `docs`     | Solo documentación                           |
| `style`    | Formato, sin cambios de código               |
| `refactor` | Refactor sin cambio de comportamiento        |
| `perf`     | Mejora de rendimiento                        |
| `test`     | Añadir o corregir tests                      |
| `chore`    | Tareas de mantenimiento, deps, configuración |
| `ci`       | Cambios en CI/CD                             |

Ejemplos:

```
feat(chat): añadir typing indicator en tiempo real
fix(auth): corregir validación de sesión expirada
docs(readme): añadir sección de despliegue en Railway
```

### Pull Requests

1. Crea una rama desde `main`:
   ```bash
   git checkout -b feat/mi-mejora
   ```
2. Haz commits pequeños y enfocados.
3. Asegúrate de que `bun run lint` no falle.
4. Si añades una funcionalidad nueva, actualiza el README si aplica.
5. Abre el PR describiendo **qué** cambia y **por qué**.

### Estructura del proyecto

```
src/
├── app/api/        # API routes (Next.js Route Handlers)
├── app/            # Páginas (en este proyecto, una SPA con hash routing)
├── components/ui/  # Componentes shadcn/ui
├── components/views/  # Vistas principales de la app
├── hooks/          # Hooks de React (chat, fetch, route)
└── lib/            # Utilidades (códigos, sesión, tiempo, etc.)

mini-services/chat-service/  # Servicio WebSocket separado (puerto 3003)
prisma/                      # Schema y migraciones
```

## 🔒 Seguridad

Si descubres una vulnerabilidad de seguridad, **NO abras un issue público**.
Envía un correo describiendo el problema y lo abordaremos con prioridad.

## 📜 Código de conducta

Al participar en este proyecto aceptas seguir nuestro [Código de Conducta](./CODE_OF_CONDUCT.md).

## 🙌 Reconocimientos

Toda contribución será reconocida. ¡Gracias por hacer este proyecto mejor!
