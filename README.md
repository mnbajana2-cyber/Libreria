# 📚 Mebitech Libris - Sistema de Gestión de Biblioteca Transaccional (3NF)

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0%2B-black.svg)](https://flask.palletsprojects.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3NF%20Compliant-003B57.svg)](https://www.sqlite.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.0-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Mebitech Libris** es una plataforma web completa de gestión bibliotecaria y lectura digital desarrollada bajo arquitectura relacional en **Tercera Forma Normal (3NF)**. Implementa control de concurrencia transaccional para préstamos, sistema de autenticación segura con roles (RBAC), catálogo interactivo con filtrado reactivo, comunidad de reseñas y visor de lectura digital progresiva.

---

## 🌟 Características Principales

### 📖 1. Lectura Progresiva Condicionada al Préstamo
* **Muestra de Cortesía (4 líneas):** Los usuarios que no tienen el libro en préstamo disfrutan de una vista previa de las primeras 4 líneas con degradado elegante (*fade-out*).
* **Llamada a la Acción:** Banner interactivo *"¿Quieres continuar la lectura? Presta el libro para leer completo"* con botón directo para solicitar el préstamo.
* **Desbloqueo Completo:** Una vez que el lector tiene el préstamo activo (o como Administrador), el visor desbloquea la obra íntegra con todos sus párrafos y capítulos.

### 🔄 2. Préstamos Transaccionales y Devolución Anticipada
* **Límite de Cupo:** Regla de negocio de un máximo de 3 libros activos por usuario.
* **Botón Dinámico:** En el catálogo, el botón cambia de forma inteligente entre **"Prestar"** y **"Devolver"** para las obras asignadas al lector o al administrador.
* **Retorno Anticipado:** Posibilidad de devolver la obra antes de la fecha límite con un solo clic, liberando inmediatamente el cupo del usuario.

### 🎯 3. Colecciones y Filtrado Inteligente
* **Libros Disponibles:** Pestaña que lista exclusivamente los ejemplares sin préstamos activos en tiempo real.
* **Recomendados (★ 4 a 5 estrellas):** Filtro estricto que muestra únicamente obras con puntuación promedio sobresaliente calculada a partir de las reseñas de la comunidad.
* **Vistos Recientemente:** Historial cronológico de lectura por usuario almacenado localmente.
* **Mis Favoritos:** Guardado de libros preferidos sincronizado con la base de datos relacional.
* **Buscador con Debounce:** Búsqueda en tiempo real (300 ms) por título o nombre de autor.

### 🛡️ 4. Control de Acceso Basado en Roles (RBAC) y Seguridad
* **Administrador (`admin`):**
  * Alta, edición y eliminación de libros del catálogo.
  * Subida de portadas desde la galería/dispositivo local o mediante URL.
  * Gestión integral de autores (agregar y eliminar).
  * Panel de registro de usuarios y consulta de lectores.
  * Supervisión y retorno global de préstamos.
  * Registro de auditoría de inicios de sesión (dirección IP, navegador, fecha y resultado).
* **Lector (`lector`):**
  * Exploración del catálogo en cuadrícula de portadas o tabla clásica.
  * Solicitud de préstamos y devolución de sus propios libros.
  * Lectura de obras y publicación de reseñas con calificación de 1 a 5 estrellas.
  * Gestión de favoritos personales.
* **Seguridad:** Cifrado de contraseñas con `generate_password_hash` (PBKDF2/SHA256) y validación de seguridad (mínimo 8 caracteres, mayúscula, minúscula, número y símbolo especial).

---

## 🏗️ Arquitectura de la Base de Datos (3NF)

El sistema implementa un esquema relacional normalizado en **Tercera Forma Normal (3NF)** para evitar redundancias y anomalías de inserción, actualización o eliminación:

1. **`autores`:** `id_autor` (PK), `nombre`, `biografia`, `nacionalidad`.
2. **`generos`:** `id_genero` (PK), `nombre`, `descripcion`.
3. **`usuarios`:** `id_usuario` (PK), `nombre`, `correo` (UNIQUE), `password_hash`, `libros_activos`, `rol`, `creado_en`.
4. **`libros`:** `id_libro` (PK), `titulo`, `anio`, `contenido`, `portada_url`, `id_autor` (FK), `id_genero` (FK).
5. **`prestamos`:** `id_prestamo` (PK), `id_libro` (FK), `id_usuario` (FK), `fecha_salida`, `fecha_limite`, `estado`.
6. **`favoritos`:** `id_favorito` (PK), `id_libro` (FK), `id_usuario` (FK), `fecha_agregado`.
7. **`comentarios`:** `id_comentario` (PK), `id_libro` (FK), `id_usuario` (FK), `contenido`, `puntuacion`, `fecha`.
8. **`historial_accesos`:** `id_acceso` (PK), `id_usuario` (FK, opcional), `correo_ingresado`, `exito`, `ip_origen`, `user_agent`, `motivo`, `fecha`.

---

## 💻 Requisitos del Sistema

* **Python:** Versión 3.10 o superior ([Descargar Python](https://www.python.org/downloads/)).
* **Git:** Para clonar y versionar el código ([Descargar Git](https://git-scm.com/)).
* **Navegador Web:** Google Chrome, Mozilla Firefox, Microsoft Edge, Safari o cualquier navegador moderno con soporte para JavaScript ES6+.

---

## 🚀 Guía de Instalación y Ejecución

Sigue estos sencillos pasos para poner en marcha la aplicación en tu entorno local:

### 1. Clonar el Repositorio
Abre tu terminal (PowerShell, Símbolo del Sistema o Bash) y ejecuta:
```bash
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
cd TU_REPOSITORIO
```

### 2. Crear y Activar un Entorno Virtual (Recomendado)
* **En Windows (PowerShell / CMD):**
  ```powershell
  python -m venv venv
  .\venv\Scripts\activate
  ```
* **En macOS / Linux:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### 3. Instalar las Dependencias
Con el entorno virtual activado, instala las librerías necesarias:
```bash
pip install -r requirements.txt
```

### 4. Iniciar el Servidor de la Aplicación
Ejecuta el script principal:
```bash
python app.py
```
> **Nota:** Al iniciarse por primera vez, la aplicación creará automáticamente la base de datos `biblioteca.db` y la poblará con autores representativos, géneros y 16 obras maestras de la literatura universal con fragmentos y portadas.

### 5. Acceder a la Plataforma
Abre tu navegador web e ingresa a:
```
http://localhost:5000
```

---

## 🔑 Credenciales de Acceso Predeterminadas

Puedes ingresar de inmediato con cualquiera de las cuentas precargadas en el sistema:

| Rol | Correo Electrónico | Contraseña | Capacidades |
| :--- | :--- | :--- | :--- |
| **👑 Administrador** | `admin@mebytech.com` | `Admin2026!` | Control total: Añadir/Editar/Eliminar libros, subir portadas, gestionar autores, usuarios y ver auditoría. |
| **📖 Lector** | `carlos@mebytech.com` | `Lector2026!` | Catálogo, préstamos (máx 3), lectura de libros, favoritos y reseñas comunitarias. |

*(También puedes registrar nuevos usuarios lectores directamente desde el formulario de registro de la pantalla de inicio).*

---

## 📡 Endpoints de la API RESTful

La aplicación expone servicios RESTful con respuestas en formato JSON:

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/books` | Lista libros (soporta `?search=` para búsqueda en tiempo real). |
| `POST` | `/api/books` | Registra un nuevo libro con autor, género y portada. |
| `PUT` | `/api/books/<id>` | Actualiza la información de un libro existente. |
| `DELETE` | `/api/books/<id>` | Elimina un libro (valida que no tenga préstamos activos). |
| `GET` | `/api/autores` | Obtiene el catálogo de autores. |
| `POST` | `/api/autores` | Registra un nuevo autor. |
| `DELETE` | `/api/autores/<id>` | Elimina un autor (valida que no tenga libros asociados). |
| `GET` | `/api/generos` | Lista géneros literarios. |
| `GET` | `/api/usuarios` | Lista usuarios registrados y sus préstamos activos. |
| `POST` | `/api/usuarios` | Registra un nuevo usuario con contraseña cifrada. |
| `POST` | `/api/auth/login` | Inicia sesión y registra auditoría en `historial_accesos`. |
| `POST` | `/api/auth/recover` | Restablece contraseña validando políticas de seguridad. |
| `GET` | `/api/prestamos` | Lista préstamos (filtra por `?id_usuario=`). |
| `POST` | `/api/prestamos` | Crea un préstamo transaccional (control de cupo máx. 3). |
| `PUT` | `/api/prestamos/<id>` | Actualiza estado a `'Devuelto'` y libera el cupo del usuario. |
| `GET` | `/api/favoritos` | Lista favoritos del usuario (`?id_usuario=`). |
| `POST` | `/api/favoritos` | Agrega un libro a favoritos (garantiza unicidad). |
| `DELETE` | `/api/favoritos/<id>` | Elimina un libro de favoritos. |
| `GET` | `/api/comentarios` | Lista reseñas con calificación y autor. |
| `POST` | `/api/comentarios` | Publica una reseña (1 a 5 estrellas). |
| `DELETE` | `/api/comentarios/<id>` | Elimina una reseña literaria. |
| `POST` | `/api/upload-cover` | Sube una imagen de portada desde el dispositivo. |
| `GET` | `/api/historial-accesos` | Retorna bitácora de auditoría de accesos para el Administrador. |

---

## 🛠️ Tecnologías Empleadas

* **Backend:** Python 3, Flask, Flask-RESTful, Flask-SQLAlchemy, Werkzeug Security.
* **Base de Datos:** SQLite 3 (Foreign Keys activas, índices y restricciones de integridad).
* **Frontend:** HTML5 semántico, Tailwind CSS (CDN), Vanilla JavaScript (ES6+ Asíncrono con Fetch API).
* **Iconografía y Tipografía:** FontAwesome 6, Google Fonts (Inter y Playfair Display).

---

## 📄 Licencia

Este proyecto fue desarrollado con fines educativos y de demostración académica bajo la licencia MIT. Puedes consultarla en el archivo `LICENSE` o adaptarla libremente.
