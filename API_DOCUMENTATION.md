# NextJS Auth API Documentation

This document provides comprehensive documentation for the NextJS Auth API service that can be used by other applications.

## Base URL

```
https://your-domain.com/api/v1
```

**Note on basePath:** If this app is deployed with `NEXT_PUBLIC_BASE_PATH` set (e.g. `/auth` for the `prod` Docker Compose profile), that prefix applies to every route the app serves, including the API. In that case the base URL becomes:

```
https://your-domain.com/auth/api/v1
```

See [README.md](./README.md#environment-variables) for how `NEXT_PUBLIC_BASE_PATH` is configured.

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
  - `X-RateLimit-Reset`: Time when the rate limit resets (ISO 8601 format)
  - `Retry-After`: Seconds until the rate limit resets (included when rate limit is exceeded)

## CORS

The API supports CORS. Configure allowed origins using the `ALLOWED_ORIGINS` environment variable (comma-separated list).

**CORS Headers:**
- `Access-Control-Allow-Origin`: Allowed origin (or `*` if not configured)
- `Access-Control-Allow-Methods`: `GET, POST, PUT, DELETE, OPTIONS, PATCH`
- `Access-Control-Allow-Headers`: `Content-Type, Authorization, X-Requested-With, Accept, Origin`
- `Access-Control-Allow-Credentials`: `true`
- `Access-Control-Max-Age`: `86400` (24 hours)
- `Access-Control-Expose-Headers`: Rate limit headers are exposed

**Default Origins** (if `ALLOWED_ORIGINS` is not set):
- `http://localhost:3000`
- `http://localhost:3001`

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

**Validation Rules:**
- `email`: Required, valid email format (case-insensitive)
- `password`: Required, 6-32 characters

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
      "is_super_admin": false,
      "company_id": "company-id",
      "slug": "john-doe-abc123",
      "company": {
        "id": "company-id",
        "name": "Acme Corp",
        "description": "Company description"
      },
      "must_change_password": false
    },
    "tokens": {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token",
      "expiresIn": 3600
    }
  }
}
```

**Note:** The `company` field will be `null` if the user is not associated with a company. If `must_change_password` is `true`, the client should prompt for a password change (via `PUT /users/me/password`) before allowing access to the rest of the app — this API does not enforce it server-side beyond that field.

**Error Responses:**

- **400 Bad Request** - Validation errors:
```json
{
  "success": false,
  "error": "Invalid input",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "email": ["Invalid email"],
      "password": ["Password must be more than 6 characters"]
    }
  }
}
```

- **401 Unauthorized** - Invalid credentials:
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

- **500 Internal Server Error** - Server error:
```json
{
  "success": false,
  "error": "Internal server error"
}
```

- **503 Service Unavailable** - Database connection failed:
```json
{
  "success": false,
  "error": "Database connection failed"
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

**Validation Rules:**
- `name`: Required, 3-100 characters
- `email`: Required, valid email format
- `password`: Required, 6-32 characters
- `confirm_password`: Required, must match `password`

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
      "is_super_admin": false,
      "company_id": null,
      "slug": "john-doe-abc123",
      "company": null
    },
    "tokens": {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token",
      "expiresIn": 3600
    }
  }
}
```

**Status Code:** `201 Created`

**Note:** The `company` field will be `null` if the user is not associated with a company.

**Error Responses:**

- **400 Bad Request** - Validation errors:
```json
{
  "success": false,
  "error": "Invalid input",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "name": ["Name must be more than 3 characters"],
      "email": ["Invalid email"],
      "password": ["Password must be more than 6 characters"],
      "confirm_password": ["Passwords must match"]
    }
  }
}
```

- **409 Conflict** - Email already exists:
```json
{
  "success": false,
  "error": "User with this email already exists",
  "details": {
    "fieldErrors": {
      "email": ["An account with this email address already exists"]
    }
  }
}
```

- **500 Internal Server Error** - Server error:
```json
{
  "success": false,
  "error": "Internal server error"
}
```

- **503 Service Unavailable** - Database connection failed:
```json
{
  "success": false,
  "error": "Database connection failed"
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
      "is_super_admin": false,
      "company_id": "company-id",
      "slug": "john-doe-abc123",
      "company": {
        "id": "company-id",
        "name": "Acme Corp",
        "description": "Company description"
      }
    },
    "tokens": {
      "accessToken": "new-jwt-access-token",
      "expiresIn": 3600
    }
  }
}
```

**Note:** The `company` field will be `null` if the user is not associated with a company.

**Error Responses:**

- **400 Bad Request** - Validation errors:
```json
{
  "success": false,
  "error": "Invalid input",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "refreshToken": ["Refresh token is required"]
    }
  }
}
```

- **401 Unauthorized** - Invalid or expired refresh token:
```json
{
  "success": false,
  "error": "Invalid or expired refresh token"
}
```

- **404 Not Found** - User not found or inactive:
```json
{
  "success": false,
  "error": "User not found or inactive"
}
```

- **500 Internal Server Error** - Server error:
```json
{
  "success": false,
  "error": "Internal server error"
}
```

- **503 Service Unavailable** - Database connection failed:
```json
{
  "success": false,
  "error": "Database connection failed"
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

**Error Responses:**

- **400 Bad Request** - Validation errors:
```json
{
  "success": false,
  "error": "Invalid input",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "refreshToken": ["Refresh token is required"]
    }
  }
}
```

- **401 Unauthorized** - Invalid refresh token:
```json
{
  "success": false,
  "error": "Invalid refresh token"
}
```

- **500 Internal Server Error** - Server error:
```json
{
  "success": false,
  "error": "Internal server error"
}
```

- **503 Service Unavailable** - Database connection failed:
```json
{
  "success": false,
  "error": "Database connection failed"
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

**Error Responses:**

- **401 Unauthorized** - Missing or invalid token:
```json
{
  "success": false,
  "error": "Authorization header required"
}
```

or

```json
{
  "success": false,
  "error": "Invalid token"
}
```

- **500 Internal Server Error** - Server error:
```json
{
  "success": false,
  "error": "Internal server error"
}
```

- **503 Service Unavailable** - Database connection failed:
```json
{
  "success": false,
  "error": "Database connection failed"
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
      "is_super_admin": false,
      "company_id": "company-id",
      "slug": "john-doe-abc123",
      "company": {
        "id": "company-id",
        "name": "Acme Corp",
        "description": "Company description"
      }
    },
    "token": {
      "valid": true,
      "expiresAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

**Note:** The `company` field will be `null` if the user is not associated with a company.

**Error Responses:**

- **401 Unauthorized** - Missing authorization header:
```json
{
  "success": false,
  "error": "Authorization header required"
}
```

- **401 Unauthorized** - Invalid or expired token:
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

- **401 Unauthorized** - Token missing expiration:
```json
{
  "success": false,
  "error": "Token missing expiration time"
}
```

- **403 Forbidden** - User account is inactive:
```json
{
  "success": false,
  "error": "User account is inactive"
}
```

- **404 Not Found** - User not found:
```json
{
  "success": false,
  "error": "User not found"
}
```

- **500 Internal Server Error** - Server error:
```json
{
  "success": false,
  "error": "Internal server error"
}
```

- **503 Service Unavailable** - Database connection failed:
```json
{
  "success": false,
  "error": "Database connection failed"
}
```

#### POST /auth/setup

Idempotently ensures the `api_refresh_tokens` table and its indexes exist, and clears expired refresh tokens. It does **not** create `users`, `companies`, or `invitations` — those are created by the schema bootstrap that runs automatically on container startup (see the main README's Database Seeding section). Calling this is not required for normal setup; it exists as a legacy safety net.

**Response:**
```json
{
  "success": true,
  "message": "API setup completed successfully"
}
```

**Error Responses:**

- **403 Forbidden** - Database permission denied:
```json
{
  "success": false,
  "error": "Database permission denied"
}
```

- **500 Internal Server Error** - Setup failed:
```json
{
  "success": false,
  "error": "Failed to setup API"
}
```

- **503 Service Unavailable** - Database connection failed:
```json
{
  "success": false,
  "error": "Database connection failed"
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
      "is_super_admin": false,
      "company_id": "company-id",
      "slug": "john-doe-abc123",
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "company": {
        "id": "company-id",
        "name": "Acme Corp",
        "description": "Company description"
      }
    }
  }
}
```

**Note:** The `company` field will be `null` if the user is not associated with a company.

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

**Validation Rules:**
- `name`: Required (non-empty; no length/format check)
- `email`: Required (non-empty; no format check), must be unique — returns `409 Conflict` (`{"success": false, "error": "Email already taken"}`) if another user already has it

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
      "is_super_admin": false,
      "company_id": "company-id",
      "slug": "john-doe-abc123",
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z",
      "company": {
        "id": "company-id",
        "name": "Acme Corp",
        "description": "Company description"
      }
    }
  }
}
```

**Note:** The `company` field will be `null` if the user is not associated with a company.

#### PUT /users/me/password

Change the current user's own password.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Validation Rules:**
- `currentPassword`: Required
- `newPassword`: Required, 6-100 characters

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Note:** On success, `must_change_password` is cleared server-side. Web UI sessions refresh their copy of this flag via NextAuth's `updateSession()`; REST API clients should re-login or track the flag themselves.

**Error Responses:**

- **400 Bad Request** - Validation errors (same `details.fieldErrors` shape as above)
- **401 Unauthorized** - `{"success": false, "error": "Current password is incorrect"}`
- **404 Not Found** - `{"success": false, "error": "User not found"}`

#### GET /users

Get list of users (Admin only). **Not company-scoped** — a company admin's token sees users from every company, not just their own. See the note under [Multi-Tenancy Features](#multi-tenancy-features).

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
        "is_super_admin": false,
        "company_id": "company-id",
        "slug": "john-doe-abc123",
        "active": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "company": {
          "id": "company-id",
          "name": "Acme Corp",
          "description": "Company description"
        }
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

**Note:** The `company` field will be `null` if a user is not associated with a company.

#### POST /users

Create a new user (Admin only — company admins and super admins). The new user is created with `must_change_password: true`.

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "temporary123",
  "company_id": "company-id",
  "isadmin": false
}
```

**Validation Rules:**
- `name`: Required, 1-255 characters
- `email`: Required, valid email format
- `password`: Required, 6-100 characters — this is a temporary/initial password; the user must change it on first login
- `company_id`: Optional UUID. If omitted, the new user inherits the creating admin's `company_id`. **If provided, it's used as-is with no check that it matches the caller's own company** — a company admin can currently create a user in a different company by passing its id explicitly. See the multi-tenancy note under [Multi-Tenancy Features](#multi-tenancy-features).
- `isadmin`: Optional boolean, defaults to `false`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "name": "New User",
      "email": "newuser@example.com",
      "isadmin": false,
      "is_super_admin": false,
      "company_id": "company-id",
      "slug": "new-user-ab12cd",
      "active": true,
      "must_change_password": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "company": {
        "id": "company-id",
        "name": "Acme Corp",
        "description": "Company description"
      }
    }
  }
}
```
Status: `201 Created`

**Error Responses:**

- **400 Bad Request** - Validation errors (standard `details.fieldErrors` shape)
- **409 Conflict** - `{"success": false, "error": "User with this email already exists"}` (email match is case-insensitive)

#### GET /users/{id}

Get a single user by id (Super Admin only).

**Headers:**
```
Authorization: Bearer <super_admin_access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "name": "John Doe",
    "email": "user@example.com",
    "isadmin": false,
    "is_super_admin": false,
    "company_id": "company-id",
    "slug": "john-doe-abc123",
    "active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "company": {
      "id": "company-id",
      "name": "Acme Corp",
      "description": "Company description"
    }
  }
}
```

**Note:** Unlike every other user endpoint, this response is not nested under `data.user` — the user object is `data` itself. Field names are also `created_at`/`updated_at` (snake_case) here, not `createdAt`/`updatedAt`.

**Error Responses:**
- **404 Not Found** - `{"success": false, "error": "User not found"}`

#### PUT /users/{id}

Update a user's admin/company/active status (Super Admin only). This endpoint does not update `name`, `email`, or `password`.

**Headers:**
```
Authorization: Bearer <super_admin_access_token>
```

**Request Body:** (all fields optional — only fields present are updated)
```json
{
  "isadmin": true,
  "is_super_admin": false,
  "company_id": "company-id",
  "active": true
}
```

**Validation Rules:**
- At least one of `isadmin`, `is_super_admin`, `company_id`, `active` must be present, or the request returns `400 Bad Request` (`"No fields to update"`)
- `company_id`: pass `""` to clear it (stored as `NULL`)
- No schema validation beyond presence — passing the wrong type for a field will surface as a database error, not a `400`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "name": "John Doe",
    "email": "user@example.com",
    "isadmin": true,
    "is_super_admin": false,
    "company_id": "company-id",
    "active": true
  }
}
```

**Note:** Same flat-response caveat as `GET /users/{id}` — this is not nested under `data.user`.

**Error Responses:**
- **400 Bad Request** - `{"success": false, "error": "No fields to update"}`
- **404 Not Found** - `{"success": false, "error": "User not found"}`

There is no `DELETE /users/{id}` — user removal is not exposed via the REST API.

#### PUT /users/{id}/password

Admin resets another user's password.

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body:**
```json
{
  "newPassword": "newpassword456",
  "requireChange": true
}
```

**Validation Rules:**
- `newPassword`: Required, 6-100 characters
- `requireChange`: Optional boolean, defaults to `true` — sets `must_change_password` on the target user

**Authorization:** Company admins (`isadmin`) may only reset passwords for users in their own company; super admins may reset any user's password.

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "must_change_password": true
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation errors (standard `details.fieldErrors` shape)
- **403 Forbidden** - `{"success": false, "error": "Cannot reset password for users in other companies"}` (company admin targeting a user outside their company)
- **404 Not Found** - `{"success": false, "error": "User not found"}`

### Company Management

#### GET /companies

List all companies (Super Admin only).

**Headers:**
```
Authorization: Bearer <super_admin_access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "company-id",
      "name": "Acme Corp",
      "description": "Company description",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Note:** Unlike the paginated `GET /users`, this returns every company as a flat array under `data` — no pagination, no `data.companies` wrapper.

#### POST /companies

Create a new company (Super Admin only).

**Headers:**
```
Authorization: Bearer <super_admin_access_token>
```

**Request Body:**
```json
{
  "name": "Acme Corp",
  "description": "Company description"
}
```

**Validation Rules:**
- `name`: Required (non-empty; no length/format check), must be unique
- `description`: Optional

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "company-id",
    "name": "Acme Corp",
    "description": "Company description",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - `{"success": false, "error": "Company name is required"}`
- **409 Conflict** - `{"success": false, "error": "Company with this name already exists"}`

#### GET /companies/{id}

Get a single company by id (Super Admin only).

**Headers:**
```
Authorization: Bearer <super_admin_access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "company-id",
    "name": "Acme Corp",
    "description": "Company description",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- **404 Not Found** - `{"success": false, "error": "Company not found"}`

#### PUT /companies/{id}

Update a company (Super Admin only).

**Headers:**
```
Authorization: Bearer <super_admin_access_token>
```

**Request Body:** (all fields optional — only fields present are updated)
```json
{
  "name": "Acme Corp Renamed",
  "description": "Updated description"
}
```

**Validation Rules:**
- At least one of `name`, `description` must be present, or the request returns `400 Bad Request` (`"No fields to update"`)
- `description`: pass `""` to clear it (stored as `NULL`)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "company-id",
    "name": "Acme Corp Renamed",
    "description": "Updated description",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request** - `{"success": false, "error": "No fields to update"}`
- **404 Not Found** - `{"success": false, "error": "Company not found"}`
- **409 Conflict** - `{"success": false, "error": "Company with this name already exists"}`

#### DELETE /companies/{id}

Delete a company (Super Admin only). Runs in a transaction: every user with this `company_id` has it set to `NULL` before the company row is deleted — users are not deleted.

**Headers:**
```
Authorization: Bearer <super_admin_access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": { "id": "company-id", "name": "Acme Corp" },
    "message": "Company deleted successfully. All associated users have been unlinked."
  }
}
```

**Error Responses:**
- **404 Not Found** - `{"success": false, "error": "Company not found"}`

Invitations have no REST API — they're handled exclusively through server actions (`app/actions/admin/invitation-actions.ts`) used by the web dashboard, not through `/api/v1/`.

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "formErrors": ["Top-level form errors (e.g., cross-field validation)"],
    "fieldErrors": {
      "fieldName": ["All error messages for this field"]
    }
  }
}
```

**Error Details Structure:**
- `formErrors`: Array of top-level form errors (e.g., cross-field validation like password confirmation)
- `fieldErrors`: Object mapping field names to an array of all error messages for that field

**Example Error Response:**
```json
{
  "success": false,
  "error": "Invalid input",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "email": ["Invalid email"],
      "password": ["Password must be more than 6 characters"]
    }
  }
}
```

**Rate Limit Error Response:**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 450
}
```

**Development Mode Error Details:**

In development mode (`NODE_ENV=development`), error responses may include additional debugging information:

```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Detailed error message for debugging"
}
```

**Note:** The `details` field is only included in development mode for security reasons.

### Common HTTP Status Codes

- `200`: Success
- `201`: Created (used for successful registration)
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token, invalid credentials)
- `403`: Forbidden (insufficient permissions, inactive account, database permission denied)
- `404`: Not Found (resource not found, user not found)
- `409`: Conflict (e.g., email already exists)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error
- `503`: Service Unavailable (database connection failed)
- `504`: Gateway Timeout (request timeout)

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

# Optional: mount the app (and this API) under a subpath, e.g. for reverse-proxy
# deployments. Affects the Base URL — see note above.
NEXT_PUBLIC_BASE_PATH=/auth
```

### 2. Database Setup

Run the setup endpoint to create necessary tables and indexes for the API:

```bash
curl -X POST https://your-domain.com/api/v1/auth/setup
```

**Response:**
```json
{
  "success": true,
  "message": "API setup completed successfully"
}
```

This endpoint creates:
- `api_refresh_tokens` table (if it doesn't exist)
- Indexes for faster token lookups
- Cleans up expired tokens

### 3. Install Dependencies

The API requires these additional dependencies (if not already installed):

```bash
npm install jsonwebtoken bcryptjs zod
npm install @types/jsonwebtoken @types/bcryptjs --save-dev
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

## Multi-Tenancy Features

The API supports multi-tenant architecture with company isolation:

### Company Management
- **Super Admin Only**: Company CRUD operations (`/companies*`) are restricted to super admins

### User Management
- **⚠️ Not company-scoped on this REST API**: `GET /users` returns users from every company to any admin token (company or super admin) — it does not filter by the caller's `company_id`. `POST /users` accepts an arbitrary `company_id` in the request body from a company admin, which is used as-is (no check that it matches the caller's own company). Only `GET/PUT /users/{id}` are super-admin-gated. This differs from the web dashboard's server actions (`app/actions/admin/user-actions.ts`), which do scope user queries/creation to the acting admin's own company — treat this as a known gap in the REST surface, not a guarantee to rely on.
- **Company Assignment**: Users can be assigned to companies or remain unassigned

### Invitation System
- **Company-Scoped Invitations**: Admins can only send invitations for their company
- **Email Validation**: Prevents inviting users who already belong to a company
- **Token-Based Acceptance**: Secure invitation acceptance via unique tokens
- **Automatic Assignment**: Users are automatically assigned to the inviting company upon acceptance

## Admin Dashboard Features

### Search Functionality

The admin dashboard includes comprehensive real-time search functionality across all management pages:

#### Users Page Search
- **Location**: `/dashboard/admin/users`
- **Search Fields**: User name or email address
- **Features**:
  - Real-time filtering with 300ms debounce
  - URL-based search parameters (shareable/bookmarkable)
  - Automatic pagination reset on new search
  - Works with existing status filters (active, inactive, admin)
- **URL Parameters**: `?query=<search_term>&page=<page_number>&status=<status>`

#### Companies Page Search
- **Location**: `/dashboard/admin/companies` (Super Admin only)
- **Search Fields**: Company name or description
- **Features**:
  - Instant filtering of company list
  - Case-insensitive search
  - URL-based search parameters
- **URL Parameters**: `?query=<search_term>&page=<page_number>`

#### Invitations Page Search
- **Location**: `/dashboard/admin/invitations`
- **Search Fields**: Invitation email or company name
- **Features**:
  - Filters all invitation statuses (pending, accepted, expired, revoked)
  - Company-scoped for regular admins
  - Real-time search with debouncing
- **URL Parameters**: `?query=<search_term>`

#### Search Implementation Details
- **Component**: Reusable `Search` component (`/app/ui/search.tsx`)
- **Debounce**: 300ms delay to reduce API calls
- **URL State**: Search queries are stored in URL parameters for persistence
- **Responsive**: Works seamlessly on mobile and desktop devices
- **Accessibility**: Includes proper ARIA labels and keyboard navigation

## Security Considerations

1. **JWT Secrets**: Use strong, unique secrets for JWT signing (minimum 32 characters recommended)
2. **HTTPS**: Always use HTTPS in production
3. **Token Storage**: Store tokens securely (httpOnly cookies recommended for web apps, secure storage for mobile apps)
4. **Rate Limiting**: The API includes rate limiting to prevent abuse (100 requests per 15 minutes per IP)
5. **CORS**: Configure CORS properly for your domains using `ALLOWED_ORIGINS` environment variable
6. **Input Validation**: All inputs are validated using Zod schemas with proper error messages
7. **Password Hashing**: Passwords are hashed using bcrypt with salt rounds of 10
8. **Token Expiration**: Access tokens expire after 1 hour, refresh tokens expire after 7 days
9. **Active Users Only**: Only active users can authenticate (inactive accounts are rejected)
10. **Token Revocation**: Refresh tokens can be revoked on logout
11. **Company Isolation**: Regular admins are restricted to their company's data
12. **Super Admin Protection**: Super admin operations require explicit super admin status verification
13. **Search Security**: Search queries are sanitized and use parameterized database queries to prevent injection attacks

## Support

For issues or questions, please check the error responses and ensure you're following the API documentation correctly.
