from flask import Blueprint, render_template, request, jsonify
from models import db, WebUser
from flask_login import login_required
from functools import wraps
from datetime import datetime

web_users_bp = Blueprint('web_users', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@web_users_bp.route('/web_users')
def web_users():
    users = WebUser.query.all()
    return render_template('web_users.html', users=users)

@web_users_bp.route('/web_users/add', methods=['POST'])
@login_required
@admin_required
def add_web_user():
    try:
        data = request.json
        
        # Check if email already exists
        if WebUser.query.filter_by(email=data['email']).first():
            return jsonify({
                'success': False,
                'error': 'El correo electrónico ya está registrado'
            }), 400
            
        new_user = WebUser(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data['phone'],
            address=data['address'],
            active=data.get('active', True)
        )
        new_user.set_password(data['password'])
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Usuario creado exitosamente'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@web_users_bp.route('/web_users/<int:user_id>', methods=['PUT'])
@login_required
@admin_required
def edit_web_user(user_id):
    try:
        user = WebUser.query.get_or_404(user_id)
        data = request.json
        
        # Check if email is being changed and if it's already taken
        if data['email'] != user.email and WebUser.query.filter_by(email=data['email']).first():
            return jsonify({
                'success': False,
                'error': 'El correo electrónico ya está registrado'
            }), 400
            
        user.email = data['email']
        user.first_name = data['first_name']
        user.last_name = data['last_name']
        user.phone = data['phone']
        user.address = data['address']
        user.active = data.get('active', True)
        
        if data.get('password'):
            user.set_password(data['password'])
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Usuario actualizado exitosamente'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@web_users_bp.route('/web_users/<int:user_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_web_user(user_id):
    try:
        user = WebUser.query.get_or_404(user_id)
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Usuario eliminado exitosamente'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
