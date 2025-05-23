import os
import re
from flask import Blueprint, request, jsonify
from models.proyecto import Proyecto
from models.database import db, usuarios_proyectos
from models.usuario import Usuario

proyectos_bp = Blueprint('proyectos', __name__)

@proyectos_bp.route('/proyectos', methods=['GET'])
def obtener_proyectos():
    proyectos = Proyecto.query.all()
    return jsonify([p.to_dict() for p in proyectos])

@proyectos_bp.route('/proyectos/<int:id>', methods=['GET'])
def obtener_proyecto(id):
    proyecto = Proyecto.query.get(id)
    if not proyecto:
        return jsonify({'mensaje': 'Proyecto no encontrado'}), 404
    return jsonify(proyecto.to_dict())


@proyectos_bp.route('/proyectos', methods=['POST'])
def crear_proyecto():
    
    if request.content_type.startswith('multipart/form-data'):
        data= request.form
        pdf_file = request.files.get('pdf')
    else:
         return jsonify({'error': 'Debe usar FormData para enviar el proyecto con PDF'}), 400
        
    
    
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
    
    pdf_url = None
    if pdf_file and pdf_file.filename.lower().endswith('.pdf'):
        UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        filename= pdf_file.filename
        pdf_path = os.path.join(UPLOAD_FOLDER, filename)
        pdf_file.save(pdf_path)
        pdf_url = f'/uploads/{filename}'
        nuevo_proyecto.pdf_url = pdf_url
        db.session.commit()
    
    respuesta = nuevo_proyecto.to_dict()
    if pdf_url:
        respuesta['pdf_url'] = pdf_url
        
    return jsonify({'mensaje': 'Proyecto creado', 'proyecto': nuevo_proyecto.to_dict()}), 201

@proyectos_bp.route('/proyectos/<int:id>', methods=['PUT'])
def actualizar_proyecto(id):
    if request.content_type.startswith('multipart/form-data'):
        data = request.form
        pdf_file = request.files.get('pdf')
    else:
        data = request.json
        pdf_file = None

    proyecto = Proyecto.query.get(id)
    if not proyecto:
        return jsonify({'mensaje': 'Proyecto no encontrado'}), 404

    pdf_url = None
    
    proyecto.titulo = data.get('titulo', proyecto.titulo)
    fecha_inicio = data.get('fecha_inicio', None)
    if fecha_inicio == '':
        fecha_inicio = None 
    proyecto.fecha_inicio = fecha_inicio
    fecha_fin = data.get('fecha_fin', None)
    if fecha_fin == '':
        fecha_fin = None 
    proyecto.fecha_fin = fecha_fin
    proyecto.email = data.get('email', proyecto.email)
    gid = data.get('gid_number')
    proyecto.gid_number = int(gid) if gid and gid.strip().isdigit() else None
    proyecto.institucion = data.get('institucion', proyecto.institucion)
    proyecto.procedencia = data.get('procedencia', proyecto.procedencia)
    proyecto.categoria = data.get('categoria', proyecto.categoria)
    proyecto.pdf_url = pdf_url
    
    
    if pdf_file and pdf_file.filename.lower().endswith('.pdf'):
        UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        filename = pdf_file.filename
        pdf_path = os.path.join(UPLOAD_FOLDER, filename)
        pdf_file.save(pdf_path)
        pdf_url = f'/uploads/{filename}'
    
        
        proyecto.pdf_url = pdf_url
    db.session.commit()

    respuesta = proyecto.to_dict()
    if pdf_url: 
        respuesta['pdf_url'] = pdf_url
    return jsonify({'mensaje': 'Proyecto actualizado', 'proyecto': respuesta}), 200

@proyectos_bp.route('/proyectos/<int:id>', methods=['DELETE'])
def eliminar_proyecto(id):
    proyecto = Proyecto.query.get(id)
    if not proyecto:
        return jsonify({'mensaje': 'Proyecto no encontrado'}), 404

    db.session.execute(usuarios_proyectos.delete().where(usuarios_proyectos.c.proyectos_id == id))

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

    try:
        insert_stmt = usuarios_proyectos.insert().values(usuario_id=usuario_id, proyectos_id=pid)
        db.session.execute(insert_stmt)
        db.session.commit()
        return jsonify({"mensaje": "Usuario asociado al proyecto correctamente"}), 200 
    except Exception as e:
        db.session.rollback()
        print("❌ Error al asociar usuario:", str(e))
        return jsonify({"error": "Error al asociar usuario", "detalle": str(e)}), 500

@proyectos_bp.route('/proyectos/<int:pid>/usuarios/<int:uid>', methods=['DELETE'])
def eliminar_usuario_de_proyecto(pid, uid):
    delete_query = usuarios_proyectos.delete().where(
        usuarios_proyectos.c.usuario_id == uid,
        usuarios_proyectos.c.proyectos_id == pid
    )
    result = db.session.execute(delete_query)
    db.session.commit()
    if result.rowcount == 0:
        return jsonify({"error": "Relación no encontrada"}), 404
    return jsonify({"mensaje": "Usuario eliminado del proyecto correctamente"})

@proyectos_bp.route('/usuarios/<int:usuario_id>/proyectos', methods=['GET'])
def obtener_proyectos_por_usuario(usuario_id):
    proyectos = db.session.query(Proyecto) \
        .join(usuarios_proyectos, Proyecto.pid_number == usuarios_proyectos.c.proyectos_id) \
        .filter(usuarios_proyectos.c.usuario_id == usuario_id) \
        .all()
    return jsonify([p.to_dict() for p in proyectos])

@proyectos_bp.route('/uploads/<filename>', methods=['GET'])
def obtener_pdf(filename):
    import os
    from flask import send_from_directory
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
    return send_from_directory(UPLOAD_FOLDER, filename)

@proyectos_bp.route('/proyectos/<int:pid>/delete-pdf', methods=['DELETE'])
def eliminar_pdf(pid):
    proyecto = Proyecto.query.get_or_404(pid)
    filename = f"{proyecto.titulo}.pdf"
    uploads_dir = os.path.join(os.getcwd(), 'uploads')
    pdf_path = os.path.join(uploads_dir, filename)

    try:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
            return jsonify({"mensaje": "PDF eliminado correctamente"}), 200
        else:
            return jsonify({"error": "El archivo no existe"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
