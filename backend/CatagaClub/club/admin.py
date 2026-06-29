from django.contrib import admin

from .models import Cliente, ConsumoRestaurante, Habitacion, Reserva


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'email', 'telefono', 'esta_en_sauna')
    search_fields = ('nombre', 'email')


@admin.register(Habitacion)
class HabitacionAdmin(admin.ModelAdmin):
    list_display = ('numero', 'tipo', 'precio_por_noche', 'capacidad', 'esta_ocupada')
    list_filter = ('tipo', 'esta_ocupada')
    search_fields = ('numero',)


@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = ('id', 'cliente', 'habitacion', 'fecha_checkin', 'fecha_checkout', 'estado', 'total_acumulado')
    list_filter = ('estado',)
    search_fields = ('cliente__nombre',)


@admin.register(ConsumoRestaurante)
class ConsumoRestauranteAdmin(admin.ModelAdmin):
    list_display = ('cliente', 'descripcion_plato', 'precio', 'cantidad', 'fecha')
    list_filter = ('fecha',)
    search_fields = ('cliente__nombre', 'descripcion_plato')