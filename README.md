# agitalo-suave-cms

Headless CMS (Strapi v5) para el contenido de [Agítalo Suave](https://agitalosuave.com).

- **Base de datos:** Supabase (PostgreSQL)
- **Media Library:** Cloudinary, con conversión automática de jpeg/png → **AVIF**
- **Contenido:** posts de blog + páginas legales. El cuerpo se guarda como **markdown+html** (campo richtext), preservando las entradas tal como están hoy.
- **Objetivo:** exponer el contenido vía REST API para que el build de `agitalo-suave` (Astro) lo consuma.

## Requisitos

- Node.js 22+ (LTS)
- pnpm 10+
- Proyecto Supabase con su connection string
- Cuenta Cloudinary con API key/secret

## Configuración inicial

1. Instalar dependencias:

   ```sh
   pnpm install
   ```

2. Copiar `.env.example` a `.env` y completar los valores:

   ```sh
   cp .env.example .env
   ```

   Variables requeridas:

   | Variable | Descripción |
   | --- | --- |
   | `DATABASE_URL` | Connection string de Supabase (directa o pooler). |
   | `CLOUDINARY_NAME` | Cloud name (ej. `ddl7angox`). |
   | `CLOUDINARY_KEY` | API Key de Cloudinary. |
   | `CLOUDINARY_SECRET` | API Secret de Cloudinary. |
   | `APP_KEYS`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY` | Secrets (genera con `openssl rand -base64 32`). |

3. Arrancar en desarrollo:

   ```sh
   pnpm develop
   ```

   - Admin en `http://localhost:1337/admin` (crear el usuario administrador en la primera visita).
   - Al arrancar, el bootstrap habilita automáticamente los permisos de lectura pública de `blog` y `legal`.

4. (Opcional) **API token**: Settings → API Tokens → Create New Token → tipo `Read-only` (o `Full-access` para el script de importación).

## Content types

| Collection | Campos principales |
| --- | --- |
| `blog` | `title`, `slug`, `type` (`receta\|bitacora\|tecnica\|tip`), `date`, `updated`, `excerpt`, `tags` (json), `image` (media), `headerImage` (media), `ingredients` (json), `steps` (json), `draft`, `featured`, `content` (richtext markdown) |
| `legal` | `title`, `slug`, `description`, `date`, `draft`, `content` (richtext markdown) |

El mapeo es 1:1 con los esquemas actuales de `agitalo-suave` (`src/schemas/blog.ts` y `src/schemas/legal.ts`).

## Conversión a AVIF en Cloudinary

En `config/plugins.ts`, el provider de upload configura `actionOptions.upload` con `format: 'avif'` y `quality: 'auto'`. Toda imagen (jpeg/png/etc.) subida por la Media Library se almacena en Cloudinary como **AVIF**; ese `.avif` es el que devuelve el API.

## Migración del contenido actual

El script `scripts/import-content.mjs` importa (idempotente por `slug`) los `.md` del blog y los `.mdx` legales de `../agitalo-suave/src/content`:

```sh
# Con Strapi corriendo y un API token full-access:
CMS_TOKEN=xxxxxxxx node scripts/import-content.mjs

# Ver qué haría sin tocar nada:
CMS_TOKEN=xxxxxxxx DRY_RUN=1 node scripts/import-content.mjs
```

Las imágenes existentes (ya en Cloudinary como `.avif`) se re-suben a la Media Library y se enlazan a cada entrada.

## API (para el build de agitalo-suave)

Endpoints públicos (rol Public) o con `Authorization: Bearer <token>`:

- `GET /api/blogs` y `GET /api/blogs/:documentId`
- `GET /api/legals` y `GET /api/legals/:documentId`

Ejemplo de filtrado:

```
GET /api/blogs?filters[type][$eq]=receta&sort[0]=date:desc&pagination[page]=1&pageSize=12
```

El cuerpo `content` llega como markdown+html; el front lo renderiza con su parser markdown actual.

## Despliegue (Render)

El repo incluye un blueprint `render.yaml`: en Render, **New → Blueprint** conectando el repo crea el servicio automáticamente.

1. New → Blueprint y conectar el repo.
2. El blueprint define el build (`corepack enable && NODE_ENV=development pnpm install --frozen-lockfile && pnpm build`) y el start (`pnpm start`).
3. En **Environment**, rellena los valores de las claves marcadas `sync: false` copiándolos de tu `.env`:
   `DATABASE_URL`, `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY`, `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`.
4. Añade el custom domain (ej. `cms.agitalosuave.com`) en Service Settings.

**Importante:** la instancia es stateless — los datos viven en Supabase y los archivos en Cloudinary, así que no necesita disco persistente. El build usa `NODE_ENV=development` solo para instalar devDependencies (Strapi necesita TypeScript para compilar); en runtime se corre con `NODE_ENV=production`.

## Comandos

| Comando | Descripción |
| --- | --- |
| `pnpm develop` | Dev con hot reload |
| `pnpm build` | Compila el admin panel |
| `pnpm start` | Corre la app (build previo requerido) |
| `node scripts/import-content.mjs` | Importa el contenido de agitalo-suave |
