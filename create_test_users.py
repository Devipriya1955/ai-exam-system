#!/usr/bin/env python3
"""
Script to create test users for the AI Exam System
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import Database
from werkzeug.security import generate_password_hash

def create_test_users():
    """Create test users for the system"""
    print("This script is now deprecated. Please register users via the web interface.")
    print("If you need to create an admin user manually, uncomment and use the code below.")
    # Example: create an admin user if needed
    # db = Database()
    # admin_email = 'admin@example.com'
    # if not db.users.find_one({'email': admin_email}):
    #     db.create_user(
    #         username='admin',
    #         email=admin_email,
    #         password='admin123',
    #         role='teacher',
    #         full_name='Admin User'
    #     )
    #     print('Admin user created.')
    # else:
    #     print('Admin user already exists.')
    return True

if __name__ == '__main__':
    create_test_users()
