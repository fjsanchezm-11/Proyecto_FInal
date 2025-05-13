from flask import Blueprint, request, jsonify
from models.investigador import Investigador
from models.database import db, investigadores_publicaciones, investigadores_usuarios, usuarios_grupos
from models.publicacion import Publicacion
from models.grupo import Grupo
from models.usuario import Usuario

investigadores_bp = Blueprint('investigadores', __name__)

@investigadores_bp.route('/investigadores', methods=['GET'])
def obtener_investigadores():
    investigadores = Investigador.query.all()
    resultado = []

    for investigador in investigadores:
        relacion = db.session.execute(
            investigadores_usuarios.select().where(investigadores_usuarios.c.investigador_id == investigador.iid_number)
        ).first()

        nombre_usuario = None
        if relacion:
            usuario = Usuario.query.get(relacion.usuario_id)
            if usuario:
                nombre_usuario = usuario.nombre_usuario

        datos_investigador = investigador.to_dict() 
        datos_investigador['nombre_usuario'] = nombre_usuario
        resultado.append(datos_investigador)

    return jsonify(resultado)

@investigadores_bp.route('/investigadores', methods=['POST'])
def crear_investigador():
    data = request.json
    try:
        nuevo_investigador = Investigador(
            nombre_investigador=data.get('nombre_investigador'),
            correo=data.get('correo')
        )
        db.session.add(nuevo_investigador)

        crear_usuario = data.get('crear_usuario', False)
        if crear_usuario:
            gid_number = data.get('gid_number')
            grupo = Grupo.query.get(gid_number)
            if not grupo:
                return jsonify({'error': f'El grupo con gid_number {gid_number} no existe'}), 400

            nuevo_usuario = Usuario(
                gid_number=gid_number,
                nombre_usuario=data.get('nombre_usuario'),
                fecha_alta=data.get('fecha_alta'),
                fecha_baja=data.get('fecha_baja'),
                activo=data.get('activo', True),
                contacto=data.get('correo'), 
                telefono=data.get('telefono'),
                orcid=data.get('orcid'),
                scholar=data.get('scholar'),
                wos=data.get('wos'),
                scopus=data.get('scopus'),
                res=data.get('res')
            )
            db.session.add(nuevo_usuario)

            db.session.flush()

            db.session.execute(investigadores_usuarios.insert().values(
                usuario_id=nuevo_usuario.uid_number,
                investigador_id=nuevo_investigador.iid_number
            ))

            db.session.execute(usuarios_grupos.insert().values(
                usuario_id=nuevo_usuario.uid_number,
                grupo_id=gid_number
            ))
        else:
            db.session.flush()

        db.session.commit()
        return jsonify({'mensaje': 'Investigador (y usuario si corresponde) creado correctamente'}), 201

    except Exception as e:
        db.session.rollback()
        print("❌ Error al crear investigador y usuario:", str(e))
        return jsonify({'error': 'Error al crear investigador', 'detalle': str(e)}), 500

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

    relacion = db.session.execute(
        investigadores_usuarios.select().where(investigadores_usuarios.c.investigador_id == id)
    ).first()

    if relacion:
        db.session.execute(
            investigadores_usuarios.delete().where(investigadores_usuarios.c.investigador_id == id)
        )

        usuario = Usuario.query.get(relacion.usuario_id)
        if usuario:
            db.session.delete(usuario)

    db.session.delete(investigador)
    db.session.commit()

    return jsonify({'mensaje': 'Investigador y usuario asociados eliminados'}), 200

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
