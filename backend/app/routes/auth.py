import re
from flask import Blueprint, request, jsonify, g
from app import db
from app.models.models import User
from app.utils.auth import generate_token, token_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        # Validate required fields
        if not name:
            return jsonify({'error': 'Name is required'}), 400
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        if not password:
            return jsonify({'error': 'Password is required'}), 400

        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return jsonify({'error': 'Invalid email format'}), 400

        # Validate password length
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400

        # Check if email already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 409

        # Create new user
        user = User(name=name, email=email)
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        token = generate_token(user.id)

        return jsonify({
            'token': token,
            'user': user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401

        token = generate_token(user.id)

        return jsonify({
            'token': token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    try:
        return jsonify({'user': g.current_user.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to get user info: {str(e)}'}), 500
