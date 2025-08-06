// Authentication related functions

// Check if user is authenticated
function isAuthenticated() {
    return authToken && currentUser;
}

// Check if user has specific role
function hasRole(role) {
    return currentUser && currentUser.role === role;
}

// Require authentication for certain actions
function requireAuth(callback) {
    if (!isAuthenticated()) {
        showAlert('Please login to continue', 'error');
        showLogin();
        return false;
    }
    
    if (callback) {
        callback();
    }
    return true;
}

// Require teacher role
function requireTeacher(callback) {
    if (!requireAuth()) {
        return false;
    }
    
    if (!hasRole('teacher')) {
        showAlert('Teacher access required', 'error');
        return false;
    }
    
    if (callback) {
        callback();
    }
    return true;
}

// Require student role
function requireStudent(callback) {
    if (!requireAuth()) {
        return false;
    }
    
    if (!hasRole('student')) {
        showAlert('Student access required', 'error');
        return false;
    }
    
    if (callback) {
        callback();
    }
    return true;
}

// Handle token expiration
function handleTokenExpiration() {
    showAlert('Session expired. Please login again.', 'error');
    logout();
}

// Refresh token if needed
async function refreshTokenIfNeeded() {
    // This would be implemented if using refresh tokens
    // For now, we'll just check if the token is still valid
    try {
        const response = await fetch(`${API_BASE}/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            handleTokenExpiration();
            return false;
        }
        
        return true;
    } catch (error) {
        handleTokenExpiration();
        return false;
    }
}

// Auto-logout on token expiration
setInterval(async () => {
    if (authToken) {
        await refreshTokenIfNeeded();
    }
}, 5 * 60 * 1000); // Check every 5 minutes
