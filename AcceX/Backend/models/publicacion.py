from models.database import db

class Publicacion(db.Model):
    __tablename__ = "publicaciones"

    result_code = db.Column(db.Integer, primary_key=True, autoincrement=True)
    result_description = db.Column(db.String(500), nullable=False)
    fecha_publicacion = db.Column(db.Date, nullable=False)
    doi = db.Column(db.String(500), nullable=True)

    def to_dict(self):
        return {
            "result_code": self.result_code,
            "result_description": self.result_description,
            "fecha_publicacion": self.fecha_publicacion,
            "doi": self.doi
        }
