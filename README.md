# Aplicación de Gestión de Partes de Trabajo

Esta aplicación web permite gestionar partes de trabajo por sala, incluyendo registro de tareas, fotos y generación de informes PDF.

## Características Principales

- Registro de tareas por sala
- Adjuntar y previsualizar fotos
- Historial completo de tareas
- Generación de informes PDF por período y sala
- Sistema de versiones para cada tarea
- Interfaz responsive y amigable

## Estructura de Archivos

- `index.html`: Página principal de la aplicación
- `js/tareas.js`: Lógica principal de la aplicación
- `css/tareas.css`: Estilos de la aplicación

## Requisitos

- Navegador web moderno (Chrome, Firefox, Edge, etc.)
- Conexión a Internet (para las librerías CDN)

## Instalación

1. Copia todos los archivos a tu servidor web
2. Asegúrate de mantener la estructura de directorios
3. Accede a través del navegador a `index.html`

## Uso

1. **Registro de Tareas**:
   - Selecciona o crea una sala
   - Completa los detalles de la tarea
   - Opcionalmente adjunta fotos
   - Guarda la tarea

2. **Historial**:
   - Visualiza todas las tareas registradas
   - Edita o elimina registros existentes
   - Ve las fotos adjuntas

3. **Informes PDF**:
   - Haz clic en "Generar PDF"
   - Selecciona el período
   - Opcionalmente filtra por sala
   - Genera el informe

## Dependencias

- jsPDF (para generación de PDF)
- Estilos CSS personalizados
- JavaScript vanilla

## Almacenamiento

La aplicación utiliza localStorage para almacenar los datos, lo que significa que:
- Los datos se guardan en el navegador del usuario
- No requiere servidor de base de datos
- Los datos persisten entre sesiones

## Licencia
MIT 