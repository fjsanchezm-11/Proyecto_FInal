from flask import Blueprint, request, jsonify
from models.publicacion import Publicacion
from models.database import db
from datetime import datetime
from models.investigador import Investigador

publicaciones_bp = Blueprint('publicaciones', __name__)

# Obtener todas las publicaciones
@publicaciones_bp.route('/publicaciones', methods=['GET'])
def obtener_publicaciones():
    publicaciones = Publicacion.query.all()
    return jsonify([publicacion.to_dict() for publicacion in publicaciones])

# Obtener una publicación por ID
@publicaciones_bp.route('/publicaciones/<int:id>', methods=['GET'])
def obtener_publicacion(id):
    publicacion = Publicacion.query.get(id)
    if not publicacion:
        return jsonify({'mensaje': 'Publicación no encontrada'}), 404
    return jsonify(publicacion.to_dict())

# Crear una nueva publicación
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
    if not fecha_str or fecha_str == '':  # Si la fecha está vacía o no existe
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

    # Parseamos la fecha si se proporciona una válida
    if 'fecha_publicacion' in data:
        publicacion.fecha_publicacion = parse_fecha(data['fecha_publicacion'])
        
    publicacion.result_description = data.get('result_description', publicacion.result_description)
    publicacion.doi = data.get('doi', publicacion.doi)

    db.session.commit()
    return jsonify({'mensaje': 'Publicación actualizada'})
# Eliminar una publicación
@publicaciones_bp.route('/publicaciones/<int:id>', methods=['DELETE'])
def eliminar_publicacion(id):
    publicacion = Publicacion.query.get(id)
    if not publicacion:
        return jsonify({'mensaje': 'Publicación no encontrada'}), 404

    db.session.delete(publicacion)
    db.session.commit()
    return jsonify({'mensaje': 'Publicación eliminada'})

