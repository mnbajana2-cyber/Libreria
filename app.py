import os
from flask import Flask, render_template
from flask_restful import Api
from flask_cors import CORS
from sqlalchemy import event
from sqlalchemy.engine import Engine

from models import db, Autor, Genero, Usuario, Libro, Prestamo, Favorito, Comentario, HistorialAcceso
from resources import (
    BookListResource,
    BookResource,
    UsuarioResource,
    PrestamoListResource,
    PrestamoResource,
    FavoritoListResource,
    FavoritoResource,
    AutorListResource,
    AutorResource,
    GeneroListResource,
    LoginResource,
    RecuperarPasswordResource,
    UploadCoverResource,
    HistorialAccesoListResource,
    ComentarioListResource,
    ComentarioResource
)


def create_app():
    app = Flask(__name__)

    # Configuración de base de datos SQLite
    base_dir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(base_dir, 'biblioteca.db')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JSON_SORT_KEYS'] = False

    # Habilitar CORS para integración abierta de endpoints
    CORS(app)

    # Inicializar Base de Datos
    db.init_app(app)

    # Habilitar soporte de Foreign Keys en SQLite
    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    # Inicializar Flask-RESTful API
    api = Api(app)

    # Registro de Recursos RESTful
    api.add_resource(BookListResource, '/api/books')
    api.add_resource(BookResource, '/api/books/<int:id_libro>')
    api.add_resource(UsuarioResource, '/api/usuarios')
    api.add_resource(PrestamoListResource, '/api/prestamos')
    api.add_resource(PrestamoResource, '/api/prestamos/<int:id_prestamo>')
    api.add_resource(FavoritoListResource, '/api/favoritos')
    api.add_resource(FavoritoResource, '/api/favoritos/<int:id_favorito>')
    api.add_resource(AutorListResource, '/api/autores')
    api.add_resource(AutorResource, '/api/autores/<int:id_autor>')
    api.add_resource(GeneroListResource, '/api/generos')
    api.add_resource(LoginResource, '/api/auth/login')
    api.add_resource(RecuperarPasswordResource, '/api/auth/recuperar-password')
    api.add_resource(UploadCoverResource, '/api/upload-cover')
    api.add_resource(HistorialAccesoListResource, '/api/historial-accesos')
    api.add_resource(ComentarioListResource, '/api/comentarios')
    api.add_resource(ComentarioResource, '/api/comentarios/<int:id_comentario>')

    # Ruta principal para servir la SPA
    @app.route('/')
    def index():
        return render_template('index.html')

    return app


def seed_database(app):
    """
    Función de datos semilla (seed data).
    Pobla la base de datos con autores, géneros, usuarios y al menos 12 obras clásicas
    de la literatura y ciencia ficción si las tablas están vacías.
    """
    with app.app_context():
        db.create_all()

        # Asegurar comentarios iniciales de bienvenida en el muro
        if Comentario.query.first() is None:
            user_admin = Usuario.query.filter(Usuario.correo.like('%admin%')).first()
            user_lector = Usuario.query.filter(~Usuario.correo.like('%admin%')).first()
            cien_anos = Libro.query.filter_by(titulo='Cien años de soledad').first()
            if user_admin:
                db.session.add(Comentario(
                    id_usuario=user_admin.id_usuario,
                    id_libro=None,
                    contenido='¡Bienvenidos a MebyTech Libris! Los invitamos a explorar las obras del catálogo y compartir sus opiniones y recomendaciones literarias.',
                    puntuacion=5
                ))
            if user_lector and cien_anos:
                db.session.add(Comentario(
                    id_usuario=user_lector.id_usuario,
                    id_libro=cien_anos.id_libro,
                    contenido='Excelente edición de Cien Años de Soledad. El lector digital integrado y la nueva portada hacen una experiencia de lectura formidable.',
                    puntuacion=5
                ))
            db.session.commit()

        # Verificar si ya existen libros registrados
        if Libro.query.first():
            return

        print("Poblando base de datos con datos semilla...")

        # 1. Catálogo de Autores
        autores_data = [
            "Gabriel García Márquez",
            "Isaac Asimov",
            "Philip K. Dick",
            "George Orwell",
            "Frank Herbert",
            "Julio Cortázar",
            "Arthur C. Clarke",
            "Ray Bradbury",
            "Jorge Luis Borges",
            "Ursula K. Le Guin",
            "Stanislaw Lem",
            "Aldous Huxley"
        ]
        autores_dict = {}
        for nombre in autores_data:
            autor = Autor(nombre=nombre)
            db.session.add(autor)
            autores_dict[nombre] = autor

        # 2. Catálogo de Géneros Literarios
        generos_data = [
            "Novela Literaria",
            "Ciencia Ficción Hard",
            "Ciencia Ficción Distópica",
            "Realismo Mágico",
            "Cyberpunk / Sci-Fi",
            "Ficción Especulativa"
        ]
        generos_dict = {}
        for nombre in generos_data:
            genero = Genero(nombre=nombre)
            db.session.add(genero)
            generos_dict[nombre] = genero

        # Persistir autores y géneros para generar sus IDs
        db.session.commit()

        # 3. Usuarios de prueba con contraseñas cifradas
        usuarios_data = [
            ("Administrador MebyTech", "admin@mebytech.com", "admin123"),
            ("Carlos Mendoza", "carlos.mendoza@example.com", "123456"),
            ("Valeria Rivas", "valeria.rivas@example.com", "123456"),
            ("Alejandro Silva", "alejandro.silva@example.com", "123456"),
            ("Elena Torres", "elena.torres@example.com", "123456")
        ]
        for nombre, correo, password in usuarios_data:
            usuario = Usuario(nombre=nombre, correo=correo, libros_activos=0)
            usuario.set_password(password)
            db.session.add(usuario)

        # 4. Libros Clásicos de Literatura y Ciencia Ficción (16 obras maestras)
        libros_data = [
            {
                "titulo": "Cien años de soledad",
                "anio": 1967,
                "autor": "Gabriel García Márquez",
                "genero": "Realismo Mágico",
                "contenido": (
                    "Muchos años después, frente al pelotón de fusilamiento, el coronel Aureliano Buendía había de recordar aquella tarde remota en que su padre lo llevó a conocer el hielo. Macondo era entonces una aldea de veinte casas de barro y cañabrava construidas a la orilla de un río de aguas diáfanas que se precipitaban por un lecho de piedras pulidas, blancas y enormes como huevos prehistóricos. El mundo era tan reciente, que muchas cosas carecían de nombre, y para mencionarlas había que señalarlas con el dedo.\n\n"
                    "Todos los años, por el mes de marzo, una familia de gitanos desarrapados plantaba su carpa cerca de la aldea, y con un grande alboroto de pitos y timbales daban a conocer los nuevos inventos. Primero llevaron el imán. Un gitano corpulento, de barba montaraz y manos de gorrión, que se presentó con el nombre de Melquíades, hizo una truculenta demostración pública de lo que él mismo llamaba la octava maravilla de los sabios alquimistas de Macedonia. Fue de casa en casa arrastrando dos lingotes metálicos, y todo el mundo se espantó al ver que los calderos, las pailas, las tenazas y los anafes se caían de su sitio, y las maderas crujían por la desesperación de los clavos tratando de desclavarse.\n\n"
                    "José Arcadio Buendía, cuya desaforada imaginación iba siempre más lejos que el ingenio de la naturaleza, y aun más allá del milagro y la magia, pensó que era posible servirse de aquella invención inútil para desentrañar el oro de la tierra. Melquíades, que era un hombre honrado, le previno: «Para eso no sirve». Pero José Arcadio Buendía no creía en aquel tiempo en la honradez de los gitanos, así que cambió su mulo y una partida de chivos por los dos lingotes imantados. Úrsula Iguarán, su mujer, no pudo disuadirlo: «Muy pronto ha de sobrarnos oro para empedrar la casa», sentenció el patriarca con inquebrantable convicción."
                )
            },
            {
                "titulo": "El amor en los tiempos del cólera",
                "anio": 1985,
                "autor": "Gabriel García Márquez",
                "genero": "Novela Literaria",
                "contenido": (
                    "Era inevitable: el olor de las almendras amargas le recordaba siempre el destino de los amores contrariados. El doctor Juvenal Urbino lo percibió tan pronto como entró en la casa todavía en penumbras, adonde había acudido de urgencia a ocuparse de un caso que para él había dejado de ser urgente desde hacía muchos años. El refugiado antillano Jeremiah de Saint-Amour, inválido de guerra, fotógrafo de niños y su adversario de ajedrez más compasivo, se había puesto a salvo de los tormentos de la memoria con un sahumerio de cianuro de oro.\n\n"
                    "Encontró el cadáver cubierto con una manta en el catre de campaña donde había dormido siempre, cerca de un banquillo con la cubeta que había servido para evaporar el veneno. En el suelo, amarrado a la pata del catre, yacía el cuerpo de un gran perro danés negro con el pecho nevado, y junto a él estaban las muletas. El cuarto sofocante y abigarrado, que hacía las veces de alcoba y laboratorio, empezaba a iluminarse con el resplandor del amanecer en la ventana abierta, pero era una luz apenas suficiente para reconocer la autoridad solemne de la muerte.\n\n"
                    "Más de medio siglo antes, Florentino Ariza había jurado fidelidad eterna y amor imperecedero a Fermina Daza bajo los almendros del parque de los Evangelios. Habían transcurrido cincuenta y un años, nueve meses y cuatro días con sus noches de callada vigilia, durante los cuales Florentino aprendió a vivir sin esperanza pero jamás sin amor, contando cada segundo hasta el momento en que pudiera repetirle, ante el umbral de la vejez, la promesa de una entrega absoluta que ni el paso implacable del tiempo ni la amenaza del cólera lograrían extinguir jamás."
                )
            },
            {
                "titulo": "Fundación",
                "anio": 1951,
                "autor": "Isaac Asimov",
                "genero": "Ciencia Ficción Hard",
                "contenido": (
                    "HARI SELDON... Nacido en el año 11.988 de la Era Galáctica; fallecido en 12.069. Las fuentes fidedignas de información biográfica sobre su persona proceden de la monumental Enciclopedia Galáctica.\n\n"
                    "Según los anales imperiales, Seldon concibió la ciencia de la Psicohistoria: aquella rama de las matemáticas que trata sobre las reacciones colectivas de conglomerados humanos ante estímulos socioeconómicos fijos. Durante más de cuarenta años perfeccionó sus ecuaciones hasta llegar a una conclusión aterradora: el glorioso Imperio Galáctico, que agrupaba a millones de mundos y trillones de habitantes, estaba en inevitable decadencia, y a su caída seguiría una era de barbarie de treinta mil años. Solo la creación de dos Fundaciones en extremos opuestos del cosmos podría reducir aquel abismo oscuro a un único milenio.\n\n"
                    "Gaal Dornick, recién llegado a la capital imperial desde su remoto planeta natal, observó con asombro la bóveda infinita de metal que cubría toda la superficie del planeta Trántor. En los salones del Palacio de Justicia, donde la Comisión de Seguridad Pública acusó a Seldon de conspiración y traición por profetizar la ruina del orden establecido, el anciano matemático defendió sus números con serena firmeza: «No intento salvar el Imperio, señores comisionados. Intento salvar el conocimiento humano de la noche perpetua»."
                )
            },
            {
                "titulo": "Yo, Robot",
                "anio": 1950,
                "autor": "Isaac Asimov",
                "genero": "Ciencia Ficción Hard",
                "contenido": (
                    "Susan Calvin se retiraba a la edad de setenta y cinco años. Durante medio siglo había presenciado el asombroso desarrollo de los cerebros positrónicos desde sus rudimentarios comienzos hasta las mentes robóticas que gobernaban la economía y la exploración espacial terrestre.\n\n"
                    "—Las Tres Leyes de la Robótica —repitió con voz pausada y mirada reflexiva frente a los expedientes de U.S. Robots—:\n1. Un robot no debe dañar a un ser humano ni, por inacción, permitir que un ser humano sufra daño.\n2. Un robot debe obedecer las órdenes dadas por los seres humanos, excepto si entran en conflicto con la Primera Ley.\n3. Un robot debe proteger su propia existencia en la medida en que ello no entre en conflicto con la Primera o la Segunda Ley.\n\n"
                    "Esas tres normas están impresas indeleblemente mediante potenciales matemáticos en las vías de platino-iridio de cada cerebro positrónico.\n\n"
                    "Sin embargo, los dilemas morales surgían allí donde la lógica fría se topaba con la ambigüedad de la conducta humana. Desde el entrañable robot mudo Robbie, que desafió los prejuicios sociales para proteger a una niña, hasta el sofisticado pensador QT-1, que dedujo mediante pura razón que los seres humanos eran demasiado imperfectos para haberlo creado a él, la doctora Calvin comprendió que los robots eran el espejo más lúcido y desconcertante de nuestra propia condición ética."
                )
            },
            {
                "titulo": "¿Sueñan los androides con ovejas eléctricas?",
                "anio": 1968,
                "autor": "Philip K. Dick",
                "genero": "Cyberpunk / Sci-Fi",
                "contenido": (
                    "Un silbido de sobrecarga en el climatizador despertó a Rick Deckard. Miró su reloj: las cuatro y media de la madrugada. Se incorporó pesadamente en la penumbra de su apartamento de San Francisco, cubierto por el polvo radiactivo que la Guerra Terminal Mundial había esparcido sobre la faz del planeta. Encendió el modulador de ánimo Penfield y seleccionó el código 481: una vaga disposición a mirar el mundo con renovada esperanza.\n\n"
                    "En la azotea comunitaria, su oveja eléctrica simulaba pastar con fidelidad mecánica en el césped sintético. Pero Rick soñaba con poseer un animal auténtico de carne y hueso, un lujo astronómico y prohibitivo en una Tierra biológicamente devastada donde la extinción de las especies había convertido la posesión de una criatura viva en el máximo símbolo de dignidad moral y estatus social.\n\n"
                    "La llamada urgente del inspector Bryant interrumpió sus cavilaciones: seis androides fugitivos del nuevo modelo Nexus-6, idénticos a los humanos en anatomía y dotados de una inteligencia superior a la de sus creadores, habían asesinado a sus amos en Marte y se ocultaban en la bahía. La tarea de Deckard era localizarlos mediante el test de empatía Voight-Kampff y «retirarlos» del servicio, aun a riesgo de cuestionar dónde terminaba la máquina y dónde comenzaba el alma humana."
                )
            },
            {
                "titulo": "Ubik",
                "anio": 1969,
                "autor": "Philip K. Dick",
                "genero": "Cyberpunk / Sci-Fi",
                "contenido": (
                    "A las tres y media de la madrugada, Glen Runciter llamó a Joe Chip. «Joe, tenemos una intrusión psíquica de nivel 4 en Topeka». En un mundo donde los telépatas corporativos robaban secretos antes de que fueran concebidos en los laboratorios, Runciter Asociados alquilaba agentes inerciales capaces de sofocar y anular cualquier manifestación precognitiva o empática.\n\n"
                    "Tras la devastadora trampa lunar en los laboratorios de Stanton Mick, la estructura misma de la realidad comenzó a resquebrajarse. Los cigarrillos se volvían ceniza rancia en los paquetes, las monedas retrocedían a diseños de hacía cuarenta años y los alimentos frescos se pudrían en cuestión de segundos, atrapados en un proceso acelerado de regresión entrópica donde el presente se desmoronaba.\n\n"
                    "—Amigos, ¿están cansados del café frío y del deterioro de la realidad? —anunciaba el aerosol en las pantallas parpadeantes—. Ubik limpia, refresca, restituye las leyes físicas y detiene la regresión temporal. Seguro cuando se usa según las instrucciones. No exceda la dosis recomendada."
                )
            },
            {
                "titulo": "1984",
                "anio": 1949,
                "autor": "George Orwell",
                "genero": "Ciencia Ficción Distópica",
                "contenido": (
                    "Era un día frío y luminoso de abril y los relojes daban las trece. Winston Smith, con la barbilla clavada en el pecho en un esfuerzo por escapar al viento glacial, se deslizó rápidamente a través de las puertas de cristal de las Casas de la Victoria, aunque no con la suficiente presteza para impedir que una ráfaga de polvo arenoso entrara tras él.\n\n"
                    "El pasillo olía a repollo cocido y a esteras viejas. En un extremo, un cartel de grandes dimensiones mostraba un rostro de más de un metro de anchura: la faz de un hombre de unos cuarenta y cinco años, con un espeso bigote negro y rasgos de ruda apostura. Los ojos parecían seguirte cuando te movías en cualquier dirección. El cartel rezaba abajo:\nEL GRAN HERMANO TE VIGILA.\n\n"
                    "Dentro del apartamento de Winston, la telepantalla parlanchina no podía apagarse jamás; día y noche emitía discursos patrióticos y estadísticas infladas, al tiempo que captaba cualquier murmullo o expresión facial sospechosa. En el Ministerio de la Verdad, el trabajo diario de Winston consistía en reescribir periódicos y documentos antiguos para que los pronósticos del Partido coincidieran siempre con el presente, borrando del registro histórico a cualquier disidente hasta convertirlo en una «nopersona»."
                )
            },
            {
                "titulo": "Rebelión en la granja",
                "anio": 1945,
                "autor": "George Orwell",
                "genero": "Novela Literaria",
                "contenido": (
                    "El señor Jones, dueño de la Granja Mayor, cerró los gallineros por la noche, pero estaba demasiado borracho para acordarse de cerrar las trampillas. Con el círculo de luz temblorosa de su linterna bailando de un lado a otro, atravesó el patio tambaleándose hasta la casa.\n\n"
                    "Tan pronto como se apagó la luz del dormitorio, comenzó un alboroto general en todos los edificios. Había corrido la voz de que el Viejo Mayor, el verraco galardonado, había tenido un sueño extraño la noche anterior y deseaba comunicárselo a los demás animales reunidos en el granero principal.\n\n"
                    "Subido a una tarima improvisada de paja, el viejo cerdo expuso su visión de un futuro libre del yugo humano, donde ningún animal fuera explotado ni sacrificado por el látigo del granjero: «El hombre es el único ser que consume sin producir. Eliminen al hombre y la causa principal del hambre y del trabajo excesivo desaparecerá para siempre». Al cabo de la revolución triunfante, pintaron los Siete Mandamientos en el muro encalado, sin sospechar que años más tarde los cerdos en el poder cambiarían las reglas hasta consagrar la máxima más cínica: «Todos los animales son iguales, pero algunos animales son más iguales que otros»."
                )
            },
            {
                "titulo": "Dune",
                "anio": 1965,
                "autor": "Frank Herbert",
                "genero": "Ficción Especulativa",
                "contenido": (
                    "Un comienzo es el momento de tener el mayor cuidado en que los equilibrios sean correctos. Esto lo sabe todo estudiante de las Bene Gesserit. Para empezar el estudio de la vida de Muad'Dib, cuida en primer término de situarlo en su tiempo: nacido en el año 57 del Emperador Padishah, Shaddam IV.\n\n"
                    "Y sitúalo sobre todo en su lugar: el planeta Arrakis, conocido como Dune, el planeta del desierto, el páramo interminable de arena donde moran los colosales gusanos Shai-Hulud y donde se extrae la especia melange, la sustancia más codiciada del universo conocido, capaz de extender la longevidad y desbloquear la presciencia para los navegantes de la Cofradía Espacial.\n\n"
                    "Paul Atreides, heredero del venerado Duque Leto, sintió el fuego lacerante de la prueba del gom jabbar mientras la Reverenda Madre Gaius Helen Mohiam le ordenaba mantener su mano dentro de la caja del dolor absoluto: «Un animal se arrancaría una pata para escapar de la trampa; un ser humano resiste el dolor y espera el momento oportuno». En las profundidades del desierto, el pueblo guerrero de los Fremen aguardaba en silencio el cumplimiento de las profecías del Lisan al-Gaib, la voz del otro mundo que cambiaría para siempre el destino del cosmos."
                )
            },
            {
                "titulo": "Rayuela",
                "anio": 1963,
                "autor": "Julio Cortázar",
                "genero": "Novela Literaria",
                "contenido": (
                    "¿Encontraría a la Maga? Tantas veces me había bastado asomarme, viniendo por la rue de Seine, al arco que da al Quai de Conti, y apenas la luz de ceniza y olivo que flota sobre el río me dejaba distinguir las formas, ya su silueta delgada se inscribía en el Pont des Arts, a veces andando de un lado a otro, a veces detenida en el pretil de hierro, inclinada sobre el agua.\n\n"
                    "Y era tan natural cruzar la calle, subir los peldaños del puente, entrar en su cintura delgada y acercarme a la Maga que sonreía sin sorpresa, convencida como yo de que un encuentro casual era lo menos casual en nuestras vidas, y que la gente que se da citas precisas es la misma que necesita papel rayado para escribirse o que aprieta desde abajo el tubo de dentífrico.\n\n"
                    "Horacio Oliveira deambulaba por los callejones húmedos de París escuchando los ecos lejanos de un jazz melancólico de Bessie Smith en los cuartos bohemios del Club de la Serpiente. Como una rayuela dibujada con tiza sobre la acera del patio, la novela invitaba al lector a saltar de casilla en casilla, buscando ese Cielo esquivo que tal vez nunca existió fuera de la propia caída libre de las palabras."
                )
            },
            {
                "titulo": "2001: Una odisea espacial",
                "anio": 1968,
                "autor": "Arthur C. Clarke",
                "genero": "Ciencia Ficción Hard",
                "contenido": (
                    "La sequía había durado ya diez millones de años, y el reinado de los terribles saurios hacía largo tiempo que había terminado. Aquí, en el ecuador, en el continente que un día sería conocido como África, la lucha por la existencia había alcanzado una nueva ferocidad. En aquel mundo desecado y hostil, solo los pequeños primates se adaptaban.\n\n"
                    "Y entre ellos se encontraba Moon-Watcher. Al amanecer, frente a la caverna, una enorme losa geométrica de roca pulida y negrura impenetrable se alzaba en silencio: el Monolito. Al tocarlo, una vibración imperceptible comenzó a reconfigurar para siempre las conexiones de su mente primitiva hacia las estrellas y el dominio de las herramientas.\n\n"
                    "Cuatro millones de años más tarde, a bordo de la nave Discovery One rumbo a Saturno, el astronauta David Bowman se enfrentaría al ojo rojo impasible de la supercomputadora HAL 9000, cuya programación entró en conflicto mortal con la tripulación: «Lo siento, Dave, pero me temo que no puedo hacer eso». Más allá del infinito y del tiempo, el último viaje hacia el embrión de las estrellas estaba a punto de consumarse."
                )
            },
            {
                "titulo": "Fahrenheit 451",
                "anio": 1953,
                "autor": "Ray Bradbury",
                "genero": "Ciencia Ficción Distópica",
                "contenido": (
                    "Quemarlo todo era un goce especial. Era un placer especial ver las cosas consumidas, ver las cosas ennegrecidas y transformadas. Con la boquilla de bronce del soplete en sus puños, con aquella gigantesca serpiente escupiendo su petróleo venenoso sobre el mundo, la sangre le latía en la cabeza y sus manos eran las de un prodigioso director de orquesta que ejecutara todas las sinfonías del fuego y del fuego devorador.\n\n"
                    "Guy Montag sonrió con la sonrisa feroz de todos los hombres chamuscados y quemados por el deber de bombero: incinerar cada libro prohibido a cuatrocientos cincuenta y un grados Fahrenheit, la temperatura a la que el papel arde por sí mismo.\n\n"
                    "Pero una noche tibia de otoño, al regresar de la estación, conoció en la esquina solitaria a Clarisse McClellan, una joven de diecisiete años que caminaba bajo la luna y olía a hojas frescas: «¿Es verdad que hace mucho tiempo los bomberos apagaban incendios en vez de provocarlos? —le preguntó mirándolo a los ojos con inocencia—. ¿Es usted feliz?». Aquella sencilla pregunta abrió una grieta irreversible en la conciencia de Montag, empujándolo a ocultar los primeros volúmenes prohibidos bajo su propia almohada."
                )
            },
            {
                "titulo": "Ficciones",
                "anio": 1944,
                "autor": "Jorge Luis Borges",
                "genero": "Novela Literaria",
                "contenido": (
                    "El universo (que otros llaman la Biblioteca) se compone de un número indefinido, y tal vez infinito, de galerías hexagonales, con vastos pozos de ventilación en el medio, cercados por barandas bajísimas. Desde cualquier hexágono se ven los pisos inferiores y superiores: interminablemente.\n\n"
                    "La distribución de las galerías es invariable. Veinte anaqueles, a cinco largos anaqueles por lado, cubren todos los lados menos dos; su altura, que es la de los pisos, excede apenas la de un bibliotecario normal. Cada libro es de cuatrocientas diez páginas; cada página, de cuarenta renglones; cada renglón, de unas ochenta letras de color negro. En algún anaquel de algún hexágono debe existir el libro total que resume todos los demás.\n\n"
                    "Los hombres de la Biblioteca han buscado durante siglos ese Libro Total que contiene la cifra perfecta de todos los anaqueles del infinito. Otros han enloquecido buscando la justificación de su propia existencia entre los laberintos hexagonales, consolándose con la certidumbre de que si el espacio es infinito, la Biblioteca debe ser periódica y repetirse eternamente en el orden cósmico de su propia soledad."
                )
            },
            {
                "titulo": "Los desposeídos",
                "anio": 1974,
                "autor": "Ursula K. Le Guin",
                "genero": "Ficción Especulativa",
                "contenido": (
                    "Había un muro. No parecía importante. Estaba hecho de piedras sin labrar, unidas con mortero áspero. Un adulto podía mirar por encima de él, e incluso un niño pequeño podía escalarlo. Pero la idea de aquel muro era lo crucial.\n\n"
                    "Rodeaba las sesenta hectáreas del espaciopuerto de Anarres. Durante doscientos años aquel muro había dividido dos mundos: hacia adentro, el suelo austero y colectivista de los pioneros anarquistas; hacia afuera, la inmensidad del universo y el antiguo planeta de Urras, opulento, dividido y esclavo de sus propias riquezas. Shevek se disponía a ser el primero en cruzarlo.\n\n"
                    "Shevek, un brillante físico teórico cuyas investigaciones sobre la simultaneidad temporal prometían unir a todos los mundos habitados mediante el comunicador instantáneo Ansible, sabía que sus propios compatriotas lo considerarían un traidor por viajar al planeta de los propietarios. Sin embargo, estaba decidido a derribar las barreras del aislamiento: «Nuestra sociedad se ha cerrado sobre sí misma por miedo; voy a Urras no para poseer, sino para tender un puente entre las estrellas»."
                )
            },
            {
                "titulo": "Solaris",
                "anio": 1961,
                "autor": "Stanislaw Lem",
                "genero": "Ciencia Ficción Hard",
                "contenido": (
                    "A las 19:00 horas de tiempo de a bordo, pasé por la escotilla al interior del contenedor. En la cabina apenas había espacio suficiente para mis codos. Una vez atornillado el tubo de aire y aseguradas las correas, el mecanismo automático inició el descenso hacia la atmósfera del planeta viviente.\n\n"
                    "Abajo, cubriéndolo todo de horizonte a horizonte bajo dos soles, se extendía el océano protoplasmático y coloidal de Solaris, una inteligencia titánica y silenciosa que desde hacía décadas desafiaba todos los modelos científicos humanos creando estructuras matemáticas colosales en su superficie y materializando los secretos más ocultos de las mentes de los tripulantes.\n\n"
                    "Al entrar en la estación espacial desierta y en penumbras, Kris Kelvin comprendió que la tragedia que había empujado al suicidio a Gibarian no era un fallo técnico, sino un fenómeno sobrecogedor: el océano había penetrado las barreras del subconsciente de los investigadores, materializando de carne y hueso los recuerdos más dolorosos de sus pasados. La presencia viva de Harey, su difunta esposa, convirtió la misión científica en un laberinto de expiación y culpa."
                )
            },
            {
                "titulo": "Un mundo feliz",
                "anio": 1932,
                "autor": "Aldous Huxley",
                "genero": "Ciencia Ficción Distópica",
                "contenido": (
                    "Un edificio gris y achaparrado de sólo treinta y cuatro plantas. Encima de la entrada principal, las palabras: CENTRO DE INCUBACIÓN Y ACONDICIONAMIENTO DE LA CENTRAL DE LONDRES, y, en un escudo, el lema del Estado Mundial: COMUNIDAD, IDENTIDAD, ESTABILIDAD.\n\n"
                    "La enorme sala de la planta baja miraba hacia el norte. Fría a pesar del verano que reinaba en el exterior, una luz pálida y cruda se colaba por las ventanas, buscando ávidamente figuras vestidas de blanco, tubos de ensayo ordenados con precisión matemática y los aparatos donde se gestaba, mediante el método Bokanovsky, a las futuras castas de Alfas, Betas, Gammas y Epsilons sin dolor ni imperfección, programados biológicamente para amar su destino social.\n\n"
                    "En este mundo higiénico, los dolores del alma habían sido erradicados gracias a la música sintética y a las dosis diarias de soma, la droga que otorgaba vacaciones de la realidad sin resaca alguna: «Un gramo de soma cura diez sentimientos tristes», repetían los altavoces. Sin embargo, en la solitaria Reserva de Nuevo México, donde las viejas costumbres de la vejez y los libros de Shakespeare aún sobrevivían, John el Salvaje aguardaba el momento de desafiar la anestesia colectiva de una civilización que sacrificó la verdad en el altar del confort."
                )
            }
        ]

        portadas = {
            "Cien años de soledad": "/static/img/covers/cien-anos-de-soledad.svg",
            "El amor en los tiempos del cólera": "/static/img/covers/el-amor-en-los-tiempos-del-colera.svg",
            "Fundación": "/static/img/covers/fundacion.svg",
            "Yo, Robot": "/static/img/covers/yo-robot.svg",
            "¿Sueñan los androides con ovejas eléctricas?": "/static/img/covers/suenan-los-androides.svg",
            "Ubik": "/static/img/covers/ubik.svg",
            "1984": "/static/img/covers/1984.svg",
            "Rebelión en la granja": "/static/img/covers/rebelion-en-la-granja.svg",
            "Dune": "/static/img/covers/dune.svg",
            "Rayuela": "/static/img/covers/rayuela.svg",
            "2001: Una odisea espacial": "/static/img/covers/2001-una-odisea-espacial.svg",
            "Fahrenheit 451": "/static/img/covers/fahrenheit-451.svg",
            "Ficciones": "/static/img/covers/ficciones.svg",
            "Los desposeídos": "/static/img/covers/los-desposeidos.svg",
            "Solaris": "/static/img/covers/solaris.svg",
            "Un mundo feliz": "/static/img/covers/un-mundo-feliz.svg"
        }

        for libro_item in libros_data:
            autor_obj = autores_dict[libro_item["autor"]]
            genero_obj = generos_dict[libro_item["genero"]]
            portada = portadas.get(libro_item["titulo"], "/static/img/covers/cien-anos-de-soledad.svg")
            libro = Libro(
                titulo=libro_item["titulo"],
                anio=libro_item["anio"],
                contenido=libro_item.get("contenido", ""),
                portada_url=portada,
                id_autor=autor_obj.id_autor,
                id_genero=genero_obj.id_genero
            )
            db.session.add(libro)

        db.session.commit()
        print("Base de datos inicializada y poblada satisfactoriamente con 16 obras maestras.")


app = create_app()

if __name__ == '__main__':
    seed_database(app)
    app.run(host='0.0.0.0', port=5000, debug=True)
