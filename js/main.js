/**
 * BPMS - Beauty Pageant Management System
 * Main JavaScript File
 * Pure Vanilla JavaScript - No frameworks
 */

'use strict';

/**
 * Main Application Object
 * Encapsulates all functionality to avoid global namespace pollution
 */
const BPMS = {
    // Application state
    state: {
        isFormSubmitting: false,
        passwordVisible: false
    },

    // Demo credentials for validation
    demoAccounts: [
        { email: 'eventmanager@gmail.com', password: 'password123', role: 'Event Manager' },
        { email: 'judge@gmail.com', password: 'password123', role: 'Judge' },
        { email: 'contestant@gmail.com', password: 'password123', role: 'Contestant' },
        { email: 'audience@gmail.com', password: 'password123', role: 'Audience' }
    ],

    // DOM element cache
    elements: {},

    /**
     * Initialize the application
     */
    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.setupFormValidation();
        console.log('BPMS Application Initialized');
    },

    /**
     * Cache frequently accessed DOM elements
     */
    cacheElements() {
        this.elements = {
            signinForm: document.getElementById('signinForm'),
            emailInput: document.getElementById('email'),
            passwordInput: document.getElementById('password'),
            togglePasswordBtn: document.getElementById('togglePassword'),
            emailError: document.getElementById('emailError'),
            passwordError: document.getElementById('passwordError'),
            submitButton: document.querySelector('.submit-button'),
            modal: document.getElementById('successModal'),
            closeModalBtn: document.getElementById('closeModal'),
            eyeIcon: document.querySelector('.eye-icon'),
            eyeOffIcon: document.querySelector('.eye-off-icon')
        };
    },

    /**
     * Attach event listeners to interactive elements
     */
    attachEventListeners() {
        // Form submission
        this.elements.signinForm.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Password toggle
        this.elements.togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility());

        // Real-time validation
        this.elements.emailInput.addEventListener('blur', () => this.validateEmail());
        this.elements.passwordInput.addEventListener('blur', () => this.validatePassword());

        // Clear error on input
        this.elements.emailInput.addEventListener('input', () => this.clearError('email'));
        this.elements.passwordInput.addEventListener('input', () => this.clearError('password'));

        // Modal close
        this.elements.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.elements.modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });

        // Keyboard accessibility for modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.elements.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });

        // Demo account quick fill (click on demo emails)
        this.attachDemoAccountListeners();
    },

    /**
     * Setup form validation rules
     */
    setupFormValidation() {
        // Add HTML5 validation attributes programmatically if needed
        this.elements.emailInput.setAttribute('autocomplete', 'email');
        this.elements.passwordInput.setAttribute('autocomplete', 'current-password');
    },

    /**
     * Handle form submission
     * @param {Event} e - Submit event
     */
    handleFormSubmit(e) {
        e.preventDefault();

        // Prevent double submission
        if (this.state.isFormSubmitting) {
            return;
        }

        // Validate all fields
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        // Get form values
        const email = this.elements.emailInput.value.trim();
        const password = this.elements.passwordInput.value;

        // Authenticate user
        this.authenticateUser(email, password);
    },

    /**
     * Validate email field
     * @returns {boolean} - Whether email is valid
     */
    validateEmail() {
        const email = this.elements.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            this.showError('email', 'Email is required');
            return false;
        }

        if (!emailRegex.test(email)) {
            this.showError('email', 'Please enter a valid email address');
            return false;
        }

        this.clearError('email');
        return true;
    },

    /**
     * Validate password field
     * @returns {boolean} - Whether password is valid
     */
    validatePassword() {
        const password = this.elements.passwordInput.value;

        if (!password) {
            this.showError('password', 'Password is required');
            return false;
        }

        if (password.length < 6) {
            this.showError('password', 'Password must be at least 6 characters');
            return false;
        }

        this.clearError('password');
        return true;
    },

    /**
     * Show validation error
     * @param {string} field - Field name (email or password)
     * @param {string} message - Error message
     */
    showError(field, message) {
        const input = this.elements[`${field}Input`];
        const errorElement = this.elements[`${field}Error`];

        input.classList.add('error');
        errorElement.textContent = message;

        // Announce error to screen readers
        input.setAttribute('aria-invalid', 'true');
        errorElement.setAttribute('role', 'alert');
    },

    /**
     * Clear validation error
     * @param {string} field - Field name (email or password)
     */
    clearError(field) {
        const input = this.elements[`${field}Input`];
        const errorElement = this.elements[`${field}Error`];

        input.classList.remove('error');
        errorElement.textContent = '';

        // Update ARIA attributes
        input.setAttribute('aria-invalid', 'false');
        errorElement.removeAttribute('role');
    },

    /**
     * Toggle password visibility
     */
    togglePasswordVisibility() {
        this.state.passwordVisible = !this.state.passwordVisible;
        const type = this.state.passwordVisible ? 'text' : 'password';

        this.elements.passwordInput.type = type;

        // Toggle icon visibility
        this.elements.eyeIcon.classList.toggle('hidden');
        this.elements.eyeOffIcon.classList.toggle('hidden');

        // Update ARIA label
        const label = this.state.passwordVisible ? 'Hide password' : 'Show password';
        this.elements.togglePasswordBtn.setAttribute('aria-label', label);

        // Keep focus on password field
        this.elements.passwordInput.focus();
    },

    /**
     * Authenticate user with demo accounts
     * @param {string} email - User email
     * @param {string} password - User password
     */
    authenticateUser(email, password) {
        // Set submitting state
        this.state.isFormSubmitting = true;
        this.elements.submitButton.disabled = true;
        this.elements.submitButton.textContent = 'Signing in...';

        // Simulate API call with setTimeout
        setTimeout(() => {
            // Check against demo accounts
            const account = this.demoAccounts.find(
                acc => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
            );

            if (account) {
                // Successful login
                this.handleSuccessfulLogin(account);
            } else {
                // Failed login
                this.handleFailedLogin(email);
            }

            // Reset submitting state
            this.state.isFormSubmitting = false;
            this.elements.submitButton.disabled = false;
            this.elements.submitButton.textContent = 'Sign In';
        }, 1000);
    },

    /**
     * Handle successful login
     * @param {Object} account - User account object
     */
    handleSuccessfulLogin(account) {
        console.log('Login successful:', account.email, 'Role:', account.role);

        // Store user session in localStorage
        const session = {
            email: account.email,
            role: account.role,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('bpms_session', JSON.stringify(session));

        // Show success modal
        this.showModal();

        // Clear form
        this.elements.signinForm.reset();

        // In a real application, redirect to dashboard
        // window.location.href = '/dashboard';
    },

    /**
     * Handle failed login
     * @param {string} email - Attempted email
     */
    handleFailedLogin(email) {
        console.log('Login failed for:', email);

        // Show error message
        this.showError('password', 'Invalid email or password');

        // Add shake animation to form
        this.elements.signinForm.style.animation = 'shake 0.5s';
        setTimeout(() => {
            this.elements.signinForm.style.animation = '';
        }, 500);
    },

    /**
     * Show success modal
     */
    showModal() {
        this.elements.modal.classList.remove('hidden');
        this.elements.modal.setAttribute('aria-hidden', 'false');

        // Focus on close button for accessibility
        this.elements.closeModalBtn.focus();

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    },

    /**
     * Close modal
     */
    closeModal() {
        this.elements.modal.classList.add('hidden');
        this.elements.modal.setAttribute('aria-hidden', 'true');

        // Restore body scroll
        document.body.style.overflow = '';

        // Return focus to email input
        this.elements.emailInput.focus();
    },

    /**
     * Attach click listeners to demo account emails for quick fill
     */
    attachDemoAccountListeners() {
        const demoEmails = document.querySelectorAll('.demo-email');

        demoEmails.forEach((emailElement, index) => {
            emailElement.style.cursor = 'pointer';
            emailElement.style.transition = 'color 0.2s ease';

            emailElement.addEventListener('click', () => {
                const account = this.demoAccounts[index];
                this.fillDemoAccount(account);
            });

            emailElement.addEventListener('mouseenter', () => {
                emailElement.style.color = 'var(--color-primary)';
            });

            emailElement.addEventListener('mouseleave', () => {
                emailElement.style.color = '';
            });
        });
    },

    /**
     * Fill form with demo account credentials
     * @param {Object} account - Demo account object
     */
    fillDemoAccount(account) {
        this.elements.emailInput.value = account.email;
        this.elements.passwordInput.value = account.password;

        // Clear any existing errors
        this.clearError('email');
        this.clearError('password');

        // Add visual feedback
        this.elements.emailInput.style.transition = 'all 0.3s ease';
        this.elements.passwordInput.style.transition = 'all 0.3s ease';
        this.elements.emailInput.style.backgroundColor = '#f0f9ff';
        this.elements.passwordInput.style.backgroundColor = '#f0f9ff';

        setTimeout(() => {
            this.elements.emailInput.style.backgroundColor = '';
            this.elements.passwordInput.style.backgroundColor = '';
        }, 500);

        // Focus on submit button
        this.elements.submitButton.focus();

        console.log('Demo account filled:', account.role);
    },

    /**
     * Utility function to check if user is logged in
     * @returns {Object|null} - Session object or null
     */
    getSession() {
        const sessionData = localStorage.getItem('bpms_session');
        return sessionData ? JSON.parse(sessionData) : null;
    },

    /**
     * Utility function to logout user
     */
    logout() {
        localStorage.removeItem('bpms_session');
        console.log('User logged out');
    }
};

/**
 * Feature Card Animation on Scroll
 */
const AnimationController = {
    init() {
        this.setupIntersectionObserver();
    },

    setupIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '0';
                    entry.target.style.transform = 'translateY(20px)';

                    setTimeout(() => {
                        entry.target.style.transition = 'all 0.5s ease';
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, 100);

                    observer.unobserve(entry.target);
                }
            });
        }, options);

        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach((card, index) => {
            card.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(card);
        });
    }
};

/**
 * Performance Monitoring (Development Only)
 */
const PerformanceMonitor = {
    init() {
        if (window.performance && window.performance.timing) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const timing = window.performance.timing;
                    const loadTime = timing.loadEventEnd - timing.navigationStart;
                    console.log(`Page Load Time: ${loadTime}ms`);
                }, 0);
            });
        }
    }
};

/**
 * Add shake animation to CSS dynamically
 */
const addShakeAnimation = () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
};

/**
 * Initialize application when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        BPMS.init();
        AnimationController.init();
        PerformanceMonitor.init();
        addShakeAnimation();
    });
} else {
    BPMS.init();
    AnimationController.init();
    PerformanceMonitor.init();
    addShakeAnimation();
}

/**
 * Export BPMS object for potential use in other scripts
 * (Only works with module systems, included for future extensibility)
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BPMS;
}
