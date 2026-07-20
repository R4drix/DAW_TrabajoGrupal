from django.urls import path

from . import views

app_name = 'club'

urlpatterns = [
    # Home
    path('', views.home, name='home'),

    # Habitaciones
    path('habitaciones/',                      views.HabitacionListView.as_view(),   name='habitacion_lista'),
    path('habitaciones/nueva/',                views.HabitacionCreateView.as_view(), name='habitacion_crear'),
    path('habitaciones/<int:pk>/',             views.HabitacionDetailView.as_view(), name='habitacion_detalle'),
    path('habitaciones/<int:pk>/editar/',      views.HabitacionUpdateView.as_view(), name='habitacion_editar'),
    path('habitaciones/<int:pk>/borrar/',      views.HabitacionDeleteView.as_view(), name='habitacion_borrar'),
    path('api/estado-habitaciones/',           views.estado_habitaciones_api,        name='estado_habitaciones_api'),

    # Clientes
    path('clientes/',                          views.ClienteListView.as_view(),      name='cliente_lista'),
    path('clientes/nuevo/',                    views.ClienteCreateView.as_view(),    name='cliente_crear'),
    path('clientes/<int:pk>/editar/',          views.ClienteUpdateView.as_view(),    name='cliente_editar'),
    path('clientes/<int:pk>/borrar/',          views.ClienteDeleteView.as_view(),    name='cliente_borrar'),

    # Reservas
    path('reservas/',                          views.ReservaListView.as_view(),      name='reserva_lista'),
    path('reservas/nueva/',                    views.ReservaWizardView.as_view(),    name='reserva_crear'),   # ← wizard
    path('reservas/<int:pk>/',                 views.ReservaDetailView.as_view(),    name='reserva_detalle'),
    path('reservas/<int:pk>/editar/',          views.ReservaUpdateView.as_view(),    name='reserva_editar'),
    path('reservas/<int:pk>/borrar/',          views.ReservaDeleteView.as_view(),    name='reserva_borrar'),
    path('reservas/<int:pk>/cuenta/',          views.reserva_cuenta_pdf,             name='reserva_cuenta'),

    # Restaurante
    path('api/club/platos/', views.lista_platos_api, name='lista_platos_api'),
    # Sauna
    path('api/camaras/', views.api_camaras, name='api_camaras'),
    # API JSON
    path('api/estado/', views.estado_habitaciones_api, name='api_estado'),
    path('api/reservas/', views.api_reservas, name='api_reservas'),
    path('api/consumos/',                      views.api_consumos,                   name='api_consumos'),
    path('api/dashboard/',                     views.api_dashboard,                  name='api_dashboard'),

    #reserva
path('api/habitaciones/disponibles/', views.habitaciones_disponibles_api, name='habitaciones_disponibles_api'),]