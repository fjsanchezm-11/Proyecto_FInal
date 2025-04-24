from flask import Blueprint, request, jsonify
from models.investigador import Investigador
from models.database import db

investigadores_bp = Blueprint('investigadores', __name__)

# Obtener todos los investigadores
@investigadores_bp.route('/investigadores', methods=['GET'])
def obtener_investigadores():
    investigadores = Investigador.query.all()
    return jsonify([investigador.to_dict() for investigador in investigadores])

# Obtener un investigador por ID
@investigadores_bp.route('/investigadores/<int:id>', methods=['GET'])
def obtener_investigador(id):
    investigador = Investigador.query.get(id)
    if not investigador:
        return jsonify({'mensaje': 'Investigador no encontrado'}), 404
    return jsonify(investigador.to_dict())

# Crear un nuevo investigador
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

# Actualizar un investigador existente
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

# Eliminar un investigador
@investigadores_bp.route('/investigadores/<int:id>', methods=['DELETE'])
def eliminar_investigador(id):
    investigador = Investigador.query.get(id)
    if not investigador:
        return jsonify({'mensaje': 'Investigador no encontrado'}), 404
    
    db.session.delete(investigador)
    db.session.commit()
    return jsonify({'mensaje': 'Investigador eliminado'})

