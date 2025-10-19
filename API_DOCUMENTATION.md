# NextJS Auth API Documentation

This document provides comprehensive documentation for the NextJS Auth API service that can be used by other applications.

## Base URL

```
https://your-domain.com/api/v1
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Rate Limiting

- **Limit**: 100 requests per 15-minute window per IP
- **Headers**: Rate limit information is included in response headers
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

## CORS

The API supports CORS. Configure allowed origins using the `ALLOWED_ORIGINS` environment variable.

## Endpoints

### Authentication

#### POST /auth/login

Authenticate a user and receive access and refresh tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "user@example.com",
      "isadmin": false,
      "slug": "john-doe-abc123"
    },
    "tokens": {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token",
      "expiresIn": 3600
    }
  }
}
```

#### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "confirm_password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "user@example.com",
      "isadmin": false,
      "slug": "john-doe-abc123"
    },
    "tokens": {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token",
      "expiresIn": 3600
    }
  }
}
```

#### POST /auth/refresh

Refresh an access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "user@example.com",
      "isadmin": false,
      "slug": "john-doe-abc123"
    },
    "tokens": {
      "accessToken": "new-jwt-access-token",
      "expiresIn": 3600
    }
  }
}
```

#### POST /auth/logout

Logout and invalidate refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

#### DELETE /auth/logout

Logout using Authorization header (invalidates all refresh tokens for the user).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

#### GET /auth/verify

Verify an access token and get user information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "user@example.com",
      "isadmin": false,
      "slug": "john-doe-abc123"
    },
    "token": {
      "valid": true,
      "expiresAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

### User Management

#### GET /users/me

Get current user's profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "user@example.com",
      "isadmin": false,
      "slug": "john-doe-abc123",
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "teams": [
        {
          "id": 1,
          "name": "DefaultTeam",
          "role": "member"
        }
      ]
    }
  }
}
```

#### PUT /users/me

Update current user's profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "name": "John Updated",
      "email": "john.updated@example.com",
      "isadmin": false,
      "slug": "john-doe-abc123",
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

#### GET /users

Get list of users (Admin only).

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for name or email

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-id",
        "name": "John Doe",
        "email": "user@example.com",
        "isadmin": false,
        "slug": "john-doe-abc123",
        "active": true,
        "teamCount": 1,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": [
    {
      "origin": "string",
      "code": "invalid_format",
      "format": "email",
      "path": ["email"],
      "message": "Invalid email address"
    }
  ]
}
```

**Error Details Structure:**
- `origin`: The type of validation that failed
- `code`: Specific error code (e.g., "invalid_format", "too_small", "required")
- `path`: Array showing the field path where the error occurred
- `message`: Human-readable error message
- Additional fields may be present depending on the error type (e.g., `minimum`, `format`, `pattern`)

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (e.g., email already exists)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Setup

### 1. Environment Variables

Add these environment variables to your `.env.local`:

```env
# JWT Secrets (change these in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://another-domain.com

# Database (already configured)
POSTGRES_URL=your-postgres-connection-string
```

### 2. Database Setup

Run the setup endpoint to create necessary tables:

```bash
curl -X POST https://your-domain.com/api/v1/auth/setup
```

### 3. Install Dependencies

The API requires these additional dependencies:

```bash
npm install jsonwebtoken
npm install @types/jsonwebtoken --save-dev
```

## Usage Examples

### JavaScript/TypeScript Client

```typescript
class AuthAPI {
  private baseURL = 'https://your-domain.com/api/v1';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (data.success) {
      this.accessToken = data.data.tokens.accessToken;
      this.refreshToken = data.data.tokens.refreshToken;
      localStorage.setItem('accessToken', this.accessToken);
      localStorage.setItem('refreshToken', this.refreshToken);
    }
    
    return data;
  }

  async getAuthenticatedRequest(url: string, options: RequestInit = {}) {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    // Handle token expiration
    if (response.status === 401 && this.refreshToken) {
      await this.refreshAccessToken();
      return this.getAuthenticatedRequest(url, options);
    }

    return response;
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    const data = await response.json();
    
    if (data.success) {
      this.accessToken = data.data.tokens.accessToken;
      localStorage.setItem('accessToken', this.accessToken);
    } else {
      // Refresh failed, redirect to login
      this.logout();
    }
    
    return data;
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

// Usage
const authAPI = new AuthAPI();

// Login
await authAPI.login('user@example.com', 'password123');

// Get user profile
const response = await authAPI.getAuthenticatedRequest(`${authAPI.baseURL}/users/me`);
const userData = await response.json();
```

### Python Client

```python
import requests
import json

class AuthAPI:
    def __init__(self, base_url):
        self.base_url = base_url
        self.access_token = None
        self.refresh_token = None

    def login(self, email, password):
        response = requests.post(
            f"{self.base_url}/auth/login",
            json={"email": email, "password": password}
        )
        
        data = response.json()
        if data["success"]:
            self.access_token = data["data"]["tokens"]["accessToken"]
            self.refresh_token = data["data"]["tokens"]["refreshToken"]
        
        return data

    def get_authenticated_request(self, url, **kwargs):
        if not self.access_token:
            raise Exception("Not authenticated")
        
        headers = kwargs.get("headers", {})
        headers["Authorization"] = f"Bearer {self.access_token}"
        kwargs["headers"] = headers
        
        response = requests.get(url, **kwargs)
        
        # Handle token expiration
        if response.status_code == 401 and self.refresh_token:
            self.refresh_access_token()
            return self.get_authenticated_request(url, **kwargs)
        
        return response

    def refresh_access_token(self):
        if not self.refresh_token:
            raise Exception("No refresh token available")
        
        response = requests.post(
            f"{self.base_url}/auth/refresh",
            json={"refreshToken": self.refresh_token}
        )
        
        data = response.json()
        if data["success"]:
            self.access_token = data["data"]["tokens"]["accessToken"]
        else:
            self.logout()
        
        return data

    def logout(self):
        self.access_token = None
        self.refresh_token = None

# Usage
auth_api = AuthAPI("https://your-domain.com/api/v1")

# Login
auth_api.login("user@example.com", "password123")

# Get user profile
response = auth_api.get_authenticated_request(f"{auth_api.base_url}/users/me")
user_data = response.json()
```

## Security Considerations

1. **JWT Secrets**: Use strong, unique secrets for JWT signing
2. **HTTPS**: Always use HTTPS in production
3. **Token Storage**: Store tokens securely (httpOnly cookies recommended for web apps)
4. **Rate Limiting**: The API includes rate limiting to prevent abuse
5. **CORS**: Configure CORS properly for your domains
6. **Input Validation**: All inputs are validated using Zod schemas
7. **Password Hashing**: Passwords are hashed using bcrypt

## Support

For issues or questions, please check the error responses and ensure you're following the API documentation correctly.
