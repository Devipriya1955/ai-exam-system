import os
from functools import wraps
from flask import request, jsonify, current_app
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity, verify_jwt_in_request
from datetime import timedelta
from database import db

class AuthManager:
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize JWT with Flask app"""
        app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
        app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
        
        self.jwt = JWTManager(app)
        
        # JWT error handlers
        @self.jwt.expired_token_loader
        def expired_token_callback(jwt_header, jwt_payload):
            return jsonify({'error': 'Token has expired'}), 401
        
        @self.jwt.invalid_token_loader
        def invalid_token_callback(error):
            return jsonify({'error': 'Invalid token'}), 401
        
        @self.jwt.unauthorized_loader
        def missing_token_callback(error):
            return jsonify({'error': 'Authorization token is required'}), 401
    
    def register_user(self, username, email, password, role='student', full_name=''):
        """Register a new user"""
        try:
            # Check if user already exists
            existing_user = db.users.find_one({'$or': [{'email': email}, {'username': username}]})
            if existing_user:
                return {'error': 'User with this email or username already exists'}, 400
            
            # Create user
            user_id = db.create_user(username, email, password, role, full_name)
            if user_id:
                return {'message': 'User registered successfully', 'user_id': user_id}, 201
            else:
                return {'error': 'Failed to register user'}, 500
        except Exception as e:
            return {'error': str(e)}, 500
    
    def login_user(self, email, password):
        """Login user and return JWT token"""
        try:
            user = db.authenticate_user(email, password)
            if user:
                # Create access token
                access_token = create_access_token(
                    identity=user['_id'],
                    additional_claims={
                        'role': user['role'],
                        'username': user['username'],
                        'email': user['email']
                    }
                )
                
                return {
                    'access_token': access_token,
                    'user': {
                        'id': user['_id'],
                        'username': user['username'],
                        'email': user['email'],
                        'role': user['role'],
                        'full_name': user.get('full_name', '')
                    }
                }, 200
            else:
                return {'error': 'Invalid email or password'}, 401
        except Exception as e:
            return {'error': str(e)}, 500
    
    def get_current_user(self):
        """Get current authenticated user"""
        try:
            user_id = get_jwt_identity()
            user = db.get_user_by_id(user_id)
            return user
        except Exception as e:
            return None

# Role-based access decorators
def role_required(required_role):
    """Decorator to require specific role"""
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            try:
                verify_jwt_in_request()
                user_id = get_jwt_identity()
                user = db.get_user_by_id(user_id)
                
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                
                if user['role'] != required_role:
                    return jsonify({'error': f'Access denied. {required_role.title()} role required'}), 403
                
                return f(*args, **kwargs)
            except Exception as e:
                return jsonify({'error': str(e)}), 500
        return decorated_function
    return decorator

def teacher_required(f):
    """Decorator to require teacher role"""
    return role_required('teacher')(f)

def student_required(f):
    """Decorator to require student role"""
    return role_required('student')(f)

def auth_required(f):
    """Decorator to require any authenticated user"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = db.get_user_by_id(user_id)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return decorated_function

# Global auth manager instance
auth_manager = AuthManager()
