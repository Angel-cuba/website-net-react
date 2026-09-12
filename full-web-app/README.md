# Wapp2 Frontend

Cliente web de Wapp2 construido con React, TypeScript y Vite.

Para comprender el flujo completo, el backend, la base de datos y los permisos,
consulta el [Project Guide](../docs/PROJECT_GUIDE.md).

El procedimiento propuesto para publicar la SPA sin CI esta en el
[Deployment Plan](../docs/DEPLOYMENT_PLAN.md).

## Requisitos

- Node `>=24.15.0 <25` (usar `nvm use` dentro de esta carpeta);
- npm;
- API Wapp2 disponible en `http://localhost:5104`.

## Configuracion

```bash
cp .env.example .env.local
npm install
```

`.env.local`:

```dotenv
VITE_API_URL=http://localhost:5104
```

La URL es la base del backend. No debe incluir `/api` ni terminar en `/`.
Las variables `VITE_*` se incluyen en el bundle del navegador y nunca deben
contener secretos.

## Comandos

```bash
npm run dev
npm run lint
npm test
npm run test:watch
npm run test:coverage
npm run build
npm run preview
```

| Comando | Funcion |
| --- | --- |
| `npm run dev` | inicia Vite en desarrollo |
| `npm run lint` | ejecuta ESLint |
| `npm test` | ejecuta una vez la suite Vitest |
| `npm run test:watch` | ejecuta Vitest en modo interactivo |
| `npm run test:coverage` | ejecuta tests y genera cobertura V8 |
| `npm run build` | ejecuta TypeScript y genera el build |
| `npm run preview` | sirve localmente el build generado |

La suite verifica el cliente HTTP, autenticacion de requests, almacenamiento del
token, fechas, errores, normalizacion de tareas y los providers de autenticacion,
SignalR e invitaciones. Tambien cubre el formulario y listado de tareas y las
tarjetas de invitacion, junto con el hook CRUD de tareas propias. Los hooks de
shared tasks y administracion de acceso tambien estan cubiertos. Los paneles,
componentes restantes y E2E se incorporan por fases; el estado, edicion y borrado
de perfil, junto con el router y shell autenticado, ya forman parte de la
regresion.

La cobertura exige como minimo 70% de lineas y statements, 65% de funciones y
55% de branches.

## Estructura

```text
src/
|-- app/
|   |-- layout/       # shell y navegacion
|   |-- providers/    # auth, profile, invitations y realtime
|   `-- router/       # rutas con History API
|-- components/       # Button, IconButton y EmptyState
|-- features/
|   |-- auth/
|   |-- invitations/
|   |-- profile/
|   |-- shared/
|   `-- tasks/
|-- hooks/
|-- lib/              # cliente HTTP
|-- styles/
|-- types/
`-- utils/
```

Cada feature mantiene cerca sus componentes, hooks, tipos y llamadas API.

## Rutas

| Ruta | Vista |
| --- | --- |
| `/tasks` | tareas propias y compartidas aceptadas |
| `/invitations` | pendientes e historial |
| `/shared` | tareas compartidas con y por el usuario |
| `/profile` | perfil y eliminacion de cuenta |

La aplicacion usa una navegacion ligera con `window.history`; no depende de
React Router.

## Sesion y HTTP

- El JWT se guarda en `localStorage` bajo `wapp2.auth.token`.
- `authenticatedRequest` agrega el header Bearer a las llamadas protegidas.
- Una respuesta `401` expira la sesion local.
- El cliente interpreta la expiracion del JWT y cierra la sesion cuando llega.
- Los mensajes de accion desaparecen automaticamente despues de tres segundos.

## Realtime

`RealtimeProvider` conecta con:

```text
http://localhost:5104/hubs/notifications
```

Los eventos `InvitationsChanged`, `SharedTasksChanged` y
`TaskSharingChanged` incrementan revisiones internas. Los hooks afectados
vuelven a consultar la API para recuperar el estado vigente desde SQL Server.

## UI de tareas

- La vista principal combina tareas propias y tareas compartidas aceptadas.
- Solo las tareas propias muestran compartir y eliminar.
- Una tarea compartida indica su owner y el permiso actual.
- Los controles de edicion y completado solo aparecen con `CanEdit`.
- El formulario exige una fecha limite de al menos cinco horas desde el momento
  actual.

## Dependencias principales

- React y React DOM;
- TypeScript;
- Vite y `@vitejs/plugin-react`;
- Vitest, jsdom y Testing Library;
- `@microsoft/signalr`;
- `lucide-react`;
- ESLint y `typescript-eslint`.

Las versiones exactas estan en `package.json` y se resumen en el
[Project Guide](../docs/PROJECT_GUIDE.md#4-stack-y-paquetes).
