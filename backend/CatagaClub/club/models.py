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


from django.db import models
from django.core.exceptions import ValidationError

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

    # --- NUEVOS CAMPOS PARA LAS 4 VISTAS ---
    imagen_principal = models.CharField(max_length=500, blank=True, null=True, help_text="Vista general de la habitación")
    imagen_cama = models.CharField(max_length=500, blank=True, null=True, help_text="Foto detallada de la cama")
    imagen_bano = models.CharField(max_length=500, blank=True, null=True, help_text="Foto del cuarto de baño")
    imagen_extra = models.CharField(max_length=500, blank=True, null=True, help_text="Detalles adicionales (jacuzzi, sauna o decoración)")

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
        # Ahora el total es únicamente el costo de la habitación por las noches de estadía
        costo_habitacion = Decimal(str(self.habitacion.precio_por_noche)) * Decimal(self.noches)
        return costo_habitacion
    
    def save(self, *args, **kwargs):
        if self.fecha_checkin and self.fecha_checkout:
            if self.fecha_checkout <= self.fecha_checkin:
                raise ValidationError({'fecha_checkout': 'El check-out debe ser posterior al check-in.'})
        super().save(*args, **kwargs)
        self.total_acumulado = self.calcular_total()
        Reserva.objects.filter(pk=self.pk).update(total_acumulado=self.total_acumulado)


class Plato(models.Model):
    CATEGORIAS = [
        ('extras', 'Extras / Platos'),
        ('guarniciones', 'Guarniciones'),
        ('sandwiches', 'Sándwiches'),
        ('salchipapas', 'Salchipapas'),
        ('bebidas', 'Bebidas'),
        ('bebidas_calientes', 'Bebidas Calientes'),
        ('jugos', 'Jugos Naturales'),
        ('cocteles', 'Cócteles'),
        ('postres', 'Postres'),
        ('frapps', 'Frapps'),
    ]

    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=6, decimal_places=2)
    imagen_url = models.URLField(max_length=500, blank=True, default='') 
    categoria = models.CharField(max_length=30, choices=CATEGORIAS, default='extras')
    disponible = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nombre} ({self.categoria})"


class Camara(models.Model):
    """Cámara/espacio del sauna del hotel (seco, vapor, jacuzzi, privada, etc.).
    Los campos reflejan exactamente la interfaz Camara de models.ts en el frontend.
    """
    tipo = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, default='')
    capacidad = models.PositiveIntegerField(default=0, help_text='0 = uso individual / sin límite fijo')
    icon_class = models.CharField(
        max_length=50, blank=True, default='flame',
        help_text='Nombre del ícono de Tabler Icons usado en el frontend (ej. flame, wind, bath)'
    )
    orden = models.PositiveIntegerField(default=0, help_text='Orden de aparición en la vista de sauna')

    class Meta:
        ordering = ['orden', 'id']
        verbose_name = 'Cámara de sauna'
        verbose_name_plural = 'Cámaras de sauna'

    def __str__(self):
        return self.tipo