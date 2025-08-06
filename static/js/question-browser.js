// Question Browser JavaScript

let selectedQuestions = [];
let currentQuestions = [];

// Show question browser modal
async function showQuestionBrowser() {
    try {
        openModal('question-browser-modal');
        await loadQuestionBrowserData();
    } catch (error) {
        console.error('Error opening question browser:', error);
        showAlert('Failed to open question browser', 'error');
    }
}

// Load initial data for question browser
async function loadQuestionBrowserData() {
    try {
        console.log('Loading question browser data...');
        showLoading(true);

        // Load subjects
        console.log('Loading subjects...');
        await loadSubjectsForBrowser();

        // Load statistics
        console.log('Loading statistics...');
        await loadQuestionStats();

        // Load all questions initially
        console.log('Loading questions...');
        await searchQuestions();

        console.log('Question browser data loaded successfully');
    } catch (error) {
        console.error('Error loading question browser data:', error);
        showAlert('Failed to load question browser data: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// Load subjects for browser
async function loadSubjectsForBrowser() {
    try {
        const response = await apiCall('/question-bank/subjects');
        const subjectSelect = document.getElementById('browser-subject');
        
        // Clear existing options except "All Subjects"
        subjectSelect.innerHTML = '<option value="">All Subjects</option>';
        
        response.subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject; // Subject names are already properly formatted from backend
            subjectSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load subjects:', error);
    }
}

// Load topics for selected subject
async function loadTopicsForBrowser() {
    const subject = document.getElementById('browser-subject').value;
    const topicSelect = document.getElementById('browser-topic');
    
    // Clear topics
    topicSelect.innerHTML = '<option value="">All Topics</option>';
    
    if (!subject) return;
    
    try {
        const response = await apiCall(`/question-bank/topics?subject=${subject}`);
        
        response.topics.forEach(topic => {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = topic.charAt(0).toUpperCase() + topic.slice(1).replace('_', ' ');
            topicSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load topics:', error);
    }
}

// Load question bank statistics
async function loadQuestionStats() {
    try {
        const response = await apiCall('/question-bank/stats');
        displayQuestionStats(response);
    } catch (error) {
        console.error('Failed to load question stats:', error);
    }
}

// Display question statistics
function displayQuestionStats(stats) {
    const statsContainer = document.getElementById('browser-stats');
    
    const statsHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-number">${stats.total_questions}</div>
                <div class="stat-label">Total Questions</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${Object.keys(stats.by_subject).length}</div>
                <div class="stat-label">Subjects</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.by_difficulty.easy}</div>
                <div class="stat-label">Easy</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.by_difficulty.medium}</div>
                <div class="stat-label">Medium</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.by_difficulty.hard}</div>
                <div class="stat-label">Hard</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.by_type.mcq || 0}</div>
                <div class="stat-label">MCQ</div>
            </div>
        </div>
    `;
    
    statsContainer.innerHTML = statsHTML;
}

// Search questions based on filters
async function searchQuestions() {
    try {
        showLoading(true);
        
        const filters = {
            subject: document.getElementById('browser-subject').value,
            topic: document.getElementById('browser-topic').value,
            difficulty: document.getElementById('browser-difficulty').value,
            type: document.getElementById('browser-type').value,
            limit: 50
        };
        
        // Build query string
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) queryParams.append(key, value);
        });
        
        const response = await apiCall(`/question-bank/browse?${queryParams.toString()}`);
        currentQuestions = response.questions;
        
        displayQuestions(response.questions);
        updateResultsTitle(response.total, filters);
        
    } catch (error) {
        showAlert('Failed to search questions', 'error');
    } finally {
        showLoading(false);
    }
}

// Display questions in the browser
function displayQuestions(questions) {
    const container = document.getElementById('questions-list');
    
    if (questions.length === 0) {
        container.innerHTML = '<div class="no-questions">No questions found matching your criteria.</div>';
        return;
    }
    
    const questionsHTML = questions.map((question, index) => `
        <div class="question-card" data-index="${index}">
            <div class="question-header">
                <div class="question-meta">
                    <span class="subject-tag">${question.subject}</span>
                    <span class="topic-tag">${question.topic}</span>
                    <span class="difficulty-tag ${question.difficulty}">${question.difficulty}</span>
                    <span class="type-tag">${question.type}</span>
                    <span class="marks-tag">${question.marks} marks</span>
                </div>
                <div class="question-actions">
                    <input type="checkbox" class="question-select" onchange="toggleQuestionSelection(${index})">
                    <button class="btn btn-sm btn-outline" onclick="previewQuestion(${index})">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                </div>
            </div>
            <div class="question-content">
                <div class="question-text">${question.question}</div>
                ${question.type === 'mcq' ? `
                    <div class="question-options">
                        <div class="options-grid">
                            <div class="option">A) ${question.options.a}</div>
                            <div class="option">B) ${question.options.b}</div>
                            <div class="option">C) ${question.options.c}</div>
                            <div class="option">D) ${question.options.d}</div>
                        </div>
                        <div class="correct-answer">✓ Correct Answer: ${question.correct_answer.toUpperCase()}</div>
                    </div>
                ` : `
                    <div class="question-answer">
                        <strong>Sample Answer:</strong> ${question.sample_answer || 'Not provided'}
                    </div>
                `}
                ${question.explanation ? `
                    <div class="question-explanation">
                        <strong>Explanation:</strong> ${question.explanation}
                    </div>
                ` : ''}
                ${question.tags ? `
                    <div class="question-tags">
                        ${question.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = questionsHTML;
}

// Update results title
function updateResultsTitle(total, filters) {
    const titleElement = document.getElementById('results-title');
    let title = `${total} Questions`;
    
    if (filters.subject) title += ` in ${filters.subject}`;
    if (filters.topic) title += ` - ${filters.topic}`;
    if (filters.difficulty) title += ` (${filters.difficulty})`;
    
    titleElement.textContent = title;
}

// Toggle question selection
function toggleQuestionSelection(index) {
    const question = currentQuestions[index];
    const checkbox = document.querySelector(`[data-index="${index}"] .question-select`);
    
    if (checkbox.checked) {
        if (!selectedQuestions.find(q => q.question === question.question)) {
            selectedQuestions.push(question);
        }
    } else {
        selectedQuestions = selectedQuestions.filter(q => q.question !== question.question);
    }
    
    updateSelectionCount();
}

// Update selection count display
function updateSelectionCount() {
    const count = selectedQuestions.length;
    const createButton = document.querySelector('[onclick="createExamFromSelected()"]');
    
    if (count > 0) {
        createButton.innerHTML = `<i class="fas fa-plus"></i> Create Exam from Selected (${count})`;
        createButton.disabled = false;
    } else {
        createButton.innerHTML = `<i class="fas fa-plus"></i> Create Exam from Selected`;
        createButton.disabled = true;
    }
}

// Clear all filters
function clearFilters() {
    document.getElementById('browser-subject').value = '';
    document.getElementById('browser-topic').value = '';
    document.getElementById('browser-difficulty').value = '';
    document.getElementById('browser-type').value = '';
    
    // Clear topics dropdown
    document.getElementById('browser-topic').innerHTML = '<option value="">All Topics</option>';
    
    // Search with cleared filters
    searchQuestions();
}

// Preview question in modal
function previewQuestion(index) {
    const question = currentQuestions[index];
    // This would open a preview modal - implement as needed
    showAlert('Question preview feature coming soon!', 'info');
}

// Export selected questions
function exportQuestions() {
    if (currentQuestions.length === 0) {
        showAlert('No questions to export', 'warning');
        return;
    }
    
    const questionsToExport = selectedQuestions.length > 0 ? selectedQuestions : currentQuestions;
    const dataStr = JSON.stringify(questionsToExport, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'questions_export.json';
    link.click();
    
    showAlert(`Exported ${questionsToExport.length} questions`, 'success');
}

// Create exam from selected questions
function createExamFromSelected() {
    if (selectedQuestions.length === 0) {
        showAlert('Please select questions first', 'warning');
        return;
    }
    
    // Close browser modal
    closeModal('question-browser-modal');
    
    // Open create exam modal with pre-selected questions
    openModal('create-exam-modal');
    
    // Pre-populate exam with selected questions
    populateExamWithQuestions(selectedQuestions);
    
    showAlert(`Added ${selectedQuestions.length} questions to exam`, 'success');
}

// Populate exam form with selected questions
function populateExamWithQuestions(questions) {
    // Clear existing sections
    document.getElementById('exam-sections').innerHTML = '';
    examSectionCount = 0;
    
    // Group questions by type
    const mcqQuestions = questions.filter(q => q.type === 'mcq');
    const shortAnswerQuestions = questions.filter(q => q.type === 'short_answer');
    const descriptiveQuestions = questions.filter(q => q.type === 'descriptive');
    
    // Create sections for each type
    if (mcqQuestions.length > 0) {
        addPreSelectedSection('Multiple Choice Questions', mcqQuestions, 'mcq');
    }
    
    if (shortAnswerQuestions.length > 0) {
        addPreSelectedSection('Short Answer Questions', shortAnswerQuestions, 'short_answer');
    }
    
    if (descriptiveQuestions.length > 0) {
        addPreSelectedSection('Descriptive Questions', descriptiveQuestions, 'descriptive');
    }
}

// Add pre-selected section to exam form
function addPreSelectedSection(sectionTitle, questions, questionType) {
    examSectionCount++;
    
    const sectionsContainer = document.getElementById('exam-sections');
    
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'exam-section pre-selected-section';
    sectionDiv.id = `section-${examSectionCount}`;
    
    sectionDiv.innerHTML = `
        <div class="section-header">
            <h4>${sectionTitle} (Pre-selected)</h4>
            <div class="pre-selected-badge">📋 ${questions.length} Questions</div>
            <button type="button" class="btn btn-danger" onclick="removeExamSection(${examSectionCount})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        
        <div class="pre-selected-questions-preview">
            <h5>Selected Questions Preview:</h5>
            <div class="questions-list">
                ${questions.slice(0, 3).map((q, index) => `
                    <div class="question-preview">
                        <strong>Q${index + 1}:</strong> ${q.question.substring(0, 100)}${q.question.length > 100 ? '...' : ''}
                    </div>
                `).join('')}
                ${questions.length > 3 ? `<div class="more-questions">... and ${questions.length - 3} more questions</div>` : ''}
            </div>
        </div>
        
        <input type="hidden" class="section-title" value="${sectionTitle}">
        <input type="hidden" class="section-subject" value="${questions[0]?.subject || 'Mixed'}">
        <input type="hidden" class="section-topic" value="${questions[0]?.topic || 'Mixed'}">
        <input type="hidden" class="section-difficulty" value="${questions[0]?.difficulty || 'mixed'}">
        <input type="hidden" class="section-type" value="${questionType}">
        <input type="hidden" class="section-count" value="${questions.length}">
        <input type="hidden" class="section-marks" value="${questions[0]?.marks || 2}">
        <input type="hidden" class="section-ai-ratio" value="0">
        <input type="hidden" class="section-instructions" value="Pre-selected questions from question bank">
        <input type="hidden" class="pre-selected-questions" value='${JSON.stringify(questions)}'>
    `;
    
    sectionsContainer.appendChild(sectionDiv);
    
    // Add styling for pre-selected sections
    sectionDiv.style.border = '2px solid #28a745';
    sectionDiv.style.borderRadius = '8px';
    sectionDiv.style.padding = '1rem';
    sectionDiv.style.marginBottom = '1rem';
    sectionDiv.style.backgroundColor = '#f8fff8';
}
