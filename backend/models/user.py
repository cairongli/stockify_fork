# models/user.py
from extensions import db  # Import db from extensions.py
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash


class Account(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    hashPass = db.Column(db.String(120), unique=False, nullable=False)

    def hash_password(self, password):
        self.hashPass= generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.hashPass, password)
    
    def __repr__(self):
        return f"<User {self.username}>"
