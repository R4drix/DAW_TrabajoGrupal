# Cataga Club — Sistema de Gestión Integral

Sistema web para la gestión de un resort con tres servicios independientes
(Hotel, Sauna y Restaurante), construido con **Django** (backend) y
**Angular 22** (frontend). Este README documenta el estado actual del
proyecto, qué se hizo, cómo se hizo y qué falta.

---

## 1. Estado de las ramas

| Rama | Qué contiene | Estado |
|---|---|---|
| `main` | Estructura inicial (Angular + Django + readme del compañero) | base |
| `FrontendShovi`, `ramitaD` | Trabajo del compañero en frontend Angular | paralelo |
| `feat-modelos` | Modelos + CRUD inicial de tu compañero (en `gestion_wellness`) | sustituida |
| `fix/rename-app-bug` | Renombre `gestion_wellness` → `club`, fix del bug, signals, auth | mergeada en feat/frontend-api-client |
| `feat/frontend-api-client` | Cliente Angular consumiendo la API + CORS + 3 vistas nuevas | actual |

---

## 2. Lo que se hizo en esta rama (`feat/frontend-api-client`)

### 2.1 Backend — habilitación de CORS

**Qué cambió:** se instaló `django-cors-headers` y se configuró para
permitir que el frontend Angular (en `http://localhost:4200`) pueda
hacer `fetch`/`HttpClient` contra el backend (en `http://localhost:8765`).

**Por qué:** por defecto, los navegadores bloquean peticiones entre
orígenes distintos (CORS policy). Si Angular pide a Django sin
configurar CORS, el navegador devuelve error.

**Cómo se hace:**

`backend/CatagaClub/CatagaClub/settings.py`:

```python
INSTALLED_APPS = [
    ...
    'corsheaders',  # 1) registrar la app
    'club',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # 2) el middleware va ANTES de CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    ...
]

# 3) declarar orígenes permitidos
CORS_ALLOWED_ORIGINS = [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
]
CORS_ALLOW_CREDENTIALS = True
```

Para validar que el preflight funciona:

```bash
curl -X OPTIONS \
  -H "Origin: http://localhost:4200" \
  -H "Access-Control-Request-Method: GET" \
  -i http://127.0.0.1:8765/club/api/estado/
```

Debe responder con `access-control-allow-origin: http://localhost:4200`.

---

### 2.2 Frontend — `ApiService` centralizado

**Qué cambió:** se creó un servicio Angular único que centraliza las
peticiones HTTP al backend.

**Por qué:** sin un servicio centralizado, cada componente repite la
URL base y los headers. Con un `ApiService` cualquier componente puede
pedir datos sin duplicar lógica.

**Cómo se hace:**

`frontend/CatagaClubFrontend/src/app/services/api.service.ts`:

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Consumo, Dashboard, Habitacion, Reserva } from './models';

@Injectable({ providedIn: 'root' })  // singleton global
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8765/club/api';

  getEstadoHabitaciones() {
    return this.http.get<{ ok: boolean; count: number; habitaciones: Habitacion[] }>(
      `${this.baseUrl}/estado/`
    );
  }
  // getReservas, getConsumos, getDashboard análogos
}
```

Conceptos clave:
- `@Injectable({ providedIn: 'root' })` → una sola instancia para toda la app.
- `inject(HttpClient)` → la forma moderna (Angular 14+) de inyectar dependencias sin constructor.
- `Observable<T>` → Angular usa RxJS para peticiones asíncronas. `T` es el tipo de respuesta esperado.

---

### 2.3 Frontend — modelos TypeScript

**Qué cambió:** se definieron interfaces que describen la forma del
JSON que devuelve el backend.

**Por qué:** TypeScript valida en tiempo de compilación que los datos
que llegan del backend coincidan con lo que el componente espera. Sin
esto, un cambio silencioso en el backend rompe la app sin avisar.

`frontend/CatagaClubFrontend/src/app/services/models.ts`:

```typescript
export interface Habitacion {
  id: number;
  numero: number;
  tipo: string;
  precio_por_noche: number;
  capacidad: number;
  esta_ocupada: boolean;
}

export interface Dashboard {
  clientes: number;
  habitaciones_total: number;
  habitaciones_ocupadas: number;
  reservas_activas: number;
  ingresos_restaurante_hoy: number;
  consumos_hoy: number;
}
// Reserva y Consumo análogos
```

---

### 2.4 Frontend — `provideHttpClient` en `app.config.ts`

**Qué cambió:** se agregó `provideHttpClient(withFetch())` en la
configuración raíz de Angular.

**Por qué:** en Angular 18+ los providers se registran con funciones
`provide*` en lugar de `HttpClientModule`. Sin esto, cualquier
inyección de `HttpClient` falla.

`frontend/CatagaClubFrontend/src/app/app.config.ts`:

```typescript
import { provideHttpClient, withFetch } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),  // <-- habilita HttpClient
  ],
};
```

`withFetch()` usa la API `fetch` nativa del navegador en lugar de
`XMLHttpRequest` (más moderna y mejor para SSR).

---

### 2.5 Frontend — componente `Habitaciones` reparado

**Qué cambió:** se eliminó un bug grave (doble `@Component` decorando
la misma clase) y se conectó a la API real.

**El bug original** (`habitaciones.ts` antes):
```typescript
@Component({ ... })  // 1er decorator
export class Habitaciones { ... }

@Component({ selector: 'app-habitaciones', ... })  // 2do decorator sobre la misma clase
export class Habitaciones implements OnInit { ... }
```
Esto no compila en Angular moderno. Además importaba `CommonModule`
sin importarlo y usaba `NgFor` que ya no existe en Angular 17+.

**Cómo se hace ahora** (`pages/habitaciones/habitaciones.ts`):

```typescript
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Habitacion } from '../../services/models';

@Component({
  selector: 'app-habitaciones',
  standalone: true,            // Angular 22: standalone por defecto
  imports: [CommonModule],     // habilita *ngIf, *ngFor, pipes
  templateUrl: './habitaciones.html',
  styleUrls: ['./habitaciones.css'],
})
export class Habitaciones implements OnInit {
  private readonly api = inject(ApiService);

  habitaciones: Habitacion[] = [];
  loading = true;
  errorMsg = '';

  ngOnInit(): void {
    this.api.getEstadoHabitaciones().subscribe({
      next: (resp) => {
        this.habitaciones = resp.habitaciones ?? [];
        this.habitacionSeleccionada = this.habitaciones[0] ?? null;
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = `No se pudo conectar (${err.status ?? 'sin status'}).`;
        this.loading = false;
      },
    });
  }
}
```

Patrón importante: el método `subscribe` recibe un objeto con `next`
y `error`. `next` se ejecuta cuando llega respuesta exitosa; `error`
cuando falla (red caída, 404, 500, etc.).

---

### 2.6 Frontend — componente `Dashboard`

**Qué cambió:** nueva página que muestra 6 métricas obtenidas de
`/club/api/dashboard/`.

**Cómo se hace:**
- En `dashboard.ts` se inyecta `ApiService` y se llama `getDashboard()`
  en `ngOnInit`.
- En `dashboard.html` se renderiza con `*ngIf="data"` para esperar a
  que llegue la respuesta, y `{{ data.clientes }}` para interpolar.

Ubicación: `frontend/CatagaClubFrontend/src/app/pages/dashboard/`

---

### 2.7 Frontend — componente `Reservas`

**Qué cambió:** nueva página que lista reservas en una tabla con
badges de estado.

**Cómo se hace:**
- Tabla HTML con `*ngFor="let r of reservas"`.
- Badge dinámico: `[ngClass]="badgeClass(r.estado)"` aplica clase
  CSS según el estado (`activa` → `bg-success`, `cancelada` → `bg-danger`).
- `r.total` viene como número desde el JSON; se renderiza con `$ {{ r.total }}`.

Ubicación: `frontend/CatagaClubFrontend/src/app/pages/reservas/`

---

### 2.8 Frontend — rutas

`frontend/CatagaClubFrontend/src/app/app.routes.ts`:

```typescript
export const routes: Routes = [
  { path: '', component: Home },
  { path: 'habitaciones', component: Habitaciones },
  { path: 'sauna', component: Sauna },
  { path: 'nosotros', component: Nosotros },
  { path: 'dashboard', component: DashboardComponent },  // nueva
  { path: 'reservas', component: Reservas },             // nueva
];
```

Las rutas se acceden vía `/dashboard` y `/reservas` cuando `ng serve`
está corriendo en :4200.

---

## 3. Cómo ejecutar el proyecto completo

### 3.1 Backend

```bash
cd backend/CatagaClub

# Crear venv (solo la primera vez)
python3 -m venv .venv

# Instalar dependencias
.venv/bin/pip install -r requirements.txt

# Aplicar migraciones
.venv/bin/python manage.py migrate

# Crear superusuario (solo la primera vez)
DJANGO_SUPERUSER_PASSWORD=admin123 .venv/bin/python manage.py createsuperuser \
  --noinput --username admin --email admin@cataga.local

# Levantar el server
.venv/bin/python manage.py runserver 0.0.0.0:8765
```

Visitar:
- `http://localhost:8765/club/` → home del panel (requiere login)
- `http://localhost:8765/club/habitaciones/` → habitaciones (público)
- `http://localhost:8765/admin/` → admin Django
- `http://localhost:8765/accounts/login/` → login

### 3.2 Frontend

```bash
cd frontend/CatagaClubFrontend

# Instalar dependencias (solo la primera vez)
npm install

# Levantar dev server
npx ng serve
```

Visitar: `http://localhost:4200/`

### 3.3 Probar la conexión API

Con ambos servers corriendo, abrí `http://localhost:4200/habitaciones`
y deberías ver la lista de habitaciones. La pestaña `/dashboard` muestra
métricas y `/reservas` muestra el listado.

Si ves error de conexión, verificá:
1. Backend en :8765 → `curl http://localhost:8765/club/api/estado/`
2. CORS configurado → curl con `-H "Origin: http://localhost:4200"`
3. Ng serve en :4200 → `curl http://localhost:4200/`

---

## 4. Lo que falta por hacer

### 4.1 Opcionales de la rúbrica (+7 pts)

| Item | Pts | Descripción | Rama sugerida |
|---|---|---|---|
| **Reporte PDF de cuenta de reserva** | +2 | Generar PDF descargable con la cuenta de la reserva (hospedaje + consumos + total). Usar `xhtml2pdf`. | `feat/pdf-report` |
| **Envío de correo al confirmar reserva** | +2 | Al crear una reserva activa, enviar email al cliente con resumen. Usar `django.core.mail.send_mail` + console backend en dev. | `feat/email-notifications` |
| **Publicar en la web (deploy)** | +3 | Subir backend a Render/Railway y frontend a Vercel/Netlify, o todo junto con gunicorn + whitenoise + Postgres. | `feat/deploy` |

### 4.2 Mejoras funcionales (no puntúan, pero son valiosas)

1. **CRUD desde el frontend** — actualmente el frontend solo lee. Falta
   poder crear/editar/borrar habitaciones, clientes y reservas desde la
   UI Angular (forms reactivos + HttpClient POST/PUT/DELETE).

2. **Paginación y filtros** en `/reservas` y `/consumos` cuando crezca
   el volumen de datos.

3. **Refresh automático** del dashboard cada 30s con `setInterval` + RxJS.

4. **Login desde Angular** — actualmente el login es del backend Django.
   Hacer una pantalla de login en Angular que use `HttpClient.post` a
   `/accounts/login/` con CSRF y guarde la sesión en una cookie.

5. **Roles y permisos** — `LoginRequiredMixin` ya está, pero falta
   diferenciar recepcionista vs. mozo vs. admin. Usar `UserPassesTestMixin`
   o `django.contrib.auth.decorators`.

6. **Filtros por fecha** en `/reservas` y `/consumos`.

7. **Manejo de errores más elegante** — actualmente solo mostramos un
   `alert-danger`. Falta un servicio `NotificationService` con toasts
   (e.g. ngx-toastr).

8. **Tests automatizados** — backend con `pytest-django` o el test runner
   nativo de Django; frontend con Jasmine/Karma (ya está `vitest`
   instalado).

9. **Documentar API** con `drf-spectacular` o un README con ejemplos
   curl por endpoint.

### 4.3 Limpieza técnica

- Hay un frontend que quedó sin tocar en esta rama: el componente
  `pages/habitaciones/habitaciones.css` aún tiene estilos del HTML
  viejo que ya no se usan. Limpiar en una rama `chore/cleanup-css`.
- Hay un stash guardado llamado `frontend cambios locales sin commit`
  con cambios de `angular.json` y `package-lock.json` que se perdieron
  cuando cambié de rama con archivos modificados. Aplicar o descartar
  según corresponda.

---

## 5. Glosario rápido

- **ORM** — Object-Relational Mapping. Django traduce clases Python a
  tablas SQL. `models.py` define la estructura, `migrate` crea las
  tablas.
- **Migración** — archivo que describe cambios al esquema de BD.
  Django los genera con `makemigrations` y los aplica con `migrate`.
- **CBV** — Class-Based View. Django ofrece vistas genéricas
  (`ListView`, `CreateView`, etc.) que se heredan y configuran.
- **Mixin** — clase que añade comportamiento. `LoginRequiredMixin`
  hace que una vista requiera login.
- **Standalone component** — en Angular 17+, los componentes ya no
  necesitan declararse en un `NgModule`. Se autocontienen.
- **HttpClient** — servicio de Angular para hacer peticiones HTTP.
  Devuelve `Observable` (lazy, cancelable).
- **Namespace** — prefijo que Django agrega a las URLs de una app
  (`{% url 'club:habitacion_lista' %}`). Evita colisiones entre apps.
- **CORS** — Cross-Origin Resource Sharing. Política del navegador
  para controlar qué orígenes pueden llamar a tu API.
- **Preflight** — petición `OPTIONS` que el navegador hace antes de
  un POST/PUT cross-origin para pedir permiso.

---

## 6. Próximo paso sugerido

Crear rama `feat/pdf-report` e implementar:

1. `views.reserva_cuenta_pdf` ya está como stub; reemplazarlo por una
   versión que use `xhtml2pdf` y devuelva `application/pdf`.
2. Template `reserva_cuenta_pdf.html` optimizado para PDF (CSS inline).
3. Botón "Descargar cuenta" en `reserva_detalle.html`.
4. Test con curl: `curl -o cuenta.pdf http://localhost:8765/club/reservas/1/cuenta/`.

Eso suma +2 pts opcionales. Después seguimos con email (+2) y deploy (+3).