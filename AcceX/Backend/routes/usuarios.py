from sqlalchemy.orm import joinedload
from flask import Blueprint, request, jsonify
from models.usuario import Usuario
from models.grupo import Grupo
from models.investigador import Investigador
from models.database import db, usuarios_grupos, investigadores_usuarios
from datetime import datetime

usuarios_bp = Blueprint('usuarios', __name__)

@usuarios_bp.route('/usuarios', methods=['GET'])
def obtener_usuarios():
    usuarios = db.session.query(Usuario).options(
        joinedload(Usuario.investigadores),
        joinedload(Usuario.grupo)
    ).all()

    resultado = []
    for u in usuarios:
        investigador = u.investigadores[0] if u.investigadores else None
        grupos_ids = [rel.grupo_id for rel in db.session.execute(
            usuarios_grupos.select().where(usuarios_grupos.c.usuario_id == u.uid_number)
        ).fetchall()]
        resultado.append({
            'uid_number': u.uid_number,
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
            'res': u.res,
            'nombre_investigador': investigador.nombre_investigador if investigador else None,
            'grupos': grupos_ids
        })
    return jsonify(resultado)

@usuarios_bp.route('/usuarios', methods=['POST'])
def crear_usuario():
    data = request.json
    try:
        nuevo_usuario = Usuario(
            nombre_usuario=data.get("nombre_usuario"),
            contacto=data.get("contacto"),
            activo=data.get("activo", True)
        )
        db.session.add(nuevo_usuario)
        db.session.flush()

        if data.get("nombre_investigador"):
            nuevo_investigador = Investigador(
                nombre_investigador=data.get("nombre_investigador"),
                correo=data.get("contacto")
            )
            db.session.add(nuevo_investigador)
            db.session.flush()
            db.session.execute(
                investigadores_usuarios.insert().values(
                    usuario_id=nuevo_usuario.uid_number,
                    investigador_id=nuevo_investigador.iid_number
                )
            )

        grupos = data.get("grupos", [])
        for gid in grupos:
            grupo = Grupo.query.get(gid)
            if not grupo:
                return jsonify({'error': f'El grupo con gid_number {gid} no existe'}), 400
            db.session.execute(
                usuarios_grupos.insert().values(
                    usuario_id=nuevo_usuario.uid_number,
                    grupo_id=gid
                )
            )

        db.session.commit()
        return jsonify({'mensaje': 'Usuario creado correctamente'}), 201

    except Exception as e:
        db.session.rollback()
        print("❌ Error:", str(e))
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

        nuevos_grupos = data.get('grupos', [])
        db.session.execute(
            usuarios_grupos.delete().where(usuarios_grupos.c.usuario_id == usuario.uid_number)
        )
        for gid in nuevos_grupos:
            grupo = Grupo.query.get(gid)
            if not grupo:
                return jsonify({'error': f'El grupo con gid_number {gid} no existe'}), 400
            db.session.execute(
                usuarios_grupos.insert().values(
                    usuario_id=usuario.uid_number,
                    grupo_id=gid
                )
            )

        db.session.commit()
        return jsonify({'mensaje': 'Usuario actualizado'})

    except Exception as e:
        db.session.rollback()
        print("❌ Error en el servidor:", str(e))
        return jsonify({'error': 'Error interno del servidor', 'detalle': str(e)}), 500

@usuarios_bp.route('/usuarios/<int:id>', methods=['DELETE'])
def eliminar_usuario(id):
    usuario = Usuario.query.get(id)
    if not usuario:
        return jsonify({'mensaje': 'Usuario no encontrado'}), 404

    db.session.execute(
        usuarios_grupos.delete().where(usuarios_grupos.c.usuario_id == id)
    )

    relacion = db.session.execute(
        investigadores_usuarios.select().where(investigadores_usuarios.c.usuario_id == id)
    ).first()
    if relacion:
        db.session.execute(
            investigadores_usuarios.delete().where(investigadores_usuarios.c.usuario_id == id)
        )
        investigador = Investigador.query.get(relacion.investigador_id)
        if investigador:
            db.session.delete(investigador)

    db.session.delete(usuario)
    db.session.commit()
    return jsonify({'mensaje': 'Usuario y relaciones asociadas eliminadas'}), 200

@usuarios_bp.route('/usuarios/<int:uid>/grupos', methods=['GET'])
def obtener_grupos_por_usuario(uid):
    usuario = Usuario.query.get(uid)
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    grupos = db.session.query(Grupo).join(usuarios_grupos).filter(usuarios_grupos.c.usuario_id == uid).all()
    return jsonify([
        {
            'gid_number': g.gid_number,
            'nombre': g.nombre
        } for g in grupos
    ])

@usuarios_bp.route('/usuarios/<int:uid>/grupos', methods=['POST'])
def asociar_grupo_a_usuario(uid):
    data = request.get_json()
    grupo_id = data.get('grupo_id')
    if not grupo_id:
        return jsonify({"error": "Falta grupo_id"}), 400

    usuario = Usuario.query.get(uid)
    grupo = Grupo.query.get(grupo_id)
    if not usuario:
        return jsonify({"error": "Usuario no existe"}), 404
    if not grupo:
        return jsonify({"error": "Grupo no existe"}), 404

    try:
        existe_relacion = db.session.execute(
            usuarios_grupos.select().where(
                usuarios_grupos.c.usuario_id == uid,
                usuarios_grupos.c.grupo_id == grupo_id
            )
        ).first()

        if existe_relacion:
            return jsonify({"mensaje": "El grupo ya está asociado al usuario"}), 200

        db.session.execute(
            usuarios_grupos.insert().values(usuario_id=uid, grupo_id=grupo_id)
        )
        db.session.commit()
        return jsonify({"mensaje": "Grupo asociado al usuario correctamente"}), 200

    except Exception as e:
        db.session.rollback()
        print("❌ Error al asociar grupo:", str(e))
        return jsonify({"error": "Error al asociar grupo", "detalle": str(e)}), 500

@usuarios_bp.route('/usuarios/<int:uid>/grupos/<int:gid>', methods=['DELETE'])
def eliminar_grupo_de_usuario(uid, gid):
    usuario = Usuario.query.get(uid)
    grupo = Grupo.query.get(gid)
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    if not grupo:
        return jsonify({'error': 'Grupo no encontrado'}), 404

    delete_query = usuarios_grupos.delete().where(
        usuarios_grupos.c.usuario_id == uid,
        usuarios_grupos.c.grupo_id == gid
    )
    result = db.session.execute(delete_query)
    db.session.commit()

    if result.rowcount == 0:
        return jsonify({"error": "Relación no encontrada"}), 404

    return jsonify({"mensaje": "Grupo eliminado del usuario correctamente"})
