# routes/user_routes.py
from flask import Blueprint, jsonify, request
from extensions import db  
from models.user import Account

user_routes = Blueprint('user_routes', __name__)

@user_routes.route('/users', methods=['GET'])
def get_users():
    users = Account.query.all()
    return jsonify([user.username for user in users])

@user_routes.route('/signup', methods=['POST'])
def add_user():
    data = request.get_json()
    
    # Check if the username already exists
    existing_user = Account.query.filter_by(username=data['username']).first()
    if existing_user:
        return jsonify({"error": "Username already exists"}), 400

    # Create a new user and hash the password
    new_user = Account(username=data['username'])
    new_user.hash_password(data['password'])  # Hash and store password

    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User successfully registered!"}), 201

