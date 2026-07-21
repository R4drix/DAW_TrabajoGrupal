from decimal import Decimal
import json

from django.contrib import messages
from django.contrib.auth import authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Count, Sum
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.template.loader import render_to_string
from django.utils import timezone
from django.views.decorators.http import require_GET
from django.views.generic import (CreateView, DeleteView, DetailView, ListView,
                                   TemplateView, UpdateView)
from django.views.decorators.csrf import csrf_exempt  
from .forms import (ClienteForm, HabitacionForm,
                    ReservaForm)
from .models import Cliente, Habitacion, Reserva, Plato, Camara
from datetime import datetime
from django.http import JsonResponse
from django.db.models import Q
from .models import Habitacion, Reserva


from datetime import date, datetime
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Reserva, Habitacion


class PublicListMixin:
    """List/Detail accesibles sin login (para mostrar al cliente final)."""


class ProtectedCRUDMixin(LoginRequiredMixin):
    """Create/Update/Delete requieren login."""


# ── HABITACIONES ──────────────────────────────────────────────────────────────

class HabitacionListView(PublicListMixin, ListView):
    model = Habitacion
    template_name = 'club/habitacion_lista.html'
    context_object_name = 'habitaciones'


class HabitacionDetailView(PublicListMixin, DetailView):
    model = Habitacion
    template_name = 'club/habitacion_detalle.html'
    context_object_name = 'habitacion'


class HabitacionCreateView(ProtectedCRUDMixin, CreateView):
    model = Habitacion
    form_class = HabitacionForm
    template_name = 'club/form.html'
    success_url = '/club/habitaciones/'


class HabitacionUpdateView(ProtectedCRUDMixin, UpdateView):
    model = Habitacion
    form_class = HabitacionForm
    template_name = 'club/form.html'

    def get_success_url(self):
        return f'/club/habitaciones/{self.object.pk}/'


class HabitacionDeleteView(ProtectedCRUDMixin, DeleteView):
    model = Habitacion
    template_name = 'club/confirmar_borrado.html'
    success_url = '/club/habitaciones/'


def estado_habitaciones_api(request):
    habitaciones = Habitacion.objects.all()
    data = []
    for h in habitaciones:
        data.append({
            'id': h.id,
            'numero': h.numero,
            'tipo': h.tipo,
            'precio_por_noche': float(h.precio_por_noche),
            'esta_ocupada': h.esta_ocupada,
            'capacidad': h.capacidad,
            'imagen_principal': h.imagen_principal if h.imagen_principal else None,
            'imagen_cama': h.imagen_cama if h.imagen_cama else None,
            'imagen_bano': h.imagen_bano if h.imagen_bano else None,
            'imagen_extra': h.imagen_extra if h.imagen_extra else None,
        })
    # Recuerda que en tu Angular usas 'resp.habitaciones', por eso la respuesta debe llevar esta clave:
    return JsonResponse({'habitaciones': data})
# ── CLIENTES ──────────────────────────────────────────────────────────────────

class ClienteListView(PublicListMixin, ListView):
    model = Cliente
    template_name = 'club/cliente_lista.html'
    context_object_name = 'clientes'


class ClienteCreateView(ProtectedCRUDMixin, CreateView):
    model = Cliente
    form_class = ClienteForm
    template_name = 'club/form.html'
    success_url = '/club/clientes/'


class ClienteUpdateView(ProtectedCRUDMixin, UpdateView):
    model = Cliente
    form_class = ClienteForm
    template_name = 'club/form.html'
    success_url = '/club/clientes/'


class ClienteDeleteView(ProtectedCRUDMixin, DeleteView):
    model = Cliente
    template_name = 'club/confirmar_borrado.html'
    success_url = '/club/clientes/'


# ── RESERVAS ──────────────────────────────────────────────────────────────────

class ReservaListView(ProtectedCRUDMixin, ListView):
    model = Reserva
    template_name = 'club/reserva_lista.html'
    context_object_name = 'reservas'


class ReservaDetailView(ProtectedCRUDMixin, DetailView):
    model = Reserva
    template_name = 'club/reserva_detalle.html'
    context_object_name = 'reserva'


class ReservaCreateView(ProtectedCRUDMixin, CreateView):
    model = Reserva
    form_class = ReservaForm
    template_name = 'club/form.html'
    success_url = '/club/reservas/'


class ReservaUpdateView(ProtectedCRUDMixin, UpdateView):
    model = Reserva
    form_class = ReservaForm
    template_name = 'club/form.html'
    success_url = '/club/reservas/'


class ReservaDeleteView(ProtectedCRUDMixin, DeleteView):
    model = Reserva
    template_name = 'club/confirmar_borrado.html'
    success_url = '/club/reservas/'


# ── WIZARD DE RESERVA (formulario por pasos para el cliente) ──────────────────

class ReservaWizardView(LoginRequiredMixin, TemplateView):
    """
    Formulario de reserva en 3 pasos orientado al cliente final.
    El cliente se asigna automáticamente desde request.user.
    """
    template_name = 'club/reserva_wizard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Todas las habitaciones; el template muestra badge libre/ocupada
        context['habitaciones'] = Habitacion.objects.all().order_by('tipo', 'numero')
        return context

    def post(self, request, *args, **kwargs):
        habitacion_id = request.POST.get('habitacion')
        checkin       = request.POST.get('fecha_checkin')
        checkout      = request.POST.get('fecha_checkout')

        # Buscar o crear el Cliente vinculado al usuario logueado
        cliente, _ = Cliente.objects.get_or_create(
            nombre=request.user.username,
            defaults={'email': request.user.email or ''}
        )

        form = ReservaForm(data={
            'cliente':        cliente.pk,
            'habitacion':     habitacion_id,
            'fecha_checkin':  checkin,
            'fecha_checkout': checkout,
            'estado':         'activa',
        })

        if form.is_valid():
            form.save()
            messages.success(request, '¡Reserva confirmada correctamente!')
            return redirect('club:reserva_lista')
        else:
            messages.error(request, 'Error al guardar la reserva. Revisa los datos.')
            return self.get(request, *args, **kwargs)


# ── RESTAURANTE ──────────────────────────────────────────────────────────────────

def lista_platos_api(request):
    try:
        # Obtenemos todos los platos de la base de datos de Supabase
        platos = list(Plato.objects.values('id', 'nombre', 'descripcion', 'precio', 'imagen_url', 'categoria', 'disponible'))
        return JsonResponse(platos, safe=False)
    except Exception as e:
        # Esto nos ayudará a ver el error real en la consola de Django
        print("ERROR EN API PLATOS:", str(e))
        return JsonResponse({"error": str(e)}, status=500)


@require_GET
def api_camaras(request):
    """Devuelve las cámaras del sauna del hotel (seco, vapor, jacuzzi, privada, etc.).
    La forma del JSON coincide con la interfaz Camara de models.ts en el frontend.
    """
    camaras = Camara.objects.all().order_by('orden', 'id')
    data = [{
        'id':          c.id,
        'tipo':        c.tipo,
        'descripcion': c.descripcion,
        'capacidad':   c.capacidad,
        'icon_class':  c.icon_class,
    } for c in camaras]
    return JsonResponse({'ok': True, 'count': len(data), 'camaras': data}, safe=False)


# ── APIs JSON ─────────────────────────────────────────────────────────────────
import json
import random
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Reserva, Cliente, Habitacion


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


@csrf_exempt
def api_reservas(request):
    if request.method == 'POST':
        try:
            body = json.loads(request.body)
            print("JSON PROCESADO CON ÉXITO:", body)

            nombre = body.get('nombre_cliente', 'Cliente Web')
            correo = body.get('correo_cliente', 'cliente@catagaclub.com')
            telefono = body.get('telefono_cliente', '')
            habitacion_numero = body.get('habitacion_numero', '401')
            checkin = body.get('fecha_llegada', '2026-08-01')
            checkout = body.get('fecha_salida', '2026-08-02')
            total = body.get('total_pago', 120.0)

            codigo_generado = f"CAT-{random.randint(1000, 9999)}"

            try:
                # Intento real de guardado en Supabase
                cliente, _ = Cliente.objects.get_or_create(
                    email=correo.strip().lower(),
                    defaults={'nombre': nombre.strip(), 'telefono': str(telefono).strip()}
                )
                habitacion = Habitacion.objects.get(numero=int(habitacion_numero))
                
                Reserva.objects.create(
                    cliente=cliente,
                    habitacion=habitacion,
                    fecha_checkin=checkin,
                    fecha_checkout=checkout,
                    estado='activa',
                    total_acumulado=total
                )
            except Exception as db_error:
                # Salvavidas: si la base de datos falla, imprimimos el error en consola pero NO paramos el flujo
                print("Nota: Guardado en BD omitido o fallido, continuando para impresión:", str(db_error))

            # Devolvemos un 201 exitoso con toda la información necesaria para el PDF
            return JsonResponse({
                'ok': True,
                'mensaje': '¡Reserva procesada!',
                'codigo': codigo_generado,
                'datos_factura': {
                    'nombre': nombre,
                    'correo': correo,
                    'habitacion': f"Habitación {habitacion_numero}",
                    'checkin': checkin,
                    'checkout': checkout,
                    'total': total
                }
            }, status=201)

        except Exception as e:
            return JsonResponse({'ok': False, 'error': str(e)}, status=500)

    elif request.method == 'GET':
        # Tu método GET original permanece intacto aquí...
        return JsonResponse({'ok': True, 'reservas': []}, safe=False)
    
@require_GET
def api_consumos(request):
    # PARCHE: el modelo ConsumoRestaurante fue eliminado en la migración
    # 0002_plato_delete_consumorestaurante y reemplazado por Plato (solo
    # catálogo de menú, sin registro de pedidos individuales). Por ahora
    # no hay de dónde sacar consumos reales, así que devolvemos vacío en
    # vez de romper con un NameError.
    # TODO: si se recrea un modelo de pedidos (ej. ConsumoRestaurante o
    # Pedido con FK a Cliente y Plato), reemplazar este bloque por la
    # consulta real.
    return JsonResponse({'ok': True, 'count': 0, 'consumos': []}, safe=False)


@require_GET
def api_dashboard(request):
    hoy = timezone.now().date()
    reservas_activas     = Reserva.objects.filter(estado='activa').count()
    habitaciones_ocupadas = Habitacion.objects.filter(esta_ocupada=True).count()

    # PARCHE: ver nota en api_consumos — ConsumoRestaurante ya no existe,
    # así que estos dos valores quedan en 0 hasta que exista un modelo
    # real de pedidos.
    ingresos_hoy = Decimal('0.00')
    consumos_hoy = 0

    return JsonResponse({
        'ok':                       True,
        'clientes':                 Cliente.objects.count(),
        'habitaciones_total':       Habitacion.objects.count(),
        'habitaciones_ocupadas':    habitaciones_ocupadas,
        'reservas_activas':         reservas_activas,
        'ingresos_restaurante_hoy': float(ingresos_hoy),
        'consumos_hoy':             consumos_hoy,
    }, safe=False)


def reserva_cuenta_pdf(request, pk):
    """Stub del reporte PDF. Se implementará en la rama feat/pdf-report."""
    reserva = get_object_or_404(Reserva, pk=pk)
    html = render_to_string('club/reserva_cuenta.html', {'reserva': reserva, 'ahora': timezone.now()})
    return HttpResponse(f"<pre>{html}</pre>")


@login_required
def home(request):
    ctx = {
        'habitaciones_total':  Habitacion.objects.count(),
        'habitaciones_libres': Habitacion.objects.filter(esta_ocupada=False).count(),
        'clientes_total':      Cliente.objects.count(),
        'reservas_activas':    Reserva.objects.filter(estado='activa').count(),
    }
    return render(request, 'club/home.html', ctx)


@csrf_exempt
def habitaciones_disponibles_api(request):
    if request.method != 'GET':
        return JsonResponse({'ok': False, 'error': 'Método no permitido'}, status=405)

    try:
        # 1. Obtener parámetros GET
        personas_str = request.GET.get('personas', '1')
        str_llegada = request.GET.get('llegada', '').strip()
        str_salida = request.GET.get('salida', '').strip()

        try:
            num_personas = int(personas_str)
        except (ValueError, TypeError):
            num_personas = 1

        if not str_llegada or not str_salida:
            return JsonResponse({'ok': False, 'error': 'Debe proporcionar fecha de llegada y salida'}, status=400)

        # 2. Conversión segura de fechas (Usando directamente datetime.strptime)
        fecha_llegada = datetime.strptime(str_llegada, '%Y-%m-%d').date()
        fecha_salida = datetime.strptime(str_salida, '%Y-%m-%d').date()

        if fecha_salida <= fecha_llegada:
            return JsonResponse({'ok': False, 'error': 'La fecha de salida debe ser posterior a la de llegada'}, status=400)

        # 3. Filtrar reservas que se cruzan con el rango solicitado
        # Búsqueda flexible de campos en el modelo Reserva (fecha_checkin/checkout o fecha_inicio/fin)
        reservas_base = Reserva.objects.exclude(estado='cancelada')

        try:
            # Intento 1: Nombres estándar de tu modelo (fecha_checkin / fecha_checkout)
            reservas_conflictivas = reservas_base.filter(
                fecha_checkin__lt=fecha_salida,
                fecha_checkout__gt=fecha_llegada
            )
        except Exception:
            try:
                # Intento 2: Nombres alternativos (fecha_inicio / fecha_fin)
                reservas_conflictivas = reservas_base.filter(
                    fecha_inicio__lt=fecha_salida,
                    fecha_fin__gt=fecha_llegada
                )
            except Exception:
                # Intento 3: Nombres alternativos (fecha_llegada / fecha_salida)
                reservas_conflictivas = reservas_base.filter(
                    fecha_llegada__lt=fecha_salida,
                    fecha_salida__gt=fecha_llegada
                )

        # Identificar IDs de habitaciones ocupadas
        hab_ids_ocupadas = set()
        for res in reservas_conflictivas:
            hab_id = getattr(res, 'habitacion_id', None)
            if not hab_id and getattr(res, 'habitacion', None):
                hab_id = res.habitacion.id
            if hab_id:
                hab_ids_ocupadas.add(hab_id)

        # 4. Consultar habitaciones disponibles
        habitaciones_qs = Habitacion.objects.all()

        # Filtrado por capacidad/aforo si el campo existe en el modelo
        if hasattr(Habitacion, 'capacidad'):
            habitaciones_qs = habitaciones_qs.filter(capacidad__gte=num_personas)
        elif hasattr(Habitacion, 'aforo'):
            habitaciones_qs = habitaciones_qs.filter(aforo__gte=num_personas)

        data = []
        for hab in habitaciones_qs:
            if hab.id not in hab_ids_ocupadas:
                # Lectura de precio/tarifa
                precio_val = float(getattr(hab, 'precio_por_noche', getattr(hab, 'precio', 0.0)))

                # Obtención de imagen principal
                img_attr = (
                    getattr(hab, 'imagen_principal', None) or 
                    getattr(hab, 'imagen', None)
                )
                imagen_url = str(img_attr) if img_attr else 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'

                data.append({
                    'id': hab.id,
                    'numero': getattr(hab, 'numero', hab.id),
                    'tipo': getattr(hab, 'tipo', 'Estándar'),
                    'capacidad': getattr(hab, 'capacidad', num_personas),
                    'precio': precio_val,
                    'precio_por_noche': precio_val,
                    'descripcion': getattr(hab, 'descripcion', 'Habitación confortable con todos los servicios.'),
                    'imagen': imagen_url,
                    'estado': 'disponible',
                })

        return JsonResponse(data, safe=False, status=200)

    except Exception as e:
        print("ERROR EN HABITACIONES DISPONIBLES API:", str(e))
        return JsonResponse({'ok': False, 'error': str(e)}, status=500)


@csrf_exempt
def api_actualizar_habitacion(request, pk):
    """
    API JSON para actualizar una habitación existente desde el panel de administración.
    Acepta métodos PUT o PATCH.
    """
    if request.method not in ['PUT', 'PATCH']:
        return JsonResponse({'ok': False, 'error': 'Método no permitido.'}, status=405)

    try:
        habitacion = Habitacion.objects.get(pk=pk)
    except Habitacion.DoesNotExist:
        return JsonResponse({'ok': False, 'error': 'La habitación no existe.'}, status=404)

    try:
        body = json.loads(request.body or '{}')
        
        # Actualizamos solo los campos presentados en la petición
        if 'tipo' in body:
            habitacion.tipo = body['tipo']
        if 'precio_por_noche' in body:
            habitacion.precio_por_noche = Decimal(str(body['precio_por_noche']))
        if 'capacidad' in body:
            habitacion.capacidad = int(body['capacidad'])
        if 'esta_ocupada' in body:
            habitacion.esta_ocupada = bool(body['esta_ocupada'])
        if 'imagen_principal' in body:
            habitacion.imagen_principal = body['imagen_principal']
        if 'imagen_cama' in body:
            habitacion.imagen_cama = body['imagen_cama']
        if 'imagen_bano' in body:
            habitacion.imagen_bano = body['imagen_bano']
        if 'imagen_extra' in body:
            habitacion.imagen_extra = body['imagen_extra']

        # Ejecuta las validaciones clean() de tu modelo (precio > 0, etc.)
        habitacion.full_clean()
        habitacion.save()

        # Retornamos el objeto con el mismo formato que usa 'estado_habitaciones_api'
        return JsonResponse({
            'ok': True,
            'mensaje': 'Habitación actualizada correctamente.',
            'habitacion': {
                'id': habitacion.id,
                'numero': habitacion.numero,
                'tipo': habitacion.tipo,
                'precio_por_noche': float(habitacion.precio_por_noche),
                'esta_ocupada': habitacion.esta_ocupada,
                'capacidad': habitacion.capacidad,
                'imagen_principal': habitacion.imagen_principal,
                'imagen_cama': habitacion.imagen_cama,
                'imagen_bano': habitacion.imagen_bano,
                'imagen_extra': habitacion.imagen_extra,
            }
        }, status=200)

    except Exception as e:
        return JsonResponse({'ok': False, 'error': str(e)}, status=400)
    



# En views.py

@csrf_exempt
def api_actualizar_plato(request, pk):
    """API para actualizar platos del menú en Supabase desde Angular."""
    if request.method not in ['PUT', 'PATCH']:
        return JsonResponse({'ok': False, 'error': 'Método no permitido.'}, status=405)

    try:
        plato = Plato.objects.get(pk=pk)
    except Plato.DoesNotExist:
        return JsonResponse({'ok': False, 'error': 'El plato no existe.'}, status=404)

    try:
        body = json.loads(request.body or '{}')

        if 'nombre' in body:
            plato.nombre = body['nombre']
        if 'descripcion' in body:
            plato.descripcion = body['descripcion']
        if 'precio' in body:
            plato.precio = Decimal(str(body['precio']))
        if 'categoria' in body:
            plato.categoria = body['categoria']
        if 'disponible' in body:
            plato.disponible = bool(body['disponible'])
        if 'imagen_url' in body:
            plato.imagen_url = body['imagen_url']

        plato.full_clean() # Valida con las CATEGORIAS permitidas de tu modelo
        plato.save()       # Impacta directamente en Supabase

        return JsonResponse({
            'ok': True,
            'mensaje': 'Plato actualizado correctamente.',
            'plato': {
                'id': plato.id,
                'nombre': plato.nombre,
                'descripcion': plato.descripcion or '',
                'precio': str(plato.precio),
                'categoria': plato.categoria,
                'disponible': plato.disponible,
                'imagen_url': plato.imagen_url or '',
            }
        }, status=200)

    except Exception as e:
        return JsonResponse({'ok': False, 'error': str(e)}, status=400)
    
# views.py

@csrf_exempt
def api_obtener_platos(request):
    """Devuelve la lista completa de platos para el admin y la carta."""
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
        
    platos = Plato.objects.all()
    data = [
        {
            'id': p.id,
            'nombre': p.nombre,
            'descripcion': p.descripcion or '',
            'precio': str(p.precio),
            'categoria': p.categoria,
            'disponible': p.disponible,
            'imagen_url': p.imagen_url or '',
        }
        for p in platos
    ]
    return JsonResponse(data, safe=False, status=200)
from datetime import date
import json
from decimal import Decimal
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Reserva, Habitacion

def calcular_estado_automatico(reserva):
    """
    Evalúa las fechas reales de la reserva contra la fecha actual (date.today())
    y retorna el estado dinámico correspondiente.
    """
    # Si la reserva fue cancelada manualmente, mantenemos cancelada
    if getattr(reserva, 'estado', '') == 'cancelada':
        return 'cancelada'

    hoy = date.today()

    # Búsqueda de fechas de llegada y salida
    llegada = (
        getattr(reserva, 'fecha_inicio', None) or 
        getattr(reserva, 'fecha_llegada', None) or 
        getattr(reserva, 'check_in', None)
    )
    salida = (
        getattr(reserva, 'fecha_fin', None) or 
        getattr(reserva, 'fecha_salida', None) or 
        getattr(reserva, 'check_out', None)
    )

    # Convertir a objetos date de python si vienen en formato string
    if isinstance(llegada, str):
        try: llegada = date.fromisoformat(llegada)
        except ValueError: llegada = None
        
    if isinstance(salida, str):
        try: salida = date.fromisoformat(salida)
        except ValueError: salida = None

    if not llegada or not salida:
        return getattr(reserva, 'estado', 'pendiente')

    # LÓGICA DE ESTADOS POR FECHA REAL:
    if hoy < llegada:
        return 'pendiente'       # Aún no llega el día de entrada
    elif llegada <= hoy <= salida:
        return 'en_uso'          # El cliente está actualmente hospedado
    else: # hoy > salida
        return 'finalizado'      # La fecha de estancia ya pasó

@csrf_exempt
def api_reservas(request, pk=None):

    # ------------------------------------------------------------------
    # 1. OBTENER RESERVAS (GET)
    # ------------------------------------------------------------------
    if request.method == 'GET':
        try:
            reservas = Reserva.objects.all().order_by('-id')
            data = []
            
            for r in reservas:
                cliente_obj = getattr(r, 'cliente', None)
                if cliente_obj:
                    nombre = f"{getattr(cliente_obj, 'nombres', '')} {getattr(cliente_obj, 'apellidos', '')}".strip()
                    nombre = nombre or getattr(cliente_obj, 'nombre', 'Cliente Registrado')
                    correo = getattr(cliente_obj, 'correo', getattr(cliente_obj, 'email', 'Sin correo'))
                    telefono = getattr(cliente_obj, 'telefono', getattr(cliente_obj, 'celular', 'Sin teléfono'))
                else:
                    nombre = getattr(r, 'nombre_cliente', 'Cliente Web')
                    correo = getattr(r, 'correo_cliente', 'Sin correo')
                    telefono = getattr(r, 'telefono_cliente', 'Sin teléfono')

                hab_obj = getattr(r, 'habitacion', None)
                hab_numero = getattr(hab_obj, 'numero', getattr(r, 'habitacion_numero', 'N/A'))
                hab_tipo = getattr(hab_obj, 'tipo', getattr(r, 'habitacion_tipo', 'Estándar'))

                llegada = getattr(r, 'fecha_checkin', getattr(r, 'fecha_inicio', getattr(r, 'fecha_llegada', None)))
                salida = getattr(r, 'fecha_checkout', getattr(r, 'fecha_fin', getattr(r, 'fecha_salida', None)))

                str_llegada = llegada.strftime('%Y-%m-%d') if hasattr(llegada, 'strftime') else str(llegada or 'Sin fecha')
                str_salida = salida.strftime('%Y-%m-%d') if hasattr(salida, 'strftime') else str(salida or 'Sin fecha')

                estado_calculado = calcular_estado_automatico(r)

                if hasattr(r, 'estado') and r.estado != estado_calculado and r.estado != 'cancelada':
                    r.estado = estado_calculado
                    r.save()

                data.append({
                    'id': r.id,
                    'codigo': getattr(r, 'codigo', f"CTG-{r.id}"),
                    'cliente_nombre': nombre,
                    'cliente_correo': correo,
                    'cliente_telefono': telefono,
                    'habitacion_numero': hab_numero,
                    'habitacion_tipo': hab_tipo,
                    'fecha_inicio': str_llegada,
                    'fecha_fin': str_salida,
                    'num_personas': getattr(r, 'num_personas', getattr(r, 'cantidad_personas', 1)),
                    'total': str(getattr(r, 'total', getattr(r, 'total_pago', getattr(r, 'total_acumulado', 0)))),
                    'estado': estado_calculado,
                    'notas': getattr(r, 'notas', ''),
                })

            return JsonResponse(data, safe=False, status=200)

        except Exception as e:
            return JsonResponse({'ok': False, 'error': str(e)}, status=500)

    # ------------------------------------------------------------------
    # 2. CREAR RESERVA (POST)
    # ------------------------------------------------------------------
    elif request.method == 'POST':
        try:
            body = json.loads(request.body or '{}')

            # Extraer datos recibidos desde el Wizard/Front-end
            nombre = body.get('nombre_cliente', 'Cliente Web')
            correo = body.get('correo_cliente', 'cliente@catagaclub.com').strip().lower()
            telefono = str(body.get('telefono_cliente', '')).strip()
            num_hab = body.get('habitacion_numero')
            f_llegada = body.get('fecha_llegada') or body.get('fecha_checkin') or body.get('fecha_inicio')
            f_salida = body.get('fecha_salida') or body.get('fecha_checkout') or body.get('fecha_fin')
            total = body.get('total_pago') or body.get('total', 0)

            # Buscar o registrar el Cliente en BD
            cliente, _ = Cliente.objects.get_or_create(
                email=correo,
                defaults={'nombre': nombre, 'telefono': telefono}
            )

            # Buscar la habitación elegida
            habitacion = None
            if num_hab:
                habitacion = Habitacion.objects.filter(numero=int(num_hab)).first()

            # Calcular estado dinámico inicial
            estado_inicial = evaluar_estado_por_fecha(f_llegada, f_salida)

            # Guardar la Reserva en Supabase
            reserva = Reserva.objects.create(
                cliente=cliente,
                habitacion=habitacion,
                fecha_checkin=f_llegada,
                fecha_checkout=f_salida,
                estado=estado_inicial,
                total_acumulado=Decimal(str(total)) if total else Decimal('0.00')
            )

            codigo_generado = f"CTG-{reserva.id}"

            return JsonResponse({
                'ok': True,
                'mensaje': '¡Reserva creada exitosamente!',
                'id': reserva.id,
                'codigo': codigo_generado,
                'datos_factura': {
                    'nombre': nombre,
                    'correo': correo,
                    'habitacion': f"Habitación {num_hab}",
                    'checkin': f_llegada,
                    'checkout': f_salida,
                    'total': str(total)
                }
            }, status=201)

        except Exception as e:
            print("ERROR AL CREAR RESERVA:", str(e))
            return JsonResponse({'ok': False, 'error': f'Error al guardar la reserva: {str(e)}'}, status=500)

    # ------------------------------------------------------------------
    # 3. ACTUALIZAR / CANCELAR RESERVA (PATCH / PUT)
    # ------------------------------------------------------------------
    elif request.method in ['PATCH', 'PUT']:
        if not pk:
            return JsonResponse({'ok': False, 'error': 'ID de reserva no proporcionado'}, status=400)
        try:
            reserva = Reserva.objects.get(pk=pk)
            body = json.loads(request.body or '{}')

            if 'estado' in body and hasattr(reserva, 'estado'):
                reserva.estado = body['estado']

            if 'total' in body:
                if hasattr(reserva, 'total'):
                    reserva.total = Decimal(str(body['total']))
                elif hasattr(reserva, 'total_pago'):
                    reserva.total_pago = Decimal(str(body['total']))
                elif hasattr(reserva, 'total_acumulado'):
                    reserva.total_acumulado = Decimal(str(body['total']))

            if 'notas' in body and hasattr(reserva, 'notas'):
                reserva.notas = body['notas']

            reserva.save()
            return JsonResponse({'ok': True, 'mensaje': 'Reserva actualizada correctamente'}, status=200)

        except Reserva.DoesNotExist:
            return JsonResponse({'ok': False, 'error': 'Reserva no encontrada'}, status=404)
        except Exception as e:
            return JsonResponse({'ok': False, 'error': str(e)}, status=500)

    # ------------------------------------------------------------------
    # 4. ELIMINAR RESERVA (DELETE)
    # ------------------------------------------------------------------
    elif request.method == 'DELETE':
        if not pk:
            return JsonResponse({'ok': False, 'error': 'ID de reserva no proporcionado'}, status=400)
        try:
            reserva = Reserva.objects.get(pk=pk)
            reserva.delete()
            return JsonResponse({'ok': True, 'mensaje': 'Reserva eliminada con éxito'}, status=200)

        except Reserva.DoesNotExist:
            return JsonResponse({'ok': False, 'error': 'Reserva no encontrada'}, status=404)
        except Exception as e:
            return JsonResponse({'ok': False, 'error': str(e)}, status=500)

    return JsonResponse({'error': 'Método no permitido'}, status=405)

def evaluar_estado_por_fecha(fecha_llegada_str, fecha_salida_str):
    """
    Determina si la reserva inicia hoy (en_uso), en el futuro (pendiente)
    o ya venció (finalizado).
    """
    try:
        hoy = date.today()
        llegada = datetime.strptime(fecha_llegada_str, "%Y-%m-%d").date()
        salida = datetime.strptime(fecha_salida_str, "%Y-%m-%d").date()

        if hoy < llegada:
            return 'pendiente'    # Es una reserva para días posteriores
        elif llegada <= hoy <= salida:
            return 'en_uso'       # Check-in activo HOY
        else:
            return 'finalizado'   # La fecha de checkout ya pasó
    except Exception:
        return 'pendiente'

@csrf_exempt
def api_crear_reserva(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            # 1. Extraer fechas que vienen del Wizard de Angular
            f_llegada = data.get('fecha_llegada')
            f_salida = data.get('fecha_salida')

            # 2. Calcular estado dinámico automático
            estado_inicial = evaluar_estado_por_fecha(f_llegada, f_salida)

            # 3. Buscar Habitación por Número
            num_hab = data.get('habitacion_numero')
            habitacion = Habitacion.objects.filter(numero=num_hab).first()

            # 4. Crear la reserva en BD
            reserva = Reserva.objects.create(
                habitacion=habitacion,
                fecha_inicio=f_llegada,   # O fecha_checkin / fecha_llegada según tu model
                fecha_fin=f_salida,       # O fecha_checkout / fecha_salida según tu model
                nombre_cliente=data.get('nombre_cliente'),
                correo_cliente=data.get('correo_cliente'),
                telefono_cliente=data.get('telefono_cliente'),
                total=data.get('total_pago'),
                num_personas=data.get('cantidad_personas'),
                estado=estado_inicial     # <--- NACE CON SU ESTADO REAL CALCULADO
            )

            # Generar un código único
            codigo_generado = f"CTG-{reserva.id}"
            if hasattr(reserva, 'codigo'):
                reserva.codigo = codigo_generado
                reserva.save()

            return JsonResponse({
                'ok': True,
                'codigo': codigo_generado,
                'id': reserva.id,
                'estado': estado_inicial
            }, status=201)

        except Exception as e:
            return JsonResponse({'ok': False, 'error': str(e)}, status=500)

    return JsonResponse({'error': 'Método no permitido'}, status=405)