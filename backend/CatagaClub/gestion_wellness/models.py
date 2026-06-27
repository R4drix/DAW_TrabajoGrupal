from django.db import models

class Cliente(models.Model):
    nombre = models.CharField(max_length=100)
    esta_en_sauna = models.BooleanField(default=False)

    def __str__(self):
        return self.nombre

class Habitacion(models.Model):
    numero = models.IntegerField(unique=True)
    tipo = models.CharField(max_length=50)
    precio_por_noche = models.FloatField()
    esta_ocupada = models.BooleanField(default=False)

    def __str__(self):
        return f"Habitación {self.numero}"

class Reserva(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    habitacion = models.ForeignKey(Habitacion, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    total_acumulado = models.FloatField(default=0.0)

    def __str__(self):
        return f"Reserva {self.id} - {self.cliente.nombre}"