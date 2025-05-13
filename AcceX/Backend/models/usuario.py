from models.database import db

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
