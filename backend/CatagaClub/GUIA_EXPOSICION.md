# Guía para exponer el backend — Cataga Club

Orden sugerido de exposición, archivos a abrir y comandos para demostrarlo en vivo.

---

## 0. Antes de empezar (5 min de setup en vivo)

Servidor ya está creado. Activa el entorno y arranca el server:

```bash
cd /home/iker/Documents/UNSA/3th_Semester/DAW/labs_daw/labs_12/DAW_TrabajoGrupal/backend/CatagaClub
source .venv/bin/activate
python manage.py runserver 0.0.0.0:8765
```

> El puerto `8765` lo eligió tu grupo. Si quieres usar el 8000 normal, omite el puerto.

URLs base que vas a usar:
- `http://localhost:8765/` → redirige a la lista de habitaciones
	- `http://localhost:8765/admin/` → admin Django (user: `admin`, pass: `admin123`)
- `http://localhost:8765/accounts/login/` → login de la app

---

## Bloque 1 — CRUD (Class-Based Views)

### Qué decir
"Django implementa el patrón MVC como MVT. En `views.py` usamos Class-Based Views genéricas (`CreateView`, `ListView`, `DetailView`, `UpdateView`, `DeleteView`) que heredan comportamiento y solo configuran `model`, `form_class`, `template_name` y `success_url`."

### Archivos a mostrar
1. `club/views.py` — las clases (líneas 27-135)
2. `club/urls.py` — el mapeo de rutas con `app_name = 'club'` (namespace)
3. `club/models.py` — los 4 modelos
4. `club/forms.py` — los 4 `ModelForm` con `BootstrapMixin` que aplica clases CSS
5. `club/templates/club/base.html` — navbar con Bootstrap 5
6. `club/templates/club/form.html` — plantilla genérica reutilizada por Create y Update

### Demostración en vivo
1. Abre `http://localhost:8765/club/habitaciones/` (lista pública, sin login)
2. Click en "Nueva" → te pide login → entra con `admin / admin123`
3. Crea una habitación `numero=999, tipo=Suite, precio=150`
4. Aparece en la lista, ábrela, edítala, luego bórrala (pasa por `confirmar_borrado.html`)
5. Repite con un cliente y una reserva para mostrar los 4 modelos

### Rutas clave para mencionar
```
/club/habitaciones/nueva/         → CreateView
/club/habitaciones/<pk>/          → DetailView
/club/habitaciones/<pk>/editar/   → UpdateView
/club/habitaciones/<pk>/borrar/   → DeleteView
```

---

## Bloque 2 — Cálculo automático del total de la reserva

### Qué decir
"El campo `total_acumulado` ya no se ingresa a mano. Se calcula en `Reserva.save()`: multiplica las noches por el precio de la habitación y le suma todos los consumos del restaurante del cliente posteriores al check-in."

### Archivo a mostrar
- `club/models.py` — método `calcular_total()` (líneas 75-81) y `save()` sobrescrito (líneas 83-89)

### Lo importante para explicar
```python
def save(self, *args, **kwargs):
    # 1. valida fechas
    if self.fecha_checkout <= self.fecha_checkin:
        raise ValidationError(...)
    super().save(*args, **kwargs)        # guarda el objeto
    # 2. recalcula y actualiza con update() directo
    self.total_acumulado = self.calcular_total()
    Reserva.objects.filter(pk=self.pk).update(total_acumulado=...)
```

**Por qué `update()` en vez de `self.save()` otra vez:** si llamaras `save()` de nuevo se dispararía la recursión infinita. `update()` va directo a SQL y no pasa por `save()`.

### Demostración en vivo
1. Abre el admin: `http://localhost:8765/admin/club/reserva/`
2. Crea una reserva: cliente "Iker", habitación 101 (precio 100), checkin hoy, checkout en 3 días, estado "activa"
3. Mira `total_acumulado` = 300 (3 noches × 100)
4. Ve a consumos y crea 2 consumos para "Iker" de 20 cada uno
5. Vuelve a la reserva y edítala/guárdala → el total sube a 340 automáticamente

---

## Bloque 3 — Signals para ocupación automática de habitación

### Qué decir
"Cuando se crea o modifica una reserva, un signal `post_save` cambia `esta_ocupada` de la habitación según el estado de la reserva. Al borrar, un `post_delete` libera la habitación si no quedan reservas activas."

### Archivos a mostrar
1. `club/signals.py` — los 3 receivers (32 líneas completas)
2. `club/apps.py` — la línea `from . import signals` en `ready()` (es como Django 'registra' los signals)
3. `club/models.py` líneas 47-66 — campo `esta_ocupada` en `Habitacion`

### Lo importante para explicar
- `post_save` recibe `created` pero no nos importa: si estado='activa' → ocupada, si no → libre
- `post_delete` pregunta a la BD si quedan otras reservas activas para esa habitación antes de liberarla
- Sin signals habría que acordarse de actualizar `esta_ocupada` a mano en cada vista (lo que hacía la versión anterior)

### Demostración en vivo
1. Ve a `http://localhost:8765/club/reservas/nueva/`
2. Crea reserva activa para habitación 101
3. Abre `http://localhost:8765/club/habitaciones/` → la 101 debe aparecer como ocupada
4. Edita la reserva y cambia estado a "finalizada" → la habitación se libera sola
5. Opcional: bórrala → también se libera

---

## Bloque 4 — Autenticación con LoginRequiredMixin

### Qué decir
"Listar y ver detalles es público (cualquier visitante puede ver habitaciones disponibles), pero crear/editar/borrar requiere login de personal autorizado. Esto se hace con dos mixins en `views.py`."

### Archivo a mostrar
- `club/views.py` — líneas 19-24 (los mixins) y 27-135 (quién hereda de cuál)

### Lo importante para explicar
```python
class PublicListMixin:       # vacío, marca semántica
    pass

class ProtectedCRUDMixin(LoginRequiredMixin):
    pass
```

- `ListView`/`DetailView` heredan de `PublicListMixin` → cualquiera entra
- `Create`/`Update`/`Delete` y vistas de reservas/consumos heredan de `ProtectedCRUDMixin` → redirige a `/accounts/login/` si no hay sesión
- CSRF lo da Django gratis por estar en `MIDDLEWARE`

### Demostración en vivo
1. Abre una ventana incógnito (sin login)
2. Entra a `http://localhost:8765/club/habitaciones/` → entra
3. Click en "Nueva habitación" → te manda a `/accounts/login/`
4. Loguéate con `admin / admin123` → te devuelve a la página que querías
5. Menciona `club/templates/club/auth/login.html`

---

## Bloque 5 — API JSON para el frontend Angular

### Qué decir
"4 endpoints públicos que devuelven JSON con la convención `{"ok": true, ...}`. El frontend los consume con `fetch`. Hay un quinto dashboard con métricas agregadas."

### Archivos a mostrar
1. `club/views.py` líneas 138-196 — las 4 vistas función con `@require_GET` y `JsonResponse`
2. `club/urls.py` líneas 37-41 — el prefijo `/club/api/`
3. `CatagaClub/settings.py` — `CORS_ALLOWED_ORIGINS` con `localhost:4200` (Angular)
4. `requirements.txt` — `django-cors-headers==4.6.0`

### Lo importante para explicar
- `JsonResponse(..., safe=False)` permite pasar listas en la raíz
- `@require_GET` rechaza POST/PUT/DELETE con 405
- `select_related('cliente', 'habitacion')` evita el problema N+1
- Límite de 200 resultados por seguridad

### Demostración en vivo (con curl o navegador)
```bash
curl http://localhost:8765/club/api/dashboard/
curl http://localhost:8765/club/api/estado/
curl http://localhost:8765/club/api/reservas/
curl http://localhost:8765/club/api/consumos/
```

O simplemente abre las URLs en el navegador, sale JSON formateado.

Salida esperada de `dashboard`:
```json
{
  "ok": true,
  "clientes": 3,
  "habitaciones_total": 5,
  "habitaciones_ocupadas": 1,
  "reservas_activas": 1,
  "ingresos_restaurante_hoy": 40.0,
  "consumos_hoy": 2
}
```

---

## Cheatsheet: orden y tiempos sugeridos (exposición ~10 min)

| Tiempo    | Bloque     | Qué hacer                                                                  |
| --------- | ---------- | -------------------------------------------------------------------------- |
| 0:00-0:30 | Intro      | Arrancar server, mostrar `http://localhost:8765/`                          |
| 0:30-2:30 | CRUD       | Mostrar `views.py` + URLs, demo crear habitación                           |
| 2:30-4:00 | Total auto | Mostrar `calcular_total()` en `models.py`, demo en admin                   |
| 4:00-5:30 | Signals    | Mostrar `signals.py` completo, demo crear reserva y ver habitación ocupada |
| 5:30-6:30 | Auth       | Mostrar mixins en `views.py`, demo con ventana incógnito                   |
| 6:30-8:00 | API        | Mostrar las 4 funciones JSON, `curl` a los 4 endpoints                     |
| 8:00-9:00 | Preguntas  | Respaldo                                                                   |

---

## Credenciales y datos de prueba
- Admin: `admin / admin123`
- DB: `db.sqlite3` (ya poblada con datos)
- Si necesitas reset: `python manage.py flush` (borra todo)

## Archivos que NO necesitas abrir en la exposición
- `CatagaClub/settings.py` (solo menciona CORS y DEBUG)
- `static/` (vacío)
- `migrations/` (interno de Django)
- `manage.py` (no aporta a la explicación)
