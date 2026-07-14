from django import forms
from django.core.exceptions import ValidationError
from django.utils import timezone

from .models import Cliente, Habitacion, Reserva


class BootstrapMixin:
    """Aplica clases Bootstrap a todos los campos visibles del formulario."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for name, field in self.fields.items():
            widget = field.widget
            css = widget.attrs.get('class', '')
            if isinstance(widget, (forms.CheckboxInput, forms.CheckboxSelectMultiple)):
                widget.attrs['class'] = (css + ' form-check-input').strip()
            elif isinstance(widget, forms.Select):
                widget.attrs['class'] = (css + ' form-select').strip()
            elif isinstance(widget, forms.Textarea):
                widget.attrs['class'] = (css + ' form-control').strip()
            else:
                widget.attrs['class'] = (css + ' form-control').strip()
            if not widget.attrs.get('placeholder'):
                widget.attrs['placeholder'] = field.label or name.title()


class ClienteForm(BootstrapMixin, forms.ModelForm):
    class Meta:
        model = Cliente
        fields = ['nombre', 'email', 'telefono', 'esta_en_sauna']
        widgets = {
            'nombre': forms.TextInput(attrs={'maxlength': 100}),
            'email': forms.EmailInput(),
            'telefono': forms.TextInput(attrs={'maxlength': 20}),
        }

    def clean_nombre(self):
        nombre = (self.cleaned_data.get('nombre') or '').strip()
        if len(nombre) < 3:
            raise ValidationError('El nombre debe tener al menos 3 caracteres.')
        qs = Cliente.objects.filter(nombre__iexact=nombre)
        if self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise ValidationError('Ya existe un cliente con ese nombre.')
        return nombre


class HabitacionForm(BootstrapMixin, forms.ModelForm):
    class Meta:
        model = Habitacion
        fields = ['numero', 'tipo', 'precio_por_noche', 'capacidad', 'esta_ocupada']

    def clean_numero(self):
        numero = self.cleaned_data.get('numero')
        if numero is None or numero <= 0:
            raise ValidationError('El número debe ser positivo.')
        qs = Habitacion.objects.filter(numero=numero)
        if self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise ValidationError('Ya existe una habitación con ese número.')
        return numero


class ReservaForm(BootstrapMixin, forms.ModelForm):
    class Meta:
        model = Reserva
        fields = ['cliente', 'habitacion', 'fecha_checkin', 'fecha_checkout', 'estado']
        widgets = {
            'fecha_checkin': forms.DateInput(attrs={'type': 'date'}),
            'fecha_checkout': forms.DateInput(attrs={'type': 'date'}),
        }

    def clean(self):
        cleaned = super().clean()
        checkin = cleaned.get('fecha_checkin')
        checkout = cleaned.get('fecha_checkout')
        habitacion = cleaned.get('habitacion')
        estado = cleaned.get('estado')

        if checkin and checkout:
            if checkout <= checkin:
                raise ValidationError({'fecha_checkout': 'El check-out debe ser posterior al check-in.'})
            if checkin < timezone.now().date():
                raise ValidationError({'fecha_checkin': 'La fecha de check-in no puede ser en el pasado.'})

        if habitacion and estado == 'activa':
            qs = Reserva.objects.filter(habitacion=habitacion, estado='activa')
            if self.instance.pk:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise ValidationError({'habitacion': 'Esta habitación ya tiene una reserva activa.'})

        return cleaned

