import os
import re
import time
import uuid
from datetime import datetime, date
from flask import request
from flask_restful import Resource, reqparse, abort
from sqlalchemy import or_, func
from models import db, Autor, Genero, Usuario, Libro, Prestamo, Favorito, Comentario, HistorialAcceso


def validar_password_segura(password):
    """
    Valida que la contraseña cumpla los requisitos de seguridad:
    - Al menos 6 caracteres
    - Al menos un dígito numérico (0-9)
    - Al menos un carácter especial (!@#$%^&*...)
    """
    if not password or len(password) < 6:
        return False, "La contraseña debe tener al menos 6 caracteres."
    if not re.search(r'\d', password):
        return False, "La contraseña debe incluir al menos un número (0-9)."
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?~`]', password):
        return False, "La contraseña debe incluir al menos un carácter especial (ej. !@#$%&*?)."
    return True, "Contraseña segura."


# ==========================================
# PARSERS (Validación de entradas con reqparse)
# ==========================================

# Parser para creación y actualización de Libros
book_parser = reqparse.RequestParser(bundle_errors=True)
book_parser.add_argument('titulo', type=str, required=True, help='El título del libro es obligatorio.', location='json')
book_parser.add_argument('anio', type=int, required=True, help='El año de publicación debe ser un número entero.', location='json')
book_parser.add_argument('id_autor', type=int, required=True, help='El id_autor es obligatorio.', location='json')
book_parser.add_argument('id_genero', type=int, required=True, help='El id_genero es obligatorio.', location='json')
book_parser.add_argument('contenido', type=str, required=False, default='', help='Texto o fragmento del libro.', location='json')
book_parser.add_argument('portada_url', type=str, required=False, default='', help='URL de la portada del libro.', location='json')

# Parser para registro de Usuarios
user_parser = reqparse.RequestParser(bundle_errors=True)
user_parser.add_argument('nombre', type=str, required=True, help='El nombre del usuario es obligatorio.', location='json')
user_parser.add_argument('correo', type=str, required=True, help='El correo electrónico es obligatorio.', location='json')
user_parser.add_argument('password', type=str, required=False, default='123456', help='Contraseña del usuario.', location='json')
user_parser.add_argument('rol', type=str, required=False, default='lector', help='Rol del usuario (admin o lector).', location='json')

# Parser para Login / Autenticación
login_parser = reqparse.RequestParser(bundle_errors=True)
login_parser.add_argument('correo', type=str, required=True, help='El correo electrónico es obligatorio.', location='json')
login_parser.add_argument('password', type=str, required=True, help='La contraseña es obligatoria.', location='json')

# Parser para Recuperación de Contraseña
recuperar_parser = reqparse.RequestParser(bundle_errors=True)
recuperar_parser.add_argument('correo', type=str, required=True, help='El correo electrónico es obligatorio.', location='json')
recuperar_parser.add_argument('nueva_password', type=str, required=True, help='La nueva contraseña es obligatoria.', location='json')

# Parser para Préstamos
loan_parser = reqparse.RequestParser(bundle_errors=True)
loan_parser.add_argument('id_libro', type=int, required=True, help='El id_libro es obligatorio.', location='json')
loan_parser.add_argument('id_usuario', type=int, required=True, help='El id_usuario es obligatorio.', location='json')
loan_parser.add_argument('fecha_limite', type=str, required=True, help='La fecha_limite (formato YYYY-MM-DD) es obligatoria.', location='json')

# Parser para actualización de estado del Préstamo
loan_update_parser = reqparse.RequestParser(bundle_errors=True)
loan_update_parser.add_argument('estado', type=str, required=True, help='El nuevo estado es obligatorio (ej. Devuelto).', location='json')

# Parser para Favoritos
favorite_parser = reqparse.RequestParser(bundle_errors=True)
favorite_parser.add_argument('id_libro', type=int, required=True, help='El id_libro es obligatorio.', location='json')
favorite_parser.add_argument('id_usuario', type=int, required=True, help='El id_usuario es obligatorio.', location='json')

# Parser para Autores
author_parser = reqparse.RequestParser(bundle_errors=True)
author_parser.add_argument('nombre', type=str, required=True, help='El nombre del autor es obligatorio.', location='json')

# Parser para Comentarios
comment_parser = reqparse.RequestParser(bundle_errors=True)
comment_parser.add_argument('id_usuario', type=int, required=True, help='El id_usuario es obligatorio.', location='json')
comment_parser.add_argument('id_libro', type=int, required=False, default=None, help='El id_libro es opcional.', location='json')
comment_parser.add_argument('contenido', type=str, required=True, help='El contenido del comentario es obligatorio.', location='json')
comment_parser.add_argument('puntuacion', type=int, required=False, default=5, help='Puntuación de 1 a 5 estrellas.', location='json')


# ==========================================
# CONTROLADORES DE LIBROS
# ==========================================

class BookListResource(Resource):
    """
    Ruta: /api/books
    GET: Lista libros permitiendo búsqueda flexible (?search=) por título, autor o género.
    POST: Crea un nuevo libro.
    """
    def get(self):
        search_query = request.args.get('search', '', type=str).strip()
        query = Libro.query.join(Autor).join(Genero)

        if search_query:
            pattern = f"%{search_query}%"
            query = query.filter(
                or_(
                    Libro.titulo.ilike(pattern),
                    Autor.nombre.ilike(pattern),
                    Genero.nombre.ilike(pattern)
                )
            )

        libros = query.order_by(Libro.id_libro.desc()).all()
        return [libro.to_dict() for libro in libros], 200

    def post(self):
        args = book_parser.parse_args()

        # Validación de integridad referencial
        autor = Autor.query.get(args['id_autor'])
        if not autor:
            return {'message': f"El autor con ID {args['id_autor']} no existe."}, 404

        genero = Genero.query.get(args['id_genero'])
        if not genero:
            return {'message': f"El género con ID {args['id_genero']} no existe."}, 404

        portada = (args.get('portada_url') or '').strip()
        if not portada:
            portada = '/static/img/covers/default-book.svg'

        nuevo_libro = Libro(
            titulo=args['titulo'].strip(),
            anio=args['anio'],
            contenido=args.get('contenido', ''),
            portada_url=portada,
            id_autor=args['id_autor'],
            id_genero=args['id_genero']
        )
        db.session.add(nuevo_libro)
        db.session.commit()

        return nuevo_libro.to_dict(), 201


class BookResource(Resource):
    """
    Ruta: /api/books/<int:id_libro>
    GET: Obtiene un libro por ID.
    PUT: Actualiza un libro existente.
    DELETE: Elimina un libro.
    """
    def get(self, id_libro):
        libro = Libro.query.get_or_404(id_libro, description=f"Libro con ID {id_libro} no encontrado.")
        return libro.to_dict(), 200

    def put(self, id_libro):
        libro = Libro.query.get_or_404(id_libro, description=f"Libro con ID {id_libro} no encontrado.")
        args = book_parser.parse_args()

        autor = db.session.get(Autor, args['id_autor'])
        if not autor:
            return {'message': f"El autor con ID {args['id_autor']} no existe."}, 404

        genero = db.session.get(Genero, args['id_genero'])
        if not genero:
            return {'message': f"El género con ID {args['id_genero']} no existe."}, 404

        libro.titulo = args['titulo'].strip()
        libro.anio = args['anio']
        if args.get('contenido') is not None:
            libro.contenido = args['contenido']
        if args.get('portada_url') is not None:
            portada = args['portada_url'].strip()
            libro.portada_url = portada if portada else '/static/img/covers/default-book.svg'
        libro.id_autor = args['id_autor']
        libro.id_genero = args['id_genero']

        db.session.commit()
        return libro.to_dict(), 200

    def delete(self, id_libro):
        libro = Libro.query.get_or_404(id_libro, description=f"Libro con ID {id_libro} no encontrado.")

        # Verificar si hay préstamos activos pendientes de devolución
        prestamo_activo = Prestamo.query.filter_by(id_libro=id_libro, estado='Reservado').first()
        if prestamo_activo:
            return {'message': 'No se puede eliminar el libro porque se encuentra en préstamo activo.'}, 400

        db.session.delete(libro)
        db.session.commit()
        return {'message': f"Libro '{libro.titulo}' eliminado exitosamente."}, 200


# ==========================================
# CONTROLADORES DE USUARIOS
# ==========================================

class UsuarioResource(Resource):
    """
    Ruta: /api/usuarios
    GET: Lista usuarios registrados.
    POST: Registra un nuevo usuario con correo único y contraseña cifrada.
    """
    def get(self):
        usuarios = Usuario.query.order_by(Usuario.id_usuario.asc()).all()
        return [usuario.to_dict() for usuario in usuarios], 200

    def post(self):
        args = user_parser.parse_args()
        correo = args['correo'].strip().lower()

        usuario_existente = Usuario.query.filter_by(correo=correo).first()
        if usuario_existente:
            return {'message': f"Ya existe un usuario registrado con el correo {correo}."}, 409

        rol = (args.get('rol') or 'lector').strip().lower()
        if rol not in ['admin', 'lector']:
            rol = 'lector'

        password = args.get('password') or ''
        if password and password != '123456':
            valida, msg = validar_password_segura(password)
            if not valida:
                return {'message': msg}, 400
        elif not password:
            password = 'User2026!'

        nuevo_usuario = Usuario(
            nombre=args['nombre'].strip(),
            correo=correo,
            libros_activos=0,
            rol=rol
        )
        nuevo_usuario.set_password(password)

        db.session.add(nuevo_usuario)
        db.session.commit()

        return nuevo_usuario.to_dict(), 201


class LoginResource(Resource):
    """
    Ruta: /api/auth/login
    POST: Valida credenciales (correo y contraseña) y registra auditoría de accesos.
    """
    def post(self):
        args = login_parser.parse_args()
        correo = args['correo'].strip().lower()
        password = args['password']

        ip_cliente = request.headers.get('X-Forwarded-For', request.remote_addr or '127.0.0.1').split(',')[0].strip()

        usuario = Usuario.query.filter_by(correo=correo).first()
        if not usuario or not usuario.check_password(password):
            try:
                log_fail = HistorialAcceso(
                    id_usuario=usuario.id_usuario if usuario else None,
                    correo=correo,
                    nombre=usuario.nombre if usuario else 'Intento no reconocido',
                    rol=usuario.rol if usuario else 'lector',
                    ip=ip_cliente,
                    exitoso=False
                )
                db.session.add(log_fail)
                db.session.commit()
            except Exception:
                db.session.rollback()

            return {'message': 'Correo o contraseña incorrectos. Verifique sus credenciales.'}, 401

        try:
            log_ok = HistorialAcceso(
                id_usuario=usuario.id_usuario,
                correo=usuario.correo,
                nombre=usuario.nombre,
                rol=usuario.rol or 'lector',
                ip=ip_cliente,
                exitoso=True
            )
            db.session.add(log_ok)
            db.session.commit()
        except Exception:
            db.session.rollback()

        return {
            'message': f'¡Bienvenido de nuevo, {usuario.nombre}!',
            'usuario': usuario.to_dict()
        }, 200


class RecuperarPasswordResource(Resource):
    """
    Ruta: /api/auth/recuperar-password
    POST: Restablece la contraseña de un usuario validando requisitos de seguridad.
    """
    def post(self):
        args = recuperar_parser.parse_args()
        correo = args['correo'].strip().lower()
        nueva_pass = args['nueva_password'].strip()

        usuario = Usuario.query.filter_by(correo=correo).first()
        if not usuario:
            return {'message': f"No existe ninguna cuenta registrada con el correo '{correo}'."}, 404

        valida, msg = validar_password_segura(nueva_pass)
        if not valida:
            return {'message': msg}, 400

        usuario.set_password(nueva_pass)

        ip_cliente = request.headers.get('X-Forwarded-For', request.remote_addr or '127.0.0.1').split(',')[0].strip()
        try:
            log_rec = HistorialAcceso(
                id_usuario=usuario.id_usuario,
                correo=usuario.correo,
                nombre=f"{usuario.nombre} (Cambio clave)",
                rol=usuario.rol or 'lector',
                ip=ip_cliente,
                exitoso=True
            )
            db.session.add(log_rec)
            db.session.commit()
        except Exception:
            db.session.rollback()

        return {'message': 'Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva clave.'}, 200


ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


class UploadCoverResource(Resource):
    """
    Ruta: /api/upload-cover
    POST: Recibe un archivo de imagen de portada desde la galería o dispositivo y lo almacena localmente.
    """
    def post(self):
        if 'cover_image' not in request.files:
            return {'message': 'No se encontró ningún archivo de imagen en la solicitud.'}, 400

        file = request.files['cover_image']
        if file.filename == '':
            return {'message': 'No se seleccionó ningún archivo de imagen.'}, 400

        if file and allowed_file(file.filename):
            extension = file.filename.rsplit('.', 1)[1].lower()
            unique_name = f"cover_{int(time.time())}_{uuid.uuid4().hex[:8]}.{extension}"

            base_dir = os.path.abspath(os.path.dirname(__file__))
            upload_dir = os.path.join(base_dir, 'static', 'uploads', 'covers')
            os.makedirs(upload_dir, exist_ok=True)

            file_path = os.path.join(upload_dir, unique_name)
            file.save(file_path)

            return {
                'message': 'Portada subida con éxito desde tu galería.',
                'url': f'/static/uploads/covers/{unique_name}'
            }, 201

        return {'message': 'Formato no permitido. Solo se aceptan imágenes (PNG, JPG, JPEG, WEBP, SVG).'}, 400


class HistorialAccesoListResource(Resource):
    """
    Ruta: /api/historial-accesos
    GET: Retorna el historial de inicios de sesión y accesos a la plataforma para el Administrador.
    """
    def get(self):
        limit = request.args.get('limit', default=100, type=int)
        logs = HistorialAcceso.query.order_by(HistorialAcceso.id_acceso.desc()).limit(limit).all()
        return [log.to_dict() for log in logs], 200


# ==========================================
# CONTROLADORES DE PRÉSTAMOS (Transaccional)
# ==========================================

class PrestamoListResource(Resource):
    """
    Ruta: /api/prestamos
    GET: Lista préstamos registrados (permite filtrar por ?id_usuario=).
    POST: Registra un nuevo préstamo validando la regla de negocio de máx 3 libros activos.
    """
    def get(self):
        id_usuario = request.args.get('id_usuario', type=int)
        query = Prestamo.query
        if id_usuario:
            query = query.filter_by(id_usuario=id_usuario)

        prestamos = query.order_by(Prestamo.id_prestamo.desc()).all()
        return [prestamo.to_dict() for prestamo in prestamos], 200

    def post(self):
        args = loan_parser.parse_args()

        usuario = Usuario.query.get(args['id_usuario'])
        if not usuario:
            return {'message': f"Usuario con ID {args['id_usuario']} no encontrado."}, 404

        libro = Libro.query.get(args['id_libro'])
        if not libro:
            return {'message': f"Libro con ID {args['id_libro']} no encontrado."}, 404

        # Regla de negocio: Máximo 3 libros activos por usuario
        if usuario.libros_activos >= 3:
            return {'message': f"El usuario '{usuario.nombre}' ya tiene 3 libros activos. Límite máximo alcanzado."}, 403

        # Regla de negocio adicional: Evitar prestar un libro que ya está prestado y sin devolver
        prestamo_vigente = Prestamo.query.filter_by(id_libro=args['id_libro'], estado='Reservado').first()
        if prestamo_vigente:
            return {'message': f"El libro '{libro.titulo}' ya se encuentra actualmente prestado."}, 400

        # Validación del formato de fecha límite
        try:
            fecha_limite_parsed = datetime.strptime(args['fecha_limite'], '%Y-%m-%d').date()
        except ValueError:
            return {'message': "Formato de fecha inválido. Utilice el formato YYYY-MM-DD."}, 400

        if fecha_limite_parsed < date.today():
            return {'message': "La fecha límite no puede ser anterior a la fecha actual."}, 400

        # Creación transaccional: Nuevo préstamo e incremento de libros activos
        nuevo_prestamo = Prestamo(
            id_libro=args['id_libro'],
            id_usuario=args['id_usuario'],
            fecha_limite=fecha_limite_parsed,
            estado='Reservado'
        )
        usuario.libros_activos += 1

        db.session.add(nuevo_prestamo)
        db.session.commit()

        return nuevo_prestamo.to_dict(), 201


class PrestamoResource(Resource):
    """
    Ruta: /api/prestamos/<int:id_prestamo>
    PUT: Actualiza el estado del préstamo. Si el estado cambia a 'Devuelto',
         se descuenta -1 a los libros activos del usuario.
    """
    def put(self, id_prestamo):
        prestamo = Prestamo.query.get_or_404(id_prestamo, description=f"Préstamo con ID {id_prestamo} no encontrado.")
        args = loan_update_parser.parse_args()
        nuevo_estado = args['estado'].strip()

        # Transición a 'Devuelto'
        if nuevo_estado == 'Devuelto':
            if prestamo.estado != 'Devuelto':
                usuario = Usuario.query.get(prestamo.id_usuario)
                if usuario and usuario.libros_activos > 0:
                    usuario.libros_activos -= 1
                prestamo.estado = 'Devuelto'
                db.session.commit()
            return prestamo.to_dict(), 200
        else:
            prestamo.estado = nuevo_estado
            db.session.commit()
            return prestamo.to_dict(), 200


# ==========================================
# CONTROLADORES DE FAVORITOS
# ==========================================

class FavoritoListResource(Resource):
    """
    Ruta: /api/favoritos
    GET: Lista favoritos (permite filtrar por ?id_usuario=).
    POST: Agrega un libro a favoritos garantizando unicidad (retorna 409 si ya existe).
    """
    def get(self):
        id_usuario = request.args.get('id_usuario', type=int)
        query = Favorito.query
        if id_usuario:
            query = query.filter_by(id_usuario=id_usuario)

        favoritos = query.order_by(Favorito.id_favorito.desc()).all()
        return [fav.to_dict() for fav in favoritos], 200

    def post(self):
        args = favorite_parser.parse_args()

        usuario = Usuario.query.get(args['id_usuario'])
        if not usuario:
            return {'message': f"Usuario con ID {args['id_usuario']} no encontrado."}, 404

        libro = Libro.query.get(args['id_libro'])
        if not libro:
            return {'message': f"Libro con ID {args['id_libro']} no encontrado."}, 404

        # Comprobar unicidad para responder con HTTP 409 si ya existe
        favorito_existente = Favorito.query.filter_by(
            id_libro=args['id_libro'],
            id_usuario=args['id_usuario']
        ).first()

        if favorito_existente:
            return {'message': f"El libro '{libro.titulo}' ya se encuentra en favoritos de este usuario."}, 409

        nuevo_favorito = Favorito(
            id_libro=args['id_libro'],
            id_usuario=args['id_usuario']
        )
        db.session.add(nuevo_favorito)
        db.session.commit()

        return nuevo_favorito.to_dict(), 201


class FavoritoResource(Resource):
    """
    Ruta: /api/favoritos/<int:id_favorito>
    DELETE: Elimina un favorito por ID.
    """
    def delete(self, id_favorito):
        favorito = Favorito.query.get_or_404(id_favorito, description=f"Favorito con ID {id_favorito} no encontrado.")
        db.session.delete(favorito)
        db.session.commit()
        return {'message': 'Libro removido de favoritos exitosamente.'}, 200


# ==========================================
# CONTROLADORES DE SOPORTE PARA UI (Selects)
# ==========================================

class AutorListResource(Resource):
    """
    Ruta: /api/autores
    GET: Lista autores para poblar selects y vistas del frontend.
    POST: Registra un nuevo autor literario.
    """
    def get(self):
        autores = Autor.query.order_by(Autor.nombre.asc()).all()
        return [autor.to_dict() for autor in autores], 200

    def post(self):
        args = author_parser.parse_args()
        nombre = args['nombre'].strip()
        if not nombre:
            return {'message': 'El nombre del autor es obligatorio.'}, 400

        existente = Autor.query.filter(func.lower(Autor.nombre) == func.lower(nombre)).first()
        if existente:
            return {'message': f"El autor '{nombre}' ya se encuentra registrado."}, 409

        nuevo_autor = Autor(nombre=nombre)
        db.session.add(nuevo_autor)
        db.session.commit()
        return nuevo_autor.to_dict(), 201


class AutorResource(Resource):
    """
    Ruta: /api/autores/<int:id_autor>
    GET: Retorna un autor por su ID.
    DELETE: Elimina un autor.
            Regla de integridad relacional: Si el autor posee obras en el catálogo,
            se previene la eliminación para resguardar la consistencia de los datos.
    """
    def get(self, id_autor):
        autor = Autor.query.get_or_404(id_autor, description=f"Autor con ID {id_autor} no encontrado.")
        return autor.to_dict(), 200

    def delete(self, id_autor):
        autor = Autor.query.get_or_404(id_autor, description=f"Autor con ID {id_autor} no encontrado.")
        total_libros = len(autor.libros) if autor.libros else 0
        if total_libros > 0:
            return {
                'message': f"No se puede eliminar a '{autor.nombre}' porque tiene {total_libros} obra(s) asociada(s) en la biblioteca. Elimine o reasigne sus libros primero."
            }, 400

        db.session.delete(autor)
        db.session.commit()
        return {'message': f"Autor '{autor.nombre}' eliminado exitosamente."}, 200


class GeneroListResource(Resource):
    """
    Ruta: /api/generos
    GET: Lista géneros para poblar selects en los formularios del frontend.
    """
    def get(self):
        generos = Genero.query.order_by(Genero.nombre.asc()).all()
        return [genero.to_dict() for genero in generos], 200


# ==========================================
# CONTROLADORES DE COMENTARIOS Y RESEÑAS
# ==========================================

class ComentarioListResource(Resource):
    """
    Ruta: /api/comentarios
    GET: Lista comentarios ordenados cronológicamente descendente.
         Permite filtrar por ?id_libro= (opcional).
    POST: Registra una nueva opinión o reseña.
    """
    def get(self):
        id_libro = request.args.get('id_libro', type=int)
        query = Comentario.query
        if id_libro:
            query = query.filter_by(id_libro=id_libro)

        comentarios = query.order_by(Comentario.fecha.desc()).all()
        return [c.to_dict() for c in comentarios], 200

    def post(self):
        args = comment_parser.parse_args()
        contenido = (args['contenido'] or '').strip()
        if not contenido:
            return {'message': 'El texto del comentario no puede estar vacío.'}, 400

        usuario = Usuario.query.get(args['id_usuario'])
        if not usuario:
            return {'message': f"El usuario con ID {args['id_usuario']} no existe."}, 404

        id_libro = args.get('id_libro')
        if id_libro:
            libro = Libro.query.get(id_libro)
            if not libro:
                return {'message': f"El libro con ID {id_libro} no existe."}, 404

        puntuacion = args.get('puntuacion', 5)
        if puntuacion not in [1, 2, 3, 4, 5]:
            puntuacion = 5

        nuevo_comentario = Comentario(
            id_usuario=args['id_usuario'],
            id_libro=id_libro,
            contenido=contenido,
            puntuacion=puntuacion
        )
        db.session.add(nuevo_comentario)
        db.session.commit()

        return nuevo_comentario.to_dict(), 201


class ComentarioResource(Resource):
    """
    Ruta: /api/comentarios/<int:id_comentario>
    DELETE: Elimina un comentario por ID.
    """
    def delete(self, id_comentario):
        comentario = Comentario.query.get_or_404(id_comentario, description=f"Comentario con ID {id_comentario} no encontrado.")
        db.session.delete(comentario)
        db.session.commit()
        return {'message': 'Comentario eliminado exitosamente.'}, 200


