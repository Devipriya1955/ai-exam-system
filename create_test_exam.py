#!/usr/bin/env python3
"""
Script to create a test exam with proper structure
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import Database
from datetime import datetime, timedelta

def create_test_exam():
    """Create a test exam with proper question structure"""
    try:
        # Initialize database
        db = Database()
        
        # Get a teacher user ID (we'll use the first teacher we find)
        teacher = db.users.find_one({'role': 'teacher'})
        if not teacher:
            print("❌ No teacher found. Please create a teacher user first.")
            return False
        
        teacher_id = str(teacher['_id'])
        print(f"Using teacher: {teacher['email']}")
        
        # Create test exam data with proper structure
        exam_data = {
            'title': 'Sample Physics Quiz',
            'subject': 'Physics',
            'description': 'A sample physics quiz for testing the exam system',
            'duration': 30,  # 30 minutes
            'total_marks': 20,
            'paper_data': {
                'title': 'Sample Physics Quiz',
                'subject': 'Physics',
                'total_marks': 20,
                'duration': 30,
                'instructions': [
                    'Read all questions carefully',
                    'Answer all questions',
                    'Time limit: 30 minutes'
                ],
                'sections': [
                    {
                        'title': 'Multiple Choice Questions',
                        'instructions': 'Choose the best answer for each question',
                        'questions': [
                            {
                                'id': 1,
                                'type': 'multiple_choice',
                                'question': 'What is the speed of light in vacuum?',
                                'options': [
                                    '3 × 10^8 m/s',
                                    '3 × 10^6 m/s', 
                                    '3 × 10^10 m/s',
                                    '3 × 10^5 m/s'
                                ],
                                'correct_answer': '3 × 10^8 m/s',
                                'marks': 2,
                                'difficulty': 'easy',
                                'explanation': 'The speed of light in vacuum is approximately 3 × 10^8 meters per second.'
                            },
                            {
                                'id': 2,
                                'type': 'multiple_choice',
                                'question': 'Which law states that force equals mass times acceleration?',
                                'options': [
                                    'Newton\'s First Law',
                                    'Newton\'s Second Law',
                                    'Newton\'s Third Law',
                                    'Law of Conservation of Energy'
                                ],
                                'correct_answer': 'Newton\'s Second Law',
                                'marks': 2,
                                'difficulty': 'easy',
                                'explanation': 'Newton\'s Second Law states that F = ma (Force = mass × acceleration).'
                            },
                            {
                                'id': 3,
                                'type': 'multiple_choice',
                                'question': 'What is the unit of electric current?',
                                'options': [
                                    'Volt',
                                    'Ampere',
                                    'Ohm',
                                    'Watt'
                                ],
                                'correct_answer': 'Ampere',
                                'marks': 2,
                                'difficulty': 'easy',
                                'explanation': 'The unit of electric current is Ampere (A).'
                            }
                        ],
                        'marks_per_question': 2
                    },
                    {
                        'title': 'Short Answer Questions',
                        'instructions': 'Provide brief answers to the following questions',
                        'questions': [
                            {
                                'id': 4,
                                'type': 'short_answer',
                                'question': 'Define kinetic energy.',
                                'sample_answer': 'Kinetic energy is the energy possessed by an object due to its motion. It is given by KE = ½mv², where m is mass and v is velocity.',
                                'marks': 3,
                                'difficulty': 'medium',
                                'keywords': ['energy', 'motion', 'velocity', 'mass']
                            },
                            {
                                'id': 5,
                                'type': 'short_answer',
                                'question': 'What is Ohm\'s Law?',
                                'sample_answer': 'Ohm\'s Law states that the current through a conductor is directly proportional to the voltage across it, provided temperature remains constant. V = IR.',
                                'marks': 3,
                                'difficulty': 'medium',
                                'keywords': ['current', 'voltage', 'resistance', 'proportional']
                            }
                        ],
                        'marks_per_question': 3
                    },
                    {
                        'title': 'Descriptive Questions',
                        'instructions': 'Provide detailed explanations',
                        'questions': [
                            {
                                'id': 6,
                                'type': 'descriptive',
                                'question': 'Explain the concept of electromagnetic induction and its applications.',
                                'sample_answer': 'Electromagnetic induction is the process of generating an electric current in a conductor by changing the magnetic field around it. This principle is used in generators, transformers, and induction motors.',
                                'marks': 8,
                                'difficulty': 'hard',
                                'keywords': ['electromagnetic', 'induction', 'magnetic field', 'current', 'applications']
                            }
                        ],
                        'marks_per_question': 8
                    }
                ],
                'created_at': datetime.utcnow(),
                'language': 'en'
            },
            'created_by': teacher_id,
            'is_active': True,
            'start_time': None,
            'end_time': None
        }
        
        # Create the exam
        exam_id = db.create_exam(exam_data)
        
        if exam_id:
            print(f"✅ Created test exam successfully!")
            print(f"📋 Exam Details:")
            print(f"   ID: {exam_id}")
            print(f"   Title: {exam_data['title']}")
            print(f"   Subject: {exam_data['subject']}")
            print(f"   Duration: {exam_data['duration']} minutes")
            print(f"   Total Questions: {sum(len(section['questions']) for section in exam_data['paper_data']['sections'])}")
            print(f"   Total Marks: {exam_data['total_marks']}")
            return True
        else:
            print("❌ Failed to create test exam")
            return False
            
    except Exception as e:
        print(f"❌ Error creating test exam: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    create_test_exam()
