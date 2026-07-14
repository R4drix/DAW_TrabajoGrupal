# 📚 RESUMEN DEL PROYECTO CON CÓDIGO

Basado en los temas del temario: **Capítulo 1: Django Framework** y **Capítulo 2: Angular Framework**

---

## **CAPÍTULO 1: DJANGO FRAMEWORK**

### **1.4 Los Modelos** (Models)

Define la estructura de datos del resort:

```python
# backend/CatagaClub/club/models.py
from django.db import models
from django.core.exceptions import ValidationError
from decimal import Decimal

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
        """Calcula la cantidad de noches de estadía"""
        if self.fecha_checkin and self.fecha_checkout:
            delta = (self.fecha_checkout - self.fecha_checkin).days
            return max(delta, 0)
        return 0
    
    def calcular_total(self):
        """Calcula el total basado en noches × precio/noche"""
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
```

---

### **1.6 Generar migraciones**

```bash
# En la carpeta del backend
python manage.py makemigrations
python manage.py migrate
```

---

### **1.11 Conexión con Supabase** (Database)

Configuración en `settings.py`:

```python
# backend/CatagaClub/CatagaClub/settings.py

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgres',
        'USER': 'postgres',
        'PASSWORD': 'Cataga_Club_123',
        'HOST': 'db.nfnpdxxsfsmhewyfeavu.supabase.co',
        'PORT': '5432',
    }
}

# Configuración de idioma
LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
```

---

### **1.13 Servicio web RESTful** (API JSON Endpoints)

Las vistas en Django devuelven JSON para consumir desde Angular:

```python
# backend/CatagaClub/club/views.py

from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.db.models import Sum
from django.utils import timezone
from django.views.generic import CreateView, UpdateView, DeleteView, ListView, DetailView, TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

@require_GET
def api_estado_habitaciones(request):
    """Endpoint que devuelve todas las habitaciones disponibles"""
    data = list(
        Habitacion.objects.values('id', 'numero', 'tipo', 'precio_por_noche', 'esta_ocupada', 'capacidad')
    )
    for item in data:
        item['precio_por_noche'] = float(item['precio_por_noche'])
    return JsonResponse({'ok': True, 'count': len(data), 'habitaciones': data}, safe=False)


@require_GET
def api_reservas(request):
    """Endpoint que devuelve todas las reservas con detalles del cliente"""
    data = []
    for r in Reserva.objects.select_related('cliente', 'habitacion').all()[:200]:
        data.append({
            'id': r.id,
            'cliente': r.cliente.nombre,
            'habitacion': r.habitacion.numero,
            'checkin': r.fecha_checkin.isoformat(),
            'checkout': r.fecha_checkout.isoformat(),
            'estado': r.estado,
            'total': float(r.total_acumulado),
        })
    return JsonResponse({'ok': True, 'count': len(data), 'reservas': data}, safe=False)


@require_GET
def api_consumos(request):
    """Endpoint que devuelve consumos del restaurante"""
    data = []
    # Aquí iría la lógica si existe ConsumoRestaurante
    return JsonResponse({'ok': True, 'count': len(data), 'consumos': data}, safe=False)


@require_GET
def api_dashboard(request):
    """Endpoint que devuelve métricas del resort"""
    hoy = timezone.now().date()
    reservas_activas = Reserva.objects.filter(estado='activa').count()
    habitaciones_ocupadas = Habitacion.objects.filter(esta_ocupada=True).count()
    
    return JsonResponse({
        'ok': True,
        'clientes': Cliente.objects.count(),
        'habitaciones_total': Habitacion.objects.count(),
        'habitaciones_ocupadas': habitaciones_ocupadas,
        'reservas_activas': reservas_activas,
        'ingresos_restaurante_hoy': 0.0,
        'consumos_hoy': 0,
    }, safe=False)


# ─── CRUD CON CLASS-BASED VIEWS ───────────────────────

class HabitacionListView(ListView):
    model = Habitacion
    template_name = 'club/habitacion_lista.html'
    context_object_name = 'habitaciones'


class HabitacionCreateView(LoginRequiredMixin, CreateView):
    model = Habitacion
    fields = ['numero', 'tipo', 'precio_por_noche', 'capacidad']
    template_name = 'club/form.html'
    success_url = '/club/habitaciones/'


class HabitacionUpdateView(LoginRequiredMixin, UpdateView):
    model = Habitacion
    fields = ['numero', 'tipo', 'precio_por_noche', 'capacidad']
    template_name = 'club/form.html'
    
    def get_success_url(self):
        return f'/club/habitaciones/{self.object.pk}/'


class HabitacionDeleteView(LoginRequiredMixin, DeleteView):
    model = Habitacion
    template_name = 'club/confirmar_borrado.html'
    success_url = '/club/habitaciones/'


# ─── WIZARD DE RESERVA ───────────────────────────────

class ReservaWizardView(LoginRequiredMixin, TemplateView):
    """Formulario de reserva en pasos para el cliente final"""
    template_name = 'club/reserva_wizard.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['habitaciones'] = Habitacion.objects.all().order_by('tipo', 'numero')
        return context
    
    def post(self, request, *args, **kwargs):
        habitacion_id = request.POST.get('habitacion')
        checkin = request.POST.get('fecha_checkin')
        checkout = request.POST.get('fecha_checkout')
        
        # Buscar o crear cliente
        cliente, _ = Cliente.objects.get_or_create(
            nombre=request.user.username,
            defaults={'email': request.user.email or ''}
        )
        
        reserva = Reserva.objects.create(
            cliente=cliente,
            habitacion_id=habitacion_id,
            fecha_checkin=checkin,
            fecha_checkout=checkout,
            estado='activa'
        )
        
        messages.success(request, '¡Reserva confirmada!')
        return redirect('club:reserva_lista')
```

---

### **1.13.2 Rutas (URLs)**

```python
# backend/CatagaClub/club/urls.py

from django.urls import path
from . import views

app_name = 'club'

urlpatterns = [
    # Home
    path('', views.home, name='home'),
    
    # Habitaciones
    path('habitaciones/', views.HabitacionListView.as_view(), name='habitacion_lista'),
    path('habitaciones/nueva/', views.HabitacionCreateView.as_view(), name='habitacion_crear'),
    path('habitaciones/<int:pk>/', views.HabitacionDetailView.as_view(), name='habitacion_detalle'),
    path('habitaciones/<int:pk>/editar/', views.HabitacionUpdateView.as_view(), name='habitacion_editar'),
    path('habitaciones/<int:pk>/borrar/', views.HabitacionDeleteView.as_view(), name='habitacion_borrar'),
    
    # Clientes
    path('clientes/', views.ClienteListView.as_view(), name='cliente_lista'),
    path('clientes/nuevo/', views.ClienteCreateView.as_view(), name='cliente_crear'),
    
    # Reservas
    path('reservas/', views.ReservaListView.as_view(), name='reserva_lista'),
    path('reservas/nueva/', views.ReservaWizardView.as_view(), name='reserva_crear'),
    path('reservas/<int:pk>/', views.ReservaDetailView.as_view(), name='reserva_detalle'),
    
    # API JSON
    path('api/estado/', views.api_estado_habitaciones, name='api_estado'),
    path('api/reservas/', views.api_reservas, name='api_reservas'),
    path('api/consumos/', views.api_consumos, name='api_consumos'),
    path('api/dashboard/', views.api_dashboard, name='api_dashboard'),
]
```

---

### **1.13.1 Instalar Django REST Framework y CORS**

En `settings.py`:

```python
# backend/CatagaClub/CatagaClub/settings.py

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',  # ← Para permitir peticiones desde Angular
    'club',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # ← CORS ANTES de CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS — permitir que Angular consuma la API
CORS_ALLOWED_ORIGINS = [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
]
CORS_ALLOW_CREDENTIALS = True

# Auth
LOGIN_URL = '/accounts/login/'
LOGIN_REDIRECT_URL = '/club/'
LOGOUT_REDIRECT_URL = '/club/'
```

---

## **CAPÍTULO 2: ANGULAR FRAMEWORK**

### **2.2 Crear una aplicación Angular**

Estructura del proyecto:

```
frontend/CatagaClubFrontend/
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   ├── api.service.ts          ← Centraliza llamadas al backend
│   │   │   └── models.ts               ← Interfaces TypeScript
│   │   ├── pages/
│   │   │   ├── habitaciones/
│   │   │   │   ├── habitaciones.ts
│   │   │   │   ├── habitaciones.html
│   │   │   │   └── habitaciones.css
│   │   │   ├── dashboard/
│   │   │   ├── reservas/
│   │   │   ├── restaurante/
│   │   │   └── home/
│   │   ├── shared/
│   │   │   ├── navbar/
│   │   │   └── footer/
│   │   ├── app.routes.ts               ← Definición de rutas
│   │   ├── app.config.ts               ← Configuración global
│   │   └── app.ts                      ← Componente raíz
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── package.json
├── angular.json
└── tsconfig.json
```

---

### **2.3 Instalar las dependencias**

```json
{
  "name": "cataga-club-frontend",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test"
  },
  "private": true,
  "packageManager": "npm@11.16.0",
  "dependencies": {
    "@angular/animations": "^22.0.0",
    "@angular/common": "^22.0.0",
    "@angular/compiler": "^22.0.0",
    "@angular/core": "^22.0.0",
    "@angular/forms": "^22.0.0",
    "@angular/platform-browser": "^22.0.0",
    "@angular/platform-browser-dynamic": "^22.0.0",
    "@angular/router": "^22.0.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.13.0"
  },
  "devDependencies": {
    "@angular/build": "^22.0.0",
    "@angular/cli": "^22.0.0",
    "@angular/compiler-cli": "^22.0.0",
    "jsdom": "^28.0.0",
    "prettier": "^3.8.1",
    "typescript": "~6.0.2",
    "vitest": "^4.0.8"
  }
}
```

---

### **2.4 Iniciar el servidor de desarrollo**

```bash
# Instalación
cd frontend/CatagaClubFrontend
npm install

# Ejecutar
npm start
# Equivalente a: ng serve
# Acceder a: http://localhost:4200
```

---

### **2.5 Frontend: Modelos TypeScript (interfaces)**

```typescript
// frontend/CatagaClubFrontend/src/app/services/models.ts

export interface Habitacion {
  id: number;
  numero: number;
  tipo: string;
  precio_por_noche: number;
  capacidad: number;
  esta_ocupada: boolean;
}

export interface Reserva {
  id: number;
  cliente: string;
  habitacion: number;
  checkin: string;
  checkout: string;
  estado: string;
  total: number;
}

export interface Consumo {
  id: number;
  cliente: string;
  plato: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  fecha: string;
}

export interface Dashboard {
  clientes: number;
  habitaciones_total: number;
  habitaciones_ocupadas: number;
  reservas_activas: number;
  ingresos_restaurante_hoy: number;
  consumos_hoy: number;
}
```

---

### **2.6 Router y Axios (ApiService)**

```typescript
// frontend/CatagaClubFrontend/src/app/services/api.service.ts

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Habitacion, Reserva, Consumo, Dashboard } from './models';

/**
 * Servicio único de acceso a la API del backend Django.
 * Centraliza la URL base y los endpoints para que cualquier componente
 * pueda consumirlos sin repetir configuración.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  
  // En desarrollo: Django corre en :8000 y Angular en :4200
  private readonly baseUrl = 'http://localhost:8000/club/api';

  getEstadoHabitaciones(): Observable<{ ok: boolean; count: number; habitaciones: Habitacion[] }> {
    return this.http.get<{ ok: boolean; count: number; habitaciones: Habitacion[] }>(
      `${this.baseUrl}/estado/`
    );
  }

  getReservas(): Observable<{ ok: boolean; count: number; reservas: Reserva[] }> {
    return this.http.get<{ ok: boolean; count: number; reservas: Reserva[] }>(
      `${this.baseUrl}/reservas/`
    );
  }

  getConsumos(): Observable<{ ok: boolean; count: number; consumos: Consumo[] }> {
    return this.http.get<{ ok: boolean; count: number; consumos: Consumo[] }>(
      `${this.baseUrl}/consumos/`
    );
  }

  getDashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${this.baseUrl}/dashboard/`);
  }
}
```

---

### **2.7 Router y rutas dinámicas**

```typescript
// frontend/CatagaClubFrontend/src/app/app.routes.ts

import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Habitaciones } from './pages/habitaciones/habitaciones';
import { Sauna } from './pages/sauna/sauna';
import { Nosotros } from './pages/nosotros/nosotros';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { Reservas } from './pages/reservas/reservas';
import { Restaurante } from './pages/restaurante/restaurante';
import { ReservarWizard } from './pages/reservar/reservar';

export const routes: Routes = [
  {
    path: 'reservar',
    component: ReservarWizard,
  },
  {
    path: '',
    component: Home,
  },
  {
    path: 'habitaciones',
    component: Habitaciones,
  },
  {
    path: 'sauna',
    component: Sauna,
  },
  {
    path: 'restaurante',
    component: Restaurante,
  },
  {
    path: 'nosotros',
    component: Nosotros,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'reservas',
    component: Reservas,
  },
];
```

---

### **2.2.1 Configuración del proyecto (app.config.ts)**

```typescript
// frontend/CatagaClubFrontend/src/app/app.config.ts

import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),  // ← Habilita HttpClient
  ],
};
```

---

### **2.5 Componente: Habitaciones (Standalone Component)**

```typescript
// frontend/CatagaClubFrontend/src/app/pages/habitaciones/habitaciones.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit, Signal, inject, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Habitacion } from '../../services/models';

@Component({
  selector: 'app-habitaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './habitaciones.html',
  styleUrls: ['./habitaciones.css'],
})
export class Habitaciones implements OnInit {
  private readonly api = inject(ApiService);

  habitaciones: Habitacion[] = [];
  loading = signal(true);
  errorMsg = '';
  habitacionSeleccionada = signal<Habitacion | null>(null);

  ngOnInit(): void {
    this.api.getEstadoHabitaciones().subscribe({
      next: (resp) => {
        this.habitaciones = resp.habitaciones ?? [];
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg = `No se pudo conectar con el backend (${err.status ?? 'sin status'}).`;
        this.loading.set(false);
      },
    });
  }

  public get destacadas(): Habitacion[] {
    return this.habitaciones;
  }

  public select(h: Habitacion): void {
    this.habitacionSeleccionada.set(h);
  }

  public deselect(): void {
    this.habitacionSeleccionada.set(null);
  }
}
```

---

### **Componente HTML asociado**

```html
<!-- frontend/CatagaClubFrontend/src/app/pages/habitaciones/habitaciones.html -->

<div class="container">
  <h1>Habitaciones</h1>
  
  <div *ngIf="loading()" class="spinner">Cargando...</div>
  
  <div *ngIf="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>
  
  <div class="habitaciones-grid">
    <div *ngFor="let h of habitaciones" class="card" (click)="select(h)">
      <h3>{{ h.numero }} - {{ h.tipo }}</h3>
      <p>Capacidad: {{ h.capacidad }} personas</p>
      <p class="precio">{{ h.precio_por_noche | currency }}</p>
      <span *ngIf="h.esta_ocupada" class="badge badge-danger">Ocupada</span>
      <span *ngIf="!h.esta_ocupada" class="badge badge-success">Disponible</span>
    </div>
  </div>
  
  <div *ngIf="habitacionSeleccionada()" class="detalle">
    <h2>Detalles</h2>
    <p>Habitación: {{ habitacionSeleccionada()?.numero }}</p>
    <p>Tipo: {{ habitacionSeleccionada()?.tipo }}</p>
    <p>Precio: {{ habitacionSeleccionada()?.precio_por_noche | currency }}</p>
    <button (click)="deselect()">Cerrar</button>
  </div>
</div>
```

---

### **Componente: Dashboard**

```typescript
// frontend/CatagaClubFrontend/src/app/pages/dashboard/dashboard.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Dashboard } from '../../services/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  data: Dashboard | null = null;
  loading = true;
  errorMsg = '';

  ngOnInit(): void {
    this.api.getDashboard().subscribe({
      next: (resp) => {
        this.data = resp;
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = `Error al cargar dashboard: ${err.status}`;
        this.loading = false;
      },
    });
  }
}
```

---

## 📋 **RESUMEN VISUAL**

| Aspecto | Django (Backend) | Angular (Frontend) |
|---------|------------------|--------------------|
| **Lenguaje** | Python | TypeScript |
| **Puerto** | 8000 | 4200 |
| **Base de datos** | PostgreSQL (Supabase) | Models/Interfaces |
| **API** | RESTful JSON | HttpClient + RxJS Observable |
| **Definición de rutas** | `urls.py` | `app.routes.ts` |
| **Configuración CORS** | `settings.py` | `provideHttpClient()` |
| **Componentes** | Class-Based Views (ListView, CreateView) | Standalone Components |
| **Autenticación** | LoginRequiredMixin | HttpClient + sesión |

---

## 🚀 **Cómo ejecutar todo**

### Backend:
```bash
cd backend/CatagaClub
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py runserver 0.0.0.0:8000
```

### Frontend:
```bash
cd frontend/CatagaClubFrontend
npm install
npm start
# Acceder: http://localhost:4200/
```

---

**Proyecto Cataga Club - Gestión Integral de Resort** ✨
