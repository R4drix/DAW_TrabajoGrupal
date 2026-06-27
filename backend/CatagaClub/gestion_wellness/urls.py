from django.urls import path
from . import views

app_name = 'wellness'

urlpatterns = [
    # Rutas Habitaciones
    path('', views.HabitacionListView.as_view(), name='lista'),
    path('<int:pk>/', views.HabitacionDetailView.as_view(), name='detalle'),
    path('nueva/', views.HabitacionCreateView.as_view(), name='crear'),
    path('<int:pk>/editar/', views.HabitacionUpdateView.as_view(), name='actualizar'),
    path('<int:pk>/eliminar/', views.HabitacionDeleteView.as_view(), name='borrar'),
    
    # Rutas Clientes
    path('clientes/', views.ClienteListView.as_view(), name='cliente_lista'),
    path('clientes/nuevo/', views.ClienteCreateView.as_view(), name='cliente_crear'),
    
    # Rutas Reservas
    path('reservas/', views.ReservaListView.as_view(), name='reserva_lista'),
    path('reservas/nueva/', views.ReservaCreateView.as_view(), name='reserva_crear'),
    
    # Rutas Restaurante
    path('restaurante/pedido/', views.ConsumoCreateView.as_view(), name='consumo_crear'),
    
    # API JSON
    path('api/estado/', views.api_estado_habitaciones, name='api_estado'),
]