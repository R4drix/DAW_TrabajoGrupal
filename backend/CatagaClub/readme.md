Sistema de Gestión - Cataga Club
Este sistema ha sido diseñado e implementado utilizando el framework Django para la gestión integral de los servicios de un resort. La arquitectura del software se rige bajo un principio de independencia de servicios (Hotel, Sauna y Restaurante), utilizando la entidad del cliente como el nodo central que unifica las operaciones.

1. Arquitectura del Modelo de Datos (models.py)
El diseño de la base de datos utiliza el ORM de Django para definir las tablas y sus relaciones. Los servicios operan de forma autónoma pero conectada mediante la entidad principal del usuario:

Cliente (Módulo Central / Sauna): Almacena la información de identificación del usuario (nombre) y un estado booleano (esta_en_sauna). Este atributo gestiona el acceso directo al servicio de bienestar sin obligar al usuario a contratar alojamiento.

Habitacion (Módulo Hotel): Representa la infraestructura física. Registra el número de habitación (configurado como identificador único), el tipo de habitación, el precio por noche y un indicador de disponibilidad (esta_ocupada).

ConsumoRestaurante (Módulo Gastronómico): Almacena los registros de consumos individuales, tales como la descripción del plato, el precio y la cantidad. La relación (Foreign Key) se orienta directamente hacia el Cliente, posibilitando que visitantes externos consuman en el establecimiento de manera independiente a una reserva de hotel.

Reserva (Módulo de Vinculación): Modela el servicio de hospedaje propiamente dicho. Actúa como una tabla intermedia que vincula a un Cliente con una Habitacion específica mediante llaves foráneas, gestionando las estadías activas y los costos acumulados.

2. Implementación del CRUD en la Arquitectura (views.py)
Las operaciones de creación, lectura, actualización y eliminación de datos (CRUD) se procesan a través de las Vistas Genéricas de Django en el archivo views.py. Estas clases interactúan con los modelos y las plantillas alojadas en el directorio templates/gestion_wellness/.

Create (Creación)
Mecanismo: Utiliza la clase CreateView para generar y procesar formularios de inserción de datos de manera segura mediante tokens CSRF.

Componentes: Clases HabitacionCreateView, ClienteCreateView, ReservaCreateView y ConsumoCreateView.

Interfaz: Comparten la plantilla reutilizable form.html para la renderización de los campos.

Read (Lectura y Listado)
Mecanismo: Utiliza las clases ListView para la visualización de colecciones de datos y DetailView para el análisis de un registro individualizado a través de su identificador único.

Componentes: Clases HabitacionListView, HabitacionDetailView, ClienteListView y ReservaListView.

Interfaz: * lista.html: Muestra el inventario total de habitaciones del hotel.

cliente_lista.html: Panel general de clientes que despliega de forma anidada su estado en el sauna y el historial de pedidos en el restaurante.

detalle.html: Ficha técnica de una habitación seleccionada.

Update (Actualización)
Mecanismo: Emplea la clase UpdateView. Recupera el registro existente por medio de su llave primaria (pk) provista en la URL, precarga la información en el formulario y procesa las modificaciones.

Componentes: Clase HabitacionUpdateView.

Interfaz: Reutiliza la plantilla form.html en modo de edición.

Delete (Eliminación)
Mecanismo: Utiliza la clase DeleteView para remover registros de la base de datos de manera definitiva.

Componentes: Clase HabitacionDeleteView.

Interfaz: Invoca a confirmar_borrado.html, que actúa como una pantalla de seguridad para evitar eliminaciones accidentales.

3. Matriz de Correspondencia Técnica del CRUD
El siguiente cuadro resume el mapeo de cada funcionalidad CRUD con sus respectivas clases, rutas y archivos de presentación:

Operación CRUD	Clase en views.py	Ruta en urls.py	Plantilla HTML asociada
Create (Crear Habitación)	HabitacionCreateView	club/nueva/	form.html
Read (Listar Habitaciones)	HabitacionListView	club/	lista.html
Read (Detalle Habitación)	HabitacionDetailView	club/<int:pk>/	detalle.html
Update (Editar Habitación)	HabitacionUpdateView	club/<int:pk>/editar/	form.html
Delete (Borrar Habitación)	HabitacionDeleteView	club/<int:pk>/eliminar/	confirmar_borrado.html
Create (Registrar Cliente)	ClienteCreateView	club/clientes/nuevo/	form.html
Read (Listar Clientes / Servicios)	ClienteListView	club/clientes/	cliente_lista.html
Create (Registrar Consumo)	ConsumoCreateView	club/restaurante/pedido/	form.html
Create (Registrar Reserva)	ReservaCreateView	club/reservas/nueva/	form.html
Read (Listar Reservas)	ReservaListView	club/reservas/	reserva_lista.html
4. Flujo Operativo y de Demostración
Para comprobar el correcto funcionamiento e integración de los módulos, se debe seguir la siguiente secuencia lógica de operaciones en el entorno de ejecución:

Establecimiento de Infraestructura (Hotel): Se accede a la ruta de creación de habitaciones (/club/nueva/) para alimentar el catálogo inicial (ej. Habitación 101, Tipo: Suite, Precio: 100). Esto poblará el listado principal de control de cuartos.

Admisión de Usuarios y Control de Bienestar (Sauna): Se realiza el alta de clientes mediante la ruta /club/clientes/nuevo/. Durante el proceso, es posible activar el check de acceso al sauna. En la lista general de clientes (/club/clientes/), se reflejará el estado de forma inmediata (ej. Activo (En el Sauna) o Inactivo).

Consumo Independiente (Restaurante): Se ingresa a la ruta /club/restaurante/pedido/ para registrar transacciones de consumo. Mediante un menú desplegable dinámico alimentado por la base de datos, se asocia el plato al cliente correspondiente. La información se indexa directamente bajo el perfil de ese usuario en el panel de clientes, validando que se puede consumir en el restaurante sin requerir una habitación de hotel.

Apertura de Estadía (Reserva): En caso de que un cliente decida alojarse, se accede a /club/reservas/nueva/. El formulario ofrece menús desplegables para asociar un cliente específico con una habitación disponible, generando el vínculo formal de hospedaje.

Exposición Automatizada de Datos (API): La URL /club/api/estado/ ejecuta una función basada en JsonResponse que extrae en tiempo real la colección de habitaciones y sus estados de ocupación, retornando un objeto JSON plano ideal para integraciones externas o consultas asíncronas vía AJAX.

5. Módulos Pendientes de Implementación
Para alcanzar la madurez total del sistema de gestión y optimizar la automatización del complejo, se contempla el desarrollo futuro de las siguientes funcionalidades técnicas:

Lógica de Regocio Avanzada y Automatización de Cuentas
Cálculo Automático del Check-out (Cierre de Cuenta Unificada): Actualmente, el campo total_acumulado en el módulo de reservas se ingresa de forma manual. Falta implementar un método interno en el modelo Reserva que sume automáticamente el costo total de los días de hospedaje (Multiplicando los días transcurridos por el precio_por_noche de la habitación vinculada) y le adicione dinámicamente el costo de todos los consumos del restaurante vinculados al cliente durante su estadía.

Control de Disponibilidad Automatizado: Falta desarrollar una señal (django.db.models.signals.post_save) o un método de validación en el formulario de reservas que cambie de forma automática el estado esta_ocupada de la habitación a True al momento de confirmar un hospedaje, y que lo devuelva a False al liberar la habitación. En el estado actual, esta actualización se debe marcar manualmente en el formulario.

Seguridad y Control de Acceso
Sistema de Autenticación y Roles: El acceso a las rutas del CRUD carece de restricciones. Es necesario incorporar el sistema de usuarios de Django (django.contrib.auth) para restringir las vistas mediante el decorador LoginRequiredMixin. Esto asegurará que solo el personal autorizado (Recepcionistas para el hotel, mozos para el restaurante y personal de administración para el sauna) pueda realizar operaciones de creación, edición o eliminación de datos.

Interfaz de Usuario e Interoperabilidad
Migración Estética a Frameworks de Diseño: Las plantillas HTML actuales utilizan una estructura base sin estilos. Se requiere la integración de una capa de presentación basada en Bootstrap o Tailwind CSS para mejorar la experiencia de usuario, adaptando la visualización a dispositivos móviles y facilitando la navegación interna mediante una barra de menú unificada.

Consumo de la API desde el Frontend: El endpoint /club/api/estado/ genera correctamente la estructura de datos en formato JSON. Falta implementar scripts basados en JavaScript (utilizando fetch o AJAX) en la pantalla principal del hotel para actualizar el estado de las habitaciones en tiempo real sin necesidad de recargar el navegador de manera manual.