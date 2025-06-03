from models.database import db, investigadores_usuarios, usuarios_grupos, usuarios_proyectos
from sqlalchemy.orm import relationship

class Usuario(db.Model):
    __tablename__ = "usuarios"

    uid_number = db.Column(db.Integer, primary_key=True)
    gid_number = db.Column(db.Integer, db.ForeignKey("grupos.gid_number", ondelete="RESTRICT"), nullable=False)
    nombre_usuario = db.Column(db.String(255), nullable=False, unique=True)
    fecha_alta = db.Column(db.Date)
    fecha_baja = db.Column(db.Date, nullable=True)
    activo = db.Column(db.Boolean, default=True)
    contacto = db.Column(db.String(255), nullable=True)
    telefono = db.Column(db.String(255), nullable=True)
    orcid = db.Column(db.String(255), nullable=True)
    scholar = db.Column(db.String(255), nullable=True)
    wos = db.Column(db.String(255), nullable=True)
    scopus = db.Column(db.String(255), nullable=True)
    res = db.Column(db.String(255), nullable=True)

    grupo = relationship("Grupo", backref="usuarios")

    investigadores = relationship(
        "Investigador",
        secondary=investigadores_usuarios,
        backref="usuarios"
    )

    grupos = relationship(
        "Grupo",
        secondary=usuarios_grupos,
        backref="miembros"
    )

    proyectos = relationship(
        "Proyecto",
        secondary=usuarios_proyectos,
        backref="usuarios"
    )

    def to_dict(self):
        return {
            "uid_number": self.uid_number,
            "gid_number": self.gid_number,
            "nombre_usuario": self.nombre_usuario,
            "fecha_alta": self.fecha_alta.isoformat() if self.fecha_alta else None,
            "fecha_baja": self.fecha_baja.isoformat() if self.fecha_baja else None,
            "activo": self.activo,
            "contacto": self.contacto,
            "telefono": self.telefono,
            "orcid": self.orcid,
            "scholar": self.scholar,
            "wos": self.wos,
            "scopus": self.scopus,
            "res": self.res
        }
