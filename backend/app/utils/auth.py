import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g
from app.models.models import User


def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, os.environ.get('SECRET_KEY', 'default-secret-key-change-in-production'), algorithm='HS256')


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        if not token:
            return jsonify({'error': 'Authentication token is required'}), 401
        try:
            payload = jwt.decode(token, os.environ.get('SECRET_KEY', 'default-secret-key-change-in-production'), algorithms=['HS256'])
            g.current_user_id = payload['user_id']
            g.current_user = User.query.get(payload['user_id'])
            if not g.current_user:
                return jsonify({'error': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated
