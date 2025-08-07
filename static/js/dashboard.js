// Dashboard related functions

// Load teacher dashboard
async function loadTeacherDashboard() {
    try {
        console.log('Loading teacher dashboard...');
        const data = await apiCall('/dashboard/teacher');
        console.log('Teacher dashboard data:', data);

        // Update statistics with safety checks
        const totalExamsEl = document.getElementById('total-exams');
        const totalResponsesEl = document.getElementById('total-responses');

        if (totalExamsEl) totalExamsEl.textContent = data.total_exams || 0;
        if (totalResponsesEl) totalResponsesEl.textContent = data.total_responses || 0;

        // Load recent exams
        console.log('📋 Recent exams from API:', data.recent_exams);
        loadRecentExams(data.recent_exams || []);

        console.log('✅ Teacher dashboard loaded successfully');
    } catch (error) {
        console.error('Teacher dashboard error:', error);
        showAlert('Failed to load teacher dashboard: ' + error.message, 'error');
    }
}

// Load student dashboard
async function loadStudentDashboard() {
    try {
        console.log('Loading student dashboard...');
        const data = await apiCall('/dashboard/student');
        console.log('Student dashboard data:', data);

        // Update statistics with safety checks
        const availableExamsEl = document.getElementById('available-exams');
        const completedExamsEl = document.getElementById('completed-exams');
        const avgScoreEl = document.getElementById('student-avg-score');

        if (availableExamsEl) availableExamsEl.textContent = data.available_exams || 0;
        if (completedExamsEl) completedExamsEl.textContent = data.completed_exams || 0;
        if (avgScoreEl) avgScoreEl.textContent = `${data.average_score || 0}%`;

        // Load available exams
        loadAvailableExams(data.available_exams_list || []);

        // Load recent results
        loadRecentResults(data.recent_results || []);

        // Load additional student features
        loadStudentProgress(data);
        loadUpcomingExams(data.upcoming_exams || []);
        loadStudentAchievements(data);
        loadStudentCalendar();

        console.log('Student dashboard loaded successfully');
    } catch (error) {
        console.error('Student dashboard error:', error);
        showAlert('Failed to load student dashboard: ' + error.message, 'error');
    }
}

// Load recent exams for teacher
function loadRecentExams(exams) {
    console.log('📚 Loading recent exams:', exams);
    console.log('📊 Number of exams received:', exams.length);

    const container = document.getElementById('recent-exams-list');
    if (!container) {
        console.error('❌ recent-exams-list container not found!');
        return;
    }

    container.innerHTML = '';

    if (exams.length === 0) {
        console.log('⚠️ No exams to display');
        container.innerHTML = '<p class="no-data">No exams created yet.</p>';
        return;
    }

    console.log('✅ Displaying', exams.length, 'exams');
    
    exams.forEach(exam => {
        const examCard = createExamCard(exam, true);
        container.appendChild(examCard);
    });
}

// Load available exams for student
function loadAvailableExams(exams) {
    const container = document.getElementById('available-exams-list');
    container.innerHTML = '';
    
    if (exams.length === 0) {
        container.innerHTML = '<p class="no-data">No exams available.</p>';
        return;
    }
    
    exams.forEach(exam => {
        const examCard = createExamCard(exam, false);
        container.appendChild(examCard);
    });
}

// Load recent results for student
function loadRecentResults(results) {
    const container = document.getElementById('recent-results-list');
    container.innerHTML = '';
    
    if (results.length === 0) {
        container.innerHTML = '<p class="no-data">No results yet.</p>';
        return;
    }
    
    results.forEach(result => {
        const resultCard = createResultCard(result);
        container.appendChild(resultCard);
    });
}

// Create exam card element
function createExamCard(exam, isTeacher) {
    const card = document.createElement('div');
    card.className = 'exam-card';
    
    const title = document.createElement('h3');
    title.textContent = exam.title;
    
    const meta = document.createElement('div');
    meta.className = 'exam-meta';
    
    const subject = document.createElement('span');
    subject.className = 'meta-item';
    subject.innerHTML = `<i class="fas fa-book"></i> ${exam.subject}`;
    
    const duration = document.createElement('span');
    duration.className = 'meta-item';
    duration.innerHTML = `<i class="fas fa-clock"></i> ${formatDuration(exam.duration)}`;
    
    const marks = document.createElement('span');
    marks.className = 'meta-item';
    marks.innerHTML = `<i class="fas fa-star"></i> ${exam.total_marks} marks`;
    
    meta.appendChild(subject);
    meta.appendChild(duration);
    meta.appendChild(marks);
    
    const actions = document.createElement('div');
    actions.className = 'exam-actions';
    
    if (isTeacher) {
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-outline';
        viewBtn.innerHTML = '<i class="fas fa-eye"></i> View';
        viewBtn.onclick = () => viewExam(exam._id);
        
        const responsesBtn = document.createElement('button');
        responsesBtn.className = 'btn btn-primary';
        responsesBtn.innerHTML = '<i class="fas fa-users"></i> Responses';
        responsesBtn.onclick = () => viewExamResponses(exam._id);
        
        actions.appendChild(viewBtn);
        actions.appendChild(responsesBtn);
    } else {
        const takeBtn = document.createElement('button');
        takeBtn.className = 'btn btn-primary';
        takeBtn.innerHTML = '<i class="fas fa-play"></i> Take Exam';
        takeBtn.onclick = () => takeExam(exam._id);
        
        actions.appendChild(takeBtn);
    }
    
    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(actions);
    
    return card;
}

// Create result card element
function createResultCard(result) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    const title = document.createElement('h3');
    title.textContent = result.exam_title;
    
    const meta = document.createElement('div');
    meta.className = 'result-meta';
    
    const score = document.createElement('span');
    score.className = 'meta-item';
    score.innerHTML = `<i class="fas fa-star"></i> ${result.evaluation.total_score}/${result.evaluation.max_score}`;
    
    const percentage = document.createElement('span');
    percentage.className = 'meta-item';
    percentage.innerHTML = `<i class="fas fa-percent"></i> ${result.evaluation.percentage}%`;
    
    const grade = document.createElement('span');
    grade.className = 'meta-item';
    grade.innerHTML = `<i class="fas fa-medal"></i> Grade ${result.evaluation.grade}`;
    
    const date = document.createElement('span');
    date.className = 'meta-item';
    date.innerHTML = `<i class="fas fa-calendar"></i> ${formatDate(result.submitted_at)}`;
    
    meta.appendChild(score);
    meta.appendChild(percentage);
    meta.appendChild(grade);
    meta.appendChild(date);
    
    const actions = document.createElement('div');
    actions.className = 'result-actions';
    
    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-outline';
    viewBtn.innerHTML = '<i class="fas fa-eye"></i> View Details';
    viewBtn.onclick = () => viewResult(result._id);
    
    actions.appendChild(viewBtn);
    
    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(actions);
    
    return card;
}

// Dashboard action functions
async function viewExam(examId) {
    try {
        showLoading(true);
        const response = await apiCall(`/exams/${examId}`);
        const exam = response.exam;

        // Create exam view modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1000px; max-height: 85vh; overflow-y: auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div class="modal-header" style="background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-bottom: 3px solid #667eea; padding: 25px; border-radius: 12px 12px 0 0;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="background: linear-gradient(45deg, #667eea, #764ba2); padding: 12px; border-radius: 50%; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                            <i class="fas fa-file-alt" style="font-size: 24px;"></i>
                        </div>
                        <div>
                            <h2 style="margin: 0; color: #2d3748; font-size: 28px; font-weight: 700;">${exam.title}</h2>
                            <p style="margin: 5px 0 0 0; color: #718096; font-size: 16px;">Exam Preview & Details</p>
                        </div>
                    </div>
                    <span class="close" onclick="this.closest('.modal').remove()" style="font-size: 28px; color: #a0aec0; cursor: pointer; transition: all 0.3s ease; padding: 5px;" onmouseover="this.style.color='#e53e3e'; this.style.transform='scale(1.1)'" onmouseout="this.style.color='#a0aec0'; this.style.transform='scale(1)'">&times;</span>
                </div>
                <div class="modal-body" style="padding: 30px; background: rgba(255,255,255,0.98); margin: 0; border-radius: 0 0 12px 12px;">
                    <div class="exam-info" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
                        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 8px 25px rgba(79, 172, 254, 0.3); transform: translateY(0); transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 12px 35px rgba(79, 172, 254, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(79, 172, 254, 0.3)'">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                <i class="fas fa-book" style="font-size: 20px;"></i>
                                <span style="font-weight: 600; font-size: 14px; opacity: 0.9;">SUBJECT</span>
                            </div>
                            <div style="font-size: 18px; font-weight: 700;">${exam.subject}</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 20px; border-radius: 12px; color: white; box-shadow: 0 8px 25px rgba(250, 112, 154, 0.3); transform: translateY(0); transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 12px 35px rgba(250, 112, 154, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(250, 112, 154, 0.3)'">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                <i class="fas fa-clock" style="font-size: 20px;"></i>
                                <span style="font-weight: 600; font-size: 14px; opacity: 0.9;">DURATION</span>
                            </div>
                            <div style="font-size: 18px; font-weight: 700;">${exam.duration} minutes</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 20px; border-radius: 12px; color: #2d3748; box-shadow: 0 8px 25px rgba(168, 237, 234, 0.3); transform: translateY(0); transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 12px 35px rgba(168, 237, 234, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(168, 237, 234, 0.3)'">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                <i class="fas fa-star" style="font-size: 20px; color: #f6ad55;"></i>
                                <span style="font-weight: 600; font-size: 14px; opacity: 0.8;">TOTAL MARKS</span>
                            </div>
                            <div style="font-size: 18px; font-weight: 700;">${exam.total_marks} points</div>
                        </div>
                        <div style="background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%); padding: 20px; border-radius: 12px; color: #2d3748; box-shadow: 0 8px 25px rgba(210, 153, 194, 0.3); transform: translateY(0); transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 12px 35px rgba(210, 153, 194, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(210, 153, 194, 0.3)'">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                <i class="fas fa-calendar-alt" style="font-size: 20px; color: #9f7aea;"></i>
                                <span style="font-weight: 600; font-size: 14px; opacity: 0.8;">CREATED</span>
                            </div>
                            <div style="font-size: 16px; font-weight: 600;">${new Date(exam.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>
                    ${exam.description ? `
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; margin-bottom: 30px; color: white; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                <i class="fas fa-info-circle" style="font-size: 20px;"></i>
                                <span style="font-weight: 600; font-size: 16px;">DESCRIPTION</span>
                            </div>
                            <p style="margin: 0; font-size: 16px; line-height: 1.6; opacity: 0.95;">${exam.description}</p>
                        </div>
                    ` : ''}
                    <div style="height: 2px; background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%); margin: 30px 0; border-radius: 2px;"></div>
                    <div class="exam-questions">
                        ${(() => {
                            // Get all questions from all sections
                            let allQuestions = [];
                            if (exam.paper_data.sections && exam.paper_data.sections.length > 0) {
                                exam.paper_data.sections.forEach(section => {
                                    if (section.questions && section.questions.length > 0) {
                                        allQuestions = allQuestions.concat(section.questions);
                                    }
                                });
                            }

                            const getQuestionTypeIcon = (type) => {
                                switch(type.toLowerCase()) {
                                    case 'mcq': return 'fas fa-list-ul';
                                    case 'true_false': return 'fas fa-check-circle';
                                    case 'short_answer': return 'fas fa-edit';
                                    case 'essay': return 'fas fa-file-text';
                                    default: return 'fas fa-question-circle';
                                }
                            };

                            const getDifficultyColor = (difficulty) => {
                                switch(difficulty.toLowerCase()) {
                                    case 'easy': return '#48bb78';
                                    case 'medium': return '#ed8936';
                                    case 'hard': return '#e53e3e';
                                    default: return '#718096';
                                }
                            };

                            return `
                            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
                                <div style="background: linear-gradient(45deg, #667eea, #764ba2); padding: 12px; border-radius: 50%; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                                    <i class="fas fa-question-circle" style="font-size: 20px;"></i>
                                </div>
                                <h3 style="margin: 0; color: #2d3748; font-size: 24px; font-weight: 700;">Questions Overview</h3>
                                <div style="background: linear-gradient(45deg, #4facfe, #00f2fe); color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);">
                                    ${allQuestions.length} Questions
                                </div>
                            </div>

                            <div style="display: grid; gap: 20px;">
                            ${allQuestions.map((q, index) => `
                                <div class="question-preview" style="
                                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                                    border: 2px solid #e2e8f0;
                                    border-left: 6px solid ${getDifficultyColor(q.difficulty)};
                                    padding: 25px;
                                    border-radius: 16px;
                                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                                    transition: all 0.3s ease;
                                    position: relative;
                                    overflow: hidden;
                                " onmouseover="
                                    this.style.transform='translateY(-3px)';
                                    this.style.boxShadow='0 8px 30px rgba(0,0,0,0.12)';
                                    this.style.borderColor='#667eea';
                                " onmouseout="
                                    this.style.transform='translateY(0)';
                                    this.style.boxShadow='0 4px 20px rgba(0,0,0,0.08)';
                                    this.style.borderColor='#e2e8f0';
                                ">
                                    <div style="position: absolute; top: 0; right: 0; background: linear-gradient(45deg, ${getDifficultyColor(q.difficulty)}, ${getDifficultyColor(q.difficulty)}dd); color: white; padding: 8px 16px; border-radius: 0 16px 0 16px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                                        ${q.difficulty}
                                    </div>

                                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                                        <div style="background: linear-gradient(45deg, #667eea, #764ba2); padding: 12px; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                                            <i class="${getQuestionTypeIcon(q.type)}" style="font-size: 18px;"></i>
                                        </div>
                                        <div>
                                            <h4 style="margin: 0; color: #2d3748; font-size: 20px; font-weight: 700;">Question ${index + 1}</h4>
                                            <div style="display: flex; gap: 15px; margin-top: 5px;">
                                                <span style="background: #edf2f7; color: #4a5568; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                                                    ${q.type.replace('_', ' ')}
                                                </span>
                                                <span style="background: linear-gradient(45deg, #f6ad55, #ed8936); color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                                                    ${q.marks} ${q.marks === 1 ? 'Mark' : 'Marks'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style="background: #f7fafc; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #667eea;">
                                        <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #2d3748; font-weight: 500;">${q.question}</p>
                                    </div>

                                    ${q.options ? `
                                        <div style="margin-bottom: 20px;">
                                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                                                <i class="fas fa-list" style="color: #667eea; font-size: 16px;"></i>
                                                <span style="font-weight: 600; color: #4a5568; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Answer Options</span>
                                            </div>
                                            <div style="display: grid; gap: 10px;">
                                                ${Object.entries(q.options).map(([key, value]) => `
                                                    <div style="
                                                        display: flex;
                                                        align-items: center;
                                                        gap: 12px;
                                                        padding: 12px 16px;
                                                        background: ${q.correct_answer === key ? 'linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%)' : '#ffffff'};
                                                        border: 2px solid ${q.correct_answer === key ? '#48bb78' : '#e2e8f0'};
                                                        border-radius: 10px;
                                                        transition: all 0.3s ease;
                                                    ">
                                                        <div style="
                                                            background: ${q.correct_answer === key ? '#48bb78' : '#edf2f7'};
                                                            color: ${q.correct_answer === key ? 'white' : '#4a5568'};
                                                            width: 28px;
                                                            height: 28px;
                                                            border-radius: 50%;
                                                            display: flex;
                                                            align-items: center;
                                                            justify-content: center;
                                                            font-weight: 700;
                                                            font-size: 14px;
                                                        ">
                                                            ${key.toUpperCase()}
                                                        </div>
                                                        <span style="color: #2d3748; font-size: 15px; flex: 1;">${value}</span>
                                                        ${q.correct_answer === key ? `
                                                            <div style="background: #48bb78; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
                                                                <i class="fas fa-check" style="margin-right: 4px;"></i>Correct
                                                            </div>
                                                        ` : ''}
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}

                                    ${q.sample_answer ? `
                                        <div style="background: linear-gradient(135deg, #bee3f8 0%, #90cdf4 100%); padding: 16px; border-radius: 12px; border-left: 4px solid #3182ce;">
                                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                                <i class="fas fa-lightbulb" style="color: #2b6cb0; font-size: 16px;"></i>
                                                <span style="font-weight: 600; color: #2b6cb0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Sample Answer</span>
                                            </div>
                                            <p style="margin: 0; color: #2d3748; font-size: 15px; line-height: 1.5;">${q.sample_answer}</p>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                            </div>`;
                        })()}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

    } catch (error) {
        console.error('Error viewing exam:', error);
        showAlert('Failed to load exam details: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function viewExamResponses(examId) {
    try {
        showLoading(true);
        const response = await apiCall(`/exams/${examId}/responses`);
        const responses = response.responses;

        // Create responses view modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1100px; max-height: 85vh; overflow-y: auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div class="modal-header" style="background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-bottom: 3px solid #667eea; padding: 25px; border-radius: 12px 12px 0 0;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="background: linear-gradient(45deg, #667eea, #764ba2); padding: 12px; border-radius: 50%; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                            <i class="fas fa-users" style="font-size: 24px;"></i>
                        </div>
                        <div>
                            <h2 style="margin: 0; color: #2d3748; font-size: 28px; font-weight: 700;">Student Responses</h2>
                            <p style="margin: 5px 0 0 0; color: #718096; font-size: 16px;">${responses.length} ${responses.length === 1 ? 'submission' : 'submissions'} received</p>
                        </div>
                    </div>
                    <span class="close" onclick="this.closest('.modal').remove()" style="font-size: 28px; color: #a0aec0; cursor: pointer; transition: all 0.3s ease; padding: 5px;" onmouseover="this.style.color='#e53e3e'; this.style.transform='scale(1.1)'" onmouseout="this.style.color='#a0aec0'; this.style.transform='scale(1)'">&times;</span>
                </div>
                <div class="modal-body" style="padding: 30px; background: rgba(255,255,255,0.98); margin: 0; border-radius: 0 0 12px 12px;">
                    ${responses.length === 0 ?
                        `<div style="text-align: center; padding: 60px 20px; color: #718096;">
                            <div style="background: linear-gradient(45deg, #667eea, #764ba2); padding: 20px; border-radius: 50%; color: white; display: inline-block; margin-bottom: 20px; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);">
                                <i class="fas fa-inbox" style="font-size: 48px;"></i>
                            </div>
                            <h3 style="color: #4a5568; margin-bottom: 10px;">No Responses Yet</h3>
                            <p style="font-size: 16px;">Students haven't submitted their responses for this exam yet.</p>
                        </div>` :
                        `<div class="responses-list" style="display: grid; gap: 20px;">
                            ${responses.map((resp, index) => {
                                const percentage = Math.round((resp.evaluation.score / resp.evaluation.total_marks) * 100);
                                const isPass = percentage >= 60;
                                const gradeColor = percentage >= 90 ? '#38a169' : percentage >= 80 ? '#48bb78' : percentage >= 70 ? '#ed8936' : percentage >= 60 ? '#f6ad55' : '#e53e3e';
                                const gradeText = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : 'F';

                                return `
                                <div class="response-card" style="
                                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                                    border: 2px solid #e2e8f0;
                                    border-left: 6px solid ${gradeColor};
                                    padding: 25px;
                                    border-radius: 16px;
                                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                                    transition: all 0.3s ease;
                                    position: relative;
                                " onmouseover="
                                    this.style.transform='translateY(-3px)';
                                    this.style.boxShadow='0 8px 30px rgba(0,0,0,0.12)';
                                    this.style.borderColor='#667eea';
                                " onmouseout="
                                    this.style.transform='translateY(0)';
                                    this.style.boxShadow='0 4px 20px rgba(0,0,0,0.08)';
                                    this.style.borderColor='#e2e8f0';
                                ">
                                    <div style="position: absolute; top: 15px; right: 15px; background: ${gradeColor}; color: white; padding: 8px 12px; border-radius: 20px; font-size: 14px; font-weight: 700;">
                                        ${gradeText}
                                    </div>

                                    <div class="response-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                                        <div style="flex: 1;">
                                            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                                                <div style="background: linear-gradient(45deg, #667eea, #764ba2); padding: 12px; border-radius: 50%; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                                                    <i class="fas fa-user-graduate" style="font-size: 18px;"></i>
                                                </div>
                                                <div>
                                                    <h4 style="margin: 0; color: #2d3748; font-size: 20px; font-weight: 700;">${resp.student_info ? resp.student_info.full_name || resp.student_info.username : 'Unknown Student'}</h4>
                                                    <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;"><i class="fas fa-envelope" style="margin-right: 8px;"></i>${resp.student_info ? resp.student_info.email : 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="score-info" style="text-align: center; margin-left: 20px;">
                                            <div style="background: linear-gradient(135deg, ${gradeColor}22, ${gradeColor}11); padding: 20px; border-radius: 16px; border: 2px solid ${gradeColor}33;">
                                                <div class="score" style="font-size: 32px; font-weight: 800; color: ${gradeColor}; margin-bottom: 5px;">
                                                    ${resp.evaluation.score}/${resp.evaluation.total_marks}
                                                </div>
                                                <div class="percentage" style="font-size: 18px; font-weight: 600; color: ${gradeColor};">${percentage}%</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="response-details" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                                        <div style="background: #f7fafc; padding: 15px; border-radius: 12px; border-left: 4px solid #4facfe;">
                                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                                <i class="fas fa-calendar-check" style="color: #4facfe; font-size: 14px;"></i>
                                                <span style="font-size: 12px; font-weight: 600; color: #4a5568; text-transform: uppercase;">Submitted</span>
                                            </div>
                                            <p style="margin: 0; color: #2d3748; font-weight: 600; font-size: 14px;">${new Date(resp.submitted_at).toLocaleDateString()}</p>
                                            <p style="margin: 0; color: #718096; font-size: 12px;">${new Date(resp.submitted_at).toLocaleTimeString()}</p>
                                        </div>

                                        <div style="background: #f7fafc; padding: 15px; border-radius: 12px; border-left: 4px solid #ed8936;">
                                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                                <i class="fas fa-stopwatch" style="color: #ed8936; font-size: 14px;"></i>
                                                <span style="font-size: 12px; font-weight: 600; color: #4a5568; text-transform: uppercase;">Time Taken</span>
                                            </div>
                                            <p style="margin: 0; color: #2d3748; font-weight: 600; font-size: 14px;">${Math.floor(resp.time_taken / 60)}m ${resp.time_taken % 60}s</p>
                                        </div>

                                        <div style="background: #f7fafc; padding: 15px; border-radius: 12px; border-left: 4px solid #48bb78;">
                                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                                <i class="fas fa-check-circle" style="color: #48bb78; font-size: 14px;"></i>
                                                <span style="font-size: 12px; font-weight: 600; color: #4a5568; text-transform: uppercase;">Correct</span>
                                            </div>
                                            <p style="margin: 0; color: #2d3748; font-weight: 600; font-size: 14px;">${resp.evaluation.correct_answers || 0} answers</p>
                                        </div>
                                    </div>

                                    ${resp.auto_submitted ? `
                                        <div style="background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%); padding: 12px 16px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid #e53e3e;">
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <i class="fas fa-exclamation-triangle" style="color: #c53030; font-size: 16px;"></i>
                                                <span style="color: #c53030; font-weight: 600; font-size: 14px;">Auto-submitted due to time expiry</span>
                                            </div>
                                        </div>
                                    ` : ''}

                                    <button class="btn" onclick="viewDetailedResponse('${resp._id}')" style="
                                        background: linear-gradient(45deg, #667eea, #764ba2);
                                        color: white;
                                        border: none;
                                        padding: 12px 24px;
                                        border-radius: 10px;
                                        font-weight: 600;
                                        font-size: 14px;
                                        cursor: pointer;
                                        transition: all 0.3s ease;
                                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                                    " onmouseover="
                                        this.style.transform='translateY(-2px)';
                                        this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.4)';
                                    " onmouseout="
                                        this.style.transform='translateY(0)';
                                        this.style.boxShadow='0 4px 15px rgba(102, 126, 234, 0.3)';
                                    ">
                                        <i class="fas fa-eye" style="margin-right: 8px;"></i>View Detailed Analysis
                                    </button>
                                </div>
                            `;
                            }).join('')}
                        </div>`
                    }
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

    } catch (error) {
        console.error('Error viewing exam responses:', error);
        showAlert('Failed to load exam responses: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function takeExam(examId) {
    // Confirm before starting exam
    if (confirm('Are you ready to start the exam?\n\nOnce started:\n• You cannot pause or exit until completion\n• Copy/paste will be disabled\n• Tab switching will be monitored\n• Time limit will be enforced\n\nClick OK to begin.')) {
        startExam(examId);
    }
}

async function viewDetailedResponse(responseId) {
    try {
        showLoading(true);
        const response = await apiCall(`/responses/${responseId}`);
        const resp = response.response;

        // Create detailed response view modal
        const modal = document.createElement('div');
        modal.className = 'modal';

        const percentage = Math.round((resp.evaluation.score / resp.evaluation.total_marks) * 100);
        const gradeColor = percentage >= 90 ? '#38a169' : percentage >= 80 ? '#48bb78' : percentage >= 70 ? '#ed8936' : percentage >= 60 ? '#f6ad55' : '#e53e3e';
        const gradeText = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : 'F';

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1000px; max-height: 85vh; overflow-y: auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div class="modal-header" style="background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-bottom: 3px solid #667eea; padding: 25px; border-radius: 12px 12px 0 0;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="background: linear-gradient(45deg, #667eea, #764ba2); padding: 12px; border-radius: 50%; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                            <i class="fas fa-file-text" style="font-size: 24px;"></i>
                        </div>
                        <div>
                            <h2 style="margin: 0; color: #2d3748; font-size: 28px; font-weight: 700;">Detailed Analysis</h2>
                            <p style="margin: 5px 0 0 0; color: #718096; font-size: 16px;">Complete response breakdown</p>
                        </div>
                    </div>
                    <span class="close" onclick="this.closest('.modal').remove()" style="font-size: 28px; color: #a0aec0; cursor: pointer; transition: all 0.3s ease; padding: 5px;" onmouseover="this.style.color='#e53e3e'; this.style.transform='scale(1.1)'" onmouseout="this.style.color='#a0aec0'; this.style.transform='scale(1)'">&times;</span>
                </div>
                <div class="modal-body" style="padding: 30px; background: rgba(255,255,255,0.98); margin: 0; border-radius: 0 0 12px 12px;">
                    <div class="response-summary" style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 30px; border-radius: 16px; margin-bottom: 30px; border: 2px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
                            <div style="background: linear-gradient(45deg, ${gradeColor}, ${gradeColor}dd); padding: 12px; border-radius: 50%; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                                <i class="fas fa-chart-line" style="font-size: 20px;"></i>
                            </div>
                            <h3 style="margin: 0; color: #2d3748; font-size: 24px; font-weight: 700;">Performance Summary</h3>
                            <div style="background: ${gradeColor}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                                Grade ${gradeText}
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 12px; color: white; text-align: center; box-shadow: 0 8px 25px rgba(79, 172, 254, 0.3);">
                                <div style="font-size: 32px; font-weight: 800; margin-bottom: 5px;">${resp.evaluation.score}/${resp.evaluation.total_marks}</div>
                                <div style="font-size: 18px; font-weight: 600; opacity: 0.9;">${percentage}% Score</div>
                            </div>

                            <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 20px; border-radius: 12px; color: white; text-align: center; box-shadow: 0 8px 25px rgba(250, 112, 154, 0.3);">
                                <div style="font-size: 32px; font-weight: 800; margin-bottom: 5px;">${resp.evaluation.correct_answers || 0}</div>
                                <div style="font-size: 18px; font-weight: 600; opacity: 0.9;">Correct Answers</div>
                            </div>

                            <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 20px; border-radius: 12px; color: #2d3748; text-align: center; box-shadow: 0 8px 25px rgba(168, 237, 234, 0.3);">
                                <div style="font-size: 32px; font-weight: 800; margin-bottom: 5px;">${Math.floor(resp.time_taken / 60)}m ${resp.time_taken % 60}s</div>
                                <div style="font-size: 18px; font-weight: 600; opacity: 0.8;">Time Taken</div>
                            </div>

                            <div style="background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%); padding: 20px; border-radius: 12px; color: #2d3748; text-align: center; box-shadow: 0 8px 25px rgba(210, 153, 194, 0.3);">
                                <div style="font-size: 18px; font-weight: 700; margin-bottom: 5px;">${new Date(resp.submitted_at).toLocaleDateString()}</div>
                                <div style="font-size: 14px; font-weight: 600; opacity: 0.8;">${new Date(resp.submitted_at).toLocaleTimeString()}</div>
                                <div style="font-size: 12px; margin-top: 5px; opacity: 0.7;">Submitted</div>
                            </div>
                        </div>

                        ${resp.auto_submitted ? `
                            <div style="background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%); padding: 16px 20px; border-radius: 12px; margin-top: 20px; border-left: 4px solid #e53e3e;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <i class="fas fa-exclamation-triangle" style="color: #c53030; font-size: 18px;"></i>
                                    <span style="color: #c53030; font-weight: 600; font-size: 16px;">This response was auto-submitted due to time expiry</span>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <div class="detailed-answers">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
                            <div style="background: linear-gradient(45deg, #667eea, #764ba2); padding: 12px; border-radius: 50%; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                                <i class="fas fa-list-alt" style="font-size: 20px;"></i>
                            </div>
                            <h3 style="margin: 0; color: #2d3748; font-size: 24px; font-weight: 700;">Question-by-Question Analysis</h3>
                        </div>

                        <div style="display: grid; gap: 20px;">
                        ${(() => {
                            if (resp.evaluation && resp.evaluation.detailed_feedback && resp.evaluation.detailed_feedback.length > 0) {
                                return resp.evaluation.detailed_feedback.map((feedback, index) => {
                                    const isCorrect = feedback.is_correct;
                                    const statusColor = isCorrect ? '#48bb78' : '#e53e3e';
                                    const statusBg = isCorrect ? 'linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%)' : 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)';

                                    return `
                                    <div class="question-analysis" style="
                                        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                                        border: 2px solid #e2e8f0;
                                        border-left: 6px solid ${statusColor};
                                        padding: 25px;
                                        border-radius: 16px;
                                        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                                        transition: all 0.3s ease;
                                    " onmouseover="
                                        this.style.transform='translateY(-2px)';
                                        this.style.boxShadow='0 8px 30px rgba(0,0,0,0.12)';
                                    " onmouseout="
                                        this.style.transform='translateY(0)';
                                        this.style.boxShadow='0 4px 20px rgba(0,0,0,0.08)';
                                    ">
                                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                                            <div style="display: flex; align-items: center; gap: 15px;">
                                                <div style="background: linear-gradient(45deg, #667eea, #764ba2); padding: 12px; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                                                    <i class="fas fa-question-circle" style="font-size: 18px;"></i>
                                                </div>
                                                <h4 style="margin: 0; color: #2d3748; font-size: 20px; font-weight: 700;">Question ${index + 1}</h4>
                                            </div>

                                            <div style="display: flex; align-items: center; gap: 15px;">
                                                <div style="background: ${statusBg}; padding: 8px 16px; border-radius: 20px; border: 2px solid ${statusColor};">
                                                    <span style="color: ${statusColor}; font-weight: 700; font-size: 14px;">
                                                        <i class="fas fa-${isCorrect ? 'check' : 'times'}" style="margin-right: 6px;"></i>
                                                        ${isCorrect ? 'Correct' : 'Incorrect'}
                                                    </span>
                                                </div>
                                                <div style="background: linear-gradient(45deg, #f6ad55, #ed8936); color: white; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 14px;">
                                                    ${feedback.score || 0}/${feedback.max_score || 1} pts
                                                </div>
                                            </div>
                                        </div>

                                        <div style="background: #f7fafc; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #667eea;">
                                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                                <i class="fas fa-question" style="color: #667eea; font-size: 16px;"></i>
                                                <span style="font-weight: 600; color: #4a5568; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Question</span>
                                            </div>
                                            <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #2d3748;">${feedback.question || 'N/A'}</p>
                                        </div>

                                        <div style="display: grid; gap: 15px; margin-bottom: 20px;">
                                            <div style="background: #fff5f5; padding: 16px; border-radius: 12px; border-left: 4px solid #e53e3e;">
                                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                                    <i class="fas fa-user-edit" style="color: #e53e3e; font-size: 16px;"></i>
                                                    <span style="font-weight: 600; color: #c53030; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Student Answer</span>
                                                </div>
                                                <p style="margin: 0; color: #2d3748; font-size: 15px; line-height: 1.5;">${feedback.student_answer || (resp.answers && resp.answers[index]) || 'No answer provided'}</p>
                                            </div>

                                            <div style="background: #f0fff4; padding: 16px; border-radius: 12px; border-left: 4px solid #48bb78;">
                                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                                    <i class="fas fa-check-circle" style="color: #48bb78; font-size: 16px;"></i>
                                                    <span style="font-weight: 600; color: #2f855a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Correct Answer</span>
                                                </div>
                                                <p style="margin: 0; color: #2d3748; font-size: 15px; line-height: 1.5;">${feedback.correct_answer || 'N/A'}</p>
                                            </div>
                                        </div>

                                        ${feedback.feedback_text ? `
                                            <div style="background: linear-gradient(135deg, #bee3f8 0%, #90cdf4 100%); padding: 16px; border-radius: 12px; border-left: 4px solid #3182ce;">
                                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                                    <i class="fas fa-lightbulb" style="color: #2b6cb0; font-size: 16px;"></i>
                                                    <span style="font-weight: 600; color: #2b6cb0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Feedback</span>
                                                </div>
                                                <p style="margin: 0; color: #2d3748; font-size: 15px; line-height: 1.5;">${feedback.feedback_text}</p>
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                                }).join('');
                            } else if (resp.answers) {
                                // Fallback: show basic answer information if detailed feedback is not available
                                return Object.entries(resp.answers).map(([questionIndex, answer], index) => `
                                    <div class="question-analysis" style="
                                        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                                        border: 2px solid #e2e8f0;
                                        border-left: 6px solid #718096;
                                        padding: 25px;
                                        border-radius: 16px;
                                        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                                    ">
                                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                                            <div style="background: linear-gradient(45deg, #718096, #4a5568); padding: 12px; border-radius: 12px; color: white;">
                                                <i class="fas fa-question-circle" style="font-size: 18px;"></i>
                                            </div>
                                            <h4 style="margin: 0; color: #2d3748; font-size: 20px; font-weight: 700;">Question ${index + 1}</h4>
                                        </div>

                                        <div style="background: #f7fafc; padding: 16px; border-radius: 12px; border-left: 4px solid #718096;">
                                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                                <i class="fas fa-user-edit" style="color: #718096; font-size: 16px;"></i>
                                                <span style="font-weight: 600; color: #4a5568; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Student Answer</span>
                                            </div>
                                            <p style="margin: 0; color: #2d3748; font-size: 15px; line-height: 1.5;">${answer || 'No answer provided'}</p>
                                        </div>

                                        <div style="background: #fef5e7; padding: 12px 16px; border-radius: 10px; margin-top: 15px; border-left: 4px solid #ed8936;">
                                            <p style="margin: 0; color: #c05621; font-style: italic; font-size: 14px;">
                                                <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                                                Detailed feedback not available for this response.
                                            </p>
                                        </div>
                                    </div>
                                `).join('');
                            } else {
                                return `
                                    <div style="text-align: center; padding: 60px 20px; color: #718096;">
                                        <div style="background: linear-gradient(45deg, #718096, #4a5568); padding: 20px; border-radius: 50%; color: white; display: inline-block; margin-bottom: 20px;">
                                            <i class="fas fa-exclamation-triangle" style="font-size: 48px;"></i>
                                        </div>
                                        <h3 style="color: #4a5568; margin-bottom: 10px;">No Answer Details Available</h3>
                                        <p style="font-size: 16px;">Unable to retrieve detailed answer information for this response.</p>
                                    </div>
                                `;
                            }
                        })()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

    } catch (error) {
        console.error('Error viewing detailed response:', error);
        showAlert('Failed to load detailed response: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function viewResult(resultId) {
    // This function can be used for student result viewing
    viewDetailedResponse(resultId);
}

// Refresh dashboard data
function refreshDashboard() {
    if (currentUser) {
        if (currentUser.role === 'teacher') {
            loadTeacherDashboard();
        } else {
            loadStudentDashboard();
        }
    }
}

// Load student progress chart
function loadStudentProgress(data) {
    const progressContainer = document.getElementById('student-progress');
    if (!progressContainer) return;

    const progressData = data.progress_data || [];

    if (progressData.length === 0) {
        progressContainer.innerHTML = '<p class="no-data">No progress data available</p>';
        return;
    }

    // Create progress chart
    const chartHTML = `
        <div class="progress-chart">
            <h3>📈 Your Progress</h3>
            <div class="progress-stats">
                <div class="stat-item">
                    <div class="stat-value">${data.total_study_time || 0}</div>
                    <div class="stat-label">Minutes Studied</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${data.streak_days || 0}</div>
                    <div class="stat-label">Day Streak</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${data.improvement_rate || 0}%</div>
                    <div class="stat-label">Improvement</div>
                </div>
            </div>
        </div>
    `;

    progressContainer.innerHTML = chartHTML;
}

// Load upcoming exams
function loadUpcomingExams(upcomingExams) {
    const container = document.getElementById('upcoming-exams');
    if (!container) return;

    if (upcomingExams.length === 0) {
        container.innerHTML = '<p class="no-data">No upcoming exams</p>';
        return;
    }

    container.innerHTML = upcomingExams.map(exam => `
        <div class="upcoming-exam-item">
            <div class="exam-icon">📝</div>
            <div class="exam-details">
                <h4>${exam.title}</h4>
                <p>${exam.subject} • ${exam.duration} minutes</p>
                <small class="exam-date">
                    <i class="fas fa-calendar"></i>
                    ${new Date(exam.scheduled_date).toLocaleDateString()}
                </small>
            </div>
            <div class="exam-actions">
                <button class="btn btn-sm btn-primary" onclick="setReminder('${exam.id}')">
                    <i class="fas fa-bell"></i> Remind Me
                </button>
            </div>
        </div>
    `).join('');
}

// Load student achievements
function loadStudentAchievements(data) {
    const container = document.getElementById('student-achievements');
    if (!container) return;

    const achievements = data.achievements || [];
    const badges = [
        { id: 'first_exam', name: 'First Steps', icon: '🎯', description: 'Completed your first exam' },
        { id: 'perfect_score', name: 'Perfect Score', icon: '🏆', description: 'Scored 100% on an exam' },
        { id: 'streak_7', name: 'Week Warrior', icon: '🔥', description: '7-day study streak' },
        { id: 'improvement', name: 'Rising Star', icon: '⭐', description: 'Improved by 20% or more' },
        { id: 'fast_learner', name: 'Speed Demon', icon: '⚡', description: 'Completed exam in record time' },
        { id: 'consistent', name: 'Consistency King', icon: '👑', description: 'Maintained 80%+ average' }
    ];

    const achievementHTML = `
        <div class="achievements-section">
            <h3>🏅 Your Achievements</h3>
            <div class="badges-grid">
                ${badges.map(badge => `
                    <div class="badge-item ${achievements.includes(badge.id) ? 'earned' : 'locked'}">
                        <div class="badge-icon">${badge.icon}</div>
                        <div class="badge-name">${badge.name}</div>
                        <div class="badge-description">${badge.description}</div>
                        ${achievements.includes(badge.id) ? '<div class="badge-earned">✓ Earned</div>' : '<div class="badge-locked">🔒 Locked</div>'}
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    container.innerHTML = achievementHTML;
}

// Set reminder for exam
function setReminder(examId) {
    showAlert('Reminder set! You will be notified before the exam.', 'success');
}

// View detailed result
function viewDetailedResult(examId) {
    // For students viewing their own results
    viewDetailedResponse(examId);
}

// Auto-refresh dashboard every 5 minutes
setInterval(() => {
    if (currentUser && (document.getElementById('teacher-dashboard').style.display === 'block' ||
                       document.getElementById('student-dashboard').style.display === 'block')) {
        refreshDashboard();
    }
}, 5 * 60 * 1000);
