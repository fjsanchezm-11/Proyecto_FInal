import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:root@127.0.0.1:3306/practica'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'clave-secreta-para-desarrollo'
    
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'clave-jwt-secreta'
    JWT_ACCESS_TOKEN_EXPIRES = 3600 
    JWT_REFRESH_TOKEN_EXPIRES = 2592000