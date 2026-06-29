# CatagaClub Frontend

Aplicación web desarrollada con **Angular** para la gestión y presentación del Club Cataga. Permite a los usuarios explorar habitaciones, conocer el sauna, realizar reservas y obtener información sobre el establecimiento.

---

## Tecnologías utilizadas

- [Angular](https://angular.io/) — Framework principal
- TypeScript
- HTML5 / CSS3

---

## Estructura del proyecto

```
CatagaClubFrontend/
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   ├── habitaciones/   # Vista de habitaciones disponibles
│   │   │   ├── home/           # Página principal
│   │   │   ├── nosotros/       # Sección "Sobre nosotros"
│   │   │   ├── reserve/        # Formulario de reservas
│   │   │   └── sauna/          # Sección del sauna
│   │   ├── shared/
│   │   │   ├── footer/         # Componente pie de página
│   │   │   └── navbar/         # Componente barra de navegación
│   │   ├── app.routes.ts       # Configuración de rutas
│   │   ├── app.config.ts       # Configuración de la aplicación
│   │   └── app.ts              # Componente raíz
│   ├── assets/                 # Recursos estáticos (imágenes, íconos)
│   ├── index.html
│   ├── main.ts
│   └── styles.css              # Estilos globales
├── angular.json
├── package.json
└── tsconfig.json
```

---

## Páginas principales

| Ruta | Descripción |
|------|-------------|
| `/home` | Página de bienvenida |
| `/habitaciones` | Listado de habitaciones |
| `/sauna` | Información del sauna |
| `/reserve` | Formulario de reserva |
| `/nosotros` | Información del club |

---

## Instalación y ejecución

### Prerrequisitos

- Node.js >= 18.x
- Angular CLI >= 17.x

```bash
npm install -g @angular/cli
```

### Pasos

```bash
# 1. Clonar el repositorio
git clone [repositorio](https://github.com/R4drix/DAW_TrabajoGrupal)
cd frontend/CatagaClubFrontend

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo
ng serve
```

La aplicación estará disponible en `http://localhost:4200`.

### Compilar para producción

```bash
ng build --configuration production
```

Los archivos compilados se generarán en la carpeta `dist/`.

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `ng serve` | Inicia el servidor de desarrollo |
| `ng build` | Compila la aplicación |
| `ng test` | Ejecuta las pruebas unitarias |
| `ng lint` | Analiza el código con el linter |

---

## Autor
- Mendoza Taco David Jose Luis
- Cusi Quicaño Jhovi Jose
- Neyra Chambilla Rodrigo Enrique
- Salazar Luque Sergio Ivan

Desarrollado como proyecto frontend para el curso.