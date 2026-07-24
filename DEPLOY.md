# DEPLOY — Cataga Club

Guía paso a paso para subir la app a producción.

## Arquitectura

| Parte | Servicio | URL |
|---|---|---|
| Frontend (Angular) | **Vercel** | `https://cataga-club-frontend.vercel.app` |
| Backend (Django) | **Render** (Web Service) | `https://catagaclub-api.onrender.com` |
| Base de datos | **Render Postgres** (free) o la Supabase que ya tenías | interna |

El frontend en Vercel llama al backend en Render vía CORS.

---

## ✅ Cambios que ya están hechos en este repo (rama `feat/deploy`)

- `vercel.json` en la raíz: Vercel sabe qué construir y qué carpeta servir.
- `frontend/.../src/environments/environment.ts` y `environment.production.ts`: la URL del API ya NO está hardcodeada en `api.service.ts`, viene de la variable `environment.apiBaseUrl`.
- `backend/CatagaClub/CatagaClub/settings.py`: ahora lee `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DATABASE_URL` y `CORS_ALLOWED_ORIGINS_EXTRA` desde variables de entorno. Si no detecta Postgres, cae a SQLite automáticamente.
- `backend/requirements.txt`: agregadas `dj-database-url` y `python-dotenv`.
- `backend/render.yaml`: blueprint de Render con la config del Web Service y la base de datos.
- `backend/build.sh`: script de build (`pip install` + `collectstatic` + `migrate`).
- `backend/Procfile`: comando de arranque con gunicorn.

---

## 🛠️ Pasos manuales que tenés que hacer vos

### 1. Backend en Render

1. Entrá a https://render.com y creá cuenta (o login con GitHub).
2. Click **"New +" → "Blueprint"**.
3. Conectá el repo `R4drix/DAW_TrabajoGrupal`.
4. Render va a detectar `backend/render.yaml` automáticamente y mostrar:
   - Web Service `catagaclub-api`
   - Database `catagaclub-db` (Postgres free)
5. Click **"Apply"**. Render va a:
   - Crear la base Postgres
   - Generar `DJANGO_SECRET_KEY` solo
   - Crear el servicio Django
   - Correr `bash build.sh` y `gunicorn`
6. Esperá a que termine el primer deploy. Te va a dar una URL tipo:
   `https://catagaclub-api.onrender.com`

> ⚠️ Si la URL real que Render te asigna es distinta a `catagaclub-api.onrender.com`, tenés que actualizar 3 lugares:
> 1. `DJANGO_ALLOWED_HOSTS` en el panel de Render (env vars del servicio).
> 2. `CORS_ALLOWED_ORIGINS_EXTRA` no hace falta tocar, lo que importa es el origen del frontend.
> 3. `frontend/.../src/environments/environment.production.ts` → cambiar `apiBaseUrl`.

7. **Probar el backend**: andá a `https://catagaclub-api.onrender.com/club/api/estado/`. Tiene que devolver JSON. (Render en plan free "duerme" tras 15 min sin tráfico, el primer hit tarda ~30s.)

8. (Opcional) Crear superusuario en Render:
   - En el panel del Web Service, abrí **"Shell"** y corré:
     ```bash
     cd CatagaClub && python manage.py createsuperuser
     ```
   - Te va a pedir username, email y password.

### 2. Frontend en Vercel

1. Entrá a https://vercel.com y login con GitHub.
2. Click **"Add New → Project"**.
3. Importá el repo `R4drix/DAW_TrabajoGrupal`.
4. **Root Directory**: dejá la raíz del repo (NO `frontend/`). Vercel va a leer el `vercel.json` que ya está en la raíz.
5. **Framework Preset**: seleccioná **"Other"** (o "Angular" si aparece, pero la config viene del `vercel.json`).
6. Click **"Deploy"**. Vercel va a correr el `buildCommand` del `vercel.json`:
   ```
   cd frontend/CatagaClubFrontend && npm install && npm run build -- --configuration production
   ```
7. Te va a dar una URL tipo `https://cataga-club-frontend.vercel.app`.

> ⚠️ Si Vercel te asigna otra URL, actualizá:
> 1. `frontend/.../src/environments/environment.production.ts` → `apiBaseUrl`.
> 2. `backend/render.yaml` → `CORS_ALLOWED_ORIGINS_EXTRA`.
> 3. En Render, la env var `CORS_ALLOWED_ORIGINS_EXTRA` del servicio.
>
> Después hacé commit y redeploy en ambos.

### 3. Verificación final

- `https://cataga-club-frontend.vercel.app/` → debería cargar el home.
- `https://cataga-club-frontend.vercel.app/habitaciones` → debería mostrar la lista (llamando a la API de Render).
- `https://cataga-club-frontend.vercel.app/dashboard` → métricas.
- Abrí la consola del navegador. Si ves errores de CORS, falta agregar el dominio en `CORS_ALLOWED_ORIGINS_EXTRA` (env var en Render) y redesplegar el backend.

---

## 🔧 Desarrollo local con la nueva config

Antes, el backend usaba Postgres directo. Ahora lee `.env` (gracias a `python-dotenv`).

`backend/.env` (basado en `.env.example`):
```
USE_SQLITE=1
DJANGO_DEBUG=1
```

Y levantás como siempre:
```bash
cd backend/CatagaClub
.venv/bin/python manage.py runserver
```

El frontend sigue igual, `npm start` lee `environment.ts` (que apunta a `localhost:8000`).

---

## 📝 Notas sobre la base de datos

- En **producción** Render crea una Postgres propia. Si querés seguir usando la Supabase que ya tenías, en el panel de Render en lugar de dejar que cree la DB, andá a **"New → PostgreSQL"** (o copiá la connection string de Supabase) y setea `DATABASE_URL` manualmente en las env vars del Web Service. Después borrá la sección `databases:` del `render.yaml` para que no intente crear otra.
- Los datos de las habitaciones, reservas, etc. que tengas localmente NO se migran solos. Si querés migrar la data de Supabase a la nueva DB de Render, exportá con `pg_dump` e importá con `psql`.
