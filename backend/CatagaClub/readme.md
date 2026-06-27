# 🏨 Cataga Club - Avance Backend Base

Este archivo contiene la documentación rápida de lo realizado para la funcionalidad actual del proyecto.


## Lo que ya se hizo (`feat-modelos`)
Hemos estructurado la base de datos basándonos en el diagrama UML corporativo. Se creó la app independiente `gestion_wellness` y se definieron tres modelos interconectados utilizando **Claves Externas (Foreign Keys)** para cumplir los puntos de la rúbrica:

1. **`Cliente`**: Registra el nombre y si está en el sauna (`esta_en_sauna`).
2. **`Habitacion`**: Controla el número, tipo, precio y si se encuentra ocupada en tiempo real (`esta_ocupada`).
3. **`Reserva`**: Es la cuenta unificada del club. Conecta a un `Cliente` y, de manera opcional, a una `Habitacion`.

*Nota: Las migraciones ya fueron ejecutadas localmente (`makemigrations` y `migrate`) y las tablas están listas.*

---

##  Tareas Pendientes para el siguiente compañero

Si vas a continuar con el código, por favor abre una rama independiente en Git para cada una de las siguientes tareas pendientes según pide el profesor:

1. **Rama `feat-crud-habitaciones`**: Crear en `views.py` las vistas basadas en clases para gestionar las habitaciones (Listar, Crear, Editar, Detalle, Borrar) y configurar sus rutas en un archivo `urls.py` propio dentro de la app usando `reverse_lazy`.
2. **Rama `feat-seguridad-formularios`**: Diseñar las plantillas HTML (carpeta `templates/gestion_wellness/`) y asegurarse de colocar la etiqueta `{% csrf_token %}` dentro de los formularios para la seguridad del sitio.
3. **Rama `feat-api-json`**: Crear una vista sencilla que devuelva el estado de las habitaciones usando `JsonResponse` para que los de Frontend consuman los datos con AJAX o Angular.

