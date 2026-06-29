# Cosas que faltan por hacer

Checklist de tareas pendientes para el proyecto Cataga Club. Cada item
tiene puntaje según la rúbrica del profesor y la rama Git sugerida
para pair programming con tu compañero.

---

## Opcionales de la rúbrica (+7 pts)

Estos son los puntos extra que pide el profesor. Son **opcionales**
pero suman a la nota final.

| # | Tarea | Pts | Rama | Dificultad | Tiempo estimado |
|---|---|---|---|---|---|
| 1 | Generar PDF descargable con la cuenta de una reserva (hospedaje + consumos + total) usando `xhtml2pdf` | +2 | `feat/pdf-report` | baja | 2-3 h |
| 2 | Enviar email al cliente cuando se crea una reserva activa, usando `django.core.mail.send_mail` | +2 | `feat/email-notifications` | baja | 1-2 h |
| 3 | Publicar la app en internet (backend en Render/Railway + frontend en Vercel/Netlify, o gunicorn + Postgres + whitenoise) | +3 | `feat/deploy` | media | 4-6 h |

**Total posible si se hacen todos: +7 pts.**

---

## Mejoras funcionales (no puntúan, pero valen la pena)

Estas mejoras no aparecen explícitamente en la rúbrica pero hacen
que la app sea más completa, usable y presentable para la
exposición.

### Frontend Angular

| # | Tarea | Descripción | Rama sugerida |
|---|---|---|---|
| 4 | CRUD desde Angular | Forms reactivos + HttpClient POST/PUT/DELETE para crear/editar/borrar habitaciones, clientes, reservas y consumos desde la UI | `feat/angular-crud` |
| 5 | Login desde Angular | Pantalla de login que use HttpClient.post a `/accounts/login/` con CSRF, guardar sesión en cookie, mostrar usuario en navbar | `feat/angular-login` |
| 6 | Refresh automático del dashboard | `setInterval` + RxJS que recarga `/club/api/dashboard/` cada 30 segundos sin recargar la página | `feat/dashboard-refresh` |
| 7 | Paginación y filtros | En `/reservas` y `/consumos` cuando crezca el volumen, agregar `?limit=` y `?offset=` en backend y un componente de paginación en Angular | `feat/pagination` |
| 8 | Toasts/notifications | Reemplazar los `alert-danger` por un `NotificationService` con librería tipo `ngx-toastr` | `feat/angular-toasts` |
| 9 | Gráficos en el dashboard | Usar `ngx-charts` o `chart.js` para visualizar habitaciones ocupadas vs libres, ingresos por día, etc. | `feat/dashboard-charts` |
| 10 | Formulario de reserva con autocompletado | Cuando el usuario tipea el nombre del cliente, autocompletar desde la lista existente; al elegir habitación, mostrar precio actualizado | `feat/booking-ux` |

### Backend Django

| # | Tarea | Descripción | Rama sugerida |
|---|---|---|---|
| 11 | Roles y permisos | Diferenciar recepcionista (solo hotel) vs. mozo (solo restaurante) vs. admin (todo). Usar `UserPassesTestMixin` o grupos de Django | `feat/roles-permissions` |
| 12 | Historial de check-in/check-out | Campo `fecha_checkin_real` y `fecha_checkout_real` separados de los planeados, para reportes | `feat/audit-fields` |
| 13 | Búsqueda y filtros | En el listado de habitaciones, filtro por tipo/estado; en reservas, filtro por fecha/cliente/estado | `feat/search-filters` |
| 14 | Soft delete | No borrar reservas/consumos, marcarlos como inactivos. Útil para auditoría | `feat/soft-delete` |
| 15 | Exportar a CSV/Excel | Botón "Exportar" en listados para descargar en formato tabular | `feat/export-csv` |
| 16 | Internacionalización | Strings en español e inglés usando `gettext_lazy` y `LANGUAGE_CODE` | `feat/i18n` |

---

## Calidad y testing

| # | Tarea | Descripción | Rama sugerida |
|---|---|---|---|
| 17 | Tests backend | `pytest-django` o el test runner nativo. Cubrir al menos: cálculo de `total_acumulado`, signals, validaciones de forms | `feat/backend-tests` |
| 18 | Tests frontend | `vitest` (ya está instalado). Cubrir `ApiService`, `DashboardComponent`, validaciones de forms | `feat/frontend-tests` |
| 19 | Tests E2E | `playwright` o `cypress` para flujos completos: login → crear reserva → ver dashboard | `feat/e2e-tests` |
| 20 | Linter y formateador | Backend: `ruff` + `black`. Frontend: ESLint + Prettier (Prettier ya está en devDependencies) | `feat/linting` |

---

## Limpieza técnica

| # | Tarea | Descripción | Rama sugerida |
|---|---|---|---|
| 21 | Limpiar CSS viejo en `habitaciones.css` | El template cambió y hay estilos huérfanos del HTML anterior | `chore/cleanup-css` |
| 22 | Resolver el stash pendiente | Hay un stash llamado `frontend cambios locales sin commit` con cambios en `angular.json` y `package-lock.json` que no se commiteó. Aplicar o descartar | `chore/resolve-stash` |
| 23 | Parametrizar settings para deploy | Mover `SECRET_KEY`, `DEBUG`, `DATABASES`, `EMAIL_*`, `ALLOWED_HOSTS` a variables de entorno con `python-decouple` o `os.environ` | `feat/env-config` |
| 24 | `.env.example` | Crear archivo plantilla con todas las variables de entorno documentadas | `chore/env-example` |
| 25 | Logging | Configurar `LOGGING` en `settings.py` para guardar errores en archivo y mostrar warnings en consola | `feat/logging` |

---

## Documentación

| # | Tarea | Descripción | Rama sugerida |
|---|---|---|---|
| 26 | Documentar API con OpenAPI/Swagger | Usar `drf-spectacular` o `django-rest-swagger` para tener una UI navegable de los 4 endpoints | `feat/api-docs` |
| 27 | Diagramas de arquitectura | Un diagrama simple (puede ser ASCII o Mermaid) en el README mostrando backend, frontend, BD y cómo se conectan | `docs/architecture-diagram` |
| 28 | Manual de usuario | PDF o markdown con pasos para usar el panel: cómo crear habitaciones, registrar clientes, hacer reservas | `docs/user-manual` |
| 29 | Changelog | Archivo `CHANGELOG.md` con qué se hizo en cada versión/feature | `chore/changelog` |

---

## Para la exposición

| # | Tarea | Descripción |
|---|---|---|
| 30 | Demo en vivo preparada | Tener datos cargados (clientes, habitaciones, reservas) para mostrar el dashboard funcionando |
| 31 | Slides de presentación | 5-10 slides: portada, problema, solución, arquitectura, demo, conclusión |
| 32 | Repartir la exposición | Coordinar con tu compañero quién habla de qué. Sugerencia: vos backend (Django + API + BD), él frontend (Angular + UX) |

---

## Resumen de puntaje potencial

| Categoría | Pts |
|---|---|
| Rúbrica obligatoria (ya lograda) | 18 / 20 |
| PDF reporte | +2 |
| Email notificaciones | +2 |
| Deploy público | +3 |
| **Máximo posible** | **25 / 20** |

La nota grupal pesa 60% y la individual 40%. Las mejoras de "exposición"
y "manual de usuario" pueden sumar a la **evaluación cualitativa** del
profesor aunque no sumen puntos explícitos.

---

## Orden sugerido de ejecución

1. **`feat/pdf-report`** — chico, visible, +2 pts seguros
2. **`feat/email-notifications`** — chico, +2 pts
3. **`feat/deploy`** — más trabajo pero +3 pts y visibilidad real
4. Mejoras Angular (CRUD desde UI, login, charts) — opcional pero impresiona
5. Tests y limpieza — al final, antes de la entrega
