import os
import openai
import re
from typing import Dict, List, Any, Tuple
from datetime import datetime
from database import db
from dotenv import load_dotenv
# from googletrans import Translator
# from langdetect import detect

# Load environment variables
load_dotenv()

# Initialize OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

class ResponseEvaluator:
    def __init__(self):
        # self.translator = Translator()
        pass

    def evaluate_mcq_response(self, question: Dict, student_answer: str) -> Dict:
        """Evaluate MCQ response"""
        try:
            correct_answer = question.get('correct_answer', '').lower().strip()
            student_answer = student_answer.lower().strip()

            is_correct = student_answer == correct_answer
            score = question.get('marks', 1) if is_correct else 0

            feedback = {
                'is_correct': is_correct,
                'score': score,
                'max_score': question.get('marks', 1),
                'correct_answer': correct_answer.upper(),
                'explanation': question.get('explanation', ''),
                'feedback_text': 'Correct!' if is_correct else f"Incorrect. The correct answer is {correct_answer.upper()}."
            }

            if not is_correct and question.get('explanation'):
                feedback['feedback_text'] += f" {question['explanation']}"

            return feedback
        except Exception as e:
            print(f"Error evaluating MCQ response: {e}")
            return {'score': 0, 'feedback_text': 'Error in evaluation'}

    def evaluate_text_response_ai(self, question: Dict, student_answer: str) -> Dict:
        """Evaluate text response using AI or fallback method"""
        try:
            # Check if OpenAI API key is configured
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key or api_key == 'your_openai_api_key_here':
                print("OpenAI API key not configured, using fallback evaluation")
                return self._fallback_evaluation(question, student_answer)

            # Create evaluation prompt
            prompt = self._create_evaluation_prompt(question, student_answer)

            response = openai.Completion.create(
                engine="text-davinci-003",
                prompt=f"You are an expert educator evaluating student responses. Provide fair, constructive feedback with specific scores.\n\n{prompt}",
                max_tokens=500,
                temperature=0.3
            )

            evaluation_text = response.choices[0].text
            evaluation = self._parse_ai_evaluation(evaluation_text, question.get('marks', 1))

            return evaluation
        except Exception as e:
            print(f"Error in AI evaluation: {e}, using fallback evaluation")
            return self._fallback_evaluation(question, student_answer)

    def _create_evaluation_prompt(self, question: Dict, student_answer: str) -> str:
        """Create evaluation prompt for AI"""
        max_marks = question.get('marks', 1)
        question_type = question.get('type', 'short_answer')

        prompt = f"""
        Evaluate the following student response:

        Question: {question['question']}
        Question Type: {question_type}
        Maximum Marks: {max_marks}

        Student Answer: {student_answer}
        """

        if question.get('sample_answer'):
            prompt += f"\nSample Answer: {question['sample_answer']}"

        if question.get('key_points'):
            prompt += f"\nKey Points to Cover: {question['key_points']}"

        prompt += f"""

        Please evaluate this response and provide:
        1. Score out of {max_marks} (as a number)
        2. Detailed feedback explaining the score
        3. Specific suggestions for improvement
        4. Hints for better understanding (if score is low)

        Format your response as:
        SCORE: [number]
        FEEDBACK: [detailed feedback]
        SUGGESTIONS: [improvement suggestions]
        HINTS: [helpful hints]
        """

        return prompt

    def _parse_ai_evaluation(self, evaluation_text: str, max_marks: int) -> Dict:
        """Parse AI evaluation response"""
        try:
            evaluation = {
                'score': 0,
                'max_score': max_marks,
                'feedback_text': '',
                'suggestions': '',
                'hints': ''
            }

            lines = evaluation_text.split('\n')
            current_section = None

            for line in lines:
                line = line.strip()
                if line.startswith('SCORE:'):
                    score_text = line.split(':', 1)[1].strip()
                    # Extract number from score text
                    score_match = re.search(r'(\d+(?:\.\d+)?)', score_text)
                    if score_match:
                        evaluation['score'] = min(float(score_match.group(1)), max_marks)
                elif line.startswith('FEEDBACK:'):
                    current_section = 'feedback'
                    evaluation['feedback_text'] = line.split(':', 1)[1].strip()
                elif line.startswith('SUGGESTIONS:'):
                    current_section = 'suggestions'
                    evaluation['suggestions'] = line.split(':', 1)[1].strip()
                elif line.startswith('HINTS:'):
                    current_section = 'hints'
                    evaluation['hints'] = line.split(':', 1)[1].strip()
                elif current_section and line:
                    if current_section == 'feedback':
                        evaluation['feedback_text'] += ' ' + line
                    elif current_section == 'suggestions':
                        evaluation['suggestions'] += ' ' + line
                    elif current_section == 'hints':
                        evaluation['hints'] += ' ' + line

            return evaluation
        except Exception as e:
            print(f"Error parsing AI evaluation: {e}")
            return {'score': 0, 'max_score': max_marks, 'feedback_text': 'Error in evaluation parsing'}

    def _fallback_evaluation(self, question: Dict, student_answer: str) -> Dict:
        """Fallback evaluation when AI fails"""
        max_marks = question.get('marks', 1)

        # Simple keyword-based evaluation
        if not student_answer.strip():
            return {
                'score': 0,
                'max_score': max_marks,
                'feedback_text': 'No answer provided.',
                'suggestions': 'Please provide an answer to receive marks.',
                'hints': 'Review the topic and try to answer the question.'
            }

        # Basic length and keyword check
        answer_length = len(student_answer.split())
        sample_answer = question.get('sample_answer', '')
        key_points = question.get('key_points', '')

        score = 0
        if answer_length >= 10:  # Minimum effort
            score += max_marks * 0.3

        # Check for key terms
        if sample_answer or key_points:
            reference_text = (sample_answer + ' ' + key_points).lower()
            student_text = student_answer.lower()

            # Simple keyword matching
            reference_words = set(reference_text.split())
            student_words = set(student_text.split())

            common_words = reference_words.intersection(student_words)
            if len(common_words) > 0:
                keyword_score = min(len(common_words) / len(reference_words), 0.7)
                score += max_marks * keyword_score

        score = min(score, max_marks)

        return {
            'score': round(score, 1),
            'max_score': max_marks,
            'feedback_text': f'Basic evaluation completed. Score: {score}/{max_marks}',
            'suggestions': 'For detailed feedback, ensure AI evaluation is available.',
            'hints': 'Review the topic materials and sample answers.'
        }

    def evaluate_response(self, question: Dict, student_answer: str) -> Dict:
        """Main method to evaluate any type of response"""
        try:
            question_type = question.get('type', '').lower()

            if question_type == 'mcq':
                return self.evaluate_mcq_response(question, student_answer)
            else:
                # For short_answer and descriptive questions
                return self.evaluate_text_response_ai(question, student_answer)
        except Exception as e:
            print(f"Error in response evaluation: {e}")
            return {
                'score': 0,
                'max_score': question.get('marks', 1),
                'feedback_text': 'Error occurred during evaluation.',
                'suggestions': 'Please try again or contact support.',
                'hints': ''
            }

    def evaluate_exam_response(self, exam_data: Dict, student_responses: Dict) -> Dict:
        """Evaluate complete exam response"""
        try:
            total_score = 0
            max_total_score = 0
            detailed_feedback = []

            for section in exam_data.get('sections', []):
                section_feedback = {
                    'section_title': section.get('title', 'Section'),
                    'questions': []
                }

                for i, question in enumerate(section.get('questions', [])):
                    question_id = f"section_{exam_data['sections'].index(section)}_question_{i}"
                    student_answer = student_responses.get(question_id, '')

                    # Evaluate individual question
                    evaluation = self.evaluate_response(question, student_answer)

                    question_feedback = {
                        'question_number': i + 1,
                        'question_text': question['question'],
                        'student_answer': student_answer,
                        'evaluation': evaluation
                    }

                    section_feedback['questions'].append(question_feedback)
                    total_score += evaluation['score']
                    max_total_score += evaluation['max_score']

                detailed_feedback.append(section_feedback)

            # Calculate percentage
            percentage = (total_score / max_total_score * 100) if max_total_score > 0 else 0

            # Generate overall feedback
            overall_feedback = self._generate_overall_feedback(percentage, detailed_feedback)

            return {
                'total_score': round(total_score, 1),
                'max_score': max_total_score,
                'percentage': round(percentage, 1),
                'grade': self._calculate_grade(percentage),
                'overall_feedback': overall_feedback,
                'detailed_feedback': detailed_feedback,
                'evaluation_date': datetime.utcnow()
            }
        except Exception as e:
            print(f"Error evaluating exam response: {e}")
            return {
                'total_score': 0,
                'max_score': 0,
                'percentage': 0,
                'grade': 'F',
                'overall_feedback': 'Error occurred during evaluation.',
                'detailed_feedback': []
            }

    def _generate_overall_feedback(self, percentage: float, detailed_feedback: List) -> str:
        """Generate overall feedback based on performance"""
        if percentage >= 90:
            return "Excellent performance! You have demonstrated a strong understanding of the subject matter."
        elif percentage >= 80:
            return "Good work! You have a solid grasp of most concepts with room for minor improvements."
        elif percentage >= 70:
            return "Satisfactory performance. Focus on strengthening your understanding of key concepts."
        elif percentage >= 60:
            return "You're on the right track, but need to work on several areas for better understanding."
        elif percentage >= 50:
            return "Below average performance. Consider reviewing the material and seeking additional help."
        else:
            return "Significant improvement needed. Please review all topics thoroughly and consider additional study resources."

    def _calculate_grade(self, percentage: float) -> str:
        """Calculate letter grade based on percentage"""
        if percentage >= 90:
            return 'A+'
        elif percentage >= 85:
            return 'A'
        elif percentage >= 80:
            return 'B+'
        elif percentage >= 75:
            return 'B'
        elif percentage >= 70:
            return 'C+'
        elif percentage >= 65:
            return 'C'
        elif percentage >= 60:
            return 'D+'
        elif percentage >= 55:
            return 'D'
        elif percentage >= 50:
            return 'E'
        else:
            return 'F'

    def generate_personalized_hints(self, question: Dict, student_answer: str, evaluation: Dict) -> List[str]:
        """Generate personalized hints based on student performance"""
        hints = []

        try:
            if evaluation['score'] < evaluation['max_score'] * 0.5:  # Less than 50%
                # Check if OpenAI API key is configured
                api_key = os.getenv('OPENAI_API_KEY')
                if api_key and api_key != 'your_openai_api_key_here':
                    # Generate AI-powered hints
                    prompt = f"""
                    Generate 3 helpful study hints for a student who answered this question incorrectly:

                    Question: {question['question']}
                    Student Answer: {student_answer}
                    Topic: {question.get('topic', 'General')}
                    Subject: {question.get('subject', 'General')}

                    Provide specific, actionable hints that will help the student understand the concept better.
                    Format as a simple list.
                    """

                    response = openai.Completion.create(
                        engine="text-davinci-003",
                        prompt=f"You are a helpful tutor providing study hints.\n\n{prompt}",
                        max_tokens=300,
                        temperature=0.7
                    )

                    hints_text = response.choices[0].text
                    hints = [hint.strip() for hint in hints_text.split('\n') if hint.strip()]
                else:
                    # Fallback hints when OpenAI is not available
                    hints = self._generate_fallback_hints(question, student_answer, evaluation)
        except Exception as e:
            print(f"Error generating personalized hints: {e}")
            # Fallback hints
            hints = self._generate_fallback_hints(question, student_answer, evaluation)

        return hints[:3]  # Return maximum 3 hints

    def _generate_fallback_hints(self, question: Dict, student_answer: str, evaluation: Dict) -> List[str]:
        """Generate fallback hints when AI is not available"""
        topic = question.get('topic', 'this topic')
        subject = question.get('subject', 'this subject')

        hints = [
            f"Review the fundamental concepts of {topic} in {subject}",
            f"Practice more questions related to {topic} to improve understanding",
            f"Focus on the key principles and formulas used in {topic}",
            "Consider creating summary notes for better retention",
            "Seek help from your instructor or study group for clarification"
        ]

        # Customize hints based on question type
        if question.get('type') == 'mcq':
            hints.append("For multiple choice questions, eliminate obviously wrong options first")
        elif question.get('type') == 'descriptive':
            hints.append("Structure your answers with clear introduction, main points, and conclusion")
        elif question.get('type') == 'short_answer':
            hints.append("Be concise but include all key points in your answer")

        return hints

# Global evaluator instance
evaluator = ResponseEvaluator()