# Guía de Despliegue en Producción // Persistencia Permanente

Esta guía detalla cómo publicar el **Sistema de Alerta Temprana (EWS)** en la nube con **persistencia permanente de datos**, garantizando que docentes, cursos, notas y diagnósticos se conserven de manera indefinida aunque el servidor web entre en reposo o se reinicie.

---

## 1. Por qué SQLite pierde datos en la nube gratuita (Y la Solución)

En plataformas de alojamiento en la nube con nivel gratuito (como Render, Railway o Koyeb), las instancias de aplicaciones web operan bajo un modelo de **disco efímero (ephemeral storage)**:
- Cuando la aplicación pasa 15 minutos sin visitas, el contenedor entra en modo suspensión (*spin-down*) para ahorrar cómputo.
- Al despertar o al realizar un nuevo despliegue, el contenedor se vuelve a construir desde el commit de Git original.
- Si la base de datos es un archivo local como `ews.db` (SQLite), **el archivo se destruye y se restablece en cada reinicio**.

### La Solución Arquitectónica
Separar el servidor de aplicaciones de la base de datos:
1. **Servidor Web / API:** Render (Aloja FastAPI + Frontend Web en HTTPS).
2. **Base de Datos Persistente:** PostgreSQL externo en la nube (Almacena los datos en disco persistente dedicado que nunca se borra).

---

## 2. Proveedores de Base de Datos PostgreSQL Gratuita Permanente

### Opción 1 (Recomendada): Neon.tech
- **URL:** [https://neon.tech](https://neon.tech)
- **Ventajas:**
  - 100% Gratuito y Serverless (PostgreSQL 16).
  - 0.5 GB de almacenamiento persistente (más que suficiente para miles de estudiantes y ciclos académicos).
  - **No caduca:** A diferencia de Render PostgreSQL (que expira a los 30 días en el plan free), Neon mantiene tu base de datos activa permanentemente.
  - Registro inmediato con cuenta de GitHub en 30 segundos.

### Opción 2: Supabase
- **URL:** [https://supabase.com](https://supabase.com)
- **Ventajas:**
  - 100% Gratuito (500 MB de base de datos PostgreSQL persistente).
  - Panel visual interactivo (*Table Editor*) para inspeccionar tablas y registros en tiempo real.
  - Cadena de conexión estándar compatible con SQLAlchemy.

---

## 3. Pasos de Despliegue en 4 Etapas

### Etapa 1: Crear la Base de Datos Persistente en Neon.tech

1. Ingresa a [https://neon.tech](https://neon.tech) e inicia sesión con tu cuenta de **GitHub**.
2. Haz clic en **Create Project**.
3. Asigna un nombre al proyecto (ejemplo: `ews-utp-database`).
4. En el panel de bienvenida verás una sección llamada **Connection String** o **Connection Details**.
5. Asegúrate de que esté seleccionada la pestaña **Postgres** o **Direct Connection** y copia la URL completa. Tendrá un formato similar a:
   ```text
   postgresql://usuario:contraseña@ep-cool-flower-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
6. *(Opcional)* Si deseas aplicar el esquema manualmente, ve a la pestaña **SQL Editor** en Neon, abre el archivo `database/schema.sql` de este proyecto, copia su contenido, pégalo en el editor y presiona **Run**. (De todas formas, FastAPI creará las tablas automáticamente al conectarse por primera vez).

---

### Etapa 2: Subir esta Carpeta a GitHub

Abre tu terminal dentro de la carpeta `EWS_Produccion`:

```bash
cd EWS_Produccion

# Inicializar Git
git init

# Agregar todos los archivos limpios
git add .
git commit -m "feat: Despliegue de producción EWS con persistencia PostgreSQL"

# Vincular a tu repositorio remoto en GitHub
# (Crea previamente un repositorio vacío en github.com con el nombre que elijas)
git remote add origin https://github.com/TU_USUARIO/ews-produccion.git
git branch -M main
git push -u origin main
```

---

### Etapa 3: Crear el Servicio Web en Render

1. Entra a [https://render.com](https://render.com) e inicia sesión con tu cuenta de **GitHub**.
2. Presiona el botón **New +** y selecciona **Web Service**.
3. Elige el repositorio que acabas de subir (`ews-produccion`).
4. Configura los parámetros del servicio:
   - **Name:** `ews-alerta-temprana-utp` (o el nombre público que prefieras).
   - **Region:** Ohio (US East) o Frankfurt.
   - **Branch:** `main`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
5. Desplázate hacia abajo hasta la sección **Environment Variables (Variables de Entorno)** y haz clic en **Add Environment Variable** para agregar:
   - **Variable 1:**
     - **Key:** `DATABASE_URL`
     - **Value:** *(Pega aquí la URL de conexión que copiaste de Neon.tech)*
   - **Variable 2:**
     - **Key:** `SECRET_KEY`
     - **Value:** `clave_criptografica_segura_utp_2026_ews_super_token_99` (o cualquier cadena larga de caracteres para firmar los JWT).
6. Haz clic en **Create Web Service**.

---

### Etapa 4: Verificación y Pruebas de Persistencia

1. En 2 a 3 minutos, Render completará el despliegue y te otorgará tu URL pública HTTPS:
   `https://ews-alerta-temprana-utp.onrender.com`
2. **Comprobación de la Base de Datos:**
   Visita `https://ews-alerta-temprana-utp.onrender.com/api/health`. Deberías recibir:
   ```json
   {
     "status": "healthy",
     "app": "Sistema de Alerta Temprana (EWS) - UTP",
     "version": "1.0.0",
     "database": "postgresql"
   }
   ```
   *(Si `database` muestra `postgresql`, la conexión con la nube persistente es un éxito rotundo).*
3. **Prueba de Persistencia:**
   - Regístrate con tu correo docente y contraseña en la web.
   - Crea un curso, registra alumnos o importa tus notas.
   - Cierra el navegador y espera 20 minutos (o presiona **Restart Web Service** en Render).
   - Vuelve a ingresar: tu usuario, tus cursos y tus calificaciones seguirán intactos.

---

## 4. Endpoints y Documentación OpenAPI

La API REST cuenta con documentación interactiva Swagger disponible públicamente en:
`https://TU-SUBDOMINIO.onrender.com/docs`
