from flask import Blueprint, request, jsonify
from models.publicacion import Publicacion
from models.database import db, investigadores_publicaciones
from datetime import datetime
from models.investigador import Investigador

publicaciones_bp = Blueprint('publicaciones', __name__)

@publicaciones_bp.route('/publicaciones', methods=['GET'])
def obtener_publicaciones():
    publicaciones = Publicacion.query.all()
    return jsonify([publicacion.to_dict() for publicacion in publicaciones])

@publicaciones_bp.route('/publicaciones/<int:id>', methods=['GET'])
def obtener_publicacion(id):
    publicacion = Publicacion.query.get(id)
    if not publicacion:
        return jsonify({'mensaje': 'Publicación no encontrada'}), 404
    return jsonify(publicacion.to_dict())

@publicaciones_bp.route('/publicaciones', methods=['POST'])
def crear_publicacion():
    data = request.json
    nueva_publicacion = Publicacion(
        result_description=data.get('result_description'),
        fecha_publicacion=data.get('fecha_publicacion'),
        doi=data.get('doi')
    )
    db.session.add(nueva_publicacion)
    db.session.commit()
    return jsonify({'mensaje': 'Publicación creada'}), 201

def parse_fecha(fecha_str):
    if not fecha_str or fecha_str == '':  
        return None
    try:
        return datetime.strptime(fecha_str, "%Y-%m-%d").date()
    except ValueError:
        return None

@publicaciones_bp.route('/publicaciones/<int:id>', methods=['PUT'])
def actualizar_publicacion(id):
    data = request.json
    publicacion = Publicacion.query.get(id)
    
    if not publicacion:
        return jsonify({'mensaje': 'Publicación no encontrada'}), 404

    publicacion.fecha_publicacion = parse_fecha(data.get('fecha_publicacion', publicacion.fecha_publicacion))
    publicacion.result_description = data.get('result_description', publicacion.result_description)
    publicacion.doi = data.get('doi', publicacion.doi)

    db.session.commit()
    return jsonify({'mensaje': 'Publicación actualizada'})

@publicaciones_bp.route('/publicaciones/<int:id>', methods=['DELETE'])
def eliminar_publicacion(id):
    publicacion = Publicacion.query.get(id)
    if not publicacion:
        return jsonify({'mensaje': 'Publicación no encontrada'}), 404

    db.session.delete(publicacion)
    db.session.commit()
    return jsonify({'mensaje': 'Publicación eliminada'})

@publicaciones_bp.route('/publicaciones/<int:publicacion_id>/investigadores', methods=['GET'])
def obtener_investigadores_por_publicacion(publicacion_id):
    investigadores = db.session.query(Investigador) \
        .join(investigadores_publicaciones, Investigador.iid_number == investigadores_publicaciones.c.investigador_id) \
        .filter(investigadores_publicaciones.c.publicacion_id == publicacion_id) \
        .all()
    return jsonify([i.to_dict() for i in investigadores])

@publicaciones_bp.route('/publicaciones/<int:publicacion_id>/investigadores', methods=['POST'])
def asociar_investigador_a_publicacion(publicacion_id):
    data = request.get_json()
    investigador_id = data.get('investigador_id')
    if not investigador_id:
        return jsonify({"error": "Falta el ID del investigador"}), 400

    publicacion = Publicacion.query.get(publicacion_id)
    investigador = Investigador.query.get(investigador_id)
    if not publicacion:
        return jsonify({"error": "La publicación no existe"}), 404
    if not investigador:
        return jsonify({"error": "El investigador no existe"}), 404

    insert_stmt = investigadores_publicaciones.insert().values(
        publicacion_id=publicacion_id,
        investigador_id=investigador_id
    )
    db.session.execute(insert_stmt)
    db.session.commit()
    return jsonify({"mensaje": "Investigador asociado a la publicación correctamente"})

@publicaciones_bp.route('/publicaciones/<int:publicacion_id>/investigadores/<int:investigador_id>', methods=['DELETE'])
def eliminar_investigador_de_publicacion(publicacion_id, investigador_id):
    delete_query = investigadores_publicaciones.delete().where(
        investigadores_publicaciones.c.publicacion_id == publicacion_id,
        investigadores_publicaciones.c.investigador_id == investigador_id
    )
    result = db.session.execute(delete_query)
    db.session.commit()
    if result.rowcount == 0:
        return jsonify({"error": "Relación no encontrada"}), 404
    return jsonify({"mensaje": "Investigador eliminado de la publicación correctamente"})