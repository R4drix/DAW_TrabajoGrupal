from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver

from .models import Reserva


@receiver(pre_save, sender=Reserva)
def _guardar_estado_anterior(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._estado_anterior = Reserva.objects.get(pk=instance.pk).estado
        except Reserva.DoesNotExist:
            instance._estado_anterior = None
    else:
        instance._estado_anterior = None


@receiver(post_save, sender=Reserva)
def actualizar_estado_habitacion(sender, instance, created, **kwargs):
    if instance.estado == 'activa':
        instance.habitacion.esta_ocupada = True
    else:
        instance.habitacion.esta_ocupada = False
    instance.habitacion.save(update_fields=['esta_ocupada'])


@receiver(post_delete, sender=Reserva)
def liberar_habitacion_al_borrar(sender, instance, **kwargs):
    habitacion = instance.habitacion
    if not Reserva.objects.filter(habitacion=habitacion, estado='activa').exists():
        habitacion.esta_ocupada = False
        habitacion.save(update_fields=['esta_ocupada'])