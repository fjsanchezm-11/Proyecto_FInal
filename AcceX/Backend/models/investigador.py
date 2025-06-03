from models.database import db, investigadores_publicaciones, investigadores_usuarios

class Investigador(db.Model):
    __tablename__ = 'investigadores'
    
    iid_number = db.Column(db.Integer, primary_key=True)
    nombre_investigador = db.Column(db.String(255), nullable=False)
    correo = db.Column(db.String(255), nullable=True)

    publicaciones = db.relationship('Publicacion', secondary=investigadores_publicaciones, backref='investigadores')

    usuarios = db.relationship(
        'Usuario', 
        secondary=investigadores_usuarios,
        backref='investigadores',
        lazy='joined'
    )

    def to_dict(self):
        return {
            "iid_number": self.iid_number,
            "nombre_investigador": self.nombre_investigador,
            "correo": self.correo,
            "publicaciones": [p.result_code for p in self.publicaciones]
        }
