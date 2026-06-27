from django.urls import reverse_lazy
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.http import JsonResponse
from .models import Habitacion, Cliente, Reserva, ConsumoRestaurante

# ==========================================
# 🏨 VISTAS DE HABITACIONES 
# ==========================================
class HabitacionListView(ListView):
    model = Habitacion
    template_name = 'gestion_wellness/lista.html'
    context_object_name = 'habitaciones'

class HabitacionDetailView(DetailView):
    model = Habitacion
    template_name = 'gestion_wellness/detalle.html'

class HabitacionCreateView(CreateView):
    model = Habitacion
    fields = ['numero', 'tipo', 'precio_por_noche', 'esta_ocupada']
    template_name = 'gestion_wellness/form.html'
    success_url = reverse_lazy('wellness:lista')

class HabitacionUpdateView(UpdateView):
    model = Habitacion
    fields = ['numero', 'tipo', 'precio_por_noche', 'esta_ocupada']
    template_name = 'gestion_wellness/form.html'
    success_url = reverse_lazy('wellness:lista')

class HabitacionDeleteView(DeleteView):
    model = Habitacion
    template_name = 'gestion_wellness/confirmar_borrado.html'
    success_url = reverse_lazy('wellness:lista')


# ==========================================
# 👥 VISTAS DE CLIENTES
# ==========================================
class ClienteListView(ListView):
    model = Cliente
    template_name = 'gestion_wellness/cliente_lista.html'
    context_object_name = 'clientes'

class ClienteCreateView(CreateView):
    model = Cliente
    fields = ['nombre', 'esta_en_sauna']
    template_name = 'gestion_wellness/form.html'
    success_url = reverse_lazy('wellness:cliente_lista')


# ==========================================
# 📅 VISTAS DE RESERVAS 
# ==========================================
class ReservaListView(ListView):
    model = Reserva
    template_name = 'gestion_wellness/reserva_lista.html'
    context_object_name = 'reservas'

class ReservaCreateView(CreateView):
    model = Reserva
    fields = ['cliente', 'habitacion', 'total_acumulado']
    template_name = 'gestion_wellness/form.html'
    success_url = reverse_lazy('wellness:reserva_lista')


# ==========================================
# 🍔 VISTAS DE RESTAURANTE
# ==========================================
class ConsumoCreateView(CreateView):
    model = ConsumoRestaurante
    fields = ['reserva', 'descripcion_plato', 'precio', 'cantidad']
    template_name = 'gestion_wellness/form.html'
    success_url = reverse_lazy('wellness:cliente_lista')


# ==========================================
# 📊 ENDPOINT JSON 
# ==========================================
def api_estado_habitaciones(request):
    habitaciones = Habitacion.objects.all().values('numero', 'tipo', 'esta_ocupada', 'precio_por_noche')
    return JsonResponse(list(habitaciones), safe=False)