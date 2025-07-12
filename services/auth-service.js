// Authentication Service
// Handles all authentication operations with Supabase

console.log('🔐 Auth Service loading...');

window.AuthService = {
  // Current user state
  currentUser: null,
  authCallbacks: [],

  // Initialize authentication service
  async init() {
    try {
      // Wait for Supabase to be ready
      await this.waitForSupabase();
      
      // Get current session
      const { data: { session }, error } = await window.SupabaseConfig.client.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return;
      }

      if (session) {
        this.currentUser = session.user;
        this.notifyAuthChange(session.user);
      }

      // Listen for auth changes
      window.SupabaseConfig.client.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        this.currentUser = session?.user || null;
        this.notifyAuthChange(this.currentUser);
      });

      console.log('✅ Auth Service initialized');
    } catch (error) {
      console.error('❌ Error initializing Auth Service:', error);
    }
  },

  // Wait for Supabase to be ready
  async waitForSupabase() {
    let attempts = 0;
    while (!window.SupabaseConfig?.client && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    if (!window.SupabaseConfig?.client) {
      throw new Error('Supabase not available after timeout');
    }
  },

  // Sign up with email and password
  async signUp(email, password, userData = {}) {
    try {
      // Add default username from email if not provided
      if (!userData.username && email) {
        userData.username = this.getDefaultUsername(email);
      }

      const { data, error } = await window.SupabaseConfig.client.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const { data, error } = await window.SupabaseConfig.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await window.SupabaseConfig.client.auth.signOut();
      
      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      const { error } = await window.SupabaseConfig.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password.html`
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update password
  async updatePassword(newPassword) {
    try {
      const { error } = await window.SupabaseConfig.client.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, error: error.message };
    }
  },

  // Update user profile
  async updateProfile(userData) {
    try {
      const { error } = await window.SupabaseConfig.client.auth.updateUser({
        data: userData
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  },

  // Add auth state change listener
  onAuthChange(callback) {
    this.authCallbacks.push(callback);
  },

  // Remove auth state change listener
  offAuthChange(callback) {
    this.authCallbacks = this.authCallbacks.filter(cb => cb !== callback);
  },

  // Notify all listeners of auth state change
  notifyAuthChange(user) {
    this.authCallbacks.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('Error in auth callback:', error);
      }
    });
  },

  // Username utility functions
  getDefaultUsername(email) {
    if (!email) return 'user';
    // Extract username from email (everything before @)
    return email.split('@')[0];
  },

  getUserDisplayName(user) {
    if (!user) return 'Gebruiker';
    
    // Check if user has a custom username in metadata
    if (user.user_metadata?.username) {
      return user.user_metadata.username;
    }
    
    // Fall back to default username from email
    return this.getDefaultUsername(user.email);
  },

  // Update username
  async updateUsername(username) {
    try {
      const { error } = await window.SupabaseConfig.client.auth.updateUser({
        data: { username: username }
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Update username error:', error);
      return { success: false, error: error.message };
    }
  }
};

console.log('✅ Auth Service loaded');
