# Wapp2

Wapp2 es una SPA multiusuario para crear tareas privadas, compartirlas con otras
cuentas registradas y administrar permisos de lectura o edicion. Combina React,
TypeScript y Vite con una API ASP.NET Core, Dapper, SQL Server, JWT y SignalR.

## Estado actual

El flujo principal esta implementado y validado en local:

- registro, login y sesion JWT;
- perfil editable con nombre, apellido, biografia y URL de avatar;
- CRUD de tareas por usuario;
- fecha limite minima de cinco horas en el formulario;
- invitaciones por email entre cuentas registradas;
- aceptacion, rechazo, cancelacion y reinvitacion;
- acceso inicial `View only` y permiso opcional `Can edit`;
- vistas de invitaciones y tareas compartidas;
- actualizaciones de sharing mediante SignalR;
- eliminacion transaccional de cuenta y datos relacionados.

Las invitaciones aparecen dentro de Wapp2. El proyecto no envia emails externos.

## Arquitectura

```text
React SPA (full-web-app, :5173)
        |
        | HTTP + JWT / SignalR
        v
ASP.NET Core API (wapp2, :5104)
        |
        | Dapper + Microsoft.Data.SqlClient
        v
SQL Server (Wapp2DB)
```

| Proyecto | Funcion | Estado |
| --- | --- | --- |
| `full-web-app` | SPA React + TypeScript + Vite | Activo |
| `wapp2` | API principal ASP.NET Core | Activo |
| `database/migrations` | Cambios SQL incrementales | Activo |
| `VideoGameCharacterApi` | API anterior de referencia | Fuera del flujo principal |

La solucion usa un monolito modular. Los dominios `Auth`, `Users`, `Tasks`,
`Invitations`, `Notifications` y `Shared` viven dentro de `wapp2` y comparten una
sola base de datos.

## Documentacion

La referencia completa del sistema esta en:

- [Project Guide](docs/PROJECT_GUIDE.md): arquitectura, flujos, permisos, API,
  modelo de datos, realtime, stack, configuracion, diagnostico y pendientes de
  produccion.
- [Frontend README](full-web-app/README.md): estructura y comandos especificos
  de React/Vite.

## Stack principal

### Frontend

- React 19;
- TypeScript 6;
- Vite 8;
- Microsoft SignalR client;
- Lucide React;
- ESLint.

### Backend

- .NET 10 y ASP.NET Core;
- Dapper;
- Microsoft.Data.SqlClient;
- SQL Server;
- JWT Bearer Authentication;
- BCrypt.Net;
- SignalR.

Las versiones exactas y la funcion de cada paquete estan documentadas en el
[Project Guide](docs/PROJECT_GUIDE.md#4-stack-y-paquetes).

## Requisitos locales

- .NET SDK 10;
- Node `^20.19.0` o `>=22.12.0`;
- npm;
- SQL Server con la base `Wapp2DB` y su esquema base.

## Configuracion

### Backend

`wapp2.csproj` ya esta preparado para `dotnet user-secrets`. Configurar desde la
raiz del repositorio:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<SQL_CONNECTION_STRING>" --project wapp2/wapp2.csproj
dotnet user-secrets set "Jwt:Secret" "<LONG_RANDOM_SECRET>" --project wapp2/wapp2.csproj
dotnet user-secrets set "Jwt:Issuer" "<JWT_ISSUER>" --project wapp2/wapp2.csproj
dotnet user-secrets set "Jwt:Audience" "<JWT_AUDIENCE>" --project wapp2/wapp2.csproj
```

No guardar secretos reales en `appsettings.json`, `.env`, README ni commits.

Aplicar en orden los scripts de `database/migrations` sobre `Wapp2DB`. El
repositorio todavia no contiene una migracion baseline que cree todo el esquema
desde cero.

### Frontend

```bash
cd full-web-app
cp .env.example .env.local
npm install
```

El archivo local debe contener:

```dotenv
VITE_API_URL=http://localhost:5104
```

La URL no debe incluir `/api` ni terminar en `/`.

## Arranque local

Terminal 1, desde la raiz:

```bash
dotnet run --project wapp2/wapp2.csproj --launch-profile http
```

Terminal 2:

```bash
cd full-web-app
npm run dev
```

Abrir `http://localhost:5173`.

## Validacion

```bash
dotnet build wapp2/wapp2.csproj --no-restore
dotnet test tests/Wapp2.Tests/Wapp2.Tests.csproj --no-restore

cd full-web-app
npm run lint
npm run build
```

La suite backend cubre inicialmente autenticacion, generacion y validacion JWT,
identidad basada en claims, y las reglas de autorizacion y notificaciones del
servicio de tareas. Consulta la seccion de produccion del
[Project Guide](docs/PROJECT_GUIDE.md#18-estado-de-produccion-y-trabajo-pendiente)
para conocer las brechas de pruebas de integracion, frontend y end-to-end.

## Seguridad y permisos

- El backend obtiene siempre el usuario efectivo desde el JWT.
- Una invitacion aceptada empieza con acceso de solo lectura.
- Solo el owner puede invitar, revocar acceso o eliminar su tarea.
- `CanEdit` permite actualizar la tarea, pero no compartirla ni borrarla.
- La eliminacion de cuenta exige el password actual.
- SQL Server sigue siendo la fuente de verdad; SignalR solo avisa que hay datos
  que recargar.
