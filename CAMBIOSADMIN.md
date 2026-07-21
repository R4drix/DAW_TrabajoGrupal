# Cambios — Login restringido a usuarios administradores

Este documento resume todos los cambios realizados para que el login
de la SPA Angular (CatagaClubFrontend) solo acepte usuarios con
`is_staff=True` del backend Django (CatagaClub).

---

## Backend (Django)

### `backend/CatagaClub/club/views.py`

Se agregó una nueva vista JSON `api_login_admin` y el import
necesario de `django.contrib.auth.authenticate`.

- Import nuevo (al inicio del archivo):
  ```python
  from django.contrib.auth import authenticate
  ```
- Nueva vista (insertada en la sección `# ── APIs JSON`):
  ```python
  @csrf_exempt
  def api_login_admin(request):
      """
      Login JSON para Angular.
      Solo permite el acceso a usuarios con is_staff=True
      (is_superuser implica is_staff, por lo que el superusuario también entra).
      """
      if request.method != 'POST':
          return JsonResponse({'ok': False, 'error': 'Método no permitido.'}, status=405)

      try:
          body = json.loads(request.body or '{}')
      except json.JSONDecodeError:
          return JsonResponse({'ok': False, 'error': 'JSON inválido.'}, status=400)

      username = (body.get('username') or '').strip()
      password = body.get('password') or ''

      if not username or not password:
          return JsonResponse(
              {'ok': False, 'error': 'Usuario y contraseña son obligatorios.'},
              status=400,
          )

      user = authenticate(request, username=username, password=password)

      if user is None:
          return JsonResponse(
              {'ok': False, 'error': 'Credenciales incorrectas.'},
              status=401,
          )

      if not user.is_staff:
          return JsonResponse(
              {'ok': False, 'error': 'No tiene permisos de administrador.'},
              status=403,
          )

      return JsonResponse({
          'ok': True,
          'user': {
              'id': user.id,
              'username': user.username,
              'email': user.email,
              'is_staff': user.is_staff,
              'is_superuser': user.is_superuser,
          },
      }, status=200)
  ```

**Códigos de respuesta:**
- `200` → login correcto (datos del usuario).
- `400` → faltan campos o JSON inválido.
- `401` → credenciales incorrectas.
- `403` → usuario autenticado pero sin `is_staff`.
- `405` → método distinto a `POST`.

### `backend/CatagaClub/club/urls.py`

Se agregó la ruta nueva dentro del bloque `urlpatterns`:

```python
path('api/auth/login/', views.api_login_admin, name='api_login_admin'),
```

URL final expuesta: `http://localhost:8000/club/api/auth/login/`.

---

## Frontend (Angular)

### `frontend/CatagaClubFrontend/src/app/services/models.ts`

Se agregaron las interfaces `AuthUser` y `LoginResponse`:

```typescript
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface LoginResponse {
  ok: boolean;
  user?: AuthUser;
  error?: string;
}
```

### `frontend/CatagaClubFrontend/src/app/services/login-service.ts`

Reescrito por completo:

```typescript
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthUser, LoginResponse } from './models';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly apiUrl = 'http://localhost:8000/club/api';
  private http = inject(HttpClient);

  public user: AuthUser | null = null;
  public isLogged = signal<boolean>(false);

  public login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login/`, {
      username,
      password,
    });
  }

  public logout(): void {
    this.user = null;
    this.isLogged.set(false);
  }
}
```

**Cambios clave:**
- URL real apuntando a Django (antes era `''`).
- Se eliminó el `user` hardcodeado con datos ficticios.
- `isLogged` ya no arranca en `true`.
- `login` ahora envía JSON (antes usaba `FormData`).
- `logout` resetea también el `user`.

### `frontend/CatagaClubFrontend/src/app/pages/login/login.ts`

Reescrito el `onSubmit` para validar la respuesta y mostrar errores:

```typescript
onSubmit() {
  if (!this.username || !this.password) {
    this.errorMessage = 'Por favor, rellene todos los campos.';
    return;
  }

  this.isLoading = true;
  this.errorMessage = '';

  this.login.login(this.username, this.password).subscribe({
    next: (res) => {
      if (res.ok && res.user && res.user.is_staff) {
        this.login.user = res.user;
        this.login.isLogged.set(true);
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage =
          res.error || 'No tiene permisos de administrador.';
      }
      this.isLoading = false;
    },
    error: (err) => {
      const backendMsg = err?.error?.error;
      this.errorMessage =
        backendMsg ||
        (err.status === 0
          ? 'No se pudo conectar con el servidor.'
          : 'Error al iniciar sesión.');
      this.isLoading = false;
    },
  });
}
```

**Cambios clave:**
- Solo marca `isLogged` y navega si la respuesta trae `is_staff: true`.
- Muestra el mensaje del backend cuando las credenciales son
  incorrectas (401) o no hay permisos (403).
- Resetea `isLoading` siempre.

### `frontend/CatagaClubFrontend/src/app/guards/auth.guard.ts` (nuevo)

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../services/login-service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(LoginService);
  const router = inject(Router);

  if (auth.isLogged()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
```

### `frontend/CatagaClubFrontend/src/app/guards/admin.guard.ts` (nuevo)

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../services/login-service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(LoginService);
  const router = inject(Router);

  if (auth.isLogged() && auth.user?.is_staff) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
```

### `frontend/CatagaClubFrontend/src/app/app.routes.ts`

Se importaron los guards y se aplicaron a las rutas protegidas:

```typescript
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

// ...

{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [authGuard, adminGuard],
},
{
  path: 'reservas',
  component: Reservas,
  canActivate: [authGuard],
},
{
  path: 'admin',
  canActivate: [authGuard, adminGuard],
  children: [
    {path: '', component: AdminHome},
    {path: 'habitaciones', component: AdminHabitaciones}
  ]
}
```

### `frontend/CatagaClubFrontend/src/app/shared/navbar/navbar.ts`

Se quitó el import sin usar `User` y se corrigió la redirección tras
logout:

```typescript
public logout() {
  this.login.logout();
  this.router.navigate(['/home'])
}
```

### `frontend/CatagaClubFrontend/src/app/shared/navbar/navbar.html`

Se adaptó para usar las propiedades de `AuthUser` (antes leía
`permisoAdmin`, `membresia`, `reservasActivas` que ya no existen):

- `login.user?.permisoAdmin` → `login.user?.is_staff`
- `login.user?.nombre` → `login.user?.username`
- Bloque "Membresía / Reservas activas" reemplazado por "Rol"
  mostrando `Superusuario` / `Administrador` / `Estándar` según
  `is_superuser` / `is_staff`.

---

## Verificación

### Backend
Compilación de Python: OK.
Importación Django: OK.
Resolución de URL: `reverse('club:api_login_admin')` →
`/club/api/auth/login/`.

Pruebas con `curl`:
| Caso | Respuesta |
| --- | --- |
| Usuario sin `is_staff` | `403` "No tiene permisos de administrador." |
| Password incorrecta | `401` "Credenciales incorrectas." |
| Usuario con `is_staff=True` | `200` con datos del usuario |

### Frontend
`ng build --configuration=development` finaliza sin errores.

---

## Cómo probar en el navegador

1. Crear un superusuario (ya cuenta con `is_staff=True`):
   ```bash
   python manage.py createsuperuser
   ```
2. Crear un usuario normal (sin `is_staff`):
   ```bash
   python manage.py shell -c "from django.contrib.auth.models import User; u=User.objects.create_user('cliente1','c@c.com','1234'); u.is_staff=False; u.is_superuser=False; u.save()"
   ```
3. Levantar Django (`python manage.py runserver`) y Angular (`ng serve`).
4. En `/login` intentar con el usuario normal → debe mostrar el
   mensaje "No tiene permisos de administrador."
5. Intentar con el superusuario → debe redirigir a `/dashboard`.
6. Intentar acceder a `/dashboard` o `/admin` sin login → debe
   redirigir a `/login`.
