// Global variables
let currentUser = null;
let authToken = null;

// API Base URL
const API_BASE = '/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check for stored auth token
    authToken = localStorage.getItem('authToken');
    
    if (authToken) {
        // Verify token and load user profile
        loadUserProfile();
    } else {
        showLandingPage();
    }
    
    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Wait a bit for DOM to be fully ready
    setTimeout(() => {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            console.log('Login form found, adding event listener');
            loginForm.addEventListener('submit', handleLogin);

            // Also add click handler to login button as backup
            const loginBtn = loginForm.querySelector('button[type="submit"]');
            if (loginBtn) {
                loginBtn.addEventListener('click', function(e) {
                    if (e.target.form) {
                        e.preventDefault();
                        handleLogin(e);
                    }
                });
            }
        } else {
            console.warn('Login form not found');
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            console.log('Register form found, adding event listener');
            registerForm.addEventListener('submit', handleRegister);
        } else {
            console.warn('Register form not found');
        }

        // Create exam form
        const createExamForm = document.getElementById('create-exam-form');
        if (createExamForm) {
            console.log('Create exam form found, adding event listener');
            createExamForm.addEventListener('submit', handleCreateExam);
        } else {
            console.warn('Create exam form not found');
        }
    }, 100);

    // Add global click handlers for buttons
    document.addEventListener('click', function(e) {
        // Handle login button clicks
        if (e.target.matches('#login-form button[type="submit"]') ||
            e.target.matches('#login-form button[type="submit"] *')) {
            e.preventDefault();
            const form = document.getElementById('login-form');
            if (form) {
                handleLogin(e);
            }
        }
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Authentication functions
async function handleLogin(event) {
    console.log('Login form submitted');
    event.preventDefault();

    const emailEl = document.getElementById('login-email');
    const passwordEl = document.getElementById('login-password');

    if (!emailEl || !passwordEl) {
        console.error('Login form elements not found');
        showAlert('Login form not properly loaded', 'error');
        return;
    }

    const email = emailEl.value.trim();
    const password = passwordEl.value.trim();

    console.log('Login attempt for email:', email);

    if (!email || !password) {
        showAlert('Please enter both email and password', 'error');
        return;
    }

    showLoading(true);

    try {
        console.log('Sending login request to:', `${API_BASE}/login`);
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        console.log('Login response status:', response.status);
        const data = await response.json();
        console.log('Login response data:', data);

        if (response.ok) {
            authToken = data.access_token;
            currentUser = data.user;

            console.log('Login successful, storing token and user data');
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            closeModal('login-modal');
            showDashboard();
            showAlert('Login successful!', 'success');
        } else {
            console.error('Login failed:', data);
            showAlert(data.error || data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login network error:', error);
        showAlert('Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Test login function (can be called from console)
async function testLogin(email = 'student@example.com', password = 'password123') {
    console.log('Testing login with:', email);
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('Test login response:', data);

        if (response.ok) {
            authToken = data.access_token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showDashboard();
            showAlert('Test login successful!', 'success');
            return true;
        } else {
            showAlert('Test login failed: ' + (data.error || data.message), 'error');
            return false;
        }
    } catch (error) {
        console.error('Test login error:', error);
        showAlert('Test login network error', 'error');
        return false;
    }
}

// Make test function available globally
window.testLogin = testLogin;

// Test registration function
async function testRegister(username = 'testuser', email = 'test@example.com', password = 'password123', role = 'student', fullName = 'Test User') {
    console.log('Testing registration with:', { username, email, role, fullName });
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password,
                role: role,
                full_name: fullName
            })
        });

        const data = await response.json();
        console.log('Test registration response:', data);

        if (response.ok) {
            showAlert('Test registration successful!', 'success');
            return true;
        } else {
            showAlert('Test registration failed: ' + (data.error || data.message), 'error');
            return false;
        }
    } catch (error) {
        console.error('Test registration error:', error);
        showAlert('Test registration network error', 'error');
        return false;
    }
}

window.testRegister = testRegister;

async function handleRegister(event) {
    console.log('Registration form submitted');
    event.preventDefault();

    // Get form elements with validation
    const fullNameEl = document.getElementById('register-fullname');
    const usernameEl = document.getElementById('register-username');
    const emailEl = document.getElementById('register-email');
    const passwordEl = document.getElementById('register-password');
    const confirmPasswordEl = document.getElementById('register-confirm-password');
    const roleEl = document.getElementById('register-role');

    // Check if all elements exist
    if (!fullNameEl || !usernameEl || !emailEl || !passwordEl || !confirmPasswordEl || !roleEl) {
        console.error('Registration form elements not found');
        showAlert('Registration form not properly loaded', 'error');
        return;
    }

    // Get values and trim whitespace
    const fullName = fullNameEl.value.trim();
    const username = usernameEl.value.trim();
    const email = emailEl.value.trim();
    const password = passwordEl.value;
    const confirmPassword = confirmPasswordEl.value;
    const role = roleEl.value;

    // Validate required fields
    if (!fullName || !username || !email || !password || !confirmPassword || !role) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }

    // Validate password length
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'error');
        return;
    }

    // Validate username length
    if (username.length < 3) {
        showAlert('Username must be at least 3 characters long', 'error');
        return;
    }

    const formData = {
        full_name: fullName,
        username: username,
        email: email,
        password: password,
        role: role
    };

    console.log('Registration data:', { ...formData, password: '[HIDDEN]' });
    showLoading(true);
    
    try {
        console.log('Sending registration request to:', `${API_BASE}/register`);
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        console.log('Registration response status:', response.status);
        const data = await response.json();
        console.log('Registration response data:', data);

        if (response.ok) {
            console.log('Registration successful');
            closeModal('register-modal');
            showAlert('Registration successful! Please login with your new account.', 'success');

            // Clear the form
            document.getElementById('register-form').reset();

            // Show login modal and pre-fill email
            setTimeout(() => {
                showLogin();
                const loginEmailEl = document.getElementById('login-email');
                if (loginEmailEl) {
                    loginEmailEl.value = email;
                }
            }, 1000);
        } else {
            console.error('Registration failed:', data);
            showAlert(data.error || data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration network error:', error);
        showAlert('Network error. Please check your connection and try again.', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showDashboard();
        } else {
            // Token invalid, clear storage
            logout();
        }
    } catch (error) {
        logout();
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showLandingPage();
    showAlert('Logged out successfully', 'info');
}

// UI functions
function showLandingPage() {
    hideAllSections();
    clearAllAlerts(); // Clear any existing alerts
    document.getElementById('landing-page').style.display = 'block';

    // Update navigation
    document.getElementById('nav-auth').style.display = 'flex';
    document.getElementById('nav-user').style.display = 'none';
}

function showDashboard() {
    hideAllSections();
    clearAllAlerts(); // Clear any existing alerts

    if (currentUser) {
        // Update navigation
        document.getElementById('nav-auth').style.display = 'none';
        document.getElementById('nav-user').style.display = 'flex';
        document.getElementById('user-name').textContent = currentUser.full_name || currentUser.username;

        // Show appropriate dashboard
        if (currentUser.role === 'teacher') {
            document.getElementById('teacher-dashboard').style.display = 'block';
            loadTeacherDashboard();
        } else {
            document.getElementById('student-dashboard').style.display = 'block';
            loadStudentDashboard();
        }
    }
}

function hideAllSections() {
    const sections = ['landing-page', 'teacher-dashboard', 'student-dashboard'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.style.display = 'none';
        }
    });
}

// Modal functions
function showLogin() {
    closeAllModals();
    document.getElementById('login-modal').style.display = 'block';
}

function showRegister() {
    closeAllModals();
    document.getElementById('register-modal').style.display = 'block';
}

function showCreateExam() {
    closeAllModals();
    document.getElementById('create-exam-modal').style.display = 'block';
    loadSubjects();
}

function showQuestionBank() {
    // Open the question browser modal
    showQuestionBrowser();
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Utility functions
function showLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');

    // Prevent duplicate alerts
    const existingAlerts = alertContainer.querySelectorAll('.alert');
    for (let existingAlert of existingAlerts) {
        if (existingAlert.textContent === message) {
            return; // Don't show duplicate alert
        }
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    alertContainer.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);
}

function clearAllAlerts() {
    const alertContainer = document.getElementById('alert-container');
    alertContainer.innerHTML = '';
}

// API helper function
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (authToken) {
        defaultOptions.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, finalOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Format duration helper
function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    clearAllAlerts(); // Clear any existing alerts on page load

    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        loadUserProfile();
    } else {
        showLandingPage();
    }
});
