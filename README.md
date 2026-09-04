# Web info

Dos APIs .NET y un frontend React + Vite que las consume.

| Proyecto | Puerto | Endpoint principal |
| --- | --- | --- |
| `wapp2` | 5104 | `GET /api/employee/all` |
| `VideoGameCharacterApi` | 5008 | `GET /api/characters` |
| `full-web-app` | 5173 | — |

Los puertos de las APIs se declaran en su `Properties/launchSettings.json`.
Ambas aceptan CORS únicamente desde `http://localhost:5173`, así que el
frontend debe arrancarse en el puerto por defecto de Vite.

## Arranque

Cada API en su propia terminal:

```bash
dotnet run --project wapp2
dotnet run --project VideoGameCharacterApi/VideoGameCharacterApi
```

El frontend necesita su fichero de entorno antes del primer arranque:

```bash
cd full-web-app
cp .env.example .env.local
npm install
npm run dev
```

Las URLs de las APIs se leen de ese fichero y no tienen valor por defecto: si
falta una variable, la aplicación falla al cargar indicando cuál. Ajusta los
valores si cambias los puertos de `launchSettings.json`.
