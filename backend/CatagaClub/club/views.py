from decimal import Decimal

from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Count, Sum
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.template.loader import render_to_string
from django.utils import timezone
from django.views.decorators.http import require_GET
from django.views.generic import (CreateView, DeleteView, DetailView, ListView,
                                  UpdateView)

from .forms import (ClienteForm, ConsumoRestauranteForm, HabitacionForm,
                    ReservaForm)
from .models import Cliente, ConsumoRestaurante, Habitacion, Reserva


class PublicListMixin:
    """List/Detail accesibles sin login (para mostrar al cliente final)."""


class ProtectedCRUDMixin(LoginRequiredMixin):
    """Create/Update/Delete requieren login."""


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


class ConsumoListView(ProtectedCRUDMixin, ListView):
    model = ConsumoRestaurante
    template_name = 'club/consumo_lista.html'
    context_object_name = 'consumos'


class ConsumoCreateView(ProtectedCRUDMixin, CreateView):
    model = ConsumoRestaurante
    form_class = ConsumoRestauranteForm
    template_name = 'club/form.html'
    success_url = '/club/consumos/'


class ConsumoDeleteView(ProtectedCRUDMixin, DeleteView):
    model = ConsumoRestaurante
    template_name = 'club/confirmar_borrado.html'
    success_url = '/club/consumos/'


@require_GET
def api_estado_habitaciones(request):
    data = list(
        Habitacion.objects.values('id', 'numero', 'tipo', 'precio_por_noche', 'esta_ocupada', 'capacidad')
    )
    for item in data:
        item['precio_por_noche'] = float(item['precio_por_noche'])
    return JsonResponse({'ok': True, 'count': len(data), 'habitaciones': data}, safe=False)


@require_GET
def api_reservas(request):
    data = []
    for r in Reserva.objects.select_related('cliente', 'habitacion').all()[:200]:
        data.append({
            'id': r.id,
            'cliente': r.cliente.nombre,
            'habitacion': r.habitacion.numero,
            'checkin': r.fecha_checkin.isoformat(),
            'checkout': r.fecha_checkout.isoformat(),
            'estado': r.estado,
            'total': float(r.total_acumulado),
        })
    return JsonResponse({'ok': True, 'count': len(data), 'reservas': data}, safe=False)


@require_GET
def api_consumos(request):
    data = []
    for c in ConsumoRestaurante.objects.select_related('cliente').all()[:200]:
        data.append({
            'id': c.id,
            'cliente': c.cliente.nombre,
            'plato': c.descripcion_plato,
            'precio': float(c.precio),
            'cantidad': c.cantidad,
            'subtotal': float(c.subtotal),
            'fecha': c.fecha.isoformat(),
        })
    return JsonResponse({'ok': True, 'count': len(data), 'consumos': data}, safe=False)


@require_GET
def api_dashboard(request):
    hoy = timezone.now().date()
    reservas_activas = Reserva.objects.filter(estado='activa').count()
    habitaciones_ocupadas = Habitacion.objects.filter(esta_ocupada=True).count()
    ingresos_hoy = ConsumoRestaurante.objects.filter(
        fecha__date=hoy
    ).aggregate(total=Sum('precio'))['total'] or Decimal('0.00')
    return JsonResponse({
        'ok': True,
        'clientes': Cliente.objects.count(),
        'habitaciones_total': Habitacion.objects.count(),
        'habitaciones_ocupadas': habitaciones_ocupadas,
        'reservas_activas': reservas_activas,
        'ingresos_restaurante_hoy': float(ingresos_hoy),
        'consumos_hoy': ConsumoRestaurante.objects.filter(fecha__date=hoy).count(),
    }, safe=False)


def reserva_cuenta_pdf(request, pk):
    """Stub del reporte PDF. Se implementará en la rama feat/pdf-report."""
    reserva = get_object_or_404(Reserva, pk=pk)
    html = render_to_string('club/reserva_cuenta.html', {'reserva': reserva, 'ahora': timezone.now()})
    return HttpResponse(f"<pre>{html}</pre>")


@login_required
def home(request):
    ctx = {
        'habitaciones_total': Habitacion.objects.count(),
        'habitaciones_libres': Habitacion.objects.filter(esta_ocupada=False).count(),
        'clientes_total': Cliente.objects.count(),
        'reservas_activas': Reserva.objects.filter(estado='activa').count(),
    }
    return render(request, 'club/home.html', ctx)