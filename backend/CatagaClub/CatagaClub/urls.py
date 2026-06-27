from django.contrib import admin
from django.urls import path, include # ¡Asegúrate de importar include!

urlpatterns = [
    path('admin/', admin.site.urls),
    path('club/', include('gestion_wellness.urls')), # Vincula las rutas de tu app
]