from flask import Blueprint, request, jsonify
from models.investigador import Investigador
from models.database import db, investigadores_publicaciones
from models.publicacion import Publicacion

investigadores_bp = Blueprint('investigadores', __name__)

@investigadores_bp.route('/investigadores', methods=['GET'])
def obtener_investigadores():
    investigadores = Investigador.query.all()
    return jsonify([investigador.to_dict() for investigador in investigadores])

@investigadores_bp.route('/investigadores/<int:id>', methods=['GET'])
def obtener_investigador(id):
    investigador = Investigador.query.get(id)
    if not investigador:
        return jsonify({'mensaje': 'Investigador no encontrado'}), 404
    return jsonify(investigador.to_dict())

@investigadores_bp.route('/investigadores', methods=['POST'])
def crear_investigador():
    data = request.json
    nuevo_investigador = Investigador(
        nombre_investigador=data.get('nombre_investigador'),
        correo=data.get('correo')
    )
    db.session.add(nuevo_investigador)
    db.session.commit()
    return jsonify({'mensaje': 'Investigador creado'}), 201

@investigadores_bp.route('/investigadores/<int:id>', methods=['PUT'])
def actualizar_investigador(id):
    data = request.json
    investigador = Investigador.query.get(id)
    if not investigador:
        return jsonify({'mensaje': 'Investigador no encontrado'}), 404
    
    investigador.nombre_investigador = data.get('nombre_investigador', investigador.nombre_investigador)
    investigador.correo = data.get('correo', investigador.correo)

    db.session.commit()
    return jsonify({'mensaje': 'Investigador actualizado'})

@investigadores_bp.route('/investigadores/<int:id>', methods=['DELETE'])
def eliminar_investigador(id):
    investigador = Investigador.query.get(id)
    if not investigador:
        return jsonify({'mensaje': 'Investigador no encontrado'}), 404
    
    db.session.delete(investigador)
    db.session.commit()
    return jsonify({'mensaje': 'Investigador eliminado'})

@investigadores_bp.route('/investigadores/<int:investigador_id>/publicaciones', methods=['GET'])
def obtener_publicaciones_por_investigador(investigador_id):
    publicaciones = db.session.query(Publicacion) \
        .join(investigadores_publicaciones, Publicacion.result_code == investigadores_publicaciones.c.publicacion_id) \
        .filter(investigadores_publicaciones.c.investigador_id == investigador_id) \
        .all()
    return jsonify([p.to_dict() for p in publicaciones])

@investigadores_bp.route('/investigadores/<int:investigador_id>/publicaciones', methods=['POST'])
def asociar_publicacion_a_investigador(investigador_id):
    data = request.get_json()
    publicacion_id = data.get('publicacion_id')
    if not publicacion_id:
        return jsonify({"error": "Falta el ID de la publicación"}), 400

    investigador = Investigador.query.get(investigador_id)
    publicacion = Publicacion.query.get(publicacion_id)
    if not investigador:
        return jsonify({"error": "El investigador no existe"}), 404
    if not publicacion:
        return jsonify({"error": "La publicación no existe"}), 404

    insert_stmt = investigadores_publicaciones.insert().values(
        investigador_id=investigador_id,
        publicacion_id=publicacion_id
    )
    db.session.execute(insert_stmt)
    db.session.commit()
    return jsonify({"mensaje": "Publicación asociada al investigador correctamente"})

@investigadores_bp.route('/investigadores/<int:investigador_id>/publicaciones/<int:publicacion_id>', methods=['DELETE'])
def eliminar_publicacion_de_investigador(investigador_id, publicacion_id):
    delete_query = investigadores_publicaciones.delete().where(
        investigadores_publicaciones.c.investigador_id == investigador_id,
        investigadores_publicaciones.c.publicacion_id == publicacion_id
    )
    result = db.session.execute(delete_query)
    db.session.commit()
    if result.rowcount == 0:
        return jsonify({"error": "Relación no encontrada"}), 404
    return jsonify({"mensaje": "Publicación eliminada del investigador correctamente"})
