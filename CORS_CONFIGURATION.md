# CORS Configuration Guide

This document explains how CORS (Cross-Origin Resource Sharing) is configured in the NextJS Auth API service.

## Overview

CORS has been properly configured to handle cross-origin requests from web applications. The configuration includes:

- **Preflight request handling** for OPTIONS requests
- **Dynamic origin validation** based on environment configuration
- **Proper CORS headers** on all API responses
- **Credential support** for authenticated requests

## Configuration

### Environment Variables

Set the `ALLOWED_ORIGINS` environment variable to specify which origins are allowed to make requests:

```bash
# Allow specific origins (recommended for production)
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,https://yourdomain.com"

# Allow all origins (development only - not recommended for production)
ALLOWED_ORIGINS="*"
```

If `ALLOWED_ORIGINS` is not set, it defaults to `http://localhost:3000,http://localhost:3001`.

### When Origin Header is Not Sent

**It's completely normal for requests to not include the `Origin` header** in the following scenarios:

1. **Same-Origin Requests**: When the web app and auth server share the same origin (same protocol, domain, and port), browsers don't send the `Origin` header. CORS doesn't apply to same-origin requests.

2. **Server-Side Requests**: Backend-to-backend API calls (from Node.js, Python, Java, etc.) don't include `Origin` because they're not browser-initiated.

3. **Non-Browser Clients**: Mobile apps, command-line tools (curl, Postman), and other non-browser clients typically don't send `Origin`.

4. **Simple Requests**: Some simple same-origin requests may omit the header.

**The CORS middleware handles this correctly** by:
- Allowing requests without `Origin` header (since CORS doesn't apply)
- Using the first allowed origin as a fallback for CORS headers
- Logging these cases for debugging purposes

### CORS Headers

The following CORS headers are automatically added to all API responses:

- `Access-Control-Allow-Origin`: The allowed origin (or `*` if configured)
- `Access-Control-Allow-Methods`: `GET, POST, PUT, DELETE, OPTIONS, PATCH`
- `Access-Control-Allow-Headers`: `Content-Type, Authorization, X-Requested-With, Accept, Origin`
- `Access-Control-Allow-Credentials`: `true`
- `Access-Control-Max-Age`: `86400` (24 hours)
- `Access-Control-Expose-Headers`: `X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset`

## Implementation Details

### Middleware Integration

The main middleware (`middleware.ts`) handles CORS preflight requests for all API routes:

```typescript
// Handle CORS for API routes
if (path.startsWith("/api/")) {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }
  return NextResponse.next();
}
```

### API Route Integration

All auth API routes have been updated to include CORS headers in their responses:

```typescript
import { addCorsHeaders } from "@/app/lib/api-middleware";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  // ... API logic ...
  const response = NextResponse.json(data);
  return addCorsHeaders(response, origin || undefined);
}
```

## Testing CORS

Use the provided test script to verify CORS configuration:

```bash
node test-cors.js
```

This script tests:
- Preflight requests (OPTIONS)
- Actual API requests
- CORS header presence
- Origin validation

## Security Considerations

1. **Production Setup**: Always specify exact origins in production, never use `*`
2. **Credentials**: CORS is configured to allow credentials, ensure your frontend handles this properly
3. **HTTPS**: Use HTTPS in production for secure cross-origin requests
4. **Environment Variables**: Keep your `ALLOWED_ORIGINS` configuration secure

## Troubleshooting

### Common Issues

1. **CORS errors in browser**: Check that your frontend origin is included in `ALLOWED_ORIGINS`
2. **Preflight failures**: Ensure the middleware is properly configured and running
3. **Missing headers**: Verify that API routes are using `addCorsHeaders()`

### Debug Mode

To debug CORS issues, check the browser's Network tab for:
- OPTIONS requests returning 200 status
- Proper CORS headers in responses
- Origin header in requests

## API Endpoints with CORS

All auth API endpoints support CORS:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/verify`
- `POST /api/v1/auth/setup`

## Example Frontend Usage

```javascript
// Making a CORS request from a frontend application
const response = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important for cookies/auth
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});
```
