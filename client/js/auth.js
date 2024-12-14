// Get form and error elements
const loginForm = document.querySelector('#login-form');
const errorMessage = document.getElementById('error-message');

// Function to show error messages
function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
}

// Function to handle login
async function handleLogin(e) {
    e.preventDefault();
    
    // Hide any previous error messages
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }

    // Get the submit button and show loading state
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    }

    if ("geolocation" in navigator) {
        try {
            // Get current position
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                });
            });

            const email = document.getElementById('email').value;
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            // Send login request
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    latitude,
                    longitude
                })
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                // Store email in localStorage and redirect
                localStorage.setItem('userEmail', email);
                window.location.href = data.data.redirectUrl;
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Error:', error);
            showError(error.message || 'An error occurred. Please try again.');
            
            // Reset button state
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            }
        }
    } else {
        showError('Geolocation is not supported by your browser');
        // Reset button state
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
    }
}

// Function to handle logout
function logout() {
    localStorage.removeItem('userEmail');
    window.location.href = '/login';
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add login form submit handler
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Add logout button handler
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});
