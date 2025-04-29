from flask import Blueprint, request, jsonify
from models.usuario import Usuario  
from models.grupo import Grupo
from models.investigador import Investigador
from models.database import db, usuarios_grupos, investigadores_usuarios
from datetime import datetime

usuarios_bp = Blueprint('usuarios', __name__)

@usuarios_bp.route('/usuarios', methods=['GET'])
def obtener_usuarios():
    usuarios = Usuario.query.all()
    resultado = []

    for u in usuarios:
        relacion = db.session.execute(
            investigadores_usuarios.select().where(investigadores_usuarios.c.usuario_id == u.uid_number)
        ).first()

        nombre_investigador = None
        if relacion:
            investigador = Investigador.query.get(relacion.investigador_id)
            if investigador:
                nombre_investigador = investigador.nombre_investigador

        resultado.append({
            'uid_number': u.uid_number,
            'gid_number': u.gid_number,
            'nombre_usuario': u.nombre_usuario,
            'fecha_alta': u.fecha_alta.isoformat() if u.fecha_alta else None,
            'fecha_baja': u.fecha_baja.isoformat() if u.fecha_baja else None,
            'activo': u.activo,
            'contacto': u.contacto,
            'telefono': u.telefono,
            'orcid': u.orcid,
            'scholar': u.scholar,
            'wos': u.wos,
            'scopus': u.scopus,
            'res': u.res,
            'nombre_investigador': nombre_investigador 
        })

    return jsonify(resultado)

@usuarios_bp.route('/usuarios', methods=['POST'])
def crear_usuario():
    data = request.json
    try:
        gid_number = data.get("gid_number")
        grupo = Grupo.query.get(gid_number)
        if not grupo:
            return jsonify({'error': f'El grupo con gid_number {gid_number} no existe'}), 400

        nuevo_usuario = Usuario(
            gid_number=gid_number,
            nombre_usuario=data.get("nombre_usuario"),
            contacto=data.get("correo"),
            activo=data.get("activo", True)
        )
        db.session.add(nuevo_usuario)

        if data.get("nombre_investigador"):
            nuevo_investigador = Investigador(
                nombre_investigador=data.get("nombre_investigador"),
                correo=data.get("correo")
            )
            db.session.add(nuevo_investigador)
            db.session.flush()

            db.session.execute(
                investigadores_usuarios.insert().values(
                    usuario_id=nuevo_usuario.uid_number,
                    investigador_id=nuevo_investigador.iid_number
                )
            )
        else:
            db.session.flush()

        db.session.execute(
            usuarios_grupos.insert().values(
                usuario_id=nuevo_usuario.uid_number,
                grupo_id=gid_number
            )
        )

        db.session.commit()
        return jsonify({'mensaje': 'Usuario creado correctamente'}), 201

    except Exception as e:
        db.session.rollback()
        print("❌ Error:", str(e))
        return jsonify({'error': 'Error al crear usuario', 'detalle': str(e)}), 500

@usuarios_bp.route('/usuarios/<int:id>', methods=['PUT'])
def actualizar_usuario(id):
    try:
        data = request.json

        usuario = Usuario.query.get(id)
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        def parse_fecha(fecha_str):
            if fecha_str in [None, '', 'null']:
                return None
            try:
                return datetime.strptime(fecha_str, "%Y-%m-%d").date()
            except ValueError:
                return None

        nuevo_gid = data.get('gid_number')

        if nuevo_gid is None:
            db.session.execute(
                usuarios_grupos.delete().where(
                    usuarios_grupos.c.usuario_id == usuario.uid_number
                )
            )
            usuario.gid_number = None
        else:
            grupo_existente = Grupo.query.get(nuevo_gid)
            if not grupo_existente:
                return jsonify({'error': 'El grupo especificado no existe'}), 400

            usuario.gid_number = nuevo_gid

            existe_relacion = db.session.execute(
                usuarios_grupos.select().where(
                    usuarios_grupos.c.usuario_id == usuario.uid_number,
                    usuarios_grupos.c.grupo_id == nuevo_gid
                )
            ).first()

            if not existe_relacion:
                insert_stmt = usuarios_grupos.insert().values(
                    usuario_id=usuario.uid_number,
                    grupo_id=nuevo_gid
                )
                db.session.execute(insert_stmt)

        usuario.nombre_usuario = data.get('nombre_usuario', usuario.nombre_usuario)
        usuario.fecha_alta = parse_fecha(data.get('fecha_alta')) or usuario.fecha_alta
        usuario.fecha_baja = parse_fecha(data.get('fecha_baja')) or usuario.fecha_baja
        usuario.activo = data.get('activo', usuario.activo)
        usuario.contacto = data.get('contacto', usuario.contacto)
        usuario.telefono = data.get('telefono', usuario.telefono)
        usuario.orcid = data.get('orcid', usuario.orcid)
        usuario.scholar = data.get('scholar', usuario.scholar)
        usuario.wos = data.get('wos', usuario.wos)
        usuario.scopus = data.get('scopus', usuario.scopus)
        usuario.res = data.get('res', usuario.res)

        db.session.commit()
        return jsonify({'mensaje': 'Usuario actualizado'})

    except Exception as e:
        db.session.rollback()
        print("❌ Error en el servidor:", str(e))
        return jsonify({'error': 'Error interno del servidor', 'detalle': str(e)}), 500


@usuarios_bp.route('/usuarios/<int:id>', methods=['DELETE'])
def eliminar_usuario(id):
    usuario = Usuario.query.get(id)
    if not usuario:
        return jsonify({'mensaje': 'Usuario no encontrado'}), 404

    relacion = db.session.execute(
        investigadores_usuarios.select().where(investigadores_usuarios.c.usuario_id == id)
    ).first()

    if relacion:
        db.session.execute(
            investigadores_usuarios.delete().where(investigadores_usuarios.c.usuario_id == id)
        )

        investigador = Investigador.query.get(relacion.investigador_id)
        if investigador:
            db.session.delete(investigador)

    db.session.delete(usuario)
    db.session.commit()

    return jsonify({'mensaje': 'Usuario e investigador asociados eliminados'}), 200


