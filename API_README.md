# NextJS Auth API Service

A comprehensive authentication API service built with Next.js that provides JWT-based authentication for other applications.

## 🚀 Quick Start

### 1. Setup Environment Variables

Create a `.env.local` file in your project root:

```env
# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://another-domain.com

# Database (already configured)
POSTGRES_URL=your-postgres-connection-string
```

### 2. Setup Database

Run the setup endpoint to create necessary tables:

```bash
curl -X POST http://localhost:3000/api/v1/auth/setup
```

### 3. Start the Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/v1`

## 📚 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | Login with email/password | No |
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout with refresh token | No |
| DELETE | `/auth/logout` | Logout with access token | Yes |
| GET | `/auth/verify` | Verify access token | Yes |
| POST | `/auth/setup` | Setup database tables | No |

### User Management

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/users/me` | Get current user profile | Yes | No |
| PUT | `/users/me` | Update current user profile | Yes | No |
| GET | `/users` | Get all users | Yes | Yes |

## 🔧 Usage Examples

### JavaScript/TypeScript

```javascript
import AuthAPIClient from './example-client.js';

const client = new AuthAPIClient('http://localhost:3000/api/v1');

// Login
await client.login('user@example.com', 'password123');

// Get user profile
const user = await client.getCurrentUser();

// Update profile
await client.updateProfile('New Name', 'newemail@example.com');

// Logout
await client.logout();
```

### cURL Examples

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get user profile
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Refresh token
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

## 🧪 Testing

Run the test script to verify everything works:

```bash
node test-api.js
```

## 🔒 Security Features

- **JWT Tokens**: Secure access and refresh tokens
- **Rate Limiting**: 100 requests per 15-minute window per IP
- **CORS Support**: Configurable allowed origins
- **Input Validation**: Zod schema validation for all inputs
- **Password Hashing**: bcrypt for secure password storage
- **Token Expiration**: 1-hour access tokens, 7-day refresh tokens

## 📖 Full Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API documentation including:

- Detailed endpoint descriptions
- Request/response examples
- Error handling
- Client implementation examples
- Security considerations

## 🏗️ Architecture

```
app/api/v1/
├── auth/
│   ├── login/route.ts      # User login
│   ├── register/route.ts   # User registration
│   ├── refresh/route.ts    # Token refresh
│   ├── logout/route.ts     # User logout
│   ├── verify/route.ts     # Token verification
│   └── setup/route.ts      # Database setup
└── users/
    ├── me/route.ts         # Current user operations
    └── route.ts            # User management (admin)
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for signing access tokens | Required |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | Required |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `*` |
| `POSTGRES_URL` | Database connection string | Required |

### Rate Limiting

- **Window**: 15 minutes
- **Limit**: 100 requests per IP
- **Headers**: Rate limit info in response headers

## 🚀 Production Deployment

1. **Set strong JWT secrets** in environment variables
2. **Configure CORS** with specific allowed origins
3. **Use HTTPS** for all API communications
4. **Set up proper logging** and monitoring
5. **Configure database** with proper SSL settings
6. **Set up rate limiting** at the reverse proxy level

## 🤝 Integration

This API can be integrated with:

- **Web Applications**: React, Vue, Angular, etc.
- **Mobile Apps**: React Native, Flutter, native apps
- **Backend Services**: Node.js, Python, Java, etc.
- **Microservices**: As a centralized auth service

## 📝 License

This project is part of the NextJS Auth application.
