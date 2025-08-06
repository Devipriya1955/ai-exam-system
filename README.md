# AI-Powered Question Generator and Evaluation System

A comprehensive web application that uses AI to generate educational questions, create exams, and automatically evaluate student responses with personalized feedback.

## Features

### Core Functionality
- **AI Question Generation**: Generate questions using OpenAI API based on subject, topic, difficulty, and type
- **Question Bank Management**: Store and manage questions in MongoDB
- **Exam Creation**: Create comprehensive exams with multiple sections
- **Automatic Evaluation**: AI-powered evaluation with detailed feedback and scoring
- **Multilingual Support**: Generate and translate questions in multiple languages
- **User Authentication**: JWT-based authentication for teachers and students
- **Role-based Access**: Separate dashboards and permissions for teachers and students

### Question Types Supported
- Multiple Choice Questions (MCQ)
- Short Answer Questions
- Descriptive/Essay Questions

### User Roles
- **Teachers**: Create exams, manage question bank, view student responses
- **Students**: Take exams, view results and feedback

## Technology Stack

### Backend
- **Python Flask**: Web framework
- **MongoDB**: Database for storing users, questions, exams, and responses
- **OpenAI API**: AI-powered question generation and evaluation
- **JWT**: Authentication and authorization
- **bcrypt**: Password hashing

### Frontend
- **HTML5**: Structure and markup
- **CSS3**: Responsive styling and animations
- **JavaScript**: Interactive functionality and API calls
- **Font Awesome**: Icons

## Installation and Setup

### Prerequisites
- Python 3.8 or higher
- MongoDB (local or cloud instance)
- OpenAI API key

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ai-exam-system
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ai_exam_system

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# JWT Configuration
JWT_SECRET_KEY=your_jwt_secret_key_here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your_flask_secret_key_here

# Application Settings
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,es,fr,de,hi,ar
```

### 4. Database Setup
Make sure MongoDB is running, then populate with sample data:
```bash
python sample_data.py
```

### 5. Run the Application
```bash
python app.py
```

The application will be available at `http://localhost:5000`

## Sample Login Credentials

After running the sample data script:

**Teacher Account:**
- Email: teacher@example.com
- Password: password123

**Student Account:**
- Email: student@example.com
- Password: password123

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile

### Question Management
- `GET /api/subjects` - Get all subjects
- `GET /api/topics/<subject>` - Get topics for a subject
- `POST /api/generate-questions` - Generate questions using AI
- `GET /api/questions/bank` - Get questions from question bank
- `POST /api/questions/bank` - Add question to question bank

### Exam Management
- `POST /api/exams` - Create new exam
- `GET /api/exams` - Get exams (role-based)
- `GET /api/exams/<exam_id>` - Get specific exam
- `POST /api/exams/<exam_id>/responses` - Submit exam response
- `GET /api/exams/<exam_id>/responses` - Get exam responses (teachers only)

### Dashboard
- `GET /api/dashboard/teacher` - Teacher dashboard data
- `GET /api/dashboard/student` - Student dashboard data

### Utilities
- `POST /api/translate` - Translate text
- `GET /api/languages` - Get supported languages
- `GET /api/health` - Health check

## Project Structure

```
ai-exam-system/
├── app.py                 # Main Flask application
├── database.py           # Database models and operations
├── auth.py              # Authentication and authorization
├── question_generator.py # AI question generation
├── evaluator.py         # Response evaluation system
├── sample_data.py       # Sample data population script
├── requirements.txt     # Python dependencies
├── .env                # Environment variables
├── README.md           # This file
├── templates/
│   └── index.html      # Main HTML template
└── static/
    ├── css/
    │   └── style.css   # Stylesheet
    └── js/
        ├── app.js      # Main JavaScript
        ├── auth.js     # Authentication functions
        ├── dashboard.js # Dashboard functionality
        └── exam.js     # Exam creation and management
```

## Usage Guide

### For Teachers

1. **Register/Login** as a teacher
2. **Create Exams**:
   - Click "Create Exam" from dashboard
   - Add exam details (title, subject, duration)
   - Add sections with different question types
   - Configure AI generation ratio
3. **Manage Question Bank**:
   - Add custom questions
   - View existing questions by filters
4. **View Results**:
   - Monitor student responses
   - Review detailed evaluations

### For Students

1. **Register/Login** as a student
2. **Take Exams**:
   - View available exams
   - Take exams within time limits
   - Submit responses
3. **View Results**:
   - Check scores and grades
   - Read detailed feedback
   - Access personalized hints

## Configuration Options

### Question Generation
- Adjust AI ratio (0-1) for mixing AI-generated and bank questions
- Configure difficulty levels: easy, medium, hard
- Set question types: MCQ, short answer, descriptive

### Evaluation Settings
- Customize scoring algorithms
- Configure feedback detail levels
- Set grade boundaries

### Multilingual Support
- Supported languages: English, Spanish, French, German, Hindi, Arabic
- Automatic translation of questions and feedback
- Language detection for responses

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env file

2. **OpenAI API Error**
   - Verify API key is correct
   - Check API quota and billing

3. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT_SECRET_KEY configuration

4. **Question Generation Fails**
   - Verify OpenAI API key
   - Check network connectivity
   - Review API usage limits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation