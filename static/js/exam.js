// Exam related functions

let examSectionCount = 0;

// Exam Taking Variables
let currentExamData = null;
let currentQuestionIndex = 0;
let examStartTime = null;
let examTimer = null;
let examTimeRemaining = 0;
let studentAnswers = {};
let examSubmitted = false;
let isExamActive = false;

// Anti-cheating variables
let tabSwitchCount = 0;
let copyAttempts = 0;
let pasteAttempts = 0;
let rightClickAttempts = 0;

// Load subjects for exam creation
async function loadSubjects() {
    try {
        const data = await apiCall('/subjects');
        const subjectSelect = document.getElementById('exam-subject');
        
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        
        data.subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectSelect.appendChild(option);
        });
    } catch (error) {
        showAlert('Failed to load subjects', 'error');
    }
}

// Load topics for a subject
async function loadTopics(subject, selectElement) {
    try {
        const data = await apiCall(`/topics/${subject}`);
        
        selectElement.innerHTML = '<option value="">Select Topic</option>';
        
        data.topics.forEach(topic => {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = topic;
            selectElement.appendChild(option);
        });
    } catch (error) {
        showAlert('Failed to load topics', 'error');
    }
}

// Add exam section
function addExamSection() {
    alert('🔧 Manual section button clicked!');
    console.log('🔧 addExamSection() called');
    console.log('   - Current examSectionCount:', examSectionCount);

    examSectionCount++;
    console.log('   - New examSectionCount:', examSectionCount);

    const sectionsContainer = document.getElementById('exam-sections');
    console.log('   - Sections container found:', !!sectionsContainer);

    if (!sectionsContainer) {
        console.error('❌ exam-sections container not found!');
        alert('Error: Cannot find exam sections container. Please refresh the page.');
        return;
    }

    console.log('   - Creating section div...');
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'exam-section';
    sectionDiv.id = `section-${examSectionCount}`;
    
    sectionDiv.innerHTML = `
        <div class="section-header">
            <h4>Section ${examSectionCount}</h4>
            <button type="button" class="btn btn-danger" onclick="removeExamSection(${examSectionCount})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Section Title</label>
                <input type="text" class="section-title" value="Section ${examSectionCount}" required>
            </div>
            <div class="form-group">
                <label>Subject</label>
                <select class="section-subject" required onchange="onSectionSubjectChange(this, ${examSectionCount})">
                    <option value="">Select Subject</option>
                </select>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Topic</label>
                <select class="section-topic" required>
                    <option value="">Select Topic</option>
                </select>
            </div>
            <div class="form-group">
                <label>Difficulty</label>
                <select class="section-difficulty" required>
                    <option value="">Select Difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Question Type</label>
                <select class="section-type" required>
                    <option value="">Select Type</option>
                    <option value="mcq">Multiple Choice</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="descriptive">Descriptive</option>
                </select>
            </div>
            <div class="form-group">
                <label>Number of Questions</label>
                <input type="number" class="section-count" min="1" max="500" value="5" required>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Marks per Question</label>
                <input type="number" class="section-marks" min="1" max="1000" value="1" required>
            </div>
            <div class="form-group">
                <label>AI Ratio (0-1)</label>
                <input type="number" class="section-ai-ratio" min="0" max="1" step="0.1" value="0.5" required>
            </div>
        </div>
        
        <div class="form-group">
            <label>Section Instructions</label>
            <textarea class="section-instructions" rows="2" placeholder="Instructions for this section..."></textarea>
        </div>
    `;
    
    sectionsContainer.appendChild(sectionDiv);

    // Load subjects for this section
    loadSubjectsForSection(examSectionCount);

    // Add some styling
    sectionDiv.style.border = '1px solid #ddd';
    sectionDiv.style.borderRadius = '8px';
    sectionDiv.style.padding = '1rem';
    sectionDiv.style.marginBottom = '1rem';
    sectionDiv.style.backgroundColor = '#f9f9f9';

    console.log('✅ Manual section created successfully');
    alert('✅ Manual section added successfully! Fill in the details and click Create Exam.');
}

// Load subjects for a specific section
async function loadSubjectsForSection(sectionId) {
    try {
        const data = await apiCall('/subjects');
        const subjectSelect = document.querySelector(`#section-${sectionId} .section-subject`);
        
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        
        data.subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectSelect.appendChild(option);
        });
    } catch (error) {
        showAlert('Failed to load subjects', 'error');
    }
}

// Handle section subject change
function onSectionSubjectChange(selectElement, sectionId) {
    const subject = selectElement.value;
    const topicSelect = document.querySelector(`#section-${sectionId} .section-topic`);
    
    if (subject) {
        loadTopics(subject, topicSelect);
    } else {
        topicSelect.innerHTML = '<option value="">Select Topic</option>';
    }
}

// Remove exam section
function removeExamSection(sectionId) {
    const sectionElement = document.getElementById(`section-${sectionId}`);
    if (sectionElement) {
        sectionElement.remove();
    }
}

// Generate AI-powered quiz from title
async function generateAIQuiz() {
    console.log('🚀 generateAIQuiz() called');

    const title = document.getElementById('exam-title').value;
    const subject = document.getElementById('exam-subject').value;

    // Get question count - try form field first, then prompt user
    let questionCount = 10;
    const questionCountElement = document.getElementById('ai-question-count');

    if (questionCountElement) {
        questionCount = parseInt(questionCountElement.value) || 10;
        console.log('✅ Found question count field, value:', questionCount);
        alert('✅ Using form field value: ' + questionCount + ' questions');
    } else {
        // Fallback: prompt user for number of questions
        const userInput = prompt('⚠️ Form field not found! How many questions do you want to generate? (1-500)', '10');
        questionCount = parseInt(userInput) || 10;
        console.log('⚠️ Question count field not found, using prompt value:', questionCount);
        alert('⚠️ Using prompt value: ' + questionCount + ' questions');
    }

    // Get difficulty - try form field first, then use default
    let difficulty = 'medium';
    const difficultyElement = document.getElementById('ai-difficulty');

    if (difficultyElement) {
        difficulty = difficultyElement.value || 'medium';
        console.log('✅ Found difficulty field, value:', difficulty);
    } else {
        console.log('⚠️ Difficulty field not found, using default:', difficulty);
    }

    // Get question types - try form fields first, then use defaults
    const questionTypes = [];
    const mcqElement = document.getElementById('ai-type-mcq');
    const shortElement = document.getElementById('ai-type-short');
    const descriptiveElement = document.getElementById('ai-type-descriptive');

    if (mcqElement || shortElement || descriptiveElement) {
        if (mcqElement && mcqElement.checked) questionTypes.push('mcq');
        if (shortElement && shortElement.checked) questionTypes.push('short_answer');
        if (descriptiveElement && descriptiveElement.checked) questionTypes.push('descriptive');
        console.log('✅ Found question type fields, selected:', questionTypes);
    } else {
        // Fallback: use defaults
        questionTypes.push('mcq', 'short_answer');
        console.log('⚠️ Question type fields not found, using defaults:', questionTypes);
    }

    console.log('📊 User Input Values:');
    console.log('   - Title:', title);
    console.log('   - Subject:', subject);
    console.log('   - Question Count:', questionCount);
    console.log('   - Difficulty:', difficulty);
    console.log('   - Question Types:', questionTypes);

    if (!title || !subject) {
        showAlert('Please enter quiz title and select subject first', 'error');
        return;
    }

    if (questionTypes.length === 0) {
        showAlert('Please select at least one question type', 'error');
        return;
    }

    if (questionCount < 1 || questionCount > 500) {
        showAlert('Please enter a valid number of questions (1-500)', 'error');
        return;
    }

    console.log('✅ Validation passed, making API call...');
    showLoading(true);

    try {
        const requestData = {
            quiz_title: title,
            subject: subject,
            difficulty: difficulty,
            count: questionCount, // Use user's input for question count
            question_types: questionTypes // Use user's selected question types
        };

        console.log('📤 API Request Data:', requestData);
        alert('📤 Sending API request for ' + questionCount + ' questions of types: ' + questionTypes.join(', '));

        const response = await apiCall('/generate-quiz-from-title', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });

        console.log('📥 API Response:', response);

        if (response.questions && response.questions.length > 0) {
            // Clear existing sections
            document.getElementById('exam-sections').innerHTML = '';
            examSectionCount = 0;

            // Create sections based on generated questions
            const mcqQuestions = response.questions.filter(q => q.type === 'mcq');
            const shortAnswerQuestions = response.questions.filter(q => q.type === 'short_answer');
            const descriptiveQuestions = response.questions.filter(q => q.type === 'descriptive');

            if (mcqQuestions.length > 0) {
                addAIGeneratedSection('Multiple Choice Questions', mcqQuestions, 'mcq');
            }

            if (shortAnswerQuestions.length > 0) {
                addAIGeneratedSection('Short Answer Questions', shortAnswerQuestions, 'short_answer');
            }

            if (descriptiveQuestions.length > 0) {
                addAIGeneratedSection('Descriptive Questions', descriptiveQuestions, 'descriptive');
            }

            showAlert(`Generated ${response.total_questions} questions using ${response.generation_method}!`, 'success');
        } else {
            showAlert('No questions were generated. Please try again.', 'error');
        }
    } catch (error) {
        showAlert(error.message || 'Failed to generate AI quiz', 'error');
    } finally {
        showLoading(false);
    }
}

// Add AI-generated section to the form
function addAIGeneratedSection(sectionTitle, questions, questionType) {
    examSectionCount++;

    const sectionsContainer = document.getElementById('exam-sections');

    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'exam-section ai-generated-section';
    sectionDiv.id = `section-${examSectionCount}`;

    sectionDiv.innerHTML = `
        <div class="section-header">
            <h4>${sectionTitle} (AI Generated)</h4>
            <div class="ai-badge">🤖 AI Generated</div>
            <button type="button" class="btn btn-danger" onclick="removeExamSection(${examSectionCount})">
                <i class="fas fa-trash"></i>
            </button>
        </div>

        <div class="ai-questions-preview">
            <h5>Generated Questions Preview:</h5>
            <div class="questions-list">
                ${questions.map((q, index) => `
                    <div class="question-preview">
                        <strong>Q${index + 1}:</strong> ${q.question}
                        ${q.type === 'mcq' ? `
                            <div class="options-preview">
                                <small>Options: A) ${q.options.a} B) ${q.options.b} C) ${q.options.c} D) ${q.options.d}</small>
                                <small><strong>Answer:</strong> ${q.correct_answer.toUpperCase()}</small>
                            </div>
                        ` : `
                            <div class="answer-preview">
                                <small><strong>Sample Answer:</strong> ${q.sample_answer}</small>
                            </div>
                        `}
                    </div>
                `).join('')}
            </div>
        </div>

        <input type="hidden" class="section-title" value="${sectionTitle}">
        <input type="hidden" class="section-subject" value="${questions[0]?.subject || 'General'}">
        <input type="hidden" class="section-topic" value="${questions[0]?.topic || 'AI Generated'}">
        <input type="hidden" class="section-difficulty" value="${questions[0]?.difficulty || 'medium'}">
        <input type="hidden" class="section-type" value="${questionType}">
        <input type="hidden" class="section-count" value="${questions.length}">
        <input type="hidden" class="section-marks" value="${questions[0]?.marks || 2}">
        <input type="hidden" class="section-ai-ratio" value="1.0">
        <input type="hidden" class="section-instructions" value="AI-generated questions based on quiz title">
        <input type="hidden" class="ai-questions-data" value='${JSON.stringify(questions)}'>
    `;

    sectionsContainer.appendChild(sectionDiv);

    // Add styling for AI-generated sections
    sectionDiv.style.border = '2px solid #007bff';
    sectionDiv.style.borderRadius = '8px';
    sectionDiv.style.padding = '1rem';
    sectionDiv.style.marginBottom = '1rem';
    sectionDiv.style.backgroundColor = '#f8f9ff';
}

// Add pre-selected section from question bank
function addPreSelectedSection(sectionTitle, questions, questionType) {
    examSectionCount++;

    const sectionsContainer = document.getElementById('exam-sections');

    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'exam-section pre-selected-section';
    sectionDiv.id = `section-${examSectionCount}`;

    sectionDiv.innerHTML = `
        <div class="section-header">
            <h4>${sectionTitle} (From Question Bank)</h4>
            <div class="bank-badge" style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">📚 Question Bank</div>
            <button type="button" class="btn btn-danger" onclick="removeExamSection(${examSectionCount})">
                <i class="fas fa-trash"></i>
            </button>
        </div>

        <div class="bank-questions-preview">
            <h5>Selected Questions Preview:</h5>
            <div class="questions-list">
                ${questions.map((q, index) => `
                    <div class="question-preview">
                        <div class="question-header">
                            <strong>Q${index + 1}:</strong>
                            <span class="question-meta">
                                <span class="difficulty" style="background: ${q.difficulty === 'easy' ? '#28a745' : q.difficulty === 'medium' ? '#ffc107' : '#dc3545'}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${q.difficulty}</span>
                                <span class="marks" style="background: #6c757d; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${q.marks || 1} marks</span>
                            </span>
                        </div>
                        <div class="question-text">${q.question}</div>
                        ${q.type === 'mcq' ? `
                            <div class="options-preview">
                                <small>Options: A) ${q.options.a} B) ${q.options.b} C) ${q.options.c} D) ${q.options.d}</small>
                                <small><strong>Answer:</strong> ${q.correct_answer.toUpperCase()}</small>
                            </div>
                        ` : `
                            <div class="answer-preview">
                                <small><strong>Sample Answer:</strong> ${q.sample_answer || 'Not provided'}</small>
                            </div>
                        `}
                    </div>
                `).join('')}
            </div>
        </div>

        <input type="hidden" class="section-title" value="${sectionTitle}">
        <input type="hidden" class="section-subject" value="${questions[0]?.subject || 'General'}">
        <input type="hidden" class="section-topic" value="${questions[0]?.topic || 'Question Bank'}">
        <input type="hidden" class="section-difficulty" value="${questions[0]?.difficulty || 'medium'}">
        <input type="hidden" class="section-type" value="${questionType}">
        <input type="hidden" class="section-count" value="${questions.length}">
        <input type="hidden" class="section-marks" value="${questions[0]?.marks || 1}">
        <input type="hidden" class="section-ai-ratio" value="0.0">
        <input type="hidden" class="section-instructions" value="Questions selected from question bank">
        <input type="hidden" class="bank-questions-data" value='${JSON.stringify(questions)}'>
    `;

    sectionsContainer.appendChild(sectionDiv);

    // Add styling for question bank sections
    sectionDiv.style.border = '2px solid #28a745';
    sectionDiv.style.borderRadius = '8px';
    sectionDiv.style.padding = '1rem';
    sectionDiv.style.marginBottom = '1rem';
    sectionDiv.style.backgroundColor = '#f8fff8';
}

// Generate AI-powered quiz from title
async function generateAIQuiz() {
    const title = document.getElementById('exam-title').value;
    const subject = document.getElementById('exam-subject').value;

    if (!title || !subject) {
        showAlert('Please enter quiz title and select subject first', 'error');
        return;
    }

    showLoading(true);

    try {
        // Get user input values
        const questionCount = parseInt(document.getElementById('ai-question-count').value) || 10;
        const difficulty = document.getElementById('ai-difficulty').value || 'medium';

        // Get selected question types
        const questionTypes = [];
        if (document.getElementById('ai-type-mcq').checked) questionTypes.push('mcq');
        if (document.getElementById('ai-type-short').checked) questionTypes.push('short_answer');
        if (document.getElementById('ai-type-descriptive').checked) questionTypes.push('descriptive');

        if (questionTypes.length === 0) {
            showAlert('Please select at least one question type', 'error');
            showLoading(false);
            return;
        }

        const response = await apiCall('/generate-quiz-from-title', {
            method: 'POST',
            body: JSON.stringify({
                quiz_title: title,
                subject: subject,
                difficulty: difficulty,
                count: questionCount, // Use user's input for question count
                question_types: questionTypes // Use user's selected question types
            })
        });

        if (response.questions && response.questions.length > 0) {
            // Clear existing sections
            document.getElementById('exam-sections').innerHTML = '';
            examSectionCount = 0;

            // Create sections based on generated questions
            const mcqQuestions = response.questions.filter(q => q.type === 'mcq');
            const shortAnswerQuestions = response.questions.filter(q => q.type === 'short_answer');
            const descriptiveQuestions = response.questions.filter(q => q.type === 'descriptive');

            if (mcqQuestions.length > 0) {
                addAIGeneratedSection('Multiple Choice Questions', mcqQuestions, 'mcq');
            }

            if (shortAnswerQuestions.length > 0) {
                addAIGeneratedSection('Short Answer Questions', shortAnswerQuestions, 'short_answer');
            }

            if (descriptiveQuestions.length > 0) {
                addAIGeneratedSection('Descriptive Questions', descriptiveQuestions, 'descriptive');
            }

            showAlert(`Generated ${response.total_questions} questions using ${response.generation_method}!`, 'success');
        } else {
            showAlert('No questions were generated. Please try again.', 'error');
        }
    } catch (error) {
        showAlert(error.message || 'Failed to generate AI quiz', 'error');
    } finally {
        showLoading(false);
    }
}

// Add AI-generated section to the form
function addAIGeneratedSection(sectionTitle, questions, questionType) {
    examSectionCount++;

    const sectionsContainer = document.getElementById('exam-sections');

    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'exam-section ai-generated-section';
    sectionDiv.id = `section-${examSectionCount}`;

    sectionDiv.innerHTML = `
        <div class="section-header">
            <h4>${sectionTitle} (AI Generated)</h4>
            <div class="ai-badge">🤖 AI Generated</div>
            <button type="button" class="btn btn-danger" onclick="removeExamSection(${examSectionCount})">
                <i class="fas fa-trash"></i>
            </button>
        </div>

        <div class="ai-questions-preview">
            <h5>Generated Questions Preview:</h5>
            <div class="questions-list">
                ${questions.map((q, index) => `
                    <div class="question-preview">
                        <strong>Q${index + 1}:</strong> ${q.question}
                        ${q.type === 'mcq' ? `
                            <div class="options-preview">
                                <small>A) ${q.options.a} B) ${q.options.b} C) ${q.options.c} D) ${q.options.d}</small><br>
                                <small><strong>Answer:</strong> ${q.correct_answer.toUpperCase()}</small>
                            </div>
                        ` : `
                            <div class="answer-preview">
                                <small><strong>Sample Answer:</strong> ${q.sample_answer}</small>
                            </div>
                        `}
                    </div>
                `).join('')}
            </div>
        </div>

        <input type="hidden" class="section-title" value="${sectionTitle}">
        <input type="hidden" class="section-subject" value="${questions[0]?.subject || 'General'}">
        <input type="hidden" class="section-topic" value="${questions[0]?.topic || 'AI Generated'}">
        <input type="hidden" class="section-difficulty" value="${questions[0]?.difficulty || 'medium'}">
        <input type="hidden" class="section-type" value="${questionType}">
        <input type="hidden" class="section-count" value="${questions.length}">
        <input type="hidden" class="section-marks" value="${questions[0]?.marks || 2}">
        <input type="hidden" class="section-ai-ratio" value="1.0">
        <input type="hidden" class="section-instructions" value="AI-generated questions based on quiz title">
        <input type="hidden" class="ai-questions-data" value='${JSON.stringify(questions)}'>
    `;

    sectionsContainer.appendChild(sectionDiv);

    // Add styling for AI-generated sections
    sectionDiv.style.border = '2px solid #007bff';
    sectionDiv.style.borderRadius = '8px';
    sectionDiv.style.padding = '1rem';
    sectionDiv.style.marginBottom = '1rem';
    sectionDiv.style.backgroundColor = '#f8f9ff';
}

// Handle create exam form submission
async function handleCreateExam(event) {
    event.preventDefault();

    const formData = {
        title: document.getElementById('exam-title').value,
        subject: document.getElementById('exam-subject').value,
        duration: parseInt(document.getElementById('exam-duration').value),
        language: document.getElementById('exam-language').value,
        description: document.getElementById('exam-description').value,
        sections: []
    };
    
    // Collect section data
    const sections = document.querySelectorAll('.exam-section');

    if (sections.length === 0) {
        showAlert('Please add at least one section or generate an AI quiz', 'error');
        return;
    }

    for (let section of sections) {
        const sectionData = {
            title: section.querySelector('.section-title').value,
            subject: section.querySelector('.section-subject').value,
            topic: section.querySelector('.section-topic').value,
            difficulty: section.querySelector('.section-difficulty').value,
            type: section.querySelector('.section-type').value,
            count: parseInt(section.querySelector('.section-count').value),
            marks_per_question: parseInt(section.querySelector('.section-marks').value),
            ai_ratio: parseFloat(section.querySelector('.section-ai-ratio').value),
            instructions: section.querySelector('.section-instructions').value
        };

        // Check if this is an AI-generated section
        const aiQuestionsData = section.querySelector('.ai-questions-data');
        if (aiQuestionsData) {
            sectionData.ai_generated_questions = JSON.parse(aiQuestionsData.value);
            sectionData.is_ai_generated = true;
        }

        // Check if this section has pre-selected questions
        const preSelectedQuestionsData = section.querySelector('.pre-selected-questions');
        if (preSelectedQuestionsData) {
            sectionData.pre_selected_questions = JSON.parse(preSelectedQuestionsData.value);
            sectionData.is_pre_selected = true;
        }

        // Validate section data
        if (!sectionData.subject || !sectionData.topic || !sectionData.difficulty || !sectionData.type) {
            showAlert('Please fill all required fields in all sections', 'error');
            return;
        }

        formData.sections.push(sectionData);
    }
    
    showLoading(true);
    
    try {
        const data = await apiCall('/exams', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        console.log('✅ Exam created successfully, response:', data);

        closeModal('create-exam-modal');
        showAlert('Exam created successfully!', 'success');

        // Reset form
        document.getElementById('create-exam-form').reset();
        document.getElementById('exam-sections').innerHTML = '';
        examSectionCount = 0;

        console.log('🔄 Refreshing dashboard to show new exam...');

        // Refresh dashboard with a small delay to ensure backend is updated
        setTimeout(() => {
            refreshDashboard();
            console.log('📊 Dashboard refresh completed');
        }, 1000);
        
    } catch (error) {
        showAlert(error.message || 'Failed to create exam', 'error');
    } finally {
        showLoading(false);
    }
}

// Initialize exam creation
function initializeExamCreation() {
    // Add first section by default
    addExamSection();
}

// Call initialization when create exam modal is shown
document.addEventListener('DOMContentLoaded', function() {
    const createExamModal = document.getElementById('create-exam-modal');
    if (createExamModal) {
        // Add event listener for when modal is shown
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (createExamModal.style.display === 'block' && examSectionCount === 0) {
                        initializeExamCreation();
                    }
                }
            });
        });
        
        observer.observe(createExamModal, {
            attributes: true,
            attributeFilter: ['style']
        });
    }
});

// ==================== EXAM TAKING FUNCTIONALITY ====================

// Start an exam
async function startExam(examId) {
    try {
        console.log('Starting exam with ID:', examId);
        showAlert('Starting exam...', 'info');
        showLoading(true);

        // Validate inputs
        if (!examId) {
            throw new Error('Exam ID is required');
        }

        if (!authToken) {
            throw new Error('Authentication required');
        }

        // Fetch exam data
        console.log('Fetching exam data...');
        const response = await fetch(`${API_BASE}/exams/${examId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error(`Failed to load exam: ${response.status} ${errorText}`);
        }

        const responseData = await response.json();
        console.log('API Response:', responseData);

        // Extract exam data from response
        currentExamData = responseData.exam || responseData;
        console.log('Exam data loaded:', currentExamData);

        // Validate exam data
        if (!currentExamData) {
            throw new Error('No exam data received');
        }

        // Normalize exam data structure - handle multiple possible formats
        console.log('Raw exam data keys:', Object.keys(currentExamData));
        console.log('Full exam data structure:', currentExamData);

        // Try different possible data structures
        let questions = [];
        let title = currentExamData.title;
        let duration = currentExamData.duration || 60;

        if (currentExamData.paper_data) {
            console.log('Found paper_data structure');
            console.log('Paper data keys:', Object.keys(currentExamData.paper_data));

            // Check if questions are directly in paper_data
            if (currentExamData.paper_data.questions && Array.isArray(currentExamData.paper_data.questions)) {
                console.log('Found questions directly in paper_data');
                questions = currentExamData.paper_data.questions;
            }
            // Check if questions are in sections within paper_data
            else if (currentExamData.paper_data.sections && Array.isArray(currentExamData.paper_data.sections)) {
                console.log('Found sections in paper_data, extracting questions');
                currentExamData.paper_data.sections.forEach((section, sectionIndex) => {
                    console.log(`Section ${sectionIndex}:`, section.title, 'Questions:', section.questions?.length || 0);
                    if (section.questions && Array.isArray(section.questions)) {
                        // Add section info to each question for better organization
                        section.questions.forEach((question, questionIndex) => {
                            question.sectionTitle = section.title;
                            question.sectionIndex = sectionIndex;
                            question.questionIndex = questionIndex;
                        });
                        questions = questions.concat(section.questions);
                    }
                });
            }

            title = title || currentExamData.paper_data.title;
            duration = duration || currentExamData.paper_data.duration || 60;
        }
        // Fallback: check if questions are directly in exam data
        else if (currentExamData.questions && Array.isArray(currentExamData.questions)) {
            console.log('Found questions directly in exam data');
            questions = currentExamData.questions;
        }
        // Fallback: check if sections are directly in exam data
        else if (currentExamData.sections && Array.isArray(currentExamData.sections)) {
            console.log('Found sections directly in exam data, extracting questions');
            currentExamData.sections.forEach((section, sectionIndex) => {
                if (section.questions && Array.isArray(section.questions)) {
                    section.questions.forEach((question, questionIndex) => {
                        question.sectionTitle = section.title;
                        question.sectionIndex = sectionIndex;
                        question.questionIndex = questionIndex;
                    });
                    questions = questions.concat(section.questions);
                }
            });
        }

        // Update currentExamData with normalized structure
        currentExamData.questions = questions;
        currentExamData.title = title;
        currentExamData.duration = duration;

        console.log('Final normalized exam data:', {
            title: currentExamData.title,
            duration: currentExamData.duration,
            questionsCount: questions ? questions.length : 0,
            hasQuestions: !!questions,
            firstQuestion: questions && questions.length > 0 ? questions[0] : null
        });

        if (!questions || questions.length === 0) {
            console.error('❌ No questions found after normalization.');
            console.error('Full exam data structure:', JSON.stringify(currentExamData, null, 2));

            // Provide specific error messages based on what we found
            let errorMessage = 'No questions found in exam. ';
            if (currentExamData.paper_data) {
                if (currentExamData.paper_data.sections) {
                    errorMessage += `Found ${currentExamData.paper_data.sections.length} sections, but no questions in them.`;
                } else {
                    errorMessage += 'Found paper_data but no sections or questions.';
                }
            } else {
                errorMessage += 'No paper_data found in exam. The exam may not have been created properly.';
            }

            throw new Error(errorMessage);
        }

        console.log('✅ Successfully extracted', questions.length, 'questions from exam');

        // Initialize exam state
        currentQuestionIndex = 0;
        examStartTime = new Date();
        examTimeRemaining = currentExamData.duration * 60; // Convert minutes to seconds
        studentAnswers = {};
        examSubmitted = false;
        isExamActive = true;

        // Reset anti-cheating counters
        tabSwitchCount = 0;
        copyAttempts = 0;
        pasteAttempts = 0;
        rightClickAttempts = 0;

        // Setup anti-cheating measures
        setupAntiCheating();

        // Auto-close any open modals before showing exam
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal.id !== 'exam-modal') {
                modal.style.display = 'none';
            }
        });

        // Show exam modal
        showExamModal();

        // Start timer
        startExamTimer();

        // Load first question (robust check)
        if (currentExamData.questions && currentExamData.questions.length > 0) {
            loadQuestion(0);
        } else {
            showAlert('No questions found for this exam. Please contact your teacher.', 'error');
            document.getElementById('exam-modal').style.display = 'none';
        }

        showLoading(false);

    } catch (error) {
        showLoading(false);
        showAlert('Failed to start exam: ' + error.message, 'error');
    }
}

// Setup anti-cheating measures
function setupAntiCheating() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', preventRightClick);

    // Disable copy/paste
    document.addEventListener('copy', preventCopy);
    document.addEventListener('paste', preventPaste);
    document.addEventListener('cut', preventCopy);

    // Disable text selection
    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('dragstart', preventSelection);

    // Disable keyboard shortcuts
    document.addEventListener('keydown', preventKeyboardShortcuts);

    // Monitor tab switching
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    // Disable developer tools (basic prevention)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.key === 'U')) {
            e.preventDefault();
            showAlert('Developer tools are disabled during the exam!', 'warning');
            return false;
        }
    });
}

// Anti-cheating event handlers
function preventRightClick(e) {
    e.preventDefault();
    rightClickAttempts++;
    showAlert(`Right-click disabled during exam! (Attempt ${rightClickAttempts})`, 'warning');
    logSecurityEvent('right_click_attempt');
    return false;
}

function preventCopy(e) {
    e.preventDefault();
    copyAttempts++;
    showAlert(`Copy/Cut disabled during exam! (Attempt ${copyAttempts})`, 'warning');
    logSecurityEvent('copy_attempt');
    return false;
}

function preventPaste(e) {
    e.preventDefault();
    pasteAttempts++;
    showAlert(`Paste disabled during exam! (Attempt ${pasteAttempts})`, 'warning');
    logSecurityEvent('paste_attempt');
    return false;
}

function preventSelection(e) {
    e.preventDefault();
    return false;
}

function preventKeyboardShortcuts(e) {
    // Prevent common shortcuts
    if (e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 's' || e.key === 'p')) {
        e.preventDefault();
        showAlert('Keyboard shortcuts are disabled during the exam!', 'warning');
        return false;
    }

    // Prevent Alt+Tab
    if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        showAlert('Alt+Tab is disabled during the exam!', 'warning');
        return false;
    }
}

function handleVisibilityChange() {
    if (document.hidden && isExamActive) {
        tabSwitchCount++;
        logSecurityEvent('tab_switch');
        showAlert(`Warning: Tab switching detected! (Count: ${tabSwitchCount})`, 'error');

        if (tabSwitchCount >= 3) {
            showAlert('Too many tab switches! Exam will be auto-submitted.', 'error');
            setTimeout(() => {
                submitExam(true); // Auto-submit
            }, 2000);
        }
    }
}

function handleWindowBlur() {
    if (isExamActive) {
        logSecurityEvent('window_blur');
    }
}

function handleWindowFocus() {
    if (isExamActive) {
        logSecurityEvent('window_focus');
    }
}

function logSecurityEvent(eventType) {
    // Log security events (could be sent to server)
    console.log(`Security Event: ${eventType} at ${new Date().toISOString()}`);

    // You could send this to the server for monitoring
    // fetch('/api/log-security-event', { ... });
}

// Show exam modal and setup UI
function showExamModal() {
    let modal = document.getElementById('exam-modal');
    // Fallback: dynamically create modal if missing
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'exam-modal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content modal-xl">
                <div class="modal-header">
                    <h2 id="exam-modal-title"><i class="fas fa-clipboard-check"></i> Exam</h2>
                    <div class="exam-timer">
                        <i class="fas fa-clock"></i>
                        <span id="exam-timer">00:00</span>
                    </div>
                </div>
                <div class="modal-body">
                    <div id="exam-content"></div>
                    <div class="exam-navigation">
                        <button class="btn btn-outline" onclick="previousQuestion()" id="prev-btn" disabled>
                            <i class="fas fa-chevron-left"></i>
                            Previous
                        </button>
                        <span id="question-indicator">Question 1 of 10</span>
                        <button class="btn btn-outline" onclick="nextQuestion()" id="next-btn">
                            Next
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="btn btn-primary" onclick="submitExam()" id="submit-btn" style="display: none;">
                            <i class="fas fa-check"></i>
                            Submit Exam
                        </button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);
    }
    const title = document.getElementById('exam-modal-title');
    const examContent = document.getElementById('exam-content');
    const questionIndicator = document.getElementById('question-indicator');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const timer = document.getElementById('exam-timer');

    // Robust safety checks for all required elements
    if (!modal || !title || !examContent || !questionIndicator || !prevBtn || !nextBtn || !submitBtn || !timer) {
        console.error('Exam modal or required elements missing after fallback.');
        showAlert('Exam interface not available (critical elements missing)', 'error');
        return;
    }
    if (!currentExamData || !currentExamData.title) {
        console.error('Exam data not available', currentExamData);
        showAlert('Exam data not loaded', 'error');
        return;
    }

    title.innerHTML = `<i class=\"fas fa-clipboard-check\"></i> ${currentExamData.title}`;
    modal.style.display = 'block';

    // Make modal fullscreen and prevent closing
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.zIndex = '9999';
    modal.style.backgroundColor = 'rgba(0,0,0,0.95)';

    // Remove close button during exam
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.style.display = 'none';
    }

    // Disable body scroll and add exam class
    document.body.style.overflow = 'hidden';
    document.body.classList.add('exam-active');
}

// Start exam timer
function startExamTimer() {
    const timerElement = document.getElementById('exam-timer');

    examTimer = setInterval(() => {
        examTimeRemaining--;

        const hours = Math.floor(examTimeRemaining / 3600);
        const minutes = Math.floor((examTimeRemaining % 3600) / 60);
        const seconds = examTimeRemaining % 60;

        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timerElement.textContent = timeString;

        // Warning when 5 minutes left
        if (examTimeRemaining === 300) {
            showAlert('5 minutes remaining!', 'warning');
            timerElement.style.color = '#ff6b35';
        }

        // Warning when 1 minute left
        if (examTimeRemaining === 60) {
            showAlert('1 minute remaining!', 'error');
            timerElement.style.color = '#ff0000';
            timerElement.style.fontWeight = 'bold';
        }

        // Auto-submit when time is up
        if (examTimeRemaining <= 0) {
            clearInterval(examTimer);
            showAlert('Time is up! Exam will be submitted automatically.', 'error');
            setTimeout(() => {
                submitExam(true);
            }, 2000);
        }
    }, 1000);
}

// Load and display a question
function loadQuestion(questionIndex) {
    if (!currentExamData || !currentExamData.questions || questionIndex >= currentExamData.questions.length) {
        console.error('Invalid question data or index', { currentExamData, questionIndex });
        showAlert('Question data not available', 'error');
        return;
    }

    const question = currentExamData.questions[questionIndex];
    const examContent = document.getElementById('exam-content');
    const questionIndicator = document.getElementById('question-indicator');

    // Safety checks
    if (!examContent) {
        console.error('Exam content container not found');
        showAlert('Exam interface not properly loaded', 'error');
        return;
    }

    if (!questionIndicator) {
        console.error('Question indicator not found');
        showAlert('Exam interface not properly loaded', 'error');
        return;
    }

    // Update question indicator
    questionIndicator.textContent = `Question ${questionIndex + 1} of ${currentExamData.questions.length}`;

    // Create question HTML
    let questionHTML = `
        <div class="question-container">
            <div class="question-header">
                <h3>Question ${questionIndex + 1}</h3>
                <span class="question-marks">${question.marks || 1} mark(s)</span>
            </div>
            <div class="question-text">
                ${question.question}
            </div>
    `;

    // Add options based on question type
    if (question.type === 'mcq' && question.options) {
        questionHTML += '<div class="question-options">';
        Object.entries(question.options).forEach(([key, value]) => {
            const isChecked = studentAnswers[questionIndex] === key ? 'checked' : '';
            questionHTML += `
                <label class="option-label">
                    <input type="radio" name="question_${questionIndex}" value="${key}" ${isChecked}
                           onchange="saveAnswer(${questionIndex}, '${key}')">
                    <span class="option-text">${key.toUpperCase()}. ${value}</span>
                </label>
            `;
        });
        questionHTML += '</div>';
    } else {
        // Text answer for short answer or descriptive questions
        const savedAnswer = studentAnswers[questionIndex] || '';
        const placeholder = question.type === 'short_answer' ? 'Enter your short answer...' : 'Enter your detailed answer...';
        const rows = question.type === 'descriptive' ? 8 : 3;

        questionHTML += `
            <div class="question-answer">
                <textarea name="question_${questionIndex}" rows="${rows}"
                          placeholder="${placeholder}"
                          onchange="saveAnswer(${questionIndex}, this.value)"
                          oninput="saveAnswer(${questionIndex}, this.value)">${savedAnswer}</textarea>
            </div>
        `;
    }

    questionHTML += '</div>';

    examContent.innerHTML = questionHTML;

    // Update navigation buttons
    updateNavigationButtons();
}

// Save student answer
function saveAnswer(questionIndex, answer) {
    studentAnswers[questionIndex] = answer;

    // Visual feedback
    const questionIndicator = document.getElementById('question-indicator');
    questionIndicator.style.color = '#28a745';
    setTimeout(() => {
        questionIndicator.style.color = '';
    }, 1000);
}

// Update navigation buttons
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');

    // Previous button
    prevBtn.disabled = currentQuestionIndex === 0;

    // Next/Submit button
    if (currentQuestionIndex === currentExamData.questions.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-flex';
    } else {
        nextBtn.style.display = 'inline-flex';
        submitBtn.style.display = 'none';
    }
}

// Navigation functions
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion(currentQuestionIndex);
    }
}

function nextQuestion() {
    if (currentQuestionIndex < currentExamData.questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion(currentQuestionIndex);
    }
}

// Submit exam
async function submitExam(autoSubmit = false) {
    if (examSubmitted) {
        return;
    }

    // Confirm submission unless auto-submit
    if (!autoSubmit) {
        const unansweredCount = currentExamData.questions.length - Object.keys(studentAnswers).length;
        let confirmMessage = 'Are you sure you want to submit your exam?';

        if (unansweredCount > 0) {
            confirmMessage += `\n\nYou have ${unansweredCount} unanswered question(s).`;
        }

        if (!confirm(confirmMessage)) {
            return;
        }
    }

    try {
        showLoading(true);
        examSubmitted = true;
        isExamActive = false;

        // Stop timer
        if (examTimer) {
            clearInterval(examTimer);
        }

        // Calculate time taken
        const timeTaken = Math.floor((new Date() - examStartTime) / 1000);

        // Prepare submission data
        const submissionData = {
            exam_id: currentExamData._id,
            answers: studentAnswers,
            time_taken: timeTaken,
            auto_submitted: autoSubmit,
            security_events: {
                tab_switches: tabSwitchCount,
                copy_attempts: copyAttempts,
                paste_attempts: pasteAttempts,
                right_click_attempts: rightClickAttempts
            }
        };

        // Submit to server
        const response = await fetch(`${API_BASE}/exams/${currentExamData._id}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(submissionData)
        });

        if (!response.ok) {
            throw new Error('Failed to submit exam');
        }

        const result = await response.json();

        // Remove anti-cheating measures
        removeAntiCheating();

        // Show results
        showExamResults(result);

        showLoading(false);

    } catch (error) {
        showLoading(false);
        examSubmitted = false;
        isExamActive = true;
        showAlert('Failed to submit exam: ' + error.message, 'error');
    }
}

// Remove anti-cheating measures
function removeAntiCheating() {
    document.removeEventListener('contextmenu', preventRightClick);
    document.removeEventListener('copy', preventCopy);
    document.removeEventListener('paste', preventPaste);
    document.removeEventListener('cut', preventCopy);
    document.removeEventListener('selectstart', preventSelection);
    document.removeEventListener('dragstart', preventSelection);
    document.removeEventListener('keydown', preventKeyboardShortcuts);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('focus', handleWindowFocus);

    // Re-enable body scroll and remove exam class
    document.body.style.overflow = '';
    document.body.classList.remove('exam-active');
}

// Show exam results
function showExamResults(result) {
    // Close exam modal
    document.getElementById('exam-modal').style.display = 'none';

    // Create or get result dashboard modal
    let resultDashboard = document.getElementById('result-dashboard-modal');
    if (!resultDashboard) {
        resultDashboard = document.createElement('div');
        resultDashboard.id = 'result-dashboard-modal';
        resultDashboard.className = 'modal';
        resultDashboard.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2><i class="fas fa-trophy"></i> Your Performance</h2>
                    <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
                </div>
                <div class="modal-body" id="result-dashboard-content"></div>
            </div>`;
        document.body.appendChild(resultDashboard);
    }
    const resultContent = document.getElementById('result-dashboard-content');

    // Calculate statistics
    const totalQuestions = currentExamData.questions.length;
    const answeredQuestions = Object.keys(studentAnswers).length;
    const correctAnswers = result.correct_answers || 0;
    const score = result.score || 0;
    const percentage = result.percentage || 0;
    const grade = getGrade(percentage);
    const timeTaken = formatTime(result.time_taken || 0);

    // Feedback logic
    let feedback = '';
    if (percentage >= 90) {
        feedback = 'Outstanding performance! You have mastered the material.';
    } else if (percentage >= 75) {
        feedback = 'Great job! Keep up the good work and aim for perfection.';
    } else if (percentage >= 60) {
        feedback = 'Good effort! Review the questions you missed to improve further.';
    } else if (percentage >= 40) {
        feedback = 'You passed, but there is room for improvement. Study the material and try again.';
    } else {
        feedback = 'Don’t be discouraged. Review your mistakes and keep practicing!';
    }

    // Create result dashboard HTML
    let dashboardHTML = `
        <div class="results-summary" style="text-align:center;">
            <div class="score-display" style="margin-bottom: 20px;">
                <div class="score-circle ${getScoreClass(percentage)}" style="margin: 0 auto;">
                    <span class="score-percentage" style="font-size:2.5rem;">${percentage}%</span>
                    <span class="score-grade" style="font-size:1.2rem;">${grade}</span>
                </div>
            </div>
            <div class="results-stats" style="margin-bottom: 20px;">
                <div class="stat-row"><span class="stat-label">Score:</span> <span class="stat-value">${score}/${result.total_marks || totalQuestions}</span></div>
                <div class="stat-row"><span class="stat-label">Correct Answers:</span> <span class="stat-value">${correctAnswers}/${totalQuestions}</span></div>
                <div class="stat-row"><span class="stat-label">Questions Answered:</span> <span class="stat-value">${answeredQuestions}/${totalQuestions}</span></div>
                <div class="stat-row"><span class="stat-label">Time Taken:</span> <span class="stat-value">${timeTaken}</span></div>
                <div class="stat-row"><span class="stat-label">Exam Duration:</span> <span class="stat-value">${currentExamData.duration} minutes</span></div>
            </div>
            <div class="feedback-box" style="background: #f7fafc; border-left: 4px solid #667eea; padding: 18px; border-radius: 10px; margin-bottom: 20px;">
                <h4 style="margin-bottom: 8px; color: #667eea;"><i class="fas fa-lightbulb"></i> Feedback</h4>
                <p style="font-size: 1.1rem; color: #2d3748;">${feedback}</p>
            </div>
            <button class="btn btn-primary" onclick="document.getElementById('result-dashboard-modal').style.display='none'; refreshDashboard();">Go to Dashboard</button>
        </div>
    `;

    resultContent.innerHTML = dashboardHTML;
    resultDashboard.style.display = 'block';

    // Refresh dashboard to update student progress
    setTimeout(() => {
        if (currentUser && currentUser.role === 'student') {
            loadStudentDashboard();
        }
    }, 1000);
}

// Utility functions for results
function getGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
}

function getScoreClass(percentage) {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    return 'poor';
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// View detailed results with answers
function viewDetailedResults() {
    const resultsContent = document.getElementById('results-content');

    let detailedHTML = `
        <div class="detailed-results">
            <div class="results-header">
                <h3><i class="fas fa-list-alt"></i> Detailed Answer Review</h3>
                <button class="btn btn-outline btn-sm" onclick="showExamResults(lastExamResult)">
                    <i class="fas fa-arrow-left"></i> Back to Summary
                </button>
            </div>

            <div class="questions-review">
    `;

    currentExamData.questions.forEach((question, index) => {
        const studentAnswer = studentAnswers[index];
        const correctAnswer = question.correct_answer;
        const isCorrect = studentAnswer === correctAnswer;
        const statusClass = isCorrect ? 'correct' : 'incorrect';
        const statusIcon = isCorrect ? 'fas fa-check-circle' : 'fas fa-times-circle';

        detailedHTML += `
            <div class="question-review ${statusClass}">
                <div class="question-review-header">
                    <h4>Question ${index + 1} <i class="${statusIcon}"></i></h4>
                    <span class="question-marks">${question.marks || 1} mark(s)</span>
                </div>

                <div class="question-review-text">
                    ${question.question}
                </div>
        `;

        if (question.type === 'mcq' && question.options) {
            detailedHTML += '<div class="options-review">';
            Object.entries(question.options).forEach(([key, value]) => {
                let optionClass = '';
                if (key === correctAnswer) optionClass = 'correct-option';
                if (key === studentAnswer && key !== correctAnswer) optionClass = 'incorrect-option';
                if (key === studentAnswer && key === correctAnswer) optionClass = 'correct-selected';

                detailedHTML += `
                    <div class="option-review ${optionClass}">
                        ${key.toUpperCase()}. ${value}
                        ${key === correctAnswer ? '<i class="fas fa-check"></i>' : ''}
                        ${key === studentAnswer && key !== correctAnswer ? '<i class="fas fa-times"></i>' : ''}
                    </div>
                `;
            });
            detailedHTML += '</div>';
        } else {
            // Text answer
            detailedHTML += `
                <div class="text-answer-review">
                    <div class="student-answer">
                        <strong>Your Answer:</strong>
                        <div class="answer-text">${studentAnswer || '<em>No answer provided</em>'}</div>
                    </div>
                    ${question.sample_answer ? `
                        <div class="sample-answer">
                            <strong>Sample Answer:</strong>
                            <div class="answer-text">${question.sample_answer}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        if (question.explanation) {
            detailedHTML += `
                <div class="explanation">
                    <strong><i class="fas fa-lightbulb"></i> Explanation:</strong>
                    <p>${question.explanation}</p>
                </div>
            `;
        }

        detailedHTML += '</div>';
    });

    detailedHTML += `
            </div>
        </div>
    `;

    resultsContent.innerHTML = detailedHTML;
}

// Store last exam result for navigation
let lastExamResult = null;

// Modified showExamResults to store result
const originalShowExamResults = showExamResults;
showExamResults = function(result) {
    lastExamResult = result;
    originalShowExamResults(result);
};

// Emergency exit function (for testing purposes)
function emergencyExitExam() {
    if (confirm('Are you sure you want to exit the exam? This will submit your current answers.')) {
        submitExam(true);
    }
}

// Debug function to test exam data
function debugExamData() {
    console.log('Current exam data:', currentExamData);
    console.log('Auth token:', authToken);
    console.log('API Base:', API_BASE);

    if (currentExamData) {
        console.log('Exam title:', currentExamData.title);
        console.log('Exam questions:', currentExamData.questions);
        console.log('Exam duration:', currentExamData.duration);
    }
}

// Make debug function available globally
window.debugExamData = debugExamData;

// Test function to manually start an exam (for debugging)
async function testStartExam(examId) {
    console.log('Testing exam start with ID:', examId);
    try {
        await startExam(examId);
        console.log('Exam started successfully');
    } catch (error) {
        console.error('Failed to start exam:', error);
        showAlert('Failed to start exam: ' + error.message, 'error');
    }
}

// Make test function available globally
window.testStartExam = testStartExam;

// Function to test with a known exam ID from the logs
function testWithKnownExam() {
    const examId = '6891d279bd417e997b47c35a'; // From the server logs
    console.log('Testing with known exam ID:', examId);
    testStartExam(examId);
}

window.testWithKnownExam = testWithKnownExam;

// Quick test function to check if exam system works
async function quickExamTest() {
    console.log('Running quick exam test...');

    // First check if user is logged in
    if (!authToken) {
        console.log('No auth token, testing login first...');
        const loginSuccess = await testLogin();
        if (!loginSuccess) {
            console.error('Login test failed, cannot test exam');
            return false;
        }
    }

    // Try to get available exams
    try {
        const response = await fetch(`${API_BASE}/exams`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Available exams:', data);

            if (data.exams && data.exams.length > 0) {
                const firstExam = data.exams[0];
                console.log('Testing with first available exam:', firstExam._id);
                await testStartExam(firstExam._id);
                return true;
            } else {
                console.log('No exams available for testing');
                showAlert('No exams available. Please create an exam first.', 'info');
                return false;
            }
        } else {
            console.error('Failed to get exams:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Error in quick exam test:', error);
        return false;
    }
}

window.quickExamTest = quickExamTest;

// Test function to check exam data structure
async function testExamStructure(examId) {
    console.log('Testing exam structure for ID:', examId);

    if (!authToken) {
        console.log('No auth token, please login first');
        return false;
    }

    try {
        const response = await fetch(`${API_BASE}/exams/${examId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('📋 Exam API Response:', data);

            const exam = data.exam || data;
            console.log('📊 Exam Structure Analysis:');
            console.log('  - Title:', exam.title);
            console.log('  - Subject:', exam.subject);
            console.log('  - Duration:', exam.duration);
            console.log('  - Has paper_data:', !!exam.paper_data);

            if (exam.paper_data) {
                console.log('  - Paper data keys:', Object.keys(exam.paper_data));
                console.log('  - Has sections:', !!exam.paper_data.sections);

                if (exam.paper_data.sections) {
                    console.log('  - Number of sections:', exam.paper_data.sections.length);
                    exam.paper_data.sections.forEach((section, index) => {
                        console.log(`    Section ${index + 1}: ${section.title} (${section.questions?.length || 0} questions)`);
                    });
                }
            }

            return exam;
        } else {
            console.error('Failed to fetch exam:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Error testing exam structure:', error);
        return false;
    }
}

window.testExamStructure = testExamStructure;

// Test with the newly created exam
async function testNewExam() {
    const examId = '689233244454f0140f6bb1f7'; // From the creation script
    console.log('Testing with newly created exam...');
    await testExamStructure(examId);
    await testStartExam(examId);
}

window.testNewExam = testNewExam;
