# models/user.py
from extensions import db  # Import db from extensions.py

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    hashPass = db.Column(db.String(120), unique=False, nullable=False)

    def __repr__(self):
        return f"<User {self.username}>"
