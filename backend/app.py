from flask import Flask, jsonify
from flask_migrate import Migrate
from flask_cors import CORS
from extensions import db  # Import db from extensions.py

# Initialize the Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'  
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False 

# Initialize database
db.init_app(app) 
migrate = Migrate(app, db)
CORS(app)

# ROUTES

#uesr routes
from routes.user_routes import user_routes
app.register_blueprint(user_routes)


@app.route('/')
def home():
    return jsonify({"message": "working"})

if __name__ == '__main__':
    app.run(debug=True)
