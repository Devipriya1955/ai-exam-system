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
    examSectionCount++;
    
    const sectionsContainer = document.getElementById('exam-sections');
    
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
                <input type="number" class="section-count" min="1" max="50" value="5" required>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Marks per Question</label>
                <input type="number" class="section-marks" min="1" max="100" value="1" required>
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
    const title = document.getElementById('exam-title').value;
    const subject = document.getElementById('exam-subject').value;

    if (!title || !subject) {
        showAlert('Please enter quiz title and select subject first', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await apiCall('/generate-quiz-from-title', {
            method: 'POST',
            body: JSON.stringify({
                quiz_title: title,
                subject: subject,
                difficulty: 'medium',
                count: 5,
                question_types: ['mcq', 'short_answer']
            })
        });

        if (response.questions && response.questions.length > 0) {
            // Clear existing sections
            document.getElementById('exam-sections').innerHTML = '';
            examSectionCount = 0;

            // Create sections based on generated questions
            const mcqQuestions = response.questions.filter(q => q.type === 'mcq');
            const shortAnswerQuestions = response.questions.filter(q => q.type === 'short_answer');

            if (mcqQuestions.length > 0) {
                addAIGeneratedSection('Multiple Choice Questions', mcqQuestions, 'mcq');
            }

            if (shortAnswerQuestions.length > 0) {
                addAIGeneratedSection('Short Answer Questions', shortAnswerQuestions, 'short_answer');
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
        const response = await apiCall('/generate-quiz-from-title', {
            method: 'POST',
            body: JSON.stringify({
                quiz_title: title,
                subject: subject,
                difficulty: 'medium',
                count: 5,
                question_types: ['mcq', 'short_answer']
            })
        });

        if (response.questions && response.questions.length > 0) {
            // Clear existing sections
            document.getElementById('exam-sections').innerHTML = '';
            examSectionCount = 0;

            // Create sections based on generated questions
            const mcqQuestions = response.questions.filter(q => q.type === 'mcq');
            const shortAnswerQuestions = response.questions.filter(q => q.type === 'short_answer');

            if (mcqQuestions.length > 0) {
                addAIGeneratedSection('Multiple Choice Questions', mcqQuestions, 'mcq');
            }

            if (shortAnswerQuestions.length > 0) {
                addAIGeneratedSection('Short Answer Questions', shortAnswerQuestions, 'short_answer');
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
        
        closeModal('create-exam-modal');
        showAlert('Exam created successfully!', 'success');
        
        // Reset form
        document.getElementById('create-exam-form').reset();
        document.getElementById('exam-sections').innerHTML = '';
        examSectionCount = 0;
        
        // Refresh dashboard
        refreshDashboard();
        
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

        // Show exam modal
        showExamModal();

        // Start timer
        startExamTimer();

        // Load first question
        loadQuestion(0);

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
    const modal = document.getElementById('exam-modal');
    const title = document.getElementById('exam-modal-title');

    // Safety checks
    if (!modal) {
        console.error('Exam modal not found');
        showAlert('Exam interface not available', 'error');
        return;
    }

    if (!title) {
        console.error('Exam modal title not found');
        showAlert('Exam interface not properly loaded', 'error');
        return;
    }

    if (!currentExamData || !currentExamData.title) {
        console.error('Exam data not available', currentExamData);
        showAlert('Exam data not loaded', 'error');
        return;
    }

    title.innerHTML = `<i class="fas fa-clipboard-check"></i> ${currentExamData.title}`;
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

    // Show results modal
    const resultsModal = document.getElementById('results-modal');
    const resultsContent = document.getElementById('results-content');

    // Calculate statistics
    const totalQuestions = currentExamData.questions.length;
    const answeredQuestions = Object.keys(studentAnswers).length;
    const correctAnswers = result.correct_answers || 0;
    const score = result.score || 0;
    const percentage = result.percentage || 0;
    const grade = getGrade(percentage);
    const timeTaken = formatTime(result.time_taken || 0);

    // Create results HTML
    let resultsHTML = `
        <div class="results-summary">
            <div class="score-display">
                <div class="score-circle ${getScoreClass(percentage)}">
                    <span class="score-percentage">${percentage}%</span>
                    <span class="score-grade">${grade}</span>
                </div>
            </div>

            <div class="results-stats">
                <div class="stat-row">
                    <span class="stat-label">Score:</span>
                    <span class="stat-value">${score}/${result.total_marks || totalQuestions}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Correct Answers:</span>
                    <span class="stat-value">${correctAnswers}/${totalQuestions}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Questions Answered:</span>
                    <span class="stat-value">${answeredQuestions}/${totalQuestions}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Time Taken:</span>
                    <span class="stat-value">${timeTaken}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Exam Duration:</span>
                    <span class="stat-value">${currentExamData.duration} minutes</span>
                </div>
            </div>
        </div>
    `;

    // Add security events if any
    if (tabSwitchCount > 0 || copyAttempts > 0 || pasteAttempts > 0 || rightClickAttempts > 0) {
        resultsHTML += `
            <div class="security-events">
                <h4><i class="fas fa-shield-alt"></i> Security Events</h4>
                <div class="security-stats">
                    <div class="security-item">Tab Switches: ${tabSwitchCount}</div>
                    <div class="security-item">Copy Attempts: ${copyAttempts}</div>
                    <div class="security-item">Paste Attempts: ${pasteAttempts}</div>
                    <div class="security-item">Right-click Attempts: ${rightClickAttempts}</div>
                </div>
            </div>
        `;
    }

    resultsContent.innerHTML = resultsHTML;
    resultsModal.style.display = 'block';

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
