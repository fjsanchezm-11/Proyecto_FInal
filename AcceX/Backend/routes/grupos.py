from flask import Blueprint, request, jsonify
from models.grupo import Grupo
from models.database import db, usuarios_grupos
from models.usuario import Usuario

grupos_bp = Blueprint('grupos', __name__)

@grupos_bp.route('/grupos', methods=['GET'])
def obtener_grupos():
    grupos = Grupo.query.all()
    return jsonify([{
        'gid_number': g.gid_number,
        'nombre': g.nombre
    } for g in grupos])

@grupos_bp.route('/grupos', methods=['POST'])
def crear_grupo():
    data = request.json
    nuevo_grupo = Grupo(
        nombre=data['nombre']
    )
    db.session.add(nuevo_grupo)
    db.session.commit()
    return jsonify({'mensaje': 'Grupo creado'}), 201

@grupos_bp.route('/grupos/<int:id>', methods=['PUT'])
def actualizar_grupo(id):
    data = request.json
    grupo = Grupo.query.get(id)
    if not grupo:
        return jsonify({'mensaje': 'Grupo no encontrado'}), 404
    
    grupo.nombre = data.get('nombre', grupo.nombre)

    db.session.commit()
    return jsonify({'mensaje': 'Grupo actualizado'})

@grupos_bp.route('/grupos/<int:id>', methods=['DELETE'])
def eliminar_grupo(id):
    grupo = Grupo.query.get(id)
    if not grupo:
        return jsonify({'mensaje': 'Grupo no encontrado'}), 404
    db.session.delete(grupo)
    db.session.commit()
    return jsonify({'mensaje': 'Grupo eliminado'})

@grupos_bp.route('/grupos/<int:gid>/usuarios', methods=['GET'])
def obtener_usuarios_por_grupo(gid):
    grupo = Grupo.query.get(gid)
    if not grupo:
        return jsonify({'error': 'Grupo no encontrado'}), 404

    usuarios = db.session.query(Usuario).join(usuarios_grupos).filter(usuarios_grupos.c.grupo_id == gid).all()
    return jsonify([
        {
            'uid_number': u.uid_number,
            'nombre_usuario': u.nombre_usuario
        } for u in usuarios
    ])

@grupos_bp.route('/grupos/<int:gid>/usuarios', methods=['POST'])
def asociar_usuario_a_grupo(gid):
    data = request.get_json()
    usuario_id = data.get('usuario_id')
    if not usuario_id:
        return jsonify({"error": "Falta usuario_id"}), 400

    grupo = Grupo.query.get(gid)
    usuario = Usuario.query.get(usuario_id)
    if not grupo:
        return jsonify({"error": "El grupo no existe"}), 404
    if not usuario:
        return jsonify({"error": "El usuario no existe"}), 404

    try:
        existe_relacion = db.session.execute(
            usuarios_grupos.select().where(
                usuarios_grupos.c.usuario_id == usuario_id,
                usuarios_grupos.c.grupo_id == gid
            )
        ).first()

        if existe_relacion:
            return jsonify({"mensaje": "El usuario ya está asociado al grupo"}), 200

        db.session.execute(
            usuarios_grupos.insert().values(usuario_id=usuario_id, grupo_id=gid)
        )
        db.session.commit()
        return jsonify({"mensaje": "Usuario asociado al grupo correctamente"}), 200

    except Exception as e:
        db.session.rollback()
        print("❌ Error al asociar usuario:", str(e))
        return jsonify({"error": "Error al asociar usuario", "detalle": str(e)}), 500

@grupos_bp.route('/grupos/<int:gid>/usuarios/<int:uid>', methods=['DELETE'])
def eliminar_usuario_de_grupo(gid, uid):
    grupo = Grupo.query.get(gid)
    usuario = Usuario.query.get(uid)
    if not grupo:
        return jsonify({'error': 'Grupo no encontrado'}), 404
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    delete_query = usuarios_grupos.delete().where(
        usuarios_grupos.c.usuario_id == uid,
        usuarios_grupos.c.grupo_id == gid
    )
    result = db.session.execute(delete_query)
    db.session.commit()

    if result.rowcount == 0:
        return jsonify({"error": "Relación no encontrada"}), 404

    return jsonify({"mensaje": "Usuario eliminado del grupo correctamente"})
