from django.apps import AppConfig


class ClubConfig(AppConfig):
    name = 'club'
    verbose_name = 'Gestión Cataga Club'

    def ready(self):
        from . import signals  # noqa: F401