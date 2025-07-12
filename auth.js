// Authentication UI Controller
// Handles all authentication UI interactions

console.log('🔐 Auth UI Controller loading...');

class AuthController {
  constructor() {
    this.modal = null;
    this.modalOverlay = null;
    this.currentView = 'signin';
    this.isLoading = false;
    
    this.init();
  }

  async init() {
    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
      }

      // Wait for AuthService to be ready
      await this.waitForAuthService();

      this.setupDOM();
      this.setupEventListeners();
      this.updateUI();

      // Listen for auth state changes
      window.AuthService.onAuthChange((user) => {
        this.updateUI();
      });

      console.log('✅ Auth Controller initialized');
    } catch (error) {
      console.error('❌ Error initializing Auth Controller:', error);
    }
  }

  async waitForAuthService() {
    let attempts = 0;
    while (!window.AuthService && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    if (!window.AuthService) {
      throw new Error('AuthService not available after timeout');
    }

    // Initialize AuthService
    await window.AuthService.init();
  }

  setupDOM() {
    this.modal = document.getElementById('authModal');
    this.modalOverlay = document.getElementById('authModalOverlay');
    
    // Get DOM elements
    this.elements = {
      // Modal controls
      modalClose: document.getElementById('authModalClose'),
      modalTitle: document.getElementById('authModalTitle'),
      modalSubtitle: document.getElementById('authModalSubtitle'),
      
      // Tabs
      authTabs: document.getElementById('authTabs'),
      
      // Message area
      authMessage: document.getElementById('authMessage'),
      
      // Forms
      signinForm: document.getElementById('signinForm'),
      signupForm: document.getElementById('signupForm'),
      resetPasswordForm: document.getElementById('resetPasswordForm'),
      
      // Sign in fields
      signinEmail: document.getElementById('signinEmail'),
      signinPassword: document.getElementById('signinPassword'),
      signinBtn: document.getElementById('signinBtn'),
      
      // Sign up fields
      signupEmail: document.getElementById('signupEmail'),
      signupPassword: document.getElementById('signupPassword'),
      signupPasswordConfirm: document.getElementById('signupPasswordConfirm'),
      signupBtn: document.getElementById('signupBtn'),
      
      // Reset password fields
      resetEmail: document.getElementById('resetEmail'),
      resetPasswordBtn: document.getElementById('resetPasswordBtn'),
      
      // Links
      forgotPasswordLink: document.getElementById('forgotPasswordLink'),
      backToAuthLink: document.getElementById('backToAuthLink'),
      
      // Account page elements
      accountOverview: document.getElementById('accountOverview'),
      loginPrompt: document.getElementById('loginPrompt'),
      showAuthBtn: document.getElementById('showAuthBtn'),
      userAvatar: document.getElementById('userAvatar'),
      userUsername: document.getElementById('userUsername'),
      userEmail: document.getElementById('userEmail'),
      userStatus: document.getElementById('userStatus'),
      signOutBtn: document.getElementById('signOutBtn'),
      changePasswordBtn: document.getElementById('changePasswordBtn'),
      editProfileBtn: document.getElementById('editProfileBtn'),
      
      // Edit profile modal elements
      editProfileModalOverlay: document.getElementById('editProfileModalOverlay'),
      editProfileModal: document.getElementById('editProfileModal'),
      editProfileModalClose: document.getElementById('editProfileModalClose'),
      editProfileMessage: document.getElementById('editProfileMessage'),
      editProfileForm: document.getElementById('editProfileForm'),
      editUsername: document.getElementById('editUsername'),
      saveProfileBtn: document.getElementById('saveProfileBtn')
    };
  }

  setupEventListeners() {
    // Modal controls
    if (this.elements.modalClose) {
      this.elements.modalClose.addEventListener('click', () => this.closeModal());
    }
    
    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) {
          this.closeModal();
        }
      });
    }

    // Auth tabs
    if (this.elements.authTabs) {
      this.elements.authTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('auth-tab')) {
          this.switchTab(e.target.dataset.tab);
        }
      });
    }

    // Forms
    if (this.elements.signinForm) {
      this.elements.signinForm.addEventListener('submit', (e) => this.handleSignIn(e));
    }
    
    if (this.elements.signupForm) {
      this.elements.signupForm.addEventListener('submit', (e) => this.handleSignUp(e));
    }

    // Password toggles
    document.querySelectorAll('.password-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => this.togglePassword(e));
    });

    // Links
    if (this.elements.forgotPasswordLink) {
      this.elements.forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showResetPassword();
      });
    }
    
    if (this.elements.backToAuthLink) {
      this.elements.backToAuthLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab('signin');
      });
    }

    // Reset password
    if (this.elements.resetPasswordBtn) {
      this.elements.resetPasswordBtn.addEventListener('click', () => this.handleResetPassword());
    }

    // Account page buttons
    if (this.elements.showAuthBtn) {
      this.elements.showAuthBtn.addEventListener('click', () => this.openModal());
    }
    
    if (this.elements.signOutBtn) {
      this.elements.signOutBtn.addEventListener('click', () => this.handleSignOut());
    }

    // Edit profile functionality
    if (this.elements.editProfileBtn) {
      this.elements.editProfileBtn.addEventListener('click', () => this.openEditProfileModal());
    }
    
    if (this.elements.editProfileModalClose) {
      this.elements.editProfileModalClose.addEventListener('click', () => this.closeEditProfileModal());
    }
    
    if (this.elements.editProfileModalOverlay) {
      this.elements.editProfileModalOverlay.addEventListener('click', (e) => {
        if (e.target === this.elements.editProfileModalOverlay) {
          this.closeEditProfileModal();
        }
      });
    }
    
    if (this.elements.editProfileForm) {
      this.elements.editProfileForm.addEventListener('submit', (e) => this.handleEditProfile(e));
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.modalOverlay && this.modalOverlay.classList.contains('show')) {
          this.closeModal();
        }
        if (this.elements.editProfileModalOverlay && this.elements.editProfileModalOverlay.classList.contains('show')) {
          this.closeEditProfileModal();
        }
      }
    });
  }

  // UI State Management
  updateUI() {
    const user = window.AuthService?.getCurrentUser();
    const isAuthenticated = !!user;

    // Update account page
    if (this.elements.accountOverview && this.elements.loginPrompt) {
      if (isAuthenticated) {
        this.elements.accountOverview.style.display = 'block';
        this.elements.loginPrompt.style.display = 'none';
        this.updateUserInfo(user);
      } else {
        this.elements.accountOverview.style.display = 'none';
        this.elements.loginPrompt.style.display = 'block';
      }
    }

    // Update username display on home page
    this.updateHomePageUsername(user);

    // Update profile button in header (if on main page)
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      if (isAuthenticated) {
        profileBtn.onclick = () => window.location.href = 'account.html';
        profileBtn.title = 'Account';
      } else {
        profileBtn.onclick = () => this.openModal();
        profileBtn.title = 'Inloggen';
      }
    }
  }

  updateUserInfo(user) {
    if (!user) return;

    // Get username
    const username = window.AuthService.getUserDisplayName(user);
    const firstLetter = username.charAt(0).toUpperCase();

    // Update avatar
    if (this.elements.userAvatar) {
      this.elements.userAvatar.textContent = firstLetter;
    }

    // Update username
    if (this.elements.userUsername) {
      this.elements.userUsername.textContent = username;
    }

    // Update email
    if (this.elements.userEmail) {
      this.elements.userEmail.textContent = user.email || 'Onbekend';
    }

    // Update status
    if (this.elements.userStatus) {
      const status = user.email_confirmed_at ? 'Geverifieerd account' : 'E-mail verificatie vereist';
      this.elements.userStatus.textContent = status;
    }
  }

  updateHomePageUsername(user) {
    const usernameDisplay = document.getElementById('usernameDisplay');
    const welcomeHeading = document.querySelector('.welcome-section h1');
    
    if (usernameDisplay && welcomeHeading) {
      if (user) {
        const username = window.AuthService.getUserDisplayName(user);
        welcomeHeading.innerHTML = `Welkom terug, <span id="usernameDisplay">${username}</span>!`;
      } else {
        welcomeHeading.innerHTML = `Welkom terug<span id="usernameDisplay" style="display: none;"></span>!`;
      }
    }
  }

  // Modal Management
  openModal(tab = 'signin') {
    if (!this.modalOverlay || !this.modal) return;
    
    this.switchTab(tab);
    this.clearMessages();
    this.modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Focus first input
    setTimeout(() => {
      const firstInput = this.modal.querySelector('.auth-form.active input');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  closeModal() {
    if (!this.modalOverlay) return;
    
    this.modalOverlay.classList.remove('show');
    document.body.style.overflow = '';
    this.clearMessages();
    this.resetForms();
  }

  switchTab(tab) {
    this.currentView = tab;

    // Update tabs
    document.querySelectorAll('.auth-tab').forEach(tabEl => {
      tabEl.classList.toggle('active', tabEl.dataset.tab === tab);
    });

    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => {
      form.classList.remove('active');
    });

    // Show appropriate form and update modal title
    switch (tab) {
      case 'signin':
        if (this.elements.signinForm) this.elements.signinForm.classList.add('active');
        if (this.elements.authTabs) this.elements.authTabs.style.display = 'flex';
        this.updateModalTitle('Welkom terug', 'Log in op je account');
        break;
      case 'signup':
        if (this.elements.signupForm) this.elements.signupForm.classList.add('active');
        if (this.elements.authTabs) this.elements.authTabs.style.display = 'flex';
        this.updateModalTitle('Account maken', 'Maak een nieuw account aan');
        break;
      case 'reset':
        if (this.elements.resetPasswordForm) this.elements.resetPasswordForm.classList.add('active');
        if (this.elements.authTabs) this.elements.authTabs.style.display = 'none';
        this.updateModalTitle('Wachtwoord resetten', 'We sturen je een reset link');
        break;
    }

    this.clearMessages();
  }

  updateModalTitle(title, subtitle) {
    if (this.elements.modalTitle) this.elements.modalTitle.textContent = title;
    if (this.elements.modalSubtitle) this.elements.modalSubtitle.textContent = subtitle;
  }

  showResetPassword() {
    this.switchTab('reset');
    // Pre-fill email if available
    const email = this.elements.signinEmail?.value || this.elements.signupEmail?.value;
    if (email && this.elements.resetEmail) {
      this.elements.resetEmail.value = email;
    }
  }

  // Form Handlers
  async handleSignIn(e) {
    e.preventDefault();
    
    if (this.isLoading) return;
    
    const email = this.elements.signinEmail?.value.trim();
    const password = this.elements.signinPassword?.value;

    if (!email || !password) {
      this.showMessage('Vul alle velden in', 'error');
      return;
    }

    this.setLoading(true, 'signin');

    try {
      const result = await window.AuthService.signIn(email, password);
      
      if (result.success) {
        this.showMessage('Succesvol ingelogd!', 'success');
        setTimeout(() => {
          this.closeModal();
        }, 1000);
      } else {
        this.showMessage(this.getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      this.showMessage('Er is een fout opgetreden. Probeer het opnieuw.', 'error');
    } finally {
      this.setLoading(false, 'signin');
    }
  }

  async handleSignUp(e) {
    e.preventDefault();
    
    if (this.isLoading) return;

    const email = this.elements.signupEmail?.value.trim();
    const password = this.elements.signupPassword?.value;
    const passwordConfirm = this.elements.signupPasswordConfirm?.value;

    if (!email || !password || !passwordConfirm) {
      this.showMessage('Vul alle velden in', 'error');
      return;
    }

    if (password !== passwordConfirm) {
      this.showMessage('Wachtwoorden komen niet overeen', 'error');
      return;
    }

    if (password.length < 6) {
      this.showMessage('Wachtwoord moet minimaal 6 karakters lang zijn', 'error');
      return;
    }

    this.setLoading(true, 'signup');

    try {
      const result = await window.AuthService.signUp(email, password);
      
      if (result.success) {
        this.showMessage('Account aangemaakt! Controleer je e-mail voor verificatie.', 'success');
        setTimeout(() => {
          this.switchTab('signin');
        }, 2000);
      } else {
        this.showMessage(this.getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      this.showMessage('Er is een fout opgetreden. Probeer het opnieuw.', 'error');
    } finally {
      this.setLoading(false, 'signup');
    }
  }

  async handleResetPassword() {
    if (this.isLoading) return;

    const email = this.elements.resetEmail?.value.trim();

    if (!email) {
      this.showMessage('Vul je e-mailadres in', 'error');
      return;
    }

    this.setLoading(true, 'reset');

    try {
      const result = await window.AuthService.resetPassword(email);
      
      if (result.success) {
        this.showMessage('Reset link verstuurd! Controleer je e-mail.', 'success');
        setTimeout(() => {
          this.switchTab('signin');
        }, 2000);
      } else {
        this.showMessage(this.getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      this.showMessage('Er is een fout opgetreden. Probeer het opnieuw.', 'error');
    } finally {
      this.setLoading(false, 'reset');
    }
  }

  async handleSignOut() {
    if (this.isLoading) return;

    try {
      const result = await window.AuthService.signOut();
      
      if (result.success) {
        // Redirect to home page
        window.location.href = 'index.html';
      } else {
        this.showMessage('Fout bij uitloggen. Probeer het opnieuw.', 'error');
      }
    } catch (error) {
      this.showMessage('Er is een fout opgetreden. Probeer het opnieuw.', 'error');
    }
  }

  // Edit Profile Modal Management
  openEditProfileModal() {
    if (!this.elements.editProfileModalOverlay) return;
    
    const user = window.AuthService?.getCurrentUser();
    if (!user) return;

    // Pre-fill the form with current username
    const currentUsername = window.AuthService.getUserDisplayName(user);
    if (this.elements.editUsername) {
      this.elements.editUsername.value = currentUsername;
    }

    this.clearEditProfileMessages();
    this.elements.editProfileModalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Focus username input
    setTimeout(() => {
      if (this.elements.editUsername) {
        this.elements.editUsername.focus();
        this.elements.editUsername.select();
      }
    }, 100);
  }

  closeEditProfileModal() {
    if (!this.elements.editProfileModalOverlay) return;
    
    this.elements.editProfileModalOverlay.classList.remove('show');
    document.body.style.overflow = '';
    this.clearEditProfileMessages();
    
    // Reset form
    if (this.elements.editProfileForm) {
      this.elements.editProfileForm.reset();
    }
  }

  async handleEditProfile(e) {
    e.preventDefault();
    
    if (this.isLoading) return;

    const username = this.elements.editUsername?.value.trim();

    if (!username) {
      this.showEditProfileMessage('Vul een gebruikersnaam in', 'error');
      return;
    }

    if (username.length < 2) {
      this.showEditProfileMessage('Gebruikersnaam moet minimaal 2 karakters lang zijn', 'error');
      return;
    }

    if (username.length > 50) {
      this.showEditProfileMessage('Gebruikersnaam mag maximaal 50 karakters lang zijn', 'error');
      return;
    }

    // Check if username contains only valid characters
    const validUsernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!validUsernameRegex.test(username)) {
      this.showEditProfileMessage('Gebruikersnaam mag alleen letters, cijfers, punten, streepjes en underscores bevatten', 'error');
      return;
    }

    this.setLoading(true, 'editProfile');

    try {
      const result = await window.AuthService.updateUsername(username);
      
      if (result.success) {
        this.showEditProfileMessage('Gebruikersnaam succesvol bijgewerkt!', 'success');
        setTimeout(() => {
          this.closeEditProfileModal();
          // The auth state change listener will automatically update the UI
        }, 1000);
      } else {
        this.showEditProfileMessage(this.getErrorMessage(result.error), 'error');
      }
    } catch (error) {
      this.showEditProfileMessage('Er is een fout opgetreden. Probeer het opnieuw.', 'error');
    } finally {
      this.setLoading(false, 'editProfile');
    }
  }

  // Utility Functions for Edit Profile
  showEditProfileMessage(message, type) {
    if (!this.elements.editProfileMessage) return;

    const isError = type === 'error';
    const icon = isError ? 'error' : 'check_circle';
    
    this.elements.editProfileMessage.innerHTML = `
      <div class="${isError ? 'error-message' : 'success-message'}">
        <span class="material-symbols-outlined">${icon}</span>
        ${message}
      </div>
    `;
    this.elements.editProfileMessage.style.display = 'block';
  }

  clearEditProfileMessages() {
    if (this.elements.editProfileMessage) {
      this.elements.editProfileMessage.style.display = 'none';
      this.elements.editProfileMessage.innerHTML = '';
    }
  }

  // Utility Functions
  setLoading(loading, form) {
    this.isLoading = loading;
    
    const buttons = {
      signin: this.elements.signinBtn,
      signup: this.elements.signupBtn,
      reset: this.elements.resetPasswordBtn,
      editProfile: this.elements.saveProfileBtn
    };

    const button = buttons[form];
    if (!button) return;

    button.disabled = loading;
    button.classList.toggle('loading', loading);
  }

  togglePassword(e) {
    const inputId = e.currentTarget.dataset.input;
    const input = document.getElementById(inputId);
    const icon = e.currentTarget.querySelector('.material-symbols-outlined');
    
    if (!input || !icon) return;

    if (input.type === 'password') {
      input.type = 'text';
      icon.textContent = 'visibility_off';
    } else {
      input.type = 'password';
      icon.textContent = 'visibility';
    }
  }

  showMessage(message, type) {
    if (!this.elements.authMessage) return;

    const isError = type === 'error';
    const icon = isError ? 'error' : 'check_circle';
    
    this.elements.authMessage.innerHTML = `
      <div class="${isError ? 'error-message' : 'success-message'}">
        <span class="material-symbols-outlined">${icon}</span>
        ${message}
      </div>
    `;
    this.elements.authMessage.style.display = 'block';
  }

  clearMessages() {
    if (this.elements.authMessage) {
      this.elements.authMessage.style.display = 'none';
      this.elements.authMessage.innerHTML = '';
    }
  }

  resetForms() {
    // Reset all form inputs
    document.querySelectorAll('.auth-form input').forEach(input => {
      input.value = '';
      input.classList.remove('error');
    });

    // Reset all password toggles
    document.querySelectorAll('.password-toggle .material-symbols-outlined').forEach(icon => {
      icon.textContent = 'visibility';
    });
    
    document.querySelectorAll('.password-input-container input').forEach(input => {
      input.type = 'password';
    });
  }

  getErrorMessage(error) {
    const errorMessages = {
      'Invalid login credentials': 'Ongeldige inloggegevens',
      'User already registered': 'E-mailadres is al in gebruik',
      'Email not confirmed': 'E-mail nog niet geverifieerd',
      'Password should be at least 6 characters': 'Wachtwoord moet minimaal 6 karakters bevatten',
      'Invalid email': 'Ongeldig e-mailadres',
      'Too many requests': 'Te veel pogingen. Probeer het later opnieuw.',
      'Network error': 'Netwerkfout. Controleer je internetverbinding.'
    };

    return errorMessages[error] || error || 'Er is een onbekende fout opgetreden';
  }
}

// Initialize Auth Controller
console.log('🚀 Starting Auth Controller...');
window.AuthController = new AuthController();
console.log('✅ Auth Controller loaded');
