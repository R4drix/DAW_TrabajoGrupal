# EXPOSICION — Deploy Cataga Club

Documento de apoyo para la exposición. Cubre la arquitectura de deploy
(frontend en Vercel + backend en Render), los archivos clave, la
explicación de la API y los comandos útiles para demostrar en vivo.

---

## 1. Resumen ejecutivo

| Capa | Servicio | URL | Rol |
|---|---|---|---|
| Frontend | **Vercel** | `https://daw-trabajo-grupal-jenkdk50b-iker281521.vercel.app` | Sirve la SPA Angular (HTML + JS + CSS estáticos). |
| Backend  | **Render** (Web Service Python) | `https://catagaclub-api.onrender.com` | Corre Django + Gunicorn. Expone la API REST. |
| Base de datos | **Render Postgres** (free, expira a 90 días) | interna al servicio | Almacena habitaciones, reservas, clientes, consumos, platos, cámaras. |

**¿Por qué Vercel no puede correr Django?**
Vercel ejecuta **funciones serverless** (código que arranca, responde y se apaga). Django necesita un **proceso Python persistente** (gunicorn con un WSGI que quede escuchando en un puerto). Por eso separamos: Vercel para el Angular estático, Render para el Django.

---

## 2. Archivos creados / modificados para el deploy

| Archivo | Estado | Para qué sirve |
|---|---|---|
| `vercel.json` | creado | Le dice a Vercel cómo buildear el Angular y qué carpeta servir como output. |
| `frontend/.../src/environments/environment.ts` | creado | URL del API en **desarrollo** (`http://localhost:8000/club/api`). |
| `frontend/.../src/environments/environment.production.ts` | creado | URL del API en **producción** (`https://catagaclub-api.onrender.com/club/api`). |
| `frontend/.../src/app/services/api.service.ts` | modificado | `ApiService` ahora lee `environment.apiBaseUrl` en lugar de tener `localhost:8000` hardcodeado. |
| `frontend/CatagaClubFrontend/angular.json` | modificado | Subí el budget de `anyComponentStyle` de 4kB/8kB a 8kB/16kB (sino el build fallaba por `reservar.css`). |
| `backend/CatagaClub/CatagaClub/settings.py` | modificado | Lee env vars: `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS_EXTRA`. Carga `.env` con `python-dotenv` en dev. |
| `backend/requirements.txt` | modificado | Agregadas `dj-database-url` (parsea el connection string) y `python-dotenv` (lee `.env` en local). |
| `backend/render.yaml` | creado | **Blueprint** de Render: define el Web Service + la base Postgres. |
| `backend/build.sh` | creado | Script de build: `pip install` + `collectstatic` + `migrate`. |
| `backend/Procfile` | creado | Comando de arranque: `gunicorn CatagaClub.wsgi:application`. |
| `DEPLOY.md` | creado | Pasos manuales para configurar Render y Vercel. |
| `EXPOSICION_DEPLOY.md` | creado (este) | Documento de apoyo para la exposición. |

---

## 3. Cómo funciona el deploy (flujo)

```
   Navegador del usuario
            │
            │ 1. GET https://daw-trabajo-grupal-...vercel.app/
            ▼
   ┌──────────────────────────┐
   │   Vercel (CDN estático)  │   Sirve index.html, main.js, styles.css
   └──────────────────────────┘
            │
            │ 2. Angular arranca, hace HttpClient
            │    GET https://catagaclub-api.onrender.com/club/api/dashboard/
            ▼
   ┌──────────────────────────┐
   │ Render (gunicorn + WSGI) │   Django responde con JSON
   └──────────────────────────┘
            │
            │ 3. Django usa dj-database-url + psycopg2
            ▼
   ┌──────────────────────────┐
   │ Render Postgres (free)   │   Tablas: habitacion, reserva, consumo, etc.
   └──────────────────────────┘
```

Vercel es **solo el cartero del HTML/JS**. Render es el **cerebro** (lógica + DB). El navegador del usuario habla con ambos por separado.

---

## 4. Explicación de la API

### 4.1 ¿Qué es REST?

REST es un estilo de arquitectura para APIs donde cada **URL representa un recurso** y se manipula con los verbos HTTP estándar:

| Verbo | Acción | Ejemplo en este proyecto |
|---|---|---|
| `GET` | Leer | `GET /club/api/estado/` → lista habitaciones |
| `POST` | Crear | `POST /club/api/reservas/` → crea una reserva |
| `PATCH` | Actualizar parcial | `PATCH /club/api/reservas/3/` → cambia estado a "cancelada" |
| `DELETE` | Borrar | `DELETE /club/api/reservas/3/` |

Las respuestas son **JSON**. Django (con `JsonResponse`) las serializa a mano o vía `serializers`.

### 4.2 Endpoints principales

| Método | URL | Qué hace | Función Django |
|---|---|---|---|
| GET | `/club/api/estado/` | Lista habitaciones con estado (libre/ocupada) | `estado_habitaciones_api` |
| GET | `/club/api/reservas/` | Lista reservas activas/históricas | `reservas_api` |
| POST | `/club/api/reservas/` | Crea una reserva nueva | `reservas_api` |
| PATCH | `/club/api/reservas/<id>/` | Actualiza estado/total/notas | `reserva_detalle_api` |
| DELETE | `/club/api/reservas/<id>/` | Elimina una reserva | `reserva_detalle_api` |
| GET | `/club/api/consumos/` | Lista consumos del restaurante | `consumos_api` |
| GET | `/club/api/dashboard/` | Métricas agregadas (clientes, ocupación, ingresos) | `dashboard_api` |
| GET | `/club/api/camaras/` | Cámaras de la sauna | `camaras_api` |
| GET | `/club/api/platos/` | Carta del restaurante | `lista_platos_api` |
| PATCH | `/club/api/platos/<id>/` | Modifica precio/stock de un plato | (PATCH handler) |
| GET | `/club/api/habitaciones/disponibles/` | Filtra habitaciones libres por fechas | `habitaciones_disponibles` |

### 4.3 Archivos clave para mostrar en la exposición

Cuando te pregunten "¿dónde está la API?", entrá a estos archivos en este orden:

1. **`backend/CatagaClub/CatagaClub/urls.py:13`** — tabla de rutas raíz. Acá ves que `/club/` se delega a la app `club` y `/admin/` va al admin de Django.
2. **`backend/CatagaClub/club/urls.py`** — todas las URLs bajo `/club/...` (acá ves los `path()` de cada endpoint de la tabla 4.2).
3. **`backend/CatagaClub/club/views.py`** — la lógica de cada endpoint. Cada función toma `request`, consulta modelos y devuelve `JsonResponse`.
4. **`backend/CatagaClub/club/models.py`** — la estructura de la base de datos (clases `Habitacion`, `Reserva`, `Consumo`, `Plato`, `Camara`, `Cliente`).
5. **`frontend/CatagaClubFrontend/src/app/services/api.service.ts:13`** — el servicio Angular que centraliza todas las llamadas HTTP. Cada método es un `this.http.get/post/patch/delete(...)`.
6. **`frontend/CatagaClubFrontend/src/app/services/models.ts`** — las interfaces TypeScript que describen la forma del JSON. Si cambia el backend, TS te avisa.
7. **`frontend/CatagaClubFrontend/src/environments/environment.production.ts`** — dónde está la URL del API en producción.

### 4.4 CORS (Cross-Origin Resource Sharing)

El frontend (Vercel, dominio A) llama al backend (Render, dominio B). Por defecto el navegador lo bloquea. Solución: `django-cors-headers` configurado en `settings.py:91-103`, que declara explícitamente qué orígenes pueden llamar:

```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:4200',            # dev local
    'http://127.0.0.1:4200',
    'https://cataga-club-frontend.vercel.app',  # prod (alternativa)
]
# + env var CORS_ALLOWED_ORIGINS_EXTRA para sumar la URL real de Vercel
```

---

## 5. Problemas que aparecieron y cómo se resolvieron

| Problema | Causa | Solución |
|---|---|---|
| Render pedía tarjeta de crédito | Política anti-abuso del plan free | Se carga igual; no cobra mientras se esté en free tier. |
| `Blueprint file render.yaml not found on main branch` | Render busca el yaml en la raíz del repo | El archivo está en `backend/render.yaml`. En el campo "Blueprint Path" del form de Render se especifica esa ruta. |
| Build de Angular fallaba: `reservar.css exceeded maximum budget` | El CSS de la página de reservas pasó los 8kB | Subí el budget en `angular.json` a 8kB warning / 16kB error. |
| 5 archivos del frontend con `localhost:8000` hardcodeado | El refactor a `environment.apiBaseUrl` se hizo solo en `api.service.ts` | Pendiente de refactor en `admin-service.ts`, `login-service.ts`, `admin-home.ts`, `admin-reservas.ts`, `admin-sauna.ts`, `restaurante.ts`. |
| `ModuleNotFoundError: No module named 'dj_database_url'` | Faltaba la dep en el venv | Agregada a `requirements.txt` y reinstalada. |

---

## 6. Tareas pendientes

- [ ] Refactorizar los 5 archivos con `localhost:8000` para que usen `environment.apiBaseUrl` (esto es lo que está causando que la página de Vercel no muestre datos).
- [ ] Confirmar que la URL `https://catagaclub-api.onrender.com/club/api` está en `environment.production.ts` y que el frontend la usa en producción.
- [ ] Si la URL de Vercel no es `https://cataga-club-frontend.vercel.app`, agregarla a `CORS_ALLOWED_ORIGINS_EXTRA` en Render (env var del Web Service) y redeploy.
- [ ] Verificar que la DB tiene datos (ver sección 7 — comando `curl`).
- [ ] (Opcional) migrar los datos de Supabase a Render Postgres si la DB actual está vacía y los datos importantes están en Supabase.

---

## 7. Comandos útiles para la exposición

### 7.1 Probar la API en vivo (con la URL real de Render)

```bash
# Estado de habitaciones
curl https://catagaclub-api.onrender.com/club/api/estado/

# Dashboard con métricas
curl https://catagaclub-api.onrender.com/club/api/dashboard/

# Lista de reservas
curl https://catagaclub-api.onrender.com/club/api/reservas/

# Lista de consumos
curl https://catagaclub-api.onrender.com/club/api/consumos/

# Carta del restaurante
curl https://catagaclub-api.onrender.com/club/api/platos/

# Cámaras de sauna
curl https://catagaclub-api.onrender.com/club/api/camaras/
```

### 7.2 Salida formateada (más lindo para mostrar)

```bash
curl -s https://catagaclub-api.onrender.com/club/api/dashboard/ | python3 -m json.tool
```

### 7.3 Verbos POST / PATCH / DELETE (ejemplos)

```bash
# Crear una reserva
curl -X POST https://catagaclub-api.onrender.com/club/api/reservas/ \
  -H "Content-Type: application/json" \
  -d '{"cliente": 1, "habitacion": 1, "llegada": "2026-08-01", "salida": "2026-08-05"}'

# Cambiar estado de una reserva
curl -X PATCH https://catagaclub-api.onrender.com/club/api/reservas/1/ \
  -H "Content-Type: application/json" \
  -d '{"estado": "cancelada"}'

# Eliminar
curl -X DELETE https://catagaclub-api.onrender.com/club/api/reservas/1/
```

### 7.4 Desarrollo local (si te preguntan "¿cómo lo corren en su máquina?")

```bash
# Backend (en una terminal)
cd backend/CatagaClub
USE_SQLITE=1 DJANGO_DEBUG=1 .venv/bin/python manage.py runserver
# → http://localhost:8000

# Frontend (en otra terminal)
cd frontend/CatagaClubFrontend
npm install         # solo la primera vez
npx ng serve
# → http://localhost:4200
```

### 7.5 Git — mostrar el historial de cambios del deploy

```bash
git log --oneline -10
git log --stat feat/deploy  # ver todos los archivos tocados por la rama de deploy
```

### 7.6 Inspeccionar la red en el navegador (DevTools)

Para mostrar en vivo que el frontend está hablando con Render:

1. Abrí `https://daw-trabajo-grupal-jenkdk50b-iker281521.vercel.app/` en Chrome.
2. Presioná **F12** (o clic derecho → "Inspeccionar").
3. Ir a la pestaña **Network**.
4. En el filtro, tildá **Fetch/XHR**.
5. Recargá la página.
6. Vas a ver cada llamada a `catagaclub-api.onrender.com` con su método (GET/POST), status (200, 404, 500) y respuesta JSON.
7. Click en una → pestaña **Response** para ver el JSON crudo.

### 7.7 Verificar si la base de datos tiene datos

**Opción A — desde la API (lo más rápido):**
```bash
# Si count es 0, no hay datos
curl -s https://catagaclub-api.onrender.com/club/api/dashboard/ | python3 -m json.tool
```
Mirá los campos `clientes`, `habitaciones_total`, `reservas_activas`. Si todos son `0`, la DB está vacía.

```bash
# Ver más detalle
curl -s https://catagaclub-api.onrender.com/club/api/estado/ | python3 -m json.tool
curl -s https://catagaclub-api.onrender.com/club/api/reservas/ | python3 -m json.tool
```

**Opción B — desde el panel de Render (visual):**
1. Ir a https://dashboard.render.com
2. Click en la base **`catagaclub-db`**.
3. En el panel izquierdo, **"Shell"** (o "PSQL Command").
4. Correr:
   ```sql
   \dt                              -- lista de tablas
   SELECT COUNT(*) FROM club_habitacion;
   SELECT COUNT(*) FROM club_reserva;
   SELECT COUNT(*) FROM club_cliente;
   SELECT COUNT(*) FROM club_consumo;
   ```
   Si todos devuelven `0`, la DB está vacía.

**Opción C — desde tu máquina con `psql`:**
```bash
# 1. Ir al panel de Render → catagaclub-db → "External Connection" / "Connection String"
# 2. Copiar la URL completa (con password) que te muestra
# 3. Pegarla en tu terminal:
psql "postgresql://catagaclub:XXXXX@dpg-XXXXX-a.oregon-postgres.render.com/catagaclub"
# 4. Una vez adentro de psql:
\dt
SELECT * FROM club_habitacion LIMIT 5;
\q
```

### 7.8 Migrar datos de Supabase a Render

Si tu DB de Render está vacía y los datos importantes están en Supabase:

**Paso 1 — Exportar desde Supabase (en tu máquina local):**
```bash
# Reemplazá con tu connection string de Supabase
pg_dump "postgresql://postgres.xxxx:TU_PASSWORD@aws-1-us-west-1.pooler.supabase.com:5432/postgres" \
  --no-owner --no-acl \
  -f backup_supabase.sql
```
Esto genera un archivo `backup_supabase.sql` con `CREATE TABLE`, `INSERT`, etc.

**Paso 2 — Importar en Render:**
1. En el panel de Render → `catagaclub-db` → "External Connection" → copiá la URL.
2. En tu terminal:
   ```bash
   psql "postgresql://catagaclub:XXXXX@dpg-XXXXX-a.oregon-postgres.render.com/catagaclub" \
     -f backup_supabase.sql
   ```

**Paso 3 — Verificar:**
```bash
curl -s https://catagaclub-api.onrender.com/club/api/dashboard/ | python3 -m json.tool
```
Ahora deberías ver counts > 0.

> **Alternativa más simple (si no querés migrar Supabase):** en Render, en lugar de dejar que cree la DB propia, vas a **Environment → Add Environment Variable** del Web Service, agregás `DATABASE_URL` con la connection string de Supabase, y borrás la sección `databases:` del `render.yaml` (para que Render no intente crear otra DB). El backend va a usar Supabase directamente.

### 7.9 Forzar un redeploy

```bash
# Frontend (Vercel) — push vacío
git commit --allow-empty -m "chore: trigger vercel redeploy"
git push origin main

# Backend (Render) — desde el panel: "Manual Deploy" → "Deploy latest commit"
```

---

## 8. Glosario rápido

- **SPA** — Single Page Application. La página no se recarga, Angular cambia la vista en el navegador.
- **WSGI** — Web Server Gateway Interface. Estándar que permite a gunicorn hablar con Django.
- **gunicorn** — servidor HTTP para Python que mantiene workers vivos.
- **whitenoise** — middleware que sirve archivos estáticos (CSS, JS del admin) directamente desde Django.
- **CORS** — política del navegador para controlar qué orígenes pueden llamar a tu API.
- **Render Blueprint** — archivo YAML que describe la infraestructura (servicios + DB) para que Render la cree de un solo click.
- **Connection string** — URL con credenciales que se le pasa a `psycopg2` para conectarse a Postgres.
- **Collectstatic** — comando de Django que junta todos los archivos estáticos en una sola carpeta para servirlos en producción.
- **Migration** — archivo que describe cambios al esquema de la DB. `migrate` los aplica.

---

## 9. Demo en vivo — guion sugerido (3-5 minutos)

1. **"Esta es la página deployada"** → abrir `https://daw-trabajo-grupal-jenkdk50b-iker281521.vercel.app/`. Mostrar la home, ir a `/habitaciones`, `/dashboard`, `/reservas`.
2. **"Veamos la API directa"** → en una terminal:
   ```bash
   curl -s https://catagaclub-api.onrender.com/club/api/dashboard/ | python3 -m json.tool
   ```
3. **"Las llamadas vienen de Vercel y van a Render"** → DevTools → Network, mostrar el request a `catagaclub-api.onrender.com`.
4. **"El backend es Django"** → mostrar `backend/CatagaClub/club/urls.py` y `views.py` brevemente.
5. **"El frontend es Angular"** → mostrar `frontend/.../api.service.ts` y `environment.production.ts`.
6. **"Render corre el gunicorn"** → panel de Render, mostrar el último deploy y los logs.
7. **"Vercel sirve el bundle estático"** → panel de Vercel, mostrar el último deploy.
