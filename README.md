# Sistema de Alerta Temprana en Docencia Universitaria (EWS) - UTP

Plataforma institucional de analítica educativa y detección temprana de estudiantes en riesgo académico antes de la evaluación sumativa oficial.

---

## Arquitectura del Proyecto

```text
EWS_Produccion/
├── backend/
│   ├── app/
│   │   ├── core/           # Configuración inmutable y seguridad JWT/Bcrypt
│   │   ├── db/             # Conexión SQLAlchemy y sesiones
│   │   ├── models/         # Modelos relacionales ORM (Docente, Curso)
│   │   ├── routers/        # Controladores REST API (Auth, Docente, Cursos)
│   │   ├── schemas/        # Esquemas de validación Pydantic v2
│   │   └── main.py         # Punto de entrada FastAPI y montaje estático
│   ├── tests/              # Suite de pruebas automatizadas con pytest
│   └── requirements.txt    # Dependencias de producción
├── database/
│   └── schema.sql          # Estructura DDL oficial en SQL (PostgreSQL & SQLite)
├── web/
│   ├── assets/             # Logo institucional vectorial y plantilla Excel
│   ├── css/                # Estilos personalizados TailwindCSS
│   ├── js/
│   │   ├── components/     # Componentes modulares de interfaz
│   │   ├── services/       # Motor analítico, API client y manejo de Excel
│   │   ├── constants.js    # Parámetros pedagógicos y ponderaciones UTP
│   │   ├── main.js         # Bootstrap de la aplicación web
│   │   └── state.js        # Estado reactivo y sincronización
│   └── index.html          # Interfaz principal unificada
├── .gitignore              # Exclusiones de Git para producción
├── DESPLIEGUE_PRODUCCION.md# Guía paso a paso para despliegue en la nube
├── iniciar_servidor_local.sh # Script de arranque local
├── Procfile                # Descriptor de proceso para Cloud (Render/Railway)
├── render.yaml             # Especificación de infraestructura como código
└── schema.sql              # Copia de respaldo del esquema DDL en raíz
```

---

## Ejecución Local

1. Instalar dependencias:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. Ejecutar suite de pruebas:
   ```bash
   PYTHONPATH=. pytest backend/tests/
   ```

3. Iniciar servidor:
   ```bash
   bash iniciar_servidor_local.sh
   ```
   Acceso web en: `http://localhost:8000`  
   Documentación Swagger: `http://localhost:8000/docs`

---

## Despliegue en la Nube

Para publicar el sistema en la nube con persistencia permanente (sin que se borren los datos al apagarse), consulta:
`DESPLIEGUE_PRODUCCION.md`
