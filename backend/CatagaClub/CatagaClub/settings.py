"""
Django settings for CatagaClub project.
Preparado para deploy en Render (Postgres + gunicorn + whitenoise).
En desarrollo se puede usar SQLite seteando USE_SQLITE=1.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR.parent / '.env')
except ImportError:
    pass

import dj_database_url

# ---------- Seguridad ----------
SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-b4s)6-0-#l@!kehpv^2k1pd!vzuuw5&f2_d!#hbv3z8=t*_tr%'
)

DEBUG = os.environ.get('DJANGO_DEBUG', '0') == '1'

ALLOWED_HOSTS = [
    h.strip() for h in os.environ.get(
        'DJANGO_ALLOWED_HOSTS',
        'localhost,127.0.0.1,catagaclub-api.onrender.com'
    ).split(',') if h.strip()
]

# ---------- Apps ----------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'club',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'CatagaClub.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'CatagaClub.wsgi.application'

# ---------- Base de datos ----------
# Si USE_SQLITE=1, usa SQLite local. Si no, usa DATABASE_URL (Postgres en Render/Supabase).
if os.environ.get('USE_SQLITE') == '1':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    database_url = os.environ.get('DATABASE_URL', '').strip()
    if not database_url:
        # Fallback seguro: SQLite si no hay DATABASE_URL seteada (útil para dev).
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
    else:
        DATABASES = {
            'default': dj_database_url.parse(database_url, conn_max_age=600)
        }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Auth
LOGIN_URL = '/accounts/login/'
LOGIN_REDIRECT_URL = '/club/'
LOGOUT_REDIRECT_URL = '/club/'

# ---------- CORS ----------
# Lista base: localhost para dev.
extra_origins = os.environ.get('CORS_ALLOWED_ORIGINS_EXTRA', '')
origins = [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'https://cataga-club-frontend.vercel.app',
    'https://daw-trabajo-grupal-jenkdk50b-iker281521.vercel.app',
]
if extra_origins:
    origins += [o.strip() for o in extra_origins.split(',') if o.strip()]

CORS_ALLOWED_ORIGINS = origins
CORS_ALLOW_CREDENTIALS = True
