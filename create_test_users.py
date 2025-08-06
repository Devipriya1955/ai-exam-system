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
    try:
        # Initialize database
        db = Database()
        
        # Test users data
        test_users = [
            {
                #'username': 'teacher1',
                'email': 'teacher@example.com',
                'password': 'password123',
                'role': 'teacher',
                'full_name': 'John Teacher'
            },
            {
                'username': 'student1',
                'email': 'student@example.com',
                'password': 'password123',
                'role': 'student',
                'full_name': 'Jane Student'
            },
            {
                'username': 'admin',
                'email': 'admin@example.com',
                'password': 'admin123',
                'role': 'teacher',
                'full_name': 'Admin User'
            }
        ]
        
        print("Creating test users...")
        
        for user_data in test_users:
            # Check if user already exists
            existing_user = db.users.find_one({'email': user_data['email']})
            if existing_user:
                print(f"User {user_data['email']} already exists, skipping...")
                continue
            
            # Create user
            result = db.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password=user_data['password'],
                role=user_data['role'],
                full_name=user_data['full_name']
            )
            
            if result:
                print(f"✅ Created user: {user_data['email']} ({user_data['role']})")
            else:
                print(f"❌ Failed to create user: {user_data['email']}")
        
        print("\n🎉 Test users creation completed!")
        print("\n📋 Login Credentials:")
        print("Teacher Account:")
        print("  Email: teacher@example.com")
        print("  Password: password123")
        print("\nStudent Account:")
        print("  Email: student@example.com")
        print("  Password: password123")
        print("\nAdmin Account:")
        print("  Email: admin@example.com")
        print("  Password: admin123")
        
    except Exception as e:
        print(f"❌ Error creating test users: {e}")
        return False
    
    return True

if __name__ == '__main__':
    create_test_users()
