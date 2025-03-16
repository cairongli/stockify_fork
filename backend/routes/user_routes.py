# routes/user_routes.py
from flask import Blueprint, jsonify, request
from extensions import db  
from models.user import User

user_routes = Blueprint('user_routes', __name__)

@user_routes.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.username for user in users])

@user_routes.route('/signup', methods=['POST'])
def add_user():
    data = request.get_json()
    
    existing_user = User.query.filter_by(username=data['username']).first()
    if existing_user:
        return jsonify({"error": "Username already exists"}), 400

    new_user = User(username=data['username'], email=data['email'])
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User added!"}), 201

