from datetime import datetime, date
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, UniqueConstraint
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class Autor(db.Model):
    """
    Modelo de Autor para normalización 3NF.
    Evita la duplicación y anomalías de actualización de nombres de autores.
    """
    __tablename__ = 'autores'

    id_autor = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(120), nullable=False, unique=True, index=True)

    # Relación uno a muchos con libros
    libros = db.relationship('Libro', backref='autor', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id_autor': self.id_autor,
            'nombre': self.nombre,
            'total_libros': len(self.libros) if self.libros else 0
        }


class Genero(db.Model):
    """
    Modelo de Género literario para normalización 3NF.
    """
    __tablename__ = 'generos'

    id_genero = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(80), nullable=False, unique=True, index=True)

    # Relación uno a muchos con libros
    libros = db.relationship('Libro', backref='genero', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id_genero': self.id_genero,
            'nombre': self.nombre
        }


class Usuario(db.Model):
    """
    Modelo de Usuario.
    libros_activos almacena la cantidad de préstamos activos (máximo permitido: 3).
    """
    __tablename__ = 'usuarios'

    id_usuario = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(100), nullable=False)
    correo = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=True)
    libros_activos = db.Column(db.Integer, default=0, nullable=False)
    rol = db.Column(db.String(20), default='lector', nullable=True)

    # Relaciones con préstamos y favoritos
    prestamos = db.relationship('Prestamo', backref='usuario', lazy=True, cascade='all, delete-orphan')
    favoritos = db.relationship('Favorito', backref='usuario', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        if password:
            self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        rol_final = self.rol if self.rol else ('admin' if 'admin' in self.correo.lower() else 'lector')
        return {
            'id_usuario': self.id_usuario,
            'nombre': self.nombre,
            'correo': self.correo,
            'libros_activos': self.libros_activos,
            'rol': rol_final
        }


class Libro(db.Model):
    """
    Modelo central de Libro que enlaza con Autor y Género en 3NF.
    """
    __tablename__ = 'libros'

    id_libro = db.Column(db.Integer, primary_key=True, autoincrement=True)
    titulo = db.Column(db.String(150), nullable=False, index=True)
    anio = db.Column(db.Integer, nullable=False)
    contenido = db.Column(db.Text, nullable=True)
    portada_url = db.Column(db.String(500), nullable=True)
    id_autor = db.Column(db.Integer, db.ForeignKey('autores.id_autor'), nullable=False)
    id_genero = db.Column(db.Integer, db.ForeignKey('generos.id_genero'), nullable=False)

    # Relaciones con préstamos y favoritos
    prestamos = db.relationship('Prestamo', backref='libro', lazy=True, cascade='all, delete-orphan')
    favoritos = db.relationship('Favorito', backref='libro', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        calificaciones = [c.puntuacion for c in self.comentarios if c.puntuacion]
        promedio = round(sum(calificaciones) / len(calificaciones), 1) if calificaciones else None
        
        prestamo_activo = next((p for p in self.prestamos if p.estado != 'Devuelto'), None)

        return {
            'id_libro': self.id_libro,
            'titulo': self.titulo,
            'anio': self.anio,
            'contenido': self.contenido,
            'portada_url': self.portada_url if self.portada_url else '/static/img/covers/default-book.svg',
            'id_autor': self.id_autor,
            'id_genero': self.id_genero,
            'autor': self.autor.nombre if self.autor else None,
            'genero': self.genero.nombre if self.genero else None,
            'rating_promedio': promedio,
            'total_resenas': len(calificaciones),
            'es_prestado': prestamo_activo is not None,
            'prestamo_activo': prestamo_activo.to_dict() if prestamo_activo else None
        }


class Prestamo(db.Model):
    """
    Modelo transaccional para registro de préstamos de libros.
    """
    __tablename__ = 'prestamos'

    id_prestamo = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_libro = db.Column(db.Integer, db.ForeignKey('libros.id_libro'), nullable=False)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    fecha_salida = db.Column(db.DateTime, default=func.now(), nullable=False)
    fecha_limite = db.Column(db.Date, nullable=False)
    estado = db.Column(db.String(20), default='Reservado', nullable=False)

    def to_dict(self):
        return {
            'id_prestamo': self.id_prestamo,
            'id_libro': self.id_libro,
            'id_usuario': self.id_usuario,
            'libro_titulo': self.libro.titulo if self.libro else None,
            'usuario_nombre': self.usuario.nombre if self.usuario else None,
            'fecha_salida': self.fecha_salida.strftime('%Y-%m-%d %H:%M:%S') if self.fecha_salida else None,
            'fecha_limite': self.fecha_limite.strftime('%Y-%m-%d') if isinstance(self.fecha_limite, (date, datetime)) else str(self.fecha_limite),
            'estado': self.estado
        }


class Favorito(db.Model):
    """
    Modelo relacional para libros favoritos por usuario.
    Posee restricción de unicidad para evitar duplicados del par (id_libro, id_usuario).
    """
    __tablename__ = 'favoritos'

    id_favorito = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_libro = db.Column(db.Integer, db.ForeignKey('libros.id_libro'), nullable=False)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    fecha_agregado = db.Column(db.DateTime, default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint('id_libro', 'id_usuario', name='uq_libro_usuario_favorito'),
    )

    def to_dict(self):
        return {
            'id_favorito': self.id_favorito,
            'id_libro': self.id_libro,
            'id_usuario': self.id_usuario,
            'libro_titulo': self.libro.titulo if self.libro else None,
            'usuario_nombre': self.usuario.nombre if self.usuario else None,
            'fecha_agregado': self.fecha_agregado.strftime('%Y-%m-%d %H:%M:%S') if self.fecha_agregado else None
        }


class Comentario(db.Model):
    """
    Modelo relacional para comentarios y opiniones de los usuarios sobre la biblioteca o libros.
    """
    __tablename__ = 'comentarios'

    id_comentario = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario'), nullable=False)
    id_libro = db.Column(db.Integer, db.ForeignKey('libros.id_libro'), nullable=True)
    contenido = db.Column(db.Text, nullable=False)
    puntuacion = db.Column(db.Integer, default=5, nullable=False)
    fecha = db.Column(db.DateTime, default=func.now(), nullable=False)

    # Relaciones relacionales 3NF
    usuario = db.relationship('Usuario', backref=db.backref('comentarios', lazy=True, cascade='all, delete-orphan'))
    libro = db.relationship('Libro', backref=db.backref('comentarios', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id_comentario': self.id_comentario,
            'id_usuario': self.id_usuario,
            'usuario_nombre': self.usuario.nombre if self.usuario else 'Usuario',
            'usuario_rol': self.usuario.rol if (self.usuario and self.usuario.rol) else ('admin' if (self.usuario and 'admin' in self.usuario.correo.lower()) else 'lector'),
            'id_libro': self.id_libro,
            'libro_titulo': self.libro.titulo if self.libro else None,
            'contenido': self.contenido,
            'puntuacion': self.puntuacion or 5,
            'fecha': self.fecha.strftime('%Y-%m-%d %H:%M') if self.fecha else None
        }


class HistorialAcceso(db.Model):
    """
    Modelo de auditoría para registro histórico de inicios de sesión y accesos.
    Permite al Administrador auditar qué usuarios han ingresado, fecha, hora, IP y resultado.
    """
    __tablename__ = 'historial_accesos'

    id_acceso = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id_usuario', ondelete='SET NULL'), nullable=True)
    correo = db.Column(db.String(120), nullable=False, index=True)
    nombre = db.Column(db.String(100), nullable=True)
    rol = db.Column(db.String(20), default='lector', nullable=False)
    fecha = db.Column(db.DateTime, default=func.now(), nullable=False)
    ip = db.Column(db.String(50), default='127.0.0.1', nullable=True)
    exitoso = db.Column(db.Boolean, default=True, nullable=False)

    usuario = db.relationship('Usuario', backref=db.backref('accesos', lazy=True))

    def to_dict(self):
        return {
            'id_acceso': self.id_acceso,
            'id_usuario': self.id_usuario,
            'correo': self.correo,
            'nombre': self.nombre or (self.usuario.nombre if self.usuario else 'Desconocido'),
            'rol': self.rol or 'lector',
            'fecha': self.fecha.strftime('%Y-%m-%d %H:%M:%S') if self.fecha else None,
            'ip': self.ip or '127.0.0.1',
            'exitoso': self.exitoso
        }

