from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import models


class Cliente(models.Model):
    nombre = models.CharField(max_length=100)
    email = models.EmailField(max_length=120, blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    esta_en_sauna = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Habitacion(models.Model):
    TIPO_CHOICES = [
        ('Individual', 'Individual'),
        ('Doble', 'Doble'),
        ('Suite', 'Suite'),
        ('Familiar', 'Familiar'),
    ]

    numero = models.IntegerField(unique=True)
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES)
    precio_por_noche = models.DecimalField(max_digits=8, decimal_places=2)
    esta_ocupada = models.BooleanField(default=False)
    capacidad = models.PositiveIntegerField(default=2)

    class Meta:
        ordering = ['numero']

    def __str__(self):
        return f"Habitación {self.numero} ({self.tipo})"

    def clean(self):
        if self.precio_por_noche is not None and self.precio_por_noche <= 0:
            raise ValidationError({'precio_por_noche': 'El precio debe ser mayor a 0.'})
        if self.numero is not None and self.numero <= 0:
            raise ValidationError({'numero': 'El número de habitación debe ser positivo.'})


class Reserva(models.Model):
    ESTADO_CHOICES = [
        ('activa', 'Activa'),
        ('finalizada', 'Finalizada'),
        ('cancelada', 'Cancelada'),
    ]

    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='reservas')
    habitacion = models.ForeignKey(Habitacion, on_delete=models.PROTECT, related_name='reservas')
    fecha_checkin = models.DateField()
    fecha_checkout = models.DateField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='activa')
    total_acumulado = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))

    class Meta:
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"Reserva #{self.pk} - {self.cliente.nombre}"

    @property
    def noches(self):
        if self.fecha_checkin and self.fecha_checkout:
            delta = (self.fecha_checkout - self.fecha_checkin).days
            return max(delta, 0)
        return 0

    def calcular_total(self):
        costo_habitacion = Decimal(str(self.habitacion.precio_por_noche)) * Decimal(self.noches)
        costo_consumos = sum(
            (Decimal(str(c.precio)) * Decimal(str(c.cantidad)))
            for c in self.cliente.consumos_restaurante.filter(fecha__gte=self.fecha_checkin)
        )
        return costo_habitacion + costo_consumos

    def save(self, *args, **kwargs):
        if self.fecha_checkin and self.fecha_checkout:
            if self.fecha_checkout <= self.fecha_checkin:
                raise ValidationError({'fecha_checkout': 'El check-out debe ser posterior al check-in.'})
        super().save(*args, **kwargs)
        self.total_acumulado = self.calcular_total()
        Reserva.objects.filter(pk=self.pk).update(total_acumulado=self.total_acumulado)


class ConsumoRestaurante(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='consumos_restaurante')
    descripcion_plato = models.CharField(max_length=100)
    precio = models.DecimalField(max_digits=8, decimal_places=2)
    cantidad = models.PositiveIntegerField(default=1)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.cantidad}x {self.descripcion_plato} ({self.cliente.nombre})"

    @property
    def subtotal(self):
        return Decimal(str(self.precio)) * Decimal(str(self.cantidad))

    def clean(self):
        if self.precio is not None and self.precio <= 0:
            raise ValidationError({'precio': 'El precio debe ser mayor a 0.'})
        if self.cantidad is not None and self.cantidad <= 0:
            raise ValidationError({'cantidad': 'La cantidad debe ser mayor a 0.'})