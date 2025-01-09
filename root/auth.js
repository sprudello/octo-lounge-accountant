import { accountService } from './services/accountService.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            this.currentUser = { username: storedUsername };
            this.updateUserDisplay();
            this.toggleAuthButtons();
        } else {
            try {
                const response = await fetch('/api/user-info');
                if (response.ok) {
                    const userData = await response.json(); // Store user data
                    this.currentUser = { username: userData.username || 'Guest' };
                    localStorage.setItem('username', this.currentUser.username); // Save username in local storage
                    this.updateUserDisplay();
                    this.toggleAuthButtons();
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        }
    }

    async login(credentials) {
        try {

            const response = await fetch('https://localhost:7162/api/Profiles/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            if (response.ok) {
                const userData = await response.json();
                this.currentUser = { username: userData.username || 'Guest' };
                localStorage.setItem('username', this.currentUser.username); 
                this.updateUserDisplay();
                this.toggleAuthButtons();
                this.closeAuthModal();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }

    async register(userData) {
        try {

            const userResponse = await fetch('https://localhost:7162/api/Profiles/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({

                    Username: userData.username,
                    Email: userData.email,
                    PasswordHash: userData.password
                })
            });

            if (!userResponse.ok) return false;

            const user = await userResponse.json();
          
            const packageResponse = await fetch('https://localhost:7162/api/AccountTypes/createAccountType', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Name: userData.accountPackage
                })
            });

            if (packageResponse.ok) {
                this.currentUser = { username: user.username = null };
                localStorage.setItem('username', this.currentUser.username); // Save username
                this.updateUserDisplay();
                this.toggleAuthButtons();
                this.closeAuthModal();
                return true;
            }
            return false;

        } catch (error) {
            console.error('Registration error:', error);
            return false;
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('username'); // Clear user data from local storage
        this.updateUserDisplay();
        this.toggleAuthButtons();
    }

    updateUserDisplay() {
        const welcomeText = document.querySelector('.user-welcome');
        const userMenu = document.querySelector('.user-menu');
        if (welcomeText) {
            welcomeText.textContent = this.currentUser ?
                `Welcome, ${this.currentUser.username}` :
                'Welcome, Guest';
            
            // Update menu buttons based on auth state
            if (this.currentUser) {
                userMenu.innerHTML = `
                    <div class="user-welcome">Welcome, ${this.currentUser.username}</div>
                    <button class="auth-button" id="logout-button">Logout</button>
                `;
                document.getElementById('logout-button').addEventListener('click', () => this.logout());
            } else {
                userMenu.innerHTML = `
                    <div class="user-welcome">Welcome, Guest</div>
                    <button class="auth-button" id="login-button">Login</button>
                    <button class="auth-button" id="register-button">Register</button>
                `;
                document.getElementById('login-button').addEventListener('click', () => this.showAuthModal('login'));
                document.getElementById('register-button').addEventListener('click', () => this.showAuthModal('register'));
            }
        }
    }

    toggleAuthButtons() {
        // Wait for components to be loaded
        const tryToggle = () => {
            const loginButton = document.getElementById('login-button');
            const registerButton = document.getElementById('register-button');
            const logoutButton = document.getElementById('logout-button');

            if (!loginButton || !registerButton || !logoutButton) {
                // If elements aren't ready, wait for components
                document.addEventListener('componentsLoaded', this.toggleAuthButtons.bind(this));
                return;
            }

            if (this.currentUser) {
                loginButton.style.display = 'none';
                registerButton.style.display = 'none';
                logoutButton.style.display = 'block';
            } else {
                loginButton.style.display = 'block';
                registerButton.style.display = 'block';
                logoutButton.style.display = 'none';
            }
        };

        tryToggle();
    }

    showAuthModal(type) {
        const modal = document.getElementById('auth-modal');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        // Reset forms
        loginForm.reset();
        registerForm.reset();
        
        // Hide error messages
        document.getElementById('login-error').style.display = 'none';
        document.getElementById('register-error').style.display = 'none';

        modal.style.display = 'block';
        if (type === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    }

    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'none';
            // Reset forms
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            if (loginForm) loginForm.reset();
            if (registerForm) registerForm.reset();
        }
    }

    async logout() {
        this.currentUser = null;
        this.updateUserDisplay();
        // Clear stored credentials
        localStorage.removeItem('username');
        localStorage.removeItem('password');
    }
}

// Initialize AuthManager
export const authManager = new AuthManager();

// Initialize event listeners after components are loaded
const initializeEventListeners = () => {
    const logoutButton = document.getElementById('logout-button');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const userMenuTrigger = document.querySelector('.user-menu-trigger');
    const userMenu = document.querySelector('.user-menu');

    if (!logoutButton || !loginForm || !registerForm || !loginButton || 
        !registerButton || !userMenuTrigger || !userMenu) {
        // If elements aren't ready, wait for components
        document.addEventListener('componentsLoaded', initializeEventListeners);
        return;
    }

    logoutButton.addEventListener('click', () => {
        authManager.logout();
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const success = await authManager.login({
            username: formData.get('username'),
            password: formData.get('password')
        });
        if (!success) {
            const errorDiv = document.querySelector('#login-error');
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Login failed. Please check your credentials.';
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const success = await authManager.register({
            username: formData.get('username'),
            accountPackage: formData.get('accountPackage'),
            email: formData.get('email'),
            password: formData.get('password')
        });
        if (!success) {
            const errorDiv = document.querySelector('#register-error');
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Registration failed. Please try again.';
        }
    });

    userMenuTrigger.addEventListener('click', () => {
        userMenu.classList.toggle('show');
    });

    loginButton.addEventListener('click', () => {
        authManager.showAuthModal('login');
    });

    registerButton.addEventListener('click', () => {
        authManager.showAuthModal('register');
    });
};

// Start initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeEventListeners);
