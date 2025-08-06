#!/usr/bin/env python3
"""
Sample data script to populate the question bank with initial questions
"""

from database import db
from datetime import datetime

def populate_sample_data():
    """Populate the database with sample questions"""
    
    # Sample questions for different subjects
    sample_questions = [
        # Mathematics - Algebra
        {
            'question': 'Solve for x: 2x + 5 = 13',
            'subject': 'Mathematics',
            'topic': 'Algebra',
            'difficulty': 'easy',
            'type': 'mcq',
            'options': {
                'a': 'x = 3',
                'b': 'x = 4',
                'c': 'x = 5',
                'd': 'x = 6'
            },
            'correct_answer': 'b',
            'explanation': '2x + 5 = 13, so 2x = 8, therefore x = 4',
            'marks': 2,
            'language': 'en',
            'source': 'manual'
        },
        {
            'question': 'What is the quadratic formula?',
            'subject': 'Mathematics',
            'topic': 'Algebra',
            'difficulty': 'medium',
            'type': 'short_answer',
            'sample_answer': 'x = (-b ± √(b² - 4ac)) / 2a',
            'key_points': 'Formula includes discriminant, plus/minus sign, division by 2a',
            'marks': 3,
            'language': 'en',
            'source': 'manual'
        },
        
        # Physics - Mechanics
        {
            'question': 'What is Newton\'s first law of motion?',
            'subject': 'Physics',
            'topic': 'Mechanics',
            'difficulty': 'easy',
            'type': 'mcq',
            'options': {
                'a': 'F = ma',
                'b': 'An object at rest stays at rest unless acted upon by a force',
                'c': 'For every action there is an equal and opposite reaction',
                'd': 'Energy cannot be created or destroyed'
            },
            'correct_answer': 'b',
            'explanation': 'Newton\'s first law states that an object at rest stays at rest and an object in motion stays in motion unless acted upon by an external force.',
            'marks': 2,
            'language': 'en',
            'source': 'manual'
        },
        {
            'question': 'Explain the concept of momentum and derive its conservation law.',
            'subject': 'Physics',
            'topic': 'Mechanics',
            'difficulty': 'hard',
            'type': 'descriptive',
            'sample_answer': 'Momentum is the product of mass and velocity (p = mv). Conservation of momentum states that in a closed system, total momentum before collision equals total momentum after collision.',
            'key_points': 'Definition of momentum, conservation principle, mathematical derivation, examples',
            'marks': 10,
            'language': 'en',
            'source': 'manual'
        },
        
        # Chemistry - Organic Chemistry
        {
            'question': 'Which functional group is present in alcohols?',
            'subject': 'Chemistry',
            'topic': 'Organic Chemistry',
            'difficulty': 'easy',
            'type': 'mcq',
            'options': {
                'a': '-COOH',
                'b': '-OH',
                'c': '-CHO',
                'd': '-NH2'
            },
            'correct_answer': 'b',
            'explanation': 'Alcohols contain the hydroxyl functional group (-OH)',
            'marks': 1,
            'language': 'en',
            'source': 'manual'
        },
        
        # Biology - Cell Biology
        {
            'question': 'What is the function of mitochondria in a cell?',
            'subject': 'Biology',
            'topic': 'Cell Biology',
            'difficulty': 'medium',
            'type': 'short_answer',
            'sample_answer': 'Mitochondria are the powerhouses of the cell, responsible for producing ATP through cellular respiration.',
            'key_points': 'ATP production, cellular respiration, powerhouse of cell, energy metabolism',
            'marks': 3,
            'language': 'en',
            'source': 'manual'
        },
        
        # Computer Science - Programming
        {
            'question': 'What is the time complexity of binary search?',
            'subject': 'Computer Science',
            'topic': 'Algorithms',
            'difficulty': 'medium',
            'type': 'mcq',
            'options': {
                'a': 'O(n)',
                'b': 'O(log n)',
                'c': 'O(n²)',
                'd': 'O(1)'
            },
            'correct_answer': 'b',
            'explanation': 'Binary search has O(log n) time complexity because it eliminates half of the search space in each iteration.',
            'marks': 2,
            'language': 'en',
            'source': 'manual'
        },
        {
            'question': 'Explain the difference between stack and queue data structures.',
            'subject': 'Computer Science',
            'topic': 'Data Structures',
            'difficulty': 'medium',
            'type': 'descriptive',
            'sample_answer': 'Stack follows LIFO (Last In First Out) principle with push/pop operations, while Queue follows FIFO (First In First Out) principle with enqueue/dequeue operations.',
            'key_points': 'LIFO vs FIFO, operations, use cases, implementation',
            'marks': 5,
            'language': 'en',
            'source': 'manual'
        },
        
        # History - World History
        {
            'question': 'When did World War II end?',
            'subject': 'History',
            'topic': 'World War II',
            'difficulty': 'easy',
            'type': 'mcq',
            'options': {
                'a': '1944',
                'b': '1945',
                'c': '1946',
                'd': '1947'
            },
            'correct_answer': 'b',
            'explanation': 'World War II ended in 1945 with the surrender of Japan in September.',
            'marks': 1,
            'language': 'en',
            'source': 'manual'
        },
        
        # English - Literature
        {
            'question': 'Who wrote "Romeo and Juliet"?',
            'subject': 'English',
            'topic': 'Literature',
            'difficulty': 'easy',
            'type': 'mcq',
            'options': {
                'a': 'Charles Dickens',
                'b': 'William Shakespeare',
                'c': 'Jane Austen',
                'd': 'Mark Twain'
            },
            'correct_answer': 'b',
            'explanation': 'Romeo and Juliet was written by William Shakespeare.',
            'marks': 1,
            'language': 'en',
            'source': 'manual'
        },
        {
            'question': 'Analyze the theme of love in Shakespeare\'s sonnets.',
            'subject': 'English',
            'topic': 'Literature',
            'difficulty': 'hard',
            'type': 'descriptive',
            'sample_answer': 'Shakespeare explores various aspects of love including romantic love, platonic love, and self-love through metaphors, imagery, and poetic devices.',
            'key_points': 'Types of love, literary devices, specific examples from sonnets, analysis of language',
            'marks': 8,
            'language': 'en',
            'source': 'manual'
        }
    ]
    
    # Add questions to database
    added_count = 0
    for question in sample_questions:
        try:
            question_id = db.add_question_to_bank(question)
            if question_id:
                added_count += 1
                print(f"Added question: {question['question'][:50]}...")
        except Exception as e:
            print(f"Error adding question: {e}")
    
    print(f"\nSuccessfully added {added_count} sample questions to the question bank.")

def create_sample_users():
    """Create sample users for testing"""
    
    sample_users = [
        {
            'username': 'teacher1',
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
        }
    ]
    
    added_count = 0
    for user in sample_users:
        try:
            # Check if user already exists
            existing_user = db.users.find_one({'email': user['email']})
            if not existing_user:
                user_id = db.create_user(
                    username=user['username'],
                    email=user['email'],
                    password=user['password'],
                    role=user['role'],
                    full_name=user['full_name']
                )
                if user_id:
                    added_count += 1
                    print(f"Created user: {user['username']} ({user['role']})")
            else:
                print(f"User {user['username']} already exists")
        except Exception as e:
            print(f"Error creating user {user['username']}: {e}")
    
    print(f"\nSuccessfully created {added_count} sample users.")

if __name__ == '__main__':
    print("Populating sample data...")
    
    # Create sample users
    create_sample_users()
    
    # Populate question bank
    populate_sample_data()
    
    print("\nSample data population completed!")
    print("\nSample login credentials:")
    print("Teacher - Email: teacher@example.com, Password: password123")
    print("Student - Email: student@example.com, Password: password123")
