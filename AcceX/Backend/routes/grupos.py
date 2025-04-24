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
    usuarios = Usuario.query.filter_by(gid_number=gid).all()
    return jsonify([
        {
            'uid_number': u.uid_number,
            'nombre_usuario': u.nombre_usuario
        } for u in usuarios
    ])

@grupos_bp.route('/grupos/<int:gid>/usuarios/<int:uid>', methods=['DELETE'])
def eliminar_usuario_de_grupo(gid, uid):
    usuario = Usuario.query.get(uid)
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    if usuario.gid_number != gid:
        return jsonify({'error': 'El usuario no pertenece a este grupo'}), 400

    db.session.execute(
        usuarios_grupos.delete().where(
            usuarios_grupos.c.usuario_id == uid,
            usuarios_grupos.c.grupo_id == gid
        )
    )

    usuario.gid_number = None
    db.session.commit()

    return jsonify({'mensaje': 'Usuario eliminado del grupo correctamente'})
