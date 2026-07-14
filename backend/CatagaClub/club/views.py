from decimal import Decimal

from django.contrib import messages
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

from .forms import (ClienteForm, HabitacionForm,
                    ReservaForm)
from .models import Cliente, Habitacion, Reserva, Plato


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
# ── APIs JSON ─────────────────────────────────────────────────────────────────

@require_GET
def api_estado_habitaciones(request):
    data = list(
        Habitacion.objects.values(
            'id',
            'numero',
            'tipo',
            'precio_por_noche',
            'esta_ocupada',
            'capacidad',
            'imagen_principal',
            'imagen_cama',
            'imagen_bano',
            'imagen_extra',
        )
    )

    for item in data:
        item['precio_por_noche'] = float(item['precio_por_noche'])

    return JsonResponse({
        'ok': True,
        'count': len(data),
        'habitaciones': data
    })

@require_GET
def api_reservas(request):
    data = []
    for r in Reserva.objects.select_related('cliente', 'habitacion').all()[:200]:
        data.append({
            'id':         r.id,
            'cliente':    r.cliente.nombre,
            'habitacion': r.habitacion.numero,
            'checkin':    r.fecha_checkin.isoformat(),
            'checkout':   r.fecha_checkout.isoformat(),
            'estado':     r.estado,
            'total':      float(r.total_acumulado),
        })
    return JsonResponse({'ok': True, 'count': len(data), 'reservas': data}, safe=False)


@require_GET
def api_consumos(request):
    data = []
    for c in ConsumoRestaurante.objects.select_related('cliente').all()[:200]:
        data.append({
            'id':       c.id,
            'cliente':  c.cliente.nombre,
            'plato':    c.descripcion_plato,
            'precio':   float(c.precio),
            'cantidad': c.cantidad,
            'subtotal': float(c.subtotal),
            'fecha':    c.fecha.isoformat(),
        })
    return JsonResponse({'ok': True, 'count': len(data), 'consumos': data}, safe=False)


@require_GET
def api_dashboard(request):
    hoy = timezone.now().date()
    reservas_activas     = Reserva.objects.filter(estado='activa').count()
    habitaciones_ocupadas = Habitacion.objects.filter(esta_ocupada=True).count()
    ingresos_hoy = ConsumoRestaurante.objects.filter(
        fecha__date=hoy
    ).aggregate(total=Sum('precio'))['total'] or Decimal('0.00')

    return JsonResponse({
        'ok':                       True,
        'clientes':                 Cliente.objects.count(),
        'habitaciones_total':       Habitacion.objects.count(),
        'habitaciones_ocupadas':    habitaciones_ocupadas,
        'reservas_activas':         reservas_activas,
        'ingresos_restaurante_hoy': float(ingresos_hoy),
        'consumos_hoy':             ConsumoRestaurante.objects.filter(fecha__date=hoy).count(),
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