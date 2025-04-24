from models.database import db

class Proyecto(db.Model):
    __tablename__ = "proyectos"

    pid_number = db.Column(db.Integer, primary_key=True, autoincrement=True)
    titulo = db.Column(db.String(255), nullable=False)
    fecha_inicio = db.Column(db.Date)
    fecha_fin = db.Column(db.Date, nullable=True)
    email = db.Column(db.String(255), nullable=True)
    gid_number = db.Column(db.Integer, db.ForeignKey("grupos.gid_number", ondelete="RESTRICT"), nullable=False)
    institucion = db.Column(db.String(255))
    procedencia = db.Column(db.String(255))
    categoria = db.Column(db.String(255), nullable=False)

    grupo = db.relationship("Grupo", backref="proyectos")

    def to_dict(self):
        return {
            "pid_number": self.pid_number,
            "titulo": self.titulo,
            "fecha_inicio": self.fecha_inicio.isoformat() if self.fecha_inicio else None,
            "fecha_fin": self.fecha_fin.isoformat() if self.fecha_fin else None,
            "email": self.email,
            "gid_number": self.gid_number,
            "institucion": self.institucion,
            "procedencia": self.procedencia,
            "categoria": self.categoria
        }
