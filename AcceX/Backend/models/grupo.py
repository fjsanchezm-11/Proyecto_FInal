from models.database import db

class Grupo(db.Model):
    __tablename__ = 'grupos'
    gid_number = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(255), nullable=True)
    
    def to_dict(self):
        return {
            'gid_number': self.gid_number,
            'nombre': self.nombre
        }