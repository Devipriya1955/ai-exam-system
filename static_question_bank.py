"""
Static Question Bank - Comprehensive collection of educational questions
"""

def _normalize_subject_name(subject_display_name):
    """Convert display subject name back to internal format"""
    if not subject_display_name:
        return None

    subject_mapping = {
        "computer science": "computer_science",
        "mathematics": "mathematics",
        "physics": "physics",
        "chemistry": "chemistry",
        "biology": "biology"
    }

    return subject_mapping.get(subject_display_name.lower(), subject_display_name.lower())

STATIC_QUESTION_BANK = {
    "mathematics": {
        "algebra": {
            "easy": [
                {
                    "question": "Solve for x: 2x + 5 = 13",
                    "type": "mcq",
                    "options": {"a": "x = 3", "b": "x = 4", "c": "x = 5", "d": "x = 6"},
                    "correct_answer": "b",
                    "explanation": "2x + 5 = 13, so 2x = 8, therefore x = 4",
                    "marks": 2,
                    "tags": ["linear_equations", "basic_algebra"]
                },
                {
                    "question": "What is the value of 3x² when x = 2?",
                    "type": "mcq",
                    "options": {"a": "6", "b": "9", "c": "12", "d": "18"},
                    "correct_answer": "c",
                    "explanation": "3x² = 3(2)² = 3(4) = 12",
                    "marks": 2,
                    "tags": ["substitution", "exponents"]
                },
                {
                    "question": "Simplify: 4x + 3x - 2x",
                    "type": "short_answer",
                    "sample_answer": "5x",
                    "key_points": "Combine like terms: (4 + 3 - 2)x = 5x",
                    "marks": 3,
                    "tags": ["combining_terms", "simplification"]
                }
            ],
            "medium": [
                {
                    "question": "Solve the quadratic equation: x² - 5x + 6 = 0",
                    "type": "mcq",
                    "options": {"a": "x = 2, 3", "b": "x = 1, 6", "c": "x = -2, -3", "d": "x = 2, -3"},
                    "correct_answer": "a",
                    "explanation": "Factoring: (x-2)(x-3) = 0, so x = 2 or x = 3",
                    "marks": 4,
                    "tags": ["quadratic_equations", "factoring"]
                },
                {
                    "question": "Find the slope of the line passing through points (2, 3) and (4, 7)",
                    "type": "short_answer",
                    "sample_answer": "m = 2",
                    "key_points": "Slope formula: m = (y₂-y₁)/(x₂-x₁) = (7-3)/(4-2) = 4/2 = 2",
                    "marks": 3,
                    "tags": ["slope", "coordinate_geometry"]
                }
            ],
            "hard": [
                {
                    "question": "Solve the system: 2x + 3y = 12 and x - y = 1",
                    "type": "descriptive",
                    "sample_answer": "x = 3, y = 2. Using substitution method: from second equation x = y + 1, substitute into first equation: 2(y + 1) + 3y = 12, solving gives y = 2, then x = 3",
                    "key_points": "System of equations, substitution method, verification of solution",
                    "marks": 6,
                    "tags": ["system_of_equations", "substitution"]
                }
            ]
        },
        "calculus": {
            "easy": [
                {
                    "question": "What is the derivative of x³?",
                    "type": "mcq",
                    "options": {"a": "3x²", "b": "x²", "c": "3x", "d": "x³"},
                    "correct_answer": "a",
                    "explanation": "Using power rule: d/dx(x³) = 3x²",
                    "marks": 2,
                    "tags": ["derivatives", "power_rule"]
                }
            ],
            "medium": [
                {
                    "question": "Find the integral of 2x dx",
                    "type": "short_answer",
                    "sample_answer": "x² + C",
                    "key_points": "∫2x dx = 2∫x dx = 2(x²/2) + C = x² + C",
                    "marks": 3,
                    "tags": ["integration", "basic_integrals"]
                }
            ]
        }
    },
    "physics": {
        "mechanics": {
            "easy": [
                {
                    "question": "What is Newton's first law of motion?",
                    "type": "mcq",
                    "options": {
                        "a": "F = ma",
                        "b": "An object at rest stays at rest unless acted upon by a force",
                        "c": "For every action, there is an equal and opposite reaction",
                        "d": "Energy cannot be created or destroyed"
                    },
                    "correct_answer": "b",
                    "explanation": "Newton's first law states that an object at rest stays at rest and an object in motion stays in motion unless acted upon by an external force",
                    "marks": 2,
                    "tags": ["newton_laws", "inertia"]
                },
                {
                    "question": "Calculate the speed of an object that travels 100 meters in 20 seconds",
                    "type": "short_answer",
                    "sample_answer": "5 m/s",
                    "key_points": "Speed = Distance/Time = 100m/20s = 5 m/s",
                    "marks": 3,
                    "tags": ["speed", "kinematics"]
                }
            ],
            "medium": [
                {
                    "question": "A car accelerates from rest to 30 m/s in 10 seconds. What is its acceleration?",
                    "type": "mcq",
                    "options": {"a": "3 m/s²", "b": "30 m/s²", "c": "300 m/s²", "d": "0.3 m/s²"},
                    "correct_answer": "a",
                    "explanation": "a = (v - u)/t = (30 - 0)/10 = 3 m/s²",
                    "marks": 3,
                    "tags": ["acceleration", "kinematics"]
                }
            ]
        },
        "electricity": {
            "easy": [
                {
                    "question": "What is the unit of electric current?",
                    "type": "mcq",
                    "options": {"a": "Volt", "b": "Ampere", "c": "Ohm", "d": "Watt"},
                    "correct_answer": "b",
                    "explanation": "The unit of electric current is Ampere (A)",
                    "marks": 1,
                    "tags": ["units", "current"]
                }
            ]
        }
    },
    "chemistry": {
        "organic_chemistry": {
            "easy": [
                {
                    "question": "What is the molecular formula of methane?",
                    "type": "mcq",
                    "options": {"a": "CH₄", "b": "C₂H₆", "c": "C₃H₈", "d": "C₄H₁₀"},
                    "correct_answer": "a",
                    "explanation": "Methane is the simplest hydrocarbon with formula CH₄",
                    "marks": 1,
                    "tags": ["hydrocarbons", "molecular_formula"]
                },
                {
                    "question": "Name the functional group -OH",
                    "type": "short_answer",
                    "sample_answer": "Hydroxyl group or alcohol group",
                    "key_points": "The -OH group is called hydroxyl group and compounds containing it are alcohols",
                    "marks": 2,
                    "tags": ["functional_groups", "alcohols"]
                }
            ],
            "medium": [
                {
                    "question": "What type of reaction is: CH₄ + 2O₂ → CO₂ + 2H₂O?",
                    "type": "mcq",
                    "options": {"a": "Addition", "b": "Substitution", "c": "Combustion", "d": "Elimination"},
                    "correct_answer": "c",
                    "explanation": "This is a combustion reaction where methane burns in oxygen to produce carbon dioxide and water",
                    "marks": 3,
                    "tags": ["combustion", "reactions"]
                }
            ]
        },
        "inorganic_chemistry": {
            "easy": [
                {
                    "question": "What is the chemical symbol for Gold?",
                    "type": "mcq",
                    "options": {"a": "Go", "b": "Gd", "c": "Au", "d": "Ag"},
                    "correct_answer": "c",
                    "explanation": "Gold's chemical symbol is Au, from the Latin word 'aurum'",
                    "marks": 1,
                    "tags": ["periodic_table", "symbols"]
                }
            ]
        }
    },
    "biology": {
        "cell_biology": {
            "easy": [
                {
                    "question": "What is the powerhouse of the cell?",
                    "type": "mcq",
                    "options": {"a": "Nucleus", "b": "Mitochondria", "c": "Ribosome", "d": "Chloroplast"},
                    "correct_answer": "b",
                    "explanation": "Mitochondria are called the powerhouse of the cell because they produce ATP through cellular respiration",
                    "marks": 2,
                    "tags": ["organelles", "mitochondria"]
                },
                {
                    "question": "What is the function of the cell membrane?",
                    "type": "short_answer",
                    "sample_answer": "Controls what enters and exits the cell; maintains cell shape; provides protection",
                    "key_points": "Selective permeability, protection, structural support, communication",
                    "marks": 3,
                    "tags": ["cell_membrane", "functions"]
                }
            ]
        },
        "genetics": {
            "medium": [
                {
                    "question": "What does DNA stand for?",
                    "type": "mcq",
                    "options": {
                        "a": "Deoxyribonucleic Acid",
                        "b": "Dinitrogen Acid",
                        "c": "Deoxyribose Nucleic Acid",
                        "d": "Deoxy Nucleic Acid"
                    },
                    "correct_answer": "a",
                    "explanation": "DNA stands for Deoxyribonucleic Acid",
                    "marks": 2,
                    "tags": ["dna", "genetics"]
                }
            ]
        }
    },
    "computer_science": {
        "programming": {
            "easy": [
                {
                    "question": "Which of the following is a programming language?",
                    "type": "mcq",
                    "options": {"a": "HTML", "b": "CSS", "c": "Python", "d": "SQL"},
                    "correct_answer": "c",
                    "explanation": "Python is a high-level programming language. HTML and CSS are markup languages, SQL is a query language",
                    "marks": 1,
                    "tags": ["programming_languages", "python"]
                },
                {
                    "question": "What does 'print()' function do in Python?",
                    "type": "short_answer",
                    "sample_answer": "Displays output to the console/screen",
                    "key_points": "Output function, displays text or variables, console output",
                    "marks": 2,
                    "tags": ["python", "functions", "output"]
                }
            ],
            "medium": [
                {
                    "question": "What is the time complexity of binary search?",
                    "type": "mcq",
                    "options": {"a": "O(n)", "b": "O(log n)", "c": "O(n²)", "d": "O(1)"},
                    "correct_answer": "b",
                    "explanation": "Binary search has O(log n) time complexity as it divides the search space in half each iteration",
                    "marks": 3,
                    "tags": ["algorithms", "time_complexity", "binary_search"]
                }
            ]
        }
    }
}

def get_questions_by_criteria(subject=None, topic=None, difficulty=None, question_type=None, tags=None, limit=None):
    """
    Retrieve questions based on specified criteria
    """
    questions = []

    # Normalize subject name if provided
    normalized_subject = _normalize_subject_name(subject) if subject else None

    for subj, topics in STATIC_QUESTION_BANK.items():
        if normalized_subject and subj.lower() != normalized_subject.lower():
            continue
            
        for top, difficulties in topics.items():
            if topic and top.lower() != topic.lower():
                continue
                
            for diff, question_list in difficulties.items():
                if difficulty and diff.lower() != difficulty.lower():
                    continue
                    
                for q in question_list:
                    # Filter by question type
                    if question_type and q.get('type', '').lower() != question_type.lower():
                        continue
                    
                    # Filter by tags
                    if tags:
                        question_tags = q.get('tags', [])
                        if not any(tag.lower() in [t.lower() for t in question_tags] for tag in tags):
                            continue
                    
                    # Add metadata
                    question_copy = q.copy()
                    question_copy['subject'] = subj
                    question_copy['topic'] = top
                    question_copy['difficulty'] = diff
                    question_copy['source'] = 'static_bank'
                    
                    questions.append(question_copy)
    
    # Apply limit if specified
    if limit and len(questions) > limit:
        import random
        questions = random.sample(questions, limit)
    
    return questions

def get_subjects():
    """Get all available subjects"""
    subjects = list(STATIC_QUESTION_BANK.keys())
    # Convert to proper display format
    formatted_subjects = []
    for subject in subjects:
        if subject == "computer_science":
            formatted_subjects.append("Computer Science")
        else:
            formatted_subjects.append(subject.capitalize())
    return formatted_subjects

def get_topics(subject):
    """Get all topics for a subject"""
    return list(STATIC_QUESTION_BANK.get(subject, {}).keys())

def get_question_stats():
    """Get statistics about the question bank"""
    stats = {
        'total_questions': 0,
        'by_subject': {},
        'by_difficulty': {'easy': 0, 'medium': 0, 'hard': 0},
        'by_type': {'mcq': 0, 'short_answer': 0, 'descriptive': 0}
    }
    
    for subject, topics in STATIC_QUESTION_BANK.items():
        subject_count = 0
        for topic, difficulties in topics.items():
            for difficulty, questions in difficulties.items():
                count = len(questions)
                subject_count += count
                stats['total_questions'] += count
                stats['by_difficulty'][difficulty] += count
                
                for q in questions:
                    q_type = q.get('type', 'mcq')
                    stats['by_type'][q_type] = stats['by_type'].get(q_type, 0) + 1
        
        stats['by_subject'][subject] = subject_count
    
    return stats
