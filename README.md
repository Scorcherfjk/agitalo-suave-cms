# 🗄️ agitalo-suave-cms

> CMS headless ([Strapi 5](https://strapi.io)) que alimenta el sitio **Agítalo Suave** ([agitalosuave.com](https://agitalosuave.com)). Exponen el blog y las páginas legales vía REST API para que el build del front (Astro) los consuma.

## ✨ Características

- **Datos en Supabase** — PostgreSQL gestionado en la nube (sin disco local).
- **Imágenes en Cloudinary** — la Media Library convierte jpeg/png → **AVIF** automáticamente.
- **Contenido rico** — el cuerpo se guarda como **markdown+html** (campo richtext), preservando las entradas tal cual.
- **API pública** — `blog` y `legal` legibles por el rol Public (permisos sembrados en el bootstrap).
- **Publicación automática** — webhook hacia el build hook de Netlify para regenerar el front al crear/editar/borrar entradas.

## 🧱 Stack

| Capa | Tecnología |
| --- | --- |
| Framework | [Strapi](https://strapi.io) 5 |
| Base de datos | Supabase (PostgreSQL) vía connection string |
| Media | Cloudinary (provider `@strapi/provider-upload-cloudinary`) |
| Deploy | Render (blueprint `render.yaml`) |

## ⚙️ Requisitos

- Node.js 20–26 (LTS)
- pnpm 10+
- Proyecto Supabase con su connection string
- Cuenta Cloudinary con API key/secret

## 🚀 Configuración inicial

1. Instalar dependencias:

   ```sh
   pnpm install
   ```

2. Copiar `.env.example` a `.env` y completar valores:

   ```sh
   cp .env.example .env
   ```

   | Variable | Descripción |
   | --- | --- |
   | `DATABASE_URL` | Connection string de Supabase (directa o pooler). |
   | `DATABASE_SSL` | `true` (Supabase exige SSL). |
   | `CLOUDINARY_NAME` | Cloud name de tu cuenta (ej. `mi-cuenta`). |
   | `CLOUDINARY_KEY` / `CLOUDINARY_SECRET` | Credenciales de Cloudinary. |
   | `APP_KEYS`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY` | Secrets (genera con `openssl rand -base64 32`). |

3. Arrancar en desarrollo:

   ```sh
   pnpm develop
   ```

   - Admin en `http://localhost:1337/admin`.
   - Al arrancar, el bootstrap habilita los permisos de lectura pública de `blog` y `legal`.

## 📝 Content types

| Collection | Campos principales |
| --- | --- |
| `blog` | `title`, `slug`, `type` (`receta` · `bitacora` · `tecnica` · `tip`), `date`, `updated`, `excerpt`, `tags` (json), `image`/`headerImage` (media), `ingredients` (json), `steps` (json), `draft`, `featured`, `content` (richtext markdown) |
| `legal` | `title`, `slug`, `description`, `date`, `draft`, `content` (richtext markdown) |

El mapeo es 1:1 con los schemas del front (`agitalo-suave/src/schemas/`).

## 🖼️ Conversión a AVIF en Cloudinary

En `config/plugins.ts`, el provider de upload configura `actionOptions.upload` con `format: 'avif'` y `quality: 'auto'`. Toda imagen (jpeg/png/etc.) subida por la Media Library se almacena como **AVIF**; ese `.avif` es el que devuelve la API.

## 🔌 API

Endpoints públicos (rol Public) o con `Authorization: Bearer <token>`:

- `GET /api/blogs` y `GET /api/blogs/:documentId`
- `GET /api/legals` y `GET /api/legals/:documentId`

Filtrado:

```
GET /api/blogs?filters[type][$eq]=receta&sort[0]=date:desc&pagination[page]=1&pageSize=12
```

El cuerpo `content` llega como markdown+html; el loader del front lo renderiza con el parser de Astro.

## 🔁 Publicación automática del front

Al crear, editar o borrar una entrada (eventos de webhook) el CMS notifica el **build hook de Netlify**, regenerando el sitio. Configuración en **Settings → Webhooks** del admin.

## 🌐 Despliegue (Render)

El repo incluye el blueprint `render.yaml`: en Render, **New → Blueprint** conectando el repo crea el servicio automáticamente.

1. New → Blueprint y conectar el repo.
2. El blueprint define el build (`corepack enable && NODE_ENV=development pnpm install --frozen-lockfile && pnpm build`) y el start (`pnpm start`).
3. En **Environment**, rellena los valores de las claves marcadas `sync: false` copiándolos de tu `.env`:
   `DATABASE_URL`, `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY`, `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`.
4. Añade el custom domain (ej. `cms.agitalosuave.com`) en Service Settings.

> **Importante:** la instancia es **stateless** — los datos viven en Supabase y los archivos en Cloudinary, así que no necesita disco persistente. El build usa `NODE_ENV=development` solo para instalar devDependencies (Strapi necesita TypeScript para compilar); en runtime se corre con `NODE_ENV=production`.

## 🧞 Comandos

| Comando | Descripción |
| --- | --- |
| `pnpm develop` | Dev con hot reload |
| `pnpm build` | Compila el admin panel |
| `pnpm start` | Corre la app (build previo requerido) |

---

Hecho con 🧉 y coctelera por **Agítalo Suave** — [agitalosuave.com](https://agitalosuave.com)
