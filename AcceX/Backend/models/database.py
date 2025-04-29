from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

investigadores_publicaciones = db.Table("investigadores_publicaciones",
    db.Column("investigador_id", db.Integer, db.ForeignKey("investigadores.iid_number", ondelete="SET NULL"), primary_key=True),
    db.Column("publicacion_id", db.Integer, db.ForeignKey("publicaciones.result_code", ondelete="RESTRICT"), primary_key=True)
)

investigadores_usuarios = db.Table("Investigadores_Usuarios",
    db.Column("usuario_id", db.Integer, db.ForeignKey("usuarios.uid_number", ondelete="CASCADE"), primary_key=True),
    db.Column("investigador_id", db.Integer, db.ForeignKey("investigadores.iid_number", ondelete="CASCADE"), primary_key=True)
)

usuarios_proyectos = db.Table("usuarios_proyectos",
    db.Column("usuario_id", db.Integer, db.ForeignKey("usuarios.uid_number", ondelete="SET NULL"), primary_key=True),
    db.Column("proyectos_id", db.Integer, db.ForeignKey("proyectos.pid_number", ondelete="RESTRICT"), primary_key=True)
)

usuarios_grupos = db.Table("usuarios_grupos",
    db.Column("usuario_id", db.Integer, db.ForeignKey("usuarios.uid_number", ondelete="CASCADE"), primary_key=True),
    db.Column("grupo_id", db.Integer, db.ForeignKey("grupos.gid_number", ondelete="RESTRICT"), primary_key=True)
)
