from flask import Blueprint, request, jsonify
from models.proyecto import Proyecto
from models.database import db, usuarios_proyectos
from models.usuario import Usuario

proyectos_bp = Blueprint('proyectos', __name__)

# Obtener todos los proyectos
@proyectos_bp.route('/proyectos', methods=['GET'])
def obtener_proyectos():
    proyectos = Proyecto.query.all()
    return jsonify([p.to_dict() for p in proyectos])

# Obtener un proyecto por ID
@proyectos_bp.route('/proyectos/<int:id>', methods=['GET'])
def obtener_proyecto(id):
    proyecto = Proyecto.query.get(id)
    if not proyecto:
        return jsonify({'mensaje': 'Proyecto no encontrado'}), 404
    return jsonify(proyecto.to_dict())

# Crear un nuevo proyecto
@proyectos_bp.route('/proyectos', methods=['POST'])
def crear_proyecto():
    data = request.json
    if not data.get('titulo'):
        return jsonify({'error': 'El título es obligatorio'}), 400
    if not data.get('categoria'):
        return jsonify({'error': 'La categoría es obligatoria'}), 400

    nuevo_proyecto = Proyecto(
        titulo=data['titulo'],
        fecha_inicio=data.get('fecha_inicio'),
        fecha_fin=data.get('fecha_fin'),
        email=data.get('email'),
        gid_number=data.get('gid_number'),
        institucion=data.get('institucion'),
        procedencia=data.get('procedencia'),
        categoria=data.get('categoria')
    )
    db.session.add(nuevo_proyecto)
    db.session.commit()
    return jsonify({'mensaje': 'Proyecto creado', 'proyecto': nuevo_proyecto.to_dict()}), 201

# Actualizar un proyecto
@proyectos_bp.route('/proyectos/<int:id>', methods=['PUT'])
def actualizar_proyecto(id):
    data = request.json
    proyecto = Proyecto.query.get(id)
    if not proyecto:
        return jsonify({'mensaje': 'Proyecto no encontrado'}), 404

    proyecto.titulo = data.get('titulo', proyecto.titulo)
    proyecto.fecha_inicio = data.get('fecha_inicio', proyecto.fecha_inicio)
    proyecto.fecha_fin = data.get('fecha_fin', proyecto.fecha_fin)
    proyecto.email = data.get('email', proyecto.email)
    proyecto.gid_number = data.get('gid_number', proyecto.gid_number)
    proyecto.institucion = data.get('institucion', proyecto.institucion)
    proyecto.procedencia = data.get('procedencia', proyecto.procedencia)
    proyecto.categoria = data.get('categoria', proyecto.categoria)
    db.session.commit()
    return jsonify({'mensaje': 'Proyecto actualizado'})

# Eliminar un proyecto
@proyectos_bp.route('/proyectos/<int:id>', methods=['DELETE'])
def eliminar_proyecto(id):
    proyecto = Proyecto.query.get(id)
    if not proyecto:
        return jsonify({'mensaje': 'Proyecto no encontrado'}), 404
    db.session.delete(proyecto)
    db.session.commit()
    return jsonify({'mensaje': 'Proyecto eliminado'})

@proyectos_bp.route('/proyectos/<int:pid>/usuarios', methods=['GET'])
def obtener_usuarios_por_proyecto(pid):
    usuarios = db.session.query(Usuario) \
        .join(usuarios_proyectos, Usuario.uid_number == usuarios_proyectos.c.usuario_id) \
        .filter(usuarios_proyectos.c.proyectos_id == pid) \
        .all()
    return jsonify([
        {'uid_number': u.uid_number, 'nombre_usuario': u.nombre_usuario}
        for u in usuarios
    ])

# Asociar un usuario a un proyecto
@proyectos_bp.route('/proyectos/<int:pid>/usuarios', methods=['POST'])
def asociar_usuario_a_proyecto(pid):
    data = request.get_json()
    usuario_id = data.get('usuario_id')
    if not usuario_id:
        return jsonify({"error": "Falta usuario_id"}), 400

    proyecto = Proyecto.query.get(pid)
    usuario = Usuario.query.get(usuario_id)
    if not proyecto:
        return jsonify({"error": "El proyecto no existe"}), 404
    if not usuario:
        return jsonify({"error": "El usuario no existe"}), 404

    # Inserta la relación
    insert_stmt = usuarios_proyectos.insert().values(usuario_id=usuario_id, proyecto_id=pid)
    db.session.execute(insert_stmt)
    db.session.commit()
    return jsonify({"mensaje": "Usuario asociado al proyecto correctamente"})

# Eliminar un usuario de un proyecto
@proyectos_bp.route('/proyectos/<int:pid>/usuarios/<int:uid>', methods=['DELETE'])
def eliminar_usuario_de_proyecto(pid, uid):
    delete_query = usuarios_proyectos.delete().where(
        usuarios_proyectos.c.usuario_id == uid,
        usuarios_proyectos.c.proyecto_id == pid
    )
    result = db.session.execute(delete_query)
    db.session.commit()
    if result.rowcount == 0:
        return jsonify({"error": "Relación no encontrada"}), 404
    return jsonify({"mensaje": "Usuario eliminado del proyecto correctamente"})

# Obtener proyectos asociados a un usuario
@proyectos_bp.route('/usuarios/<int:usuario_id>/proyectos', methods=['GET'])
def obtener_proyectos_por_usuario(usuario_id):
    proyectos = db.session.query(Proyecto) \
        .join(usuarios_proyectos, Proyecto.pid_number == usuarios_proyectos.c.proyecto_id) \
        .filter(usuarios_proyectos.c.usuario_id == usuario_id) \
        .all()
    return jsonify([p.to_dict() for p in proyectos])
