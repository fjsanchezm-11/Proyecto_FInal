from flask import Blueprint, request, jsonify
from models.usuario import Usuario  
from models.grupo import Grupo
from models.database import db, usuarios_grupos
from datetime import datetime

usuarios_bp = Blueprint('usuarios', __name__)

# Ruta para obtener todos los usuarios
@usuarios_bp.route('/usuarios', methods=['GET'])
def obtener_usuarios():
    usuarios = Usuario.query.all()
    return jsonify([{
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
        'res': u.res
    } for u in usuarios])

@usuarios_bp.route('/usuarios', methods=['POST'])
def crear_usuario():
    try:
        data = request.json
        gid_number = data.get('gid_number')

        grupo = Grupo.query.get(gid_number)
        if not grupo:
            return jsonify({'error': f'El grupo con gid_number {gid_number} no existe'}), 400

        nuevo_usuario = Usuario(
            gid_number=gid_number,
            nombre_usuario=data['nombre_usuario'],
            fecha_alta=data.get('fecha_alta'),
            fecha_baja=data.get('fecha_baja'),
            activo=data.get('activo', True),
            contacto=data.get('contacto'),
            telefono=data.get('telefono'),
            orcid=data.get('orcid'),
            scholar=data.get('scholar'),
            wos=data.get('wos'),
            scopus=data.get('scopus'),
            res=data.get('res')
        )
        db.session.add(nuevo_usuario)
        db.session.commit()

        db.session.execute(usuarios_grupos.insert().values(
            usuario_id=nuevo_usuario.uid_number,
            grupo_id=gid_number
        ))
        db.session.commit()

        return jsonify({'mensaje': 'Usuario creado'}), 201

    except Exception as e:
        db.session.rollback()
        print("❌ Error al crear usuario:", str(e))
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
            # ✅ Si se elimina el grupo, borrar también la relación en la tabla intermedia
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

            # ✅ Insertar en tabla intermedia si no existe la relación
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

        # Resto de campos
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


# Ruta para eliminar un usuario
@usuarios_bp.route('/usuarios/<int:id>', methods=['DELETE'])
def eliminar_usuario(id):
    usuario = Usuario.query.get(id)
    if not usuario:
        return jsonify({'mensaje': 'Usuario no encontrado'}), 404
    db.session.delete(usuario)
    db.session.commit()
    return jsonify({'mensaje': 'Usuario eliminado'})
