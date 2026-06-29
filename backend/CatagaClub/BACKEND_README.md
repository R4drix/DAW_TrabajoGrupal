# Cataga Club — Backend (Django)

App Django que expone el panel administrativo (HTML + Bootstrap 5) y
una API JSON consumida por el frontend Angular.

---

## Estructura

```
backend/CatagaClub/
├── CatagaClub/                # proyecto Django (settings, urls, wsgi)
│   ├── settings.py
│   ├── urls.py                # incluye namespace 'club'
│   ├── asgi.py / wsgi.py
├── club/                      # <-- app independiente
│   ├── models.py              # Cliente, Habitacion, Reserva, ConsumoRestaurante
│   ├── views.py               # 16 class-based views + 4 endpoints JSON
│   ├── urls.py                # namespace 'club', 22 rutas
│   ├── forms.py               # 4 ModelForm con widgets Bootstrap
│   ├── signals.py             # signals post_save/post_delete en Reserva
│   ├── admin.py               # registro de los 4 modelos
│   ├── migrations/
│   ├── templates/club/        # 12 plantillas + base.html
│   │   ├── base.html          # navbar + Bootstrap 5 CDN
│   │   ├── auth/login.html
│   │   ├── habitacion_lista.html / habitacion_detalle.html
│   │   ├── cliente_lista.html
│   │   ├── reserva_lista.html / reserva_detalle.html / reserva_cuenta.html
│   │   ├── consumo_lista.html
│   │   ├── form.html          # formulario genérico
│   │   ├── home.html
│   │   └── confirmar_borrado.html
├── static/                    # archivos estáticos (vacío por ahora)
├── manage.py
├── requirements.txt
├── readme.md                  # readme original del compañero
```

---

## Modelos

### `Cliente`
| Campo | Tipo | Notas |
|---|---|---|
| `nombre` | CharField(100) | único case-insensitive (validado en form) |
| `email` | EmailField | opcional pero usado para notificaciones |
| `telefono` | CharField(20) | opcional |
| `esta_en_sauna` | BooleanField | acceso al sauna |
| `creado_en` | DateTimeField | auto_now_add |

### `Habitacion`
| Campo | Tipo | Notas |
|---|---|---|
| `numero` | IntegerField | único |
| `tipo` | CharField(50) | choices: Individual, Doble, Suite, Familiar |
| `precio_por_noche` | DecimalField(8,2) | > 0 (validado) |
| `capacidad` | PositiveIntegerField | default 2 |
| `esta_ocupada` | BooleanField | **actualizado automáticamente por signal** |

### `Reserva`
| Campo | Tipo | Notas |
|---|---|---|
| `cliente` | FK → Cliente | CASCADE |
| `habitacion` | FK → Habitacion | PROTECT (no se borra hab con reserva) |
| `fecha_checkin` | DateField | no en pasado (validado) |
| `fecha_checkout` | DateField | > checkin (validado) |
| `estado` | CharField | activa / finalizada / cancelada |
| `total_acumulado` | DecimalField(10,2) | **calculado en save()** |

### `ConsumoRestaurante`
| Campo | Tipo | Notas |
|---|---|---|
| `cliente` | FK → Cliente | related_name='consumos_restaurante' |
| `descripcion_plato` | CharField(100) | |
| `precio` | DecimalField(8,2) | > 0 |
| `cantidad` | PositiveIntegerField | default 1 |
| `fecha` | DateTimeField | auto_now_add |

---

## Signals (`club/signals.py`)

### `post_save` en `Reserva`
Cuando se crea o modifica una reserva:
- Si `estado='activa'` → marca `habitacion.esta_ocupada = True`.
- Si `estado='finalizada'` o `'cancelada'` → libera la habitación.

Esto reemplaza la actualización manual que tenía la versión anterior.

### `post_delete` en `Reserva`
Al borrar una reserva, libera la habitación **solo si no quedan otras
reservas activas** apuntando a ella.

---

## Lógica de cuenta automática

`Reserva.save()` hace dos cosas:

1. **Valida fechas:** `fecha_checkout > fecha_checkin`.
2. **Recalcula `total_acumulado`:**
   ```
   total = (noches × precio_por_noche)
         + Σ(precio × cantidad) de Consumos del cliente
   ```
   Donde `noches = (checkout - checkin).days`.

El método `Reserva.calcular_total()` desglosa ese cálculo. `save()`
lo invoca y luego hace un `update()` directo al campo para evitar
recursión infinita.

---

## API JSON

Todas devuelven `{"ok": true, ...}` para que el frontend pueda
discriminar errores con un solo check.

| Endpoint | Método | Auth | Descripción |
|---|---|---|---|
| `/club/api/estado/` | GET | público | Lista habitaciones con id, numero, tipo, precio, ocupada, capacidad |
| `/club/api/reservas/` | GET | público | Lista reservas con cliente, habitación, fechas, estado, total |
| `/club/api/consumos/` | GET | público | Lista consumos del restaurante con subtotal |
| `/club/api/dashboard/` | GET | público | Métricas agregadas (clientes, habs, reservas, ingresos hoy) |

Limitado a 200 resultados cada uno. Si se necesita paginación,
agregar `?limit=` y `?offset=` con `queryset[offset:offset+limit]`.

---

## Autenticación y seguridad

- `LoginRequiredMixin` en todas las vistas de **escritura** (Create/Update/Delete).
- `ListView` y `DetailView` son **públicas** (cualquiera puede ver
  habitaciones, pero no modificarlas).
- CSRF activo por defecto (Django ya lo incluye en `MIDDLEWARE`).
- `CORS_ALLOWED_ORIGINS` restringido a `localhost:4200` y `127.0.0.1:4200`
  (configurable en `settings.py`).
- `ALLOWED_HOSTS` está vacío en dev; para deploy agregar el dominio.

---

## Variables que conviene parametrizar

En `settings.py`, mover a variables de entorno antes del deploy:

```python
import os
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '...')
DEBUG = os.environ.get('DJANGO_DEBUG', '1') == '1'
ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(',')
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.environ.get('EMAIL_HOST')
# ... etc
```

Eso se hace en la rama `feat/deploy`.

---

## Tests

`python manage.py test club` corre los tests automáticos (vacíos por
ahora). Para agregar tests:

```python
# club/tests.py
from django.test import TestCase
from .models import Cliente, Habitacion, Reserva

class ReservaTotalTest(TestCase):
    def test_total_incluye_noches_y_consumos(self):
        cliente = Cliente.objects.create(nombre='Test')
        hab = Habitacion.objects.create(numero=1, tipo='Suite', precio_por_noche=100)
        reserva = Reserva.objects.create(
            cliente=cliente, habitacion=hab,
            fecha_checkin='2026-07-01', fecha_checkout='2026-07-04',
        )
        ConsumoRestaurante.objects.create(
            cliente=cliente, descripcion_plato='Café', precio=10, cantidad=2
        )
        # 3 noches × 100 + 1 consumo × 20 = 320
        self.assertEqual(reserva.calcular_total(), Decimal('320'))
```

---

## Endpoints útiles para debugging

```bash
# Estado del servidor
curl -i http://localhost:8765/club/api/dashboard/

# Crear habitación (requiere login + CSRF)
# Ver sección 2.1 del README raíz para el flujo completo con curl

# Acceder al admin
# http://localhost:8765/admin/ (usuario: admin, pass: admin123)
```