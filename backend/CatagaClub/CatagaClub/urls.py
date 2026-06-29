from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from django.shortcuts import redirect


def root_redirect(request):
    return redirect('club:habitacion_lista')


urlpatterns = [
    path('', root_redirect),
    path('admin/', admin.site.urls),

    # Auth
    path('accounts/login/', auth_views.LoginView.as_view(template_name='club/auth/login.html'), name='login'),
    path('accounts/logout/', auth_views.LogoutView.as_view(next_page='club:habitacion_lista'), name='logout'),

    # App principal
    path('club/', include(('club.urls', 'club'), namespace='club')),
]