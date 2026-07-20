from django.db import migrations, models


def seed_camaras(apps, schema_editor):
    Camara = apps.get_model('club', 'Camara')
    datos = [
        {
            'tipo': 'Sauna Seco',
            'descripcion': 'Calor seco con piedras volcánicas para eliminar toxinas y mejorar la circulación.',
            'capacidad': 0,
            'icon_class': 'flame',
            'orden': 1,
        },
        {
            'tipo': 'Cámara de Vapor',
            'descripcion': 'Baño turco con sutiles aromas a eucalipto para purificar el sistema respiratorio.',
            'capacidad': 80,
            'icon_class': 'wind',
            'orden': 2,
        },
        {
            'tipo': 'Jacuzzi & Relax',
            'descripcion': 'Aguas termales con chorros de hidromasaje para aliviar la tensión muscular.',
            'capacidad': 120,
            'icon_class': 'bath',
            'orden': 3,
        },
        {
            'tipo': 'Cámara Privada',
            'descripcion': 'Un espacio exclusivo que ofrece total privacidad para una persona o un grupo de amigos.',
            'capacidad': 200,
            'icon_class': 'user-check',
            'orden': 4,
        },
    ]
    for d in datos:
        Camara.objects.get_or_create(tipo=d['tipo'], defaults=d)


def remove_camaras(apps, schema_editor):
    Camara = apps.get_model('club', 'Camara')
    Camara.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('club', '0003_habitacion_imagen_bano_habitacion_imagen_cama_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Camara',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo', models.CharField(max_length=100)),
                ('descripcion', models.TextField(blank=True, default='')),
                ('capacidad', models.PositiveIntegerField(default=0, help_text='0 = uso individual / sin límite fijo')),
                ('icon_class', models.CharField(blank=True, default='flame', help_text='Nombre del ícono de Tabler Icons usado en el frontend (ej. flame, wind, bath)', max_length=50)),
                ('orden', models.PositiveIntegerField(default=0, help_text='Orden de aparición en la vista de sauna')),
            ],
            options={
                'verbose_name': 'Cámara de sauna',
                'verbose_name_plural': 'Cámaras de sauna',
                'ordering': ['orden', 'id'],
            },
        ),
        migrations.RunPython(seed_camaras, remove_camaras),
    ]
