import os
import openai
import json
import random
from typing import List, Dict, Any
from datetime import datetime
from database import db
from dotenv import load_dotenv
from static_question_bank import get_questions_by_criteria, get_subjects, get_topics, get_question_stats
# from googletrans import Translator
# from langdetect import detect

# Load environment variables
load_dotenv()

# Initialize OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

class QuestionGenerator:
    def __init__(self):
        # self.translator = Translator()
        self.supported_languages = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'hi': 'Hindi',
            'ar': 'Arabic'
        }

    def generate_questions_ai(self, subject: str, topic: str, difficulty: str,
                             question_type: str, count: int = 5, language: str = 'en') -> List[Dict]:
        """Generate questions using OpenAI API or fallback templates"""
        try:
            # Check if OpenAI API key is configured
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key or api_key == 'your_openai_api_key_here':
                print("OpenAI API key not configured, using fallback question generation")
                return self._generate_fallback_questions(subject, topic, difficulty, question_type, count, language)

            # Create prompt based on question type
            prompt = self._create_prompt(subject, topic, difficulty, question_type, count, language)

            response = openai.Completion.create(
                engine="text-davinci-003",
                prompt=f"You are an expert educator and question generator. Generate high-quality educational questions in the specified format.\n\n{prompt}",
                max_tokens=2000,
                temperature=0.7
            )

            # Parse the response
            questions_text = response.choices[0].text
            questions = self._parse_ai_response(questions_text, subject, topic, difficulty, question_type, language)

            return questions
        except Exception as e:
            print(f"Error generating AI questions: {e}, falling back to template questions")
            return self._generate_fallback_questions(subject, topic, difficulty, question_type, count, language)

    def _create_prompt(self, subject: str, topic: str, difficulty: str,
                      question_type: str, count: int, language: str) -> str:
        """Create prompt for OpenAI based on parameters"""

        language_name = self.supported_languages.get(language, 'English')

        base_prompt = f"""
        Generate {count} {difficulty} level {question_type} questions about {topic} in {subject}.
        Language: {language_name}

        Requirements:
        - Questions should be appropriate for {difficulty} difficulty level
        - Focus specifically on the topic: {topic}
        - Subject area: {subject}
        """

        if question_type.lower() == 'mcq':
            base_prompt += """
            - Format: Multiple Choice Questions with 4 options (A, B, C, D)
            - Clearly indicate the correct answer
            - Include brief explanations for the correct answer

            Format each question as:
            Q1: [Question text]
            A) [Option A]
            B) [Option B]
            C) [Option C]
            D) [Option D]
            Correct Answer: [Letter]
            Explanation: [Brief explanation]
            """
        elif question_type.lower() == 'short_answer':
            base_prompt += """
            - Format: Short answer questions (1-3 sentences expected)
            - Include sample answers or key points

            Format each question as:
            Q1: [Question text]
            Sample Answer: [Expected answer or key points]
            """
        elif question_type.lower() == 'descriptive':
            base_prompt += """
            - Format: Descriptive/Essay questions requiring detailed answers
            - Include key points that should be covered in the answer

            Format each question as:
            Q1: [Question text]
            Key Points: [Main points that should be covered]
            """

        return base_prompt

    def _parse_ai_response(self, response_text: str, subject: str, topic: str,
                          difficulty: str, question_type: str, language: str) -> List[Dict]:
        """Parse AI response into structured question format"""
        questions = []

        try:
            # Split response into individual questions
            question_blocks = response_text.split('Q')[1:]  # Remove empty first element

            for i, block in enumerate(question_blocks):
                if not block.strip():
                    continue

                question_data = {
                    'subject': subject,
                    'topic': topic,
                    'difficulty': difficulty,
                    'type': question_type,
                    'language': language,
                    'source': 'ai_generated'
                }

                lines = block.strip().split('\n')
                question_text = lines[0].split(':', 1)[1].strip() if ':' in lines[0] else lines[0].strip()
                question_data['question'] = question_text

                if question_type.lower() == 'mcq':
                    options = {}
                    correct_answer = ''
                    explanation = ''

                    for line in lines[1:]:
                        line = line.strip()
                        if line.startswith(('A)', 'B)', 'C)', 'D)')):
                            key = line[0].lower()
                            value = line[3:].strip()
                            options[key] = value
                        elif line.startswith('Correct Answer:'):
                            correct_answer = line.split(':', 1)[1].strip().lower()
                        elif line.startswith('Explanation:'):
                            explanation = line.split(':', 1)[1].strip()

                    question_data['options'] = options
                    question_data['correct_answer'] = correct_answer
                    question_data['explanation'] = explanation

                elif question_type.lower() in ['short_answer', 'descriptive']:
                    sample_answer = ''
                    key_points = ''

                    for line in lines[1:]:
                        line = line.strip()
                        if line.startswith('Sample Answer:'):
                            sample_answer = line.split(':', 1)[1].strip()
                        elif line.startswith('Key Points:'):
                            key_points = line.split(':', 1)[1].strip()

                    question_data['sample_answer'] = sample_answer
                    question_data['key_points'] = key_points

                questions.append(question_data)

        except Exception as e:
            print(f"Error parsing AI response: {e}")

        return questions

    def _generate_fallback_questions(self, subject: str, topic: str, difficulty: str,
                                   question_type: str, count: int = 5, language: str = 'en') -> List[Dict]:
        """Generate template-based questions when OpenAI is not available"""
        try:
            fallback_questions = []

            # Template questions based on subject and type
            templates = self._get_question_templates(subject, topic, difficulty, question_type)

            for i in range(min(count, len(templates))):
                template = templates[i % len(templates)]
                question_data = {
                    'subject': subject,
                    'topic': topic,
                    'difficulty': difficulty,
                    'type': question_type,
                    'language': language,
                    'source': 'template_generated',
                    'question': template['question'].format(topic=topic, subject=subject),
                    'marks': template.get('marks', 1)
                }

                if question_type.lower() == 'mcq':
                    question_data['options'] = template['options']
                    question_data['correct_answer'] = template['correct_answer']
                    question_data['explanation'] = template.get('explanation', '')
                else:
                    question_data['sample_answer'] = template.get('sample_answer', '')
                    question_data['key_points'] = template.get('key_points', '')

                fallback_questions.append(question_data)

            return fallback_questions
        except Exception as e:
            print(f"Error generating fallback questions: {e}")
            return []

    def _get_question_templates(self, subject: str, topic: str, difficulty: str, question_type: str) -> List[Dict]:
        """Get enhanced question templates based on subject and type"""
        templates = []

        # Subject-specific templates
        subject_templates = {
            'mathematics': {
                'mcq': [
                    {
                        'question': 'What is the derivative of x² with respect to x?',
                        'options': {'a': 'x', 'b': '2x', 'c': 'x²', 'd': '2x²'},
                        'correct_answer': 'b',
                        'explanation': 'The derivative of x² is 2x using the power rule.',
                        'marks': 2
                    },
                    {
                        'question': 'Which of the following is the quadratic formula?',
                        'options': {
                            'a': 'x = -b ± √(b² - 4ac) / 2a',
                            'b': 'x = b ± √(b² + 4ac) / 2a',
                            'c': 'x = -b ± √(b² + 4ac) / 2a',
                            'd': 'x = b ± √(b² - 4ac) / 2a'
                        },
                        'correct_answer': 'a',
                        'explanation': 'The quadratic formula is x = (-b ± √(b² - 4ac)) / 2a',
                        'marks': 3
                    }
                ],
                'short_answer': [
                    {
                        'question': 'Solve the equation 2x + 5 = 13 and show your work.',
                        'sample_answer': '2x + 5 = 13, 2x = 8, x = 4',
                        'key_points': 'Subtract 5 from both sides, divide by 2, final answer x = 4',
                        'marks': 3
                    }
                ]
            },
            'physics': {
                'mcq': [
                    {
                        'question': 'What is Newton\'s second law of motion?',
                        'options': {'a': 'F = ma', 'b': 'E = mc²', 'c': 'v = u + at', 'd': 'P = mv'},
                        'correct_answer': 'a',
                        'explanation': 'Newton\'s second law states that Force equals mass times acceleration (F = ma).',
                        'marks': 2
                    },
                    {
                        'question': 'The unit of electric current is:',
                        'options': {'a': 'Volt', 'b': 'Ampere', 'c': 'Ohm', 'd': 'Watt'},
                        'correct_answer': 'b',
                        'explanation': 'The unit of electric current is Ampere (A).',
                        'marks': 1
                    }
                ]
            },
            'chemistry': {
                'mcq': [
                    {
                        'question': 'What is the chemical symbol for Gold?',
                        'options': {'a': 'Go', 'b': 'Gd', 'c': 'Au', 'd': 'Ag'},
                        'correct_answer': 'c',
                        'explanation': 'Gold\'s chemical symbol is Au, from the Latin word "aurum".',
                        'marks': 1
                    },
                    {
                        'question': 'Which gas is most abundant in Earth\'s atmosphere?',
                        'options': {'a': 'Oxygen', 'b': 'Carbon Dioxide', 'c': 'Nitrogen', 'd': 'Hydrogen'},
                        'correct_answer': 'c',
                        'explanation': 'Nitrogen makes up about 78% of Earth\'s atmosphere.',
                        'marks': 2
                    }
                ]
            },
            'biology': {
                'mcq': [
                    {
                        'question': 'What is the powerhouse of the cell?',
                        'options': {'a': 'Nucleus', 'b': 'Mitochondria', 'c': 'Ribosome', 'd': 'Chloroplast'},
                        'correct_answer': 'b',
                        'explanation': 'Mitochondria are called the powerhouse of the cell because they produce ATP.',
                        'marks': 2
                    }
                ]
            },
            'computer science': {
                'mcq': [
                    {
                        'question': 'Which of the following is a programming language?',
                        'options': {'a': 'HTML', 'b': 'CSS', 'c': 'Python', 'd': 'SQL'},
                        'correct_answer': 'c',
                        'explanation': 'Python is a high-level programming language.',
                        'marks': 1
                    },
                    {
                        'question': 'What does CPU stand for?',
                        'options': {'a': 'Central Processing Unit', 'b': 'Computer Processing Unit', 'c': 'Central Program Unit', 'd': 'Computer Program Unit'},
                        'correct_answer': 'a',
                        'explanation': 'CPU stands for Central Processing Unit.',
                        'marks': 1
                    }
                ]
            }
        }

        # Get subject-specific templates or use generic ones
        subject_key = subject.lower()
        question_type_key = question_type.lower()

        if subject_key in subject_templates and question_type_key in subject_templates[subject_key]:
            templates = subject_templates[subject_key][question_type_key]
        else:
            # Generic templates
            if question_type.lower() == 'mcq':
                templates = [
                    {
                        'question': f'What is the main concept of {topic} in {subject}?',
                        'options': {
                            'a': f'Primary concept of {topic}',
                            'b': f'Secondary aspect of {topic}',
                            'c': f'Related field to {topic}',
                            'd': f'Opposite of {topic}'
                        },
                        'correct_answer': 'a',
                        'explanation': f'The primary concept is fundamental to understanding {topic}.',
                        'marks': 2
                    }
                ]
            else:
                templates = [
                    {
                        'question': f'Explain the concept of {topic} in {subject}.',
                        'sample_answer': f'The concept of {topic} involves understanding the fundamental principles and applications in {subject}.',
                        'key_points': 'Definition, principles, applications, examples',
                        'marks': 5
                    }
                ]

        return templates

    def generate_quiz_questions_from_title(self, quiz_title: str, subject: str,
                                         difficulty: str = 'medium', count: int = 5,
                                         question_types: List[str] = None) -> List[Dict]:
        """Generate AI-powered questions based on quiz title and subject"""
        if question_types is None:
            question_types = ['mcq', 'short_answer']

        try:
            # Check if OpenAI API key is configured
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key or api_key == 'your_openai_api_key_here':
                print("OpenAI API key not configured, using enhanced template generation")
                return self._generate_enhanced_template_questions(quiz_title, subject, difficulty, count, question_types)

            # Create AI prompt based on quiz title
            prompt = self._create_quiz_title_prompt(quiz_title, subject, difficulty, count, question_types)

            response = openai.Completion.create(
                engine="text-davinci-003",
                prompt=prompt,
                max_tokens=2500,
                temperature=0.7
            )

            # Parse the response
            questions_text = response.choices[0].text
            questions = self._parse_quiz_ai_response(questions_text, subject, difficulty, question_types)

            return questions[:count]  # Ensure we don't exceed requested count
        except Exception as e:
            print(f"Error generating AI quiz questions: {e}, using enhanced templates")
            return self._generate_enhanced_template_questions(quiz_title, subject, difficulty, count, question_types)

    def _create_quiz_title_prompt(self, quiz_title: str, subject: str, difficulty: str,
                                count: int, question_types: List[str]) -> str:
        """Create AI prompt based on quiz title"""

        prompt = f"""
        Create a {difficulty} level quiz titled "{quiz_title}" for the subject {subject}.
        Generate {count} high-quality educational questions.

        Question types to include: {', '.join(question_types)}

        Requirements:
        - Questions should be relevant to the quiz title "{quiz_title}"
        - Appropriate for {difficulty} difficulty level
        - Subject area: {subject}
        - Include a mix of the specified question types

        For Multiple Choice Questions (MCQ):
        - Provide 4 options (A, B, C, D)
        - Clearly indicate the correct answer
        - Include brief explanations

        For Short Answer Questions:
        - Expect 1-3 sentence responses
        - Include sample answers or key points

        Format each question as:

        Q1: [Question text]
        Type: [MCQ/Short Answer]
        [If MCQ:]
        A) [Option A]
        B) [Option B]
        C) [Option C]
        D) [Option D]
        Correct Answer: [Letter]
        Explanation: [Brief explanation]

        [If Short Answer:]
        Sample Answer: [Expected answer or key points]

        ---

        Make sure questions are:
        1. Directly related to "{quiz_title}"
        2. Educationally valuable
        3. Clear and unambiguous
        4. Appropriate for the {difficulty} level
        """

        return prompt

    def _generate_enhanced_template_questions(self, quiz_title: str, subject: str,
                                            difficulty: str, count: int,
                                            question_types: List[str]) -> List[Dict]:
        """Generate enhanced template questions based on quiz title"""
        questions = []

        # Extract key topics from quiz title
        topics = self._extract_topics_from_title(quiz_title, subject)

        for i in range(count):
            question_type = question_types[i % len(question_types)]
            topic = topics[i % len(topics)] if topics else subject

            # Generate contextual question based on quiz title
            if question_type.lower() == 'mcq':
                question = self._generate_contextual_mcq(quiz_title, subject, topic, difficulty)
            else:
                question = self._generate_contextual_short_answer(quiz_title, subject, topic, difficulty)

            questions.append(question)

        return questions

    def _extract_topics_from_title(self, quiz_title: str, subject: str) -> List[str]:
        """Extract potential topics from quiz title"""
        # Simple keyword extraction - can be enhanced with NLP
        title_words = quiz_title.lower().split()

        # Subject-specific topic mapping
        topic_mappings = {
            'mathematics': ['algebra', 'calculus', 'geometry', 'statistics', 'trigonometry'],
            'physics': ['mechanics', 'thermodynamics', 'electromagnetism', 'optics', 'quantum'],
            'chemistry': ['organic chemistry', 'inorganic chemistry', 'physical chemistry', 'biochemistry'],
            'biology': ['cell biology', 'genetics', 'ecology', 'evolution', 'anatomy'],
            'computer science': ['programming', 'algorithms', 'data structures', 'databases', 'networks']
        }

        subject_key = subject.lower()
        potential_topics = topic_mappings.get(subject_key, [subject])

        # Try to match title words with known topics
        matched_topics = []
        for word in title_words:
            for topic in potential_topics:
                if word in topic.lower() or topic.lower() in word:
                    matched_topics.append(topic)

        return matched_topics if matched_topics else [subject]

    def _generate_contextual_mcq(self, quiz_title: str, subject: str, topic: str, difficulty: str) -> Dict:
        """Generate contextual MCQ based on quiz title"""

        # Difficulty-based question complexity
        if difficulty.lower() == 'easy':
            question_text = f"In the context of '{quiz_title}', what is a fundamental concept in {topic}?"
            options = {
                'a': f"Basic principle of {topic}",
                'b': f"Advanced theory in {topic}",
                'c': f"Unrelated concept",
                'd': f"Complex application"
            }
            correct_answer = 'a'
            explanation = f"The basic principle is fundamental to understanding {topic} in the context of {quiz_title}."
            marks = 1
        elif difficulty.lower() == 'hard':
            question_text = f"Considering '{quiz_title}', which advanced concept in {topic} is most critical?"
            options = {
                'a': f"Elementary concept in {topic}",
                'b': f"Advanced application of {topic}",
                'c': f"Basic definition",
                'd': f"Simple example"
            }
            correct_answer = 'b'
            explanation = f"Advanced applications are crucial for mastering {topic} as covered in {quiz_title}."
            marks = 3
        else:  # medium
            question_text = f"In '{quiz_title}', how does {topic} relate to the main subject matter?"
            options = {
                'a': f"It's completely unrelated",
                'b': f"It provides foundational understanding",
                'c': f"It's only for advanced students",
                'd': f"It's optional knowledge"
            }
            correct_answer = 'b'
            explanation = f"{topic} provides essential foundational understanding for {quiz_title}."
            marks = 2

        return {
            'question': question_text,
            'subject': subject,
            'topic': topic,
            'difficulty': difficulty,
            'type': 'mcq',
            'options': options,
            'correct_answer': correct_answer,
            'explanation': explanation,
            'marks': marks,
            'language': 'en',
            'source': 'enhanced_template',
            'quiz_context': quiz_title
        }

    def _generate_contextual_short_answer(self, quiz_title: str, subject: str, topic: str, difficulty: str) -> Dict:
        """Generate contextual short answer question based on quiz title"""

        if difficulty.lower() == 'easy':
            question_text = f"Briefly explain how {topic} relates to '{quiz_title}'."
            sample_answer = f"{topic} is fundamental to {quiz_title} because it provides the basic concepts needed for understanding."
            key_points = f"Definition of {topic}, connection to quiz topic, basic importance"
            marks = 3
        elif difficulty.lower() == 'hard':
            question_text = f"Analyze the complex relationship between {topic} and the concepts covered in '{quiz_title}'. Provide specific examples."
            sample_answer = f"{topic} plays a crucial role in {quiz_title} through multiple interconnected concepts and practical applications."
            key_points = f"Complex analysis, specific examples, interconnections, practical applications"
            marks = 8
        else:  # medium
            question_text = f"Describe the importance of {topic} in the context of '{quiz_title}' and give one example."
            sample_answer = f"{topic} is important in {quiz_title} because it helps understand key concepts. For example, [specific example]."
            key_points = f"Importance explanation, specific example, clear connection to quiz topic"
            marks = 5

        return {
            'question': question_text,
            'subject': subject,
            'topic': topic,
            'difficulty': difficulty,
            'type': 'short_answer',
            'sample_answer': sample_answer,
            'key_points': key_points,
            'marks': marks,
            'language': 'en',
            'source': 'enhanced_template',
            'quiz_context': quiz_title
        }

    def _parse_quiz_ai_response(self, response_text: str, subject: str, difficulty: str, question_types: List[str]) -> List[Dict]:
        """Parse AI response for quiz questions"""
        questions = []

        try:
            # Split response into individual questions
            question_blocks = response_text.split('Q')[1:]  # Remove empty first element

            for i, block in enumerate(question_blocks):
                if not block.strip():
                    continue

                lines = block.strip().split('\n')
                question_text = lines[0].split(':', 1)[1].strip() if ':' in lines[0] else lines[0].strip()

                question_data = {
                    'subject': subject,
                    'topic': 'AI Generated',
                    'difficulty': difficulty,
                    'language': 'en',
                    'source': 'ai_generated_quiz'
                }

                # Determine question type
                question_type = 'mcq'  # default
                for line in lines:
                    if 'Type:' in line:
                        if 'Short Answer' in line:
                            question_type = 'short_answer'
                        break

                question_data['type'] = question_type
                question_data['question'] = question_text

                if question_type == 'mcq':
                    options = {}
                    correct_answer = ''
                    explanation = ''

                    for line in lines[1:]:
                        line = line.strip()
                        if line.startswith(('A)', 'B)', 'C)', 'D)')):
                            key = line[0].lower()
                            value = line[3:].strip()
                            options[key] = value
                        elif line.startswith('Correct Answer:'):
                            correct_answer = line.split(':', 1)[1].strip().lower()
                        elif line.startswith('Explanation:'):
                            explanation = line.split(':', 1)[1].strip()

                    question_data['options'] = options
                    question_data['correct_answer'] = correct_answer
                    question_data['explanation'] = explanation
                    question_data['marks'] = 2

                else:  # short_answer
                    sample_answer = ''
                    for line in lines[1:]:
                        line = line.strip()
                        if line.startswith('Sample Answer:'):
                            sample_answer = line.split(':', 1)[1].strip()

                    question_data['sample_answer'] = sample_answer
                    question_data['key_points'] = 'Key concepts and explanations'
                    question_data['marks'] = 5

                questions.append(question_data)

        except Exception as e:
            print(f"Error parsing AI quiz response: {e}")

        return questions

    def get_questions_from_bank(self, subject: str, topic: str, difficulty: str,
                               question_type: str, count: int = 5, language: str = 'en') -> List[Dict]:
        """Get questions from existing question bank"""
        try:
            # First try to get from database
            questions = []
            try:
                questions = db.get_questions_from_bank(
                    subject=subject,
                    topic=topic,
                    difficulty=difficulty,
                    question_type=question_type,
                    limit=count
                )
            except:
                pass  # Database might not have the method yet

            # If database doesn't have enough questions, use static bank
            if len(questions) < count:
                static_questions = get_questions_by_criteria(
                    subject=subject,
                    topic=topic,
                    difficulty=difficulty,
                    question_type=question_type,
                    limit=count - len(questions)
                )

                # Add static questions that aren't duplicates
                existing_questions = {q.get('question', '') for q in questions}
                for q in static_questions:
                    if q['question'] not in existing_questions:
                        questions.append(q)
                        if len(questions) >= count:
                            break

            # If still not enough, try relaxed criteria from static bank
            if len(questions) < count:
                # Try without topic restriction
                additional_questions = get_questions_by_criteria(
                    subject=subject,
                    difficulty=difficulty,
                    question_type=question_type,
                    limit=count - len(questions)
                )

                existing_questions = {q.get('question', '') for q in questions}
                for q in additional_questions:
                    if q['question'] not in existing_questions:
                        questions.append(q)
                        if len(questions) >= count:
                            break

            # Filter by language if specified
            if language != 'en':
                questions = [q for q in questions if q.get('language', 'en') == language]

            return questions[:count]
        except Exception as e:
            print(f"Error getting questions from bank: {e}")
            return []

    def generate_mixed_questions(self, subject: str, topic: str, difficulty: str,
                                question_type: str, count: int = 5, language: str = 'en',
                                ai_ratio: float = 0.5) -> List[Dict]:
        """Generate questions using both AI and question bank"""
        try:
            ai_count = int(count * ai_ratio)
            bank_count = count - ai_count

            questions = []

            # Get questions from bank first
            if bank_count > 0:
                bank_questions = self.get_questions_from_bank(
                    subject, topic, difficulty, question_type, bank_count, language
                )
                questions.extend(bank_questions)

            # Generate remaining questions with AI
            remaining_count = count - len(questions)
            if remaining_count > 0:
                ai_questions = self.generate_questions_ai(
                    subject, topic, difficulty, question_type, remaining_count, language
                )
                questions.extend(ai_questions)

            # Shuffle questions
            random.shuffle(questions)

            return questions[:count]  # Ensure we don't exceed requested count
        except Exception as e:
            print(f"Error generating mixed questions: {e}")
            return []

    def translate_question(self, question_data: Dict, target_language: str) -> Dict:
        """Translate a question to target language"""
        # Translation temporarily disabled due to compatibility issues
        print(f"Translation feature temporarily disabled. Returning original question.")
        return question_data

    def create_question_paper(self, paper_config: Dict) -> Dict:
        """Create a complete question paper"""
        try:
            paper = {
                'title': paper_config.get('title', 'Question Paper'),
                'subject': paper_config['subject'],
                'total_marks': 0,
                'duration': paper_config.get('duration', 60),  # minutes
                'instructions': paper_config.get('instructions', []),
                'sections': [],
                'created_at': datetime.utcnow(),
                'language': paper_config.get('language', 'en')
            }

            # Generate questions for each section
            for section_config in paper_config.get('sections', []):
                section = {
                    'title': section_config.get('title', 'Section'),
                    'instructions': section_config.get('instructions', ''),
                    'questions': [],
                    'marks_per_question': section_config.get('marks_per_question', 1)
                }

                # Check if this section has pre-generated AI questions
                if section_config.get('is_ai_generated') and section_config.get('ai_generated_questions'):
                    questions = section_config['ai_generated_questions']
                    print(f"Using pre-generated AI questions for section: {section['title']}")
                # Check if this section has pre-selected questions from question bank
                elif section_config.get('pre_selected_questions'):
                    questions = section_config['pre_selected_questions']
                    print(f"Using pre-selected questions for section: {section['title']}")
                else:
                    # Generate questions based on configuration
                    questions = self.generate_mixed_questions(
                        subject=section_config['subject'],
                        topic=section_config['topic'],
                        difficulty=section_config['difficulty'],
                        question_type=section_config['type'],
                        count=section_config['count'],
                        language=paper_config.get('language', 'en'),
                        ai_ratio=section_config.get('ai_ratio', 0.5)
                    )

                # Add marks to each question
                for question in questions:
                    question['marks'] = section['marks_per_question']

                section['questions'] = questions
                section['total_marks'] = len(questions) * section['marks_per_question']
                paper['total_marks'] += section['total_marks']

                paper['sections'].append(section)

            return paper
        except Exception as e:
            print(f"Error creating question paper: {e}")
            return {}

# Global question generator instance
question_generator = QuestionGenerator()