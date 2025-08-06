import os
from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId
import bcrypt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Database:
    def __init__(self):
        self.client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
        self.db = self.client.ai_exam_system

        # Collections
        self.users = self.db.users
        self.questions = self.db.questions
        self.exams = self.db.exams
        self.responses = self.db.responses
        self.question_bank = self.db.question_bank

        # Create indexes for better performance
        self._create_indexes()

    def _create_indexes(self):
        """Create database indexes for better performance"""
        # User indexes
        self.users.create_index("email", unique=True)
        self.users.create_index("username", unique=True)

        # Question indexes
        self.questions.create_index([("subject", 1), ("topic", 1), ("difficulty", 1)])
        self.question_bank.create_index([("subject", 1), ("topic", 1), ("difficulty", 1)])

        # Exam indexes
        self.exams.create_index("created_by")
        self.exams.create_index("created_at")

        # Response indexes
        self.responses.create_index([("exam_id", 1), ("student_id", 1)])

    # User Management Methods
    def create_user(self, username, email, password, role='student', full_name=''):
        """Create a new user"""
        try:
            # Hash password
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

            user_data = {
                'username': username,
                'email': email,
                'password': hashed_password,
                'role': role,  # 'teacher' or 'student'
                'full_name': full_name,
                'created_at': datetime.utcnow(),
                'is_active': True
            }

            result = self.users.insert_one(user_data)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error creating user: {e}")
            return None

    def authenticate_user(self, email, password):
        """Authenticate user login"""
        try:
            user = self.users.find_one({'email': email, 'is_active': True})
            if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
                # Remove password from returned user data
                user.pop('password', None)
                user['_id'] = str(user['_id'])
                return user
            return None
        except Exception as e:
            print(f"Error authenticating user: {e}")
            return None

    def get_user_by_id(self, user_id):
        """Get user by ID"""
        try:
            user = self.users.find_one({'_id': ObjectId(user_id)})
            if user:
                user.pop('password', None)
                user['_id'] = str(user['_id'])
            return user
        except Exception as e:
            print(f"Error getting user: {e}")
            return None

    # Question Bank Methods
    def add_question_to_bank(self, question_data):
        """Add question to question bank"""
        try:
            question_data['created_at'] = datetime.utcnow()
            result = self.question_bank.insert_one(question_data)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error adding question to bank: {e}")
            return None

    def get_questions_from_bank(self, subject=None, topic=None, difficulty=None, question_type=None, limit=None):
        """Get questions from question bank with filters"""
        try:
            query = {}
            if subject:
                query['subject'] = subject
            if topic:
                query['topic'] = topic
            if difficulty:
                query['difficulty'] = difficulty
            if question_type:
                query['type'] = question_type

            cursor = self.question_bank.find(query)
            if limit:
                cursor = cursor.limit(limit)

            questions = []
            for q in cursor:
                q['_id'] = str(q['_id'])
                questions.append(q)
            return questions
        except Exception as e:
            print(f"Error getting questions from bank: {e}")
            return []

    # Exam Management Methods
    def create_exam(self, exam_data):
        """Create a new exam"""
        try:
            exam_data['created_at'] = datetime.utcnow()
            exam_data['is_active'] = True
            result = self.exams.insert_one(exam_data)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error creating exam: {e}")
            return None

    def get_exam_by_id(self, exam_id):
        """Get exam by ID"""
        try:
            exam = self.exams.find_one({'_id': ObjectId(exam_id)})
            if exam:
                exam['_id'] = str(exam['_id'])
            return exam
        except Exception as e:
            print(f"Error getting exam: {e}")
            return None

    def get_exams_by_teacher(self, teacher_id):
        """Get all exams created by a teacher"""
        try:
            exams = []
            for exam in self.exams.find({'created_by': teacher_id}):
                exam['_id'] = str(exam['_id'])
                exams.append(exam)
            return exams
        except Exception as e:
            print(f"Error getting teacher exams: {e}")
            return []

    def get_available_exams(self):
        """Get all available exams for students"""
        try:
            exams = []
            for exam in self.exams.find({'is_active': True}):
                exam['_id'] = str(exam['_id'])
                exams.append(exam)
            return exams
        except Exception as e:
            print(f"Error getting available exams: {e}")
            return []

    # Response Management Methods
    def save_response(self, response_data):
        """Save student response"""
        try:
            response_data['submitted_at'] = datetime.utcnow()
            result = self.responses.insert_one(response_data)
            return str(result.inserted_id)
        except Exception as e:
            print(f"Error saving response: {e}")
            return None

    def get_response(self, exam_id, student_id):
        """Get student response for an exam"""
        try:
            response = self.responses.find_one({
                'exam_id': exam_id,
                'student_id': student_id
            })
            if response:
                response['_id'] = str(response['_id'])
            return response
        except Exception as e:
            print(f"Error getting response: {e}")
            return None

    def get_exam_responses(self, exam_id):
        """Get all responses for an exam"""
        try:
            responses = []
            for response in self.responses.find({'exam_id': exam_id}):
                response['_id'] = str(response['_id'])
                responses.append(response)
            return responses
        except Exception as e:
            print(f"Error getting exam responses: {e}")
            return []

    def update_response_score(self, response_id, score, feedback):
        """Update response with score and feedback"""
        try:
            result = self.responses.update_one(
                {'_id': ObjectId(response_id)},
                {
                    '$set': {
                        'score': score,
                        'feedback': feedback,
                        'evaluated_at': datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating response score: {e}")
            return False

    # Utility Methods
    def get_subjects(self):
        """Get all unique subjects from question bank"""
        try:
            return self.question_bank.distinct('subject')
        except Exception as e:
            print(f"Error getting subjects: {e}")
            return []

    def get_topics_by_subject(self, subject):
        """Get all topics for a subject"""
        try:
            return self.question_bank.distinct('topic', {'subject': subject})
        except Exception as e:
            print(f"Error getting topics: {e}")
            return []

    def close_connection(self):
        """Close database connection"""
        self.client.close()

# Global database instance
db = Database()