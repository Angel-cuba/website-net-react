# Full .NET + React App

Proyecto de practica para profundizar en backend con C#, SQL Server y React.
El objetivo actual es evolucionar `wapp2` como backend principal, con una sola
base de datos (`Wapp2Db`) y una estructura preparada para autenticacion,
autorizacion, tareas compartidas y avisos en tiempo real.

## Proyectos

| Proyecto | Rol | Puerto | Estado |
| --- | --- | --- | --- |
| `wapp2` | API principal ASP.NET Core | 5104 | Activo |
| `full-web-app` | Frontend React + Vite | 5173 | Activo |
| `VideoGameCharacterApi` | API anterior/de referencia | 5008 | Fuera del flujo principal |

Los puertos de las APIs se declaran en sus `Properties/launchSettings.json`.
El frontend debe arrancar en el puerto por defecto de Vite porque `wapp2`
acepta CORS desde `http://localhost:5173`.

## Estado Actual

`wapp2` queda como backend principal del proyecto. La base usada por esta API es
`Wapp2Db`; el nombre anterior `EmployeeDb` no debe seguir apareciendo en las
connection strings.

La conexion local funciona con SQL Server en `localhost,1433` usando el usuario
`sa`. La password no debe guardarse en `appsettings.json`; debe vivir en
`dotnet user-secrets`.

Tablas actuales en `Wapp2Db`:

```text
dbo.Employee
dbo.Roles
dbo.UserProfiles
dbo.UserRoles
dbo.Users
```

`VideoGameCharacterApi` se mantiene como referencia separada. Sus tablas no
deben mezclarse en `Wapp2Db` salvo que se decida migrar ese dominio al backend
principal.

## Direccion Arquitectonica

Por ahora se recomienda evitar tres backends o tres bases de datos. La opcion
mas practica para aprender y mantener el proyecto claro es un monolito modular:

```text
React frontend
  |
  v
wapp2 ASP.NET Core API
  |
  v
Wapp2Db SQL Server
```

La separacion se hara por carpetas y responsabilidades dentro de `wapp2`, no
por servidores separados. Esto permite practicar conceptos importantes sin
sumar coste y complejidad de despliegue.

## Estructura Objetivo Del Backend

Punto de partida recomendado para `wapp2`:

```text
wapp2/
├── Auth/
│   ├── Controllers/
│   │   └── AuthController.cs
│   ├── DTOs/
│   │   ├── LoginRequest.cs
│   │   ├── RegisterRequest.cs
│   │   └── AuthResponse.cs
│   ├── Services/
│   │   ├── AuthService.cs
│   │   └── JwtService.cs
│   └── Interfaces/
│       └── IAuthService.cs
│
├── Users/
│   ├── Controllers/
│   │   └── UsersController.cs
│   ├── Models/
│   │   ├── User.cs
│   │   ├── UserProfile.cs
│   │   └── Role.cs
│   ├── DTOs/
│   │   ├── UserProfileResponse.cs
│   │   └── UpdateUserProfileRequest.cs
│   ├── Repositories/
│   │   └── UserRepository.cs
│   ├── Services/
│   │   └── UserService.cs
│   └── Interfaces/
│       ├── IUserRepository.cs
│       └── IUserService.cs
│
├── Tasks/
│   ├── Controllers/
│   │   └── TasksController.cs
│   ├── Models/
│   │   ├── TaskItem.cs
│   │   └── TaskAccess.cs
│   ├── DTOs/
│   │   ├── CreateTaskRequest.cs
│   │   ├── UpdateTaskRequest.cs
│   │   ├── TaskResponse.cs
│   │   └── TaskAccessResponse.cs
│   ├── Repositories/
│   │   └── TaskRepository.cs
│   ├── Services/
│   │   └── TaskService.cs
│   └── Interfaces/
│       ├── ITaskRepository.cs
│       └── ITaskService.cs
│
├── Invitations/
│   ├── Controllers/
│   │   └── InvitationsController.cs
│   ├── Models/
│   │   └── TaskInvitation.cs
│   ├── DTOs/
│   │   ├── CreateInvitationRequest.cs
│   │   ├── InvitationResponse.cs
│   │   └── RespondInvitationRequest.cs
│   ├── Repositories/
│   │   └── InvitationRepository.cs
│   ├── Services/
│   │   └── InvitationService.cs
│   └── Interfaces/
│       ├── IInvitationRepository.cs
│       └── IInvitationService.cs
│
├── Notifications/
│   ├── Controllers/
│   │   └── NotificationsController.cs
│   ├── Hubs/
│   │   └── NotificationHub.cs
│   ├── Models/
│   │   └── Notification.cs
│   ├── DTOs/
│   │   └── NotificationResponse.cs
│   ├── Repositories/
│   │   └── NotificationRepository.cs
│   ├── Services/
│   │   └── NotificationService.cs
│   └── Interfaces/
│       ├── INotificationRepository.cs
│       └── INotificationService.cs
│
├── Shared/
│   ├── Database/
│   │   ├── ISqlConnectionFactory.cs
│   │   └── SqlConnectionFactory.cs
│   ├── Security/
│   │   ├── ICurrentUserService.cs
│   │   └── CurrentUserService.cs
│   ├── Middleware/
│   │   └── ErrorHandlingMiddleware.cs
│   └── DTOs/
│       └── ApiResponse.cs
│
├── Program.cs
├── appsettings.json
├── appsettings.Development.json
└── wapp2.csproj
```

## Responsabilidades Por Modulo

`Auth` se encargara de register, login, hash de passwords, generacion de JWT y
validacion de credenciales.

`Users` contendra el perfil completo del usuario y la relacion con roles.

`Tasks` sera el dominio principal de la app: cada usuario podra crear listas o
tareas con campos como nombre, descripcion, fecha, estado y prioridad.

`Invitations` gestionara invitaciones para compartir tareas. Una invitacion
podra estar `pending`, `accepted` o `rejected`.

`Notifications` servira para avisos al usuario, primero guardados en SQL Server
y despues enviados en tiempo real con SignalR.

`Shared` contendra piezas comunes como la fabrica de conexiones SQL, servicios
para obtener el usuario actual desde el JWT, middleware de errores y respuestas
comunes.

## Modelo De Datos Inicial

La base principal es `Wapp2Db`. Las tablas actuales estan listadas en
`Estado Actual`.

`dbo.Employee` puede evolucionar despues a `dbo.Tasks` o convivir temporalmente
mientras se transforma el CRUD inicial en una app de tareas.

Tablas recomendadas para la siguiente fase:

```text
dbo.Tasks
dbo.TaskAccess
dbo.TaskInvitations
dbo.Notifications
```

`Tasks` debe guardar el owner:

```text
OwnerUserId
```

`TaskAccess` debe guardar permisos por recurso:

```text
TaskId
UserId
CanEdit
```

Esto evita guardar IDs de usuarios como arrays dentro de una columna y permite
consultas mas claras, indices y revocacion de accesos.

## Autenticacion Y Autorizacion

La autenticacion recomendada es JWT:

```text
POST /api/auth/register
POST /api/auth/login
```

El token debe incluir:

```text
userId
email
roles
```

Roles globales iniciales:

```text
User
Admin
SuperAdmin
```

Autorizacion por recurso:

```text
Puede ver/editar una tarea si:
- es owner de la tarea
- fue invitado, acepto y tiene permiso
- tiene rol Admin o SuperAdmin, si el sistema lo permite
```

Regla importante: el frontend nunca debe decidir el `UserId` efectivo. El
backend debe leerlo desde el JWT y usarlo en las queries.

## Realtime, Messaging Y Cache

Orden recomendado de aprendizaje:

```text
1. JWT + roles
2. CRUD de tareas por usuario
3. Invitaciones y permisos por tarea
4. SignalR para notificaciones en tiempo real
5. Redis para cache, rate limiting o SignalR backplane
6. RabbitMQ o Azure Service Bus para eventos asincronos
7. Kafka para streaming/eventos historicos cuando el dominio lo justifique
```

SignalR sirve para avisar al frontend sin refrescar:

```text
TaskInvitationCreated
TaskInvitationAccepted
TaskUpdated
NotificationCreated
```

Redis no reemplaza SQL Server. SQL Server sigue siendo la fuente de verdad.
Redis puede ayudar con:

```text
cache de lecturas frecuentes
rate limiting de login
sesiones temporales
tokens revocados hasta expiracion
backplane de SignalR si hay varias instancias
locks temporales
```

RabbitMQ o Azure Service Bus servirian para trabajo asincrono:

```text
enviar email de invitacion
procesar eventos en background
crear notificaciones
auditar cambios importantes
```

Kafka tiene mas sentido si se quiere aprender event streaming, replay de eventos
o pipelines de analytics. No es necesario al inicio.

## Configuracion Y Secretos

No guardar passwords, JWT keys ni connection strings reales en archivos que se
suben al repositorio.

`appsettings.json` puede tener estructura sin secretos:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": ""
  },
  "Jwt": {
    "Key": "",
    "Issuer": "wapp2",
    "Audience": "full-web-app"
  }
}
```

En local, usar `dotnet user-secrets` desde la carpeta de `wapp2`:

```bash
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" 'Server=localhost,1433;Database=Wapp2Db;User Id=sa;Password=<SQL_PASSWORD>;Encrypt=True;TrustServerCertificate=True;'
dotnet user-secrets set "Jwt:Key" "<JWT_SECRET_LARGO_Y_SEGURO>"
```

Para visualizar los valores locales:

```bash
dotnet user-secrets list
```

En un servidor real, usar variables de entorno o el gestor de secretos de la
plataforma:

```text
ConnectionStrings__DefaultConnection
Jwt__Key
Jwt__Issuer
Jwt__Audience
```

## Consultas Utiles En SQL Server

Confirmar servidor y DB antes de modificar datos:

```sql
SELECT
    @@SERVERNAME AS ServerName,
    DB_NAME() AS CurrentDatabase;
```

Listar tablas:

```sql
SELECT
    TABLE_SCHEMA,
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_SCHEMA, TABLE_NAME;
```

Contar filas por tabla:

```sql
SELECT
    t.name AS TableName,
    SUM(p.rows) AS TotalRows
FROM sys.tables t
JOIN sys.partitions p
    ON t.object_id = p.object_id
WHERE p.index_id IN (0, 1)
GROUP BY t.name
ORDER BY t.name;
```

## Arranque Local

API principal:

```bash
dotnet run --project wapp2
```

Frontend: ver `full-web-app/README.md` para detalles propios de React/Vite.
Arranque rapido desde la raiz:

```bash
cd full-web-app
cp .env.example .env.local
npm install
npm run dev
```

La URL de la API debe estar en el `.env.local` del frontend. Las variables de
React/Vite no deben contener secretos porque se exponen al navegador.

## Siguientes Pasos

1. Reorganizar `wapp2` por modulos: `Auth`, `Users`, `Tasks`, `Invitations`,
   `Notifications` y `Shared`.
2. Centralizar la conexion con `SqlConnectionFactory`.
3. Implementar register/login con password hashing.
4. Generar y validar JWT.
5. Proteger endpoints con `[Authorize]`.
6. Implementar roles `User`, `Admin` y `SuperAdmin`.
7. Crear `Tasks`, `TaskAccess` y `TaskInvitations`.
8. Anadir SignalR para avisos en tiempo real.
9. Evaluar Redis para cache/rate limiting cuando el flujo base ya funcione.
10. Evaluar RabbitMQ/Azure Service Bus para eventos asincronos.
