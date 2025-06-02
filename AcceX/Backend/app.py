import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models.database import db
from routes.proyectos import proyectos_bp
from routes.usuarios import usuarios_bp
from routes.investigadores import investigadores_bp
from routes.publicaciones import publicaciones_bp
from routes.grupos import grupos_bp

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, supports_credentials=True)

db.init_app(app)

app.register_blueprint(proyectos_bp, url_prefix='/api')
app.register_blueprint(usuarios_bp, url_prefix='/api')
app.register_blueprint(investigadores_bp, url_prefix='/api')
app.register_blueprint(publicaciones_bp, url_prefix='/api')
app.register_blueprint(grupos_bp, url_prefix='/api')

# with app.app_context():
    # db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))