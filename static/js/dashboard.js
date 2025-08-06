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
        loadRecentExams(data.recent_exams || []);

        console.log('Teacher dashboard loaded successfully');
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
    const container = document.getElementById('recent-exams-list');
    container.innerHTML = '';
    
    if (exams.length === 0) {
        container.innerHTML = '<p class="no-data">No exams created yet.</p>';
        return;
    }
    
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
function viewExam(examId) {
    // TODO: Implement exam viewing
    showAlert('Exam viewing feature coming soon!', 'info');
}

function viewExamResponses(examId) {
    // TODO: Implement responses viewing
    showAlert('Response viewing feature coming soon!', 'info');
}

function takeExam(examId) {
    // Confirm before starting exam
    if (confirm('Are you ready to start the exam?\n\nOnce started:\n• You cannot pause or exit until completion\n• Copy/paste will be disabled\n• Tab switching will be monitored\n• Time limit will be enforced\n\nClick OK to begin.')) {
        startExam(examId);
    }
}

function viewResult(resultId) {
    // TODO: Implement result viewing
    showAlert('Result viewing feature coming soon!', 'info');
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
    showAlert('Detailed results feature coming soon!', 'info');
}

// Auto-refresh dashboard every 5 minutes
setInterval(() => {
    if (currentUser && (document.getElementById('teacher-dashboard').style.display === 'block' ||
                       document.getElementById('student-dashboard').style.display === 'block')) {
        refreshDashboard();
    }
}, 5 * 60 * 1000);
