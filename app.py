import os
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import json

# Import our modules
from database import db
from auth import auth_manager, teacher_required, student_required, auth_required
from question_generator import question_generator
from evaluator import evaluator
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')

# Initialize extensions
CORS(app)
auth_manager.init_app(app)

# Static files route
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

# Main route
@app.route('/')
def index():
    return render_template('index.html')

# Authentication Routes
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['username', 'email', 'password', 'role']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        result, status_code = auth_manager.register_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            role=data['role'],
            full_name=data.get('full_name', '')
        )

        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password are required'}), 400

        result, status_code = auth_manager.login_user(data['email'], data['password'])
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/profile', methods=['GET'])
@auth_required
def get_profile():
    try:
        user_id = get_jwt_identity()
        user = db.get_user_by_id(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'user': user}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Question Generation Routes
@app.route('/api/subjects', methods=['GET'])
@auth_required
def get_subjects():
    try:
        # Get subjects from static question bank instead of database
        from static_question_bank import get_subjects
        subjects = get_subjects()
        return jsonify({'subjects': subjects}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/topics/<subject>', methods=['GET'])
@auth_required
def get_topics(subject):
    try:
        # Get topics from static question bank instead of database
        from static_question_bank import get_topics, _normalize_subject_name
        normalized_subject = _normalize_subject_name(subject)
        topics = get_topics(normalized_subject) if normalized_subject else []
        # Format topic names properly
        formatted_topics = [topic.replace('_', ' ').title() for topic in topics]
        return jsonify({'topics': formatted_topics}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-questions', methods=['POST'])
@teacher_required
def generate_questions():
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['subject', 'topic', 'difficulty', 'type', 'count']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        # Generate questions
        questions = question_generator.generate_mixed_questions(
            subject=data['subject'],
            topic=data['topic'],
            difficulty=data['difficulty'],
            question_type=data['type'],
            count=data['count'],
            language=data.get('language', 'en'),
            ai_ratio=data.get('ai_ratio', 0.5)
        )

        return jsonify({'questions': questions}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-quiz-from-title', methods=['POST'])
@teacher_required
def generate_quiz_from_title():
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['quiz_title', 'subject']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        # Generate AI-powered questions based on quiz title
        questions = question_generator.generate_quiz_questions_from_title(
            quiz_title=data['quiz_title'],
            subject=data['subject'],
            difficulty=data.get('difficulty', 'medium'),
            count=data.get('count', 5),
            question_types=data.get('question_types', ['mcq', 'short_answer'])
        )

        return jsonify({
            'questions': questions,
            'quiz_title': data['quiz_title'],
            'total_questions': len(questions),
            'generation_method': 'AI-powered' if questions and questions[0].get('source') == 'ai_generated_quiz' else 'Enhanced Template'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/question-bank/browse', methods=['GET'])
@auth_required
def browse_question_bank():
    try:
        from static_question_bank import get_questions_by_criteria, get_subjects, get_topics, get_question_stats

        # Get query parameters
        subject = request.args.get('subject')
        topic = request.args.get('topic')
        difficulty = request.args.get('difficulty')
        question_type = request.args.get('type')
        tags = request.args.get('tags', '').split(',') if request.args.get('tags') else None
        limit = int(request.args.get('limit', 20))

        # Get questions based on criteria
        questions = get_questions_by_criteria(
            subject=subject,
            topic=topic,
            difficulty=difficulty,
            question_type=question_type,
            tags=tags,
            limit=limit
        )

        return jsonify({
            'questions': questions,
            'total': len(questions),
            'filters': {
                'subject': subject,
                'topic': topic,
                'difficulty': difficulty,
                'type': question_type,
                'tags': tags
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/question-bank/subjects', methods=['GET'])
@auth_required
def get_question_bank_subjects():
    try:
        from static_question_bank import get_subjects
        subjects = get_subjects()
        return jsonify({'subjects': subjects}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/question-bank/topics', methods=['GET'])
@auth_required
def get_question_bank_topics():
    try:
        from static_question_bank import get_topics
        subject = request.args.get('subject')
        if not subject:
            return jsonify({'error': 'Subject parameter is required'}), 400

        topics = get_topics(subject)
        return jsonify({'topics': topics}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/question-bank/stats', methods=['GET'])
@auth_required
def get_question_bank_stats():
    try:
        from static_question_bank import get_question_stats
        stats = get_question_stats()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/questions/bank', methods=['GET'])
@teacher_required
def get_question_bank():
    try:
        subject = request.args.get('subject')
        topic = request.args.get('topic')
        difficulty = request.args.get('difficulty')
        question_type = request.args.get('type')
        limit = request.args.get('limit', type=int)

        questions = db.get_questions_from_bank(
            subject=subject,
            topic=topic,
            difficulty=difficulty,
            question_type=question_type,
            limit=limit
        )

        return jsonify({'questions': questions}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/questions/bank', methods=['POST'])
@teacher_required
def add_question_to_bank():
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['question', 'subject', 'topic', 'difficulty', 'type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        # Add created_by field
        data['created_by'] = get_jwt_identity()

        question_id = db.add_question_to_bank(data)

        if question_id:
            return jsonify({'message': 'Question added successfully', 'question_id': question_id}), 201
        else:
            return jsonify({'error': 'Failed to add question'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Exam Management Routes
@app.route('/api/exams', methods=['POST'])
@teacher_required
def create_exam():
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['title', 'subject', 'sections']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        # Create question paper
        paper = question_generator.create_question_paper(data)

        if not paper:
            return jsonify({'error': 'Failed to create question paper'}), 500

        # Add exam metadata
        exam_data = {
            'title': data['title'],
            'subject': data['subject'],
            'description': data.get('description', ''),
            'duration': data.get('duration', 60),
            'total_marks': paper['total_marks'],
            'paper_data': paper,
            'created_by': get_jwt_identity(),
            'is_active': True,
            'start_time': data.get('start_time'),
            'end_time': data.get('end_time')
        }

        exam_id = db.create_exam(exam_data)

        if exam_id:
            return jsonify({'message': 'Exam created successfully', 'exam_id': exam_id, 'paper': paper}), 201
        else:
            return jsonify({'error': 'Failed to create exam'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/exams', methods=['GET'])
@auth_required
def get_exams():
    try:
        user_id = get_jwt_identity()
        user = db.get_user_by_id(user_id)

        if user['role'] == 'teacher':
            exams = db.get_exams_by_teacher(user_id)
        else:
            exams = db.get_available_exams()

        return jsonify({'exams': exams}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/exams/<exam_id>', methods=['GET'])
@auth_required
def get_exam(exam_id):
    try:
        exam = db.get_exam_by_id(exam_id)

        if not exam:
            return jsonify({'error': 'Exam not found'}), 404

        return jsonify({'exam': exam}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/exams/<exam_id>/responses', methods=['POST'])
@student_required
def submit_exam_response():
    try:
        exam_id = request.view_args['exam_id']
        data = request.get_json()

        if 'responses' not in data:
            return jsonify({'error': 'Responses are required'}), 400

        student_id = get_jwt_identity()

        # Check if student has already submitted
        existing_response = db.get_response(exam_id, student_id)
        if existing_response:
            return jsonify({'error': 'You have already submitted this exam'}), 400

        # Get exam data
        exam = db.get_exam_by_id(exam_id)
        if not exam:
            return jsonify({'error': 'Exam not found'}), 404

        # Evaluate responses
        evaluation = evaluator.evaluate_exam_response(exam['paper_data'], data['responses'])

        # Save response
        response_data = {
            'exam_id': exam_id,
            'student_id': student_id,
            'responses': data['responses'],
            'evaluation': evaluation
        }

        response_id = db.save_response(response_data)

        if response_id:
            return jsonify({
                'message': 'Exam submitted successfully',
                'response_id': response_id,
                'evaluation': evaluation
            }), 201
        else:
            return jsonify({'error': 'Failed to submit exam'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/exams/<exam_id>/submit', methods=['POST'])
@student_required
def submit_exam():
    try:
        exam_id = request.view_args['exam_id']
        data = request.get_json()

        if 'answers' not in data:
            return jsonify({'error': 'Answers are required'}), 400

        student_id = get_jwt_identity()

        # Check if student has already submitted
        existing_response = db.get_response(exam_id, student_id)
        if existing_response:
            return jsonify({'error': 'You have already submitted this exam'}), 400

        # Get exam data
        exam = db.get_exam_by_id(exam_id)
        if not exam:
            return jsonify({'error': 'Exam not found'}), 404

        # Convert answers format to responses format
        responses = {}
        for question_index, answer in data['answers'].items():
            responses[f"question_{question_index}"] = answer

        # Evaluate responses
        evaluation = evaluator.evaluate_exam_response(exam['paper_data'], responses)

        # Calculate additional metrics
        # Get total questions from all sections
        total_questions = 0
        if 'sections' in exam['paper_data']:
            for section in exam['paper_data']['sections']:
                if 'questions' in section:
                    total_questions += len(section['questions'])
        else:
            # Fallback for old structure
            total_questions = len(exam['paper_data'].get('questions', []))

        answered_questions = len([a for a in data['answers'].values() if a])
        correct_answers = evaluation.get('correct_answers', 0)
        total_marks = evaluation.get('total_marks', total_questions)
        score = evaluation.get('score', 0)
        percentage = round((score / total_marks) * 100, 1) if total_marks > 0 else 0

        # Save response with additional data
        response_data = {
            'exam_id': exam_id,
            'student_id': student_id,
            'responses': responses,
            'answers': data['answers'],
            'evaluation': evaluation,
            'time_taken': data.get('time_taken', 0),
            'auto_submitted': data.get('auto_submitted', False),
            'security_events': data.get('security_events', {}),
            'submitted_at': datetime.utcnow()
        }

        response_id = db.save_response(response_data)

        if response_id:
            return jsonify({
                'message': 'Exam submitted successfully',
                'response_id': response_id,
                'score': score,
                'total_marks': total_marks,
                'percentage': percentage,
                'correct_answers': correct_answers,
                'total_questions': total_questions,
                'answered_questions': answered_questions,
                'time_taken': data.get('time_taken', 0),
                'evaluation': evaluation
            }), 201
        else:
            return jsonify({'error': 'Failed to submit exam'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/exams/<exam_id>/responses', methods=['GET'])
@teacher_required
def get_exam_responses(exam_id):
    try:
        responses = db.get_exam_responses(exam_id)

        # Add student information to responses
        for response in responses:
            student = db.get_user_by_id(response['student_id'])
            if student:
                response['student_info'] = {
                    'username': student['username'],
                    'full_name': student.get('full_name', ''),
                    'email': student['email']
                }

        return jsonify({'responses': responses}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/responses/<response_id>', methods=['GET'])
@auth_required
def get_response(response_id):
    try:
        user_id = get_jwt_identity()
        user = db.get_user_by_id(user_id)

        # Get response from database
        response = db.responses.find_one({'_id': db.ObjectId(response_id)})

        if not response:
            return jsonify({'error': 'Response not found'}), 404

        # Check permissions
        if user['role'] == 'student' and response['student_id'] != user_id:
            return jsonify({'error': 'Access denied'}), 403
        elif user['role'] == 'teacher':
            # Teachers can view responses for their exams
            exam = db.get_exam_by_id(response['exam_id'])
            if not exam or exam['created_by'] != user_id:
                return jsonify({'error': 'Access denied'}), 403

        response['_id'] = str(response['_id'])
        return jsonify({'response': response}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Dashboard Routes
@app.route('/api/dashboard/teacher', methods=['GET'])
@teacher_required
def teacher_dashboard():
    try:
        user_id = get_jwt_identity()

        # Get teacher's exams
        exams = db.get_exams_by_teacher(user_id)

        # Get statistics
        total_exams = len(exams)
        total_responses = 0

        for exam in exams:
            responses = db.get_exam_responses(exam['_id'])
            total_responses += len(responses)

        # Get recent activity
        recent_exams = exams[:5]  # Last 5 exams

        dashboard_data = {
            'total_exams': total_exams,
            'total_responses': total_responses,
            'recent_exams': recent_exams,
            'subjects': db.get_subjects()
        }

        return jsonify(dashboard_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/student', methods=['GET'])
@student_required
def student_dashboard():
    try:
        user_id = get_jwt_identity()

        # Get available exams
        available_exams = db.get_available_exams()

        # Get student's completed exams
        completed_responses = []
        for exam in available_exams:
            response = db.get_response(exam['_id'], user_id)
            if response:
                response['exam_title'] = exam['title']
                completed_responses.append(response)

        # Calculate average score
        total_score = 0
        total_max_score = 0
        for response in completed_responses:
            if 'evaluation' in response:
                total_score += response['evaluation'].get('total_score', 0)
                total_max_score += response['evaluation'].get('max_score', 0)

        average_percentage = (total_score / total_max_score * 100) if total_max_score > 0 else 0

        # Mock data for new features (in a real app, this would come from the database)
        import random
        from datetime import datetime, timedelta

        # Generate mock progress data
        progress_data = []
        for i in range(5):
            progress_data.append({
                'exam': f'Exam {i+1}',
                'score': random.randint(60, 95),
                'date': (datetime.now() - timedelta(days=i*7)).isoformat()
            })

        # Generate mock upcoming exams
        upcoming_exams = [
            {
                'id': 'upcoming_1',
                'title': 'Advanced Chemistry Quiz',
                'subject': 'Chemistry',
                'duration': 45,
                'scheduled_date': (datetime.now() + timedelta(days=3)).isoformat()
            },
            {
                'id': 'upcoming_2',
                'title': 'Physics Midterm',
                'subject': 'Physics',
                'duration': 90,
                'scheduled_date': (datetime.now() + timedelta(days=7)).isoformat()
            }
        ]

        # Mock achievements based on student performance
        achievements = []
        if len(completed_responses) > 0:
            achievements.append('first_exam')
        if average_percentage >= 90:
            achievements.append('perfect_score')
        if len(completed_responses) >= 3:
            achievements.append('consistent')
        if random.choice([True, False]):
            achievements.append('improvement')

        dashboard_data = {
            'available_exams': len(available_exams),
            'completed_exams': len(completed_responses),
            'average_score': round(average_percentage, 1),
            'recent_results': completed_responses[:5],
            'available_exams_list': available_exams[:10],
            # New enhanced features
            'progress_data': progress_data,
            'total_study_time': random.randint(120, 480),  # Mock study time in minutes
            'streak_days': random.randint(0, 15),  # Mock study streak
            'improvement_rate': random.randint(5, 25),  # Mock improvement percentage
            'upcoming_exams': upcoming_exams,
            'achievements': achievements
        }

        return jsonify(dashboard_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Utility Routes
@app.route('/api/translate', methods=['POST'])
@auth_required
def translate_text():
    try:
        data = request.get_json()

        if 'text' not in data or 'target_language' not in data:
            return jsonify({'error': 'Text and target_language are required'}), 400

        # Translation temporarily disabled due to compatibility issues
        return jsonify({
            'original_text': data['text'],
            'translated_text': data['text'],  # Return original text for now
            'source_language': 'en',
            'target_language': data['target_language'],
            'note': 'Translation feature temporarily disabled'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/languages', methods=['GET'])
def get_supported_languages():
    return jsonify({
        'languages': {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'hi': 'Hindi',
            'ar': 'Arabic'
        }
    }), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()}), 200

# Test endpoint to list users (for debugging)
@app.route('/api/test/users', methods=['GET'])
def test_list_users():
    try:
        users = []
        for user in db.users.find({}, {'password': 0}):  # Exclude password
            user['_id'] = str(user['_id'])
            users.append(user)
        return jsonify({'users': users}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Create templates directory if it doesn't exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static', exist_ok=True)

    app.run(debug=True, host='0.0.0.0', port=5000)