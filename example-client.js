/**
 * Example client for the NextJS Auth API
 * This demonstrates how to use the API from a client application
 */

class AuthAPIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Helper method to make HTTP requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if we have a token
    if (this.accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, config);
    const data = await response.json();

    // Handle token expiration
    if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/refresh')) {
      console.log('Access token expired, attempting to refresh...');
      const refreshSuccess = await this.refreshAccessToken();
      if (refreshSuccess) {
        // Retry the original request
        config.headers.Authorization = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(url, config);
        return await retryResponse.json();
      } else {
        // Refresh failed, redirect to login
        this.logout();
        throw new Error('Session expired. Please login again.');
      }
    }

    return data;
  }

  // Login with email and password
  async login(email, password) {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.success) {
        this.accessToken = response.data.tokens.accessToken;
        this.refreshToken = response.data.tokens.refreshToken;
        
        // Store tokens in localStorage (in a real app, consider more secure storage)
        localStorage.setItem('accessToken', this.accessToken);
        localStorage.setItem('refreshToken', this.refreshToken);
        
        console.log('Login successful:', response.data.user);
        return response.data;
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register a new user
  async register(name, email, password, confirmPassword) {
    try {
      const response = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          confirm_password: confirmPassword,
        }),
      });

      if (response.success) {
        this.accessToken = response.data.tokens.accessToken;
        this.refreshToken = response.data.tokens.refreshToken;
        
        // Store tokens in localStorage
        localStorage.setItem('accessToken', this.accessToken);
        localStorage.setItem('refreshToken', this.refreshToken);
        
        console.log('Registration successful:', response.data.user);
        return response.data;
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await this.request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
        headers: {
          // Don't include Authorization header for refresh request
          'Content-Type': 'application/json',
        },
      });

      if (response.success) {
        this.accessToken = response.data.tokens.accessToken;
        localStorage.setItem('accessToken', this.accessToken);
        console.log('Token refreshed successfully');
        return true;
      } else {
        console.error('Token refresh failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  // Logout
  async logout() {
    try {
      if (this.refreshToken) {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens regardless of API call success
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      console.log('Logged out successfully');
    }
  }

  // Verify current token
  async verifyToken() {
    try {
      const response = await this.request('/auth/verify');
      if (response.success) {
        console.log('Token is valid:', response.data.user);
        return response.data;
      } else {
        throw new Error(response.error || 'Token verification failed');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      const response = await this.request('/users/me');
      if (response.success) {
        console.log('Current user:', response.data.user);
        return response.data.user;
      } else {
        throw new Error(response.error || 'Failed to get user profile');
      }
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  // Update current user profile
  async updateProfile(name, email) {
    try {
      const response = await this.request('/users/me', {
        method: 'PUT',
        body: JSON.stringify({ name, email }),
      });

      if (response.success) {
        console.log('Profile updated:', response.data.user);
        return response.data.user;
      } else {
        throw new Error(response.error || 'Profile update failed');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Get all users (admin only)
  async getUsers(page = 1, limit = 10, search = '') {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const response = await this.request(`/users?${params}`);
      if (response.success) {
        console.log('Users retrieved:', response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to get users');
      }
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  // Restore tokens from localStorage
  restoreSession() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken && refreshToken) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      console.log('Session restored from localStorage');
      return true;
    }
    
    return false;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.accessToken;
  }
}

// Usage example (commented out to avoid linting warning)
// async function example() {
//   // Initialize the client
//   const client = new AuthAPIClient('http://localhost:3000/api/v1');
//   
//   // Try to restore session from localStorage
//   client.restoreSession();
//   
//   try {
//     // If not authenticated, login
//     if (!client.isAuthenticated()) {
//       console.log('Not authenticated, attempting login...');
//       await client.login('user@example.com', 'password123');
//     }
//     
//     // Verify token
//     await client.verifyToken();
//     
//     // Get current user
//     const user = await client.getCurrentUser();
//     console.log('Current user:', user);
//     
//     // Update profile
//     await client.updateProfile('Updated Name', 'updated@example.com');
//     
//     // If user is admin, get all users
//     if (user.isadmin) {
//       const users = await client.getUsers(1, 10);
//       console.log('All users:', users);
//     }
//     
//   } catch (error) {
//     console.error('Example error:', error);
//   }
// }

// Export for use in other files
export default AuthAPIClient;

// Run example if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.AuthAPIClient = AuthAPIClient;
  console.log('AuthAPIClient is available on window.AuthAPIClient');
}
