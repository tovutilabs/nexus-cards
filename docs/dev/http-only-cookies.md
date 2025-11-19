# HTTP-Only Cookies Authentication

## Overview

Nexus Cards uses HTTP-only cookies for secure token storage instead of localStorage. This approach provides better security against XSS attacks since JavaScript cannot access HTTP-only cookies.

## Implementation Details

### Backend (NestJS)

#### Cookie Configuration

```typescript
// Cookie settings in auth.controller.ts
res.cookie('access_token', token, {
  httpOnly: true, // Cannot be accessed by JavaScript
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'lax', // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/', // Available site-wide
});
```

#### JWT Strategy

The JWT strategy extracts tokens from cookies first, then falls back to Bearer token:

```typescript
// apps/api/src/auth/strategies/jwt.strategy.ts
jwtFromRequest: ExtractJwt.fromExtractors([
  (request: Request) => {
    return request?.cookies?.access_token;
  },
  ExtractJwt.fromAuthHeaderAsBearerToken(), // Fallback for API clients
]);
```

#### CORS Configuration

CORS is configured to allow credentials (cookies):

```typescript
// apps/api/src/main.ts
app.enableCors({
  origin: process.env.WEB_URL || 'http://localhost:3000',
  credentials: true, // Required for cookie-based auth
});
```

#### Middleware

Cookie parser middleware is added to parse incoming cookies:

```typescript
import cookieParser from 'cookie-parser';

app.use(cookieParser());
```

### Frontend (Next.js)

#### API Client

All API requests include credentials to send/receive cookies:

```typescript
// apps/web/src/lib/api-client.ts
const response = await fetch(`${this.baseUrl}${endpoint}`, {
  ...options,
  headers,
  credentials: 'include', // Send cookies with every request
});
```

#### Auth Context

The auth context no longer manages tokens directly:

- **No localStorage access** - Tokens are stored as HTTP-only cookies
- **Cookie management is automatic** - Browser handles cookie storage/transmission
- **Login/Register** - Server sets cookie in response
- **Logout** - Server clears cookie
- **Protected requests** - Cookie automatically included

## Authentication Flow

### 1. Registration

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe"
}

# Response includes Set-Cookie header
Set-Cookie: access_token=<JWT>; HttpOnly; SameSite=Lax; Max-Age=604800
```

### 2. Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}

# Response includes Set-Cookie header
Set-Cookie: access_token=<JWT>; HttpOnly; SameSite=Lax; Max-Age=604800
```

### 3. Protected Requests

```bash
GET /api/users/me
Cookie: access_token=<JWT>

# Browser automatically includes cookie
# No Authorization header needed
```

### 4. Logout

```bash
POST /api/auth/logout
Cookie: access_token=<JWT>

# Response clears cookie
Set-Cookie: access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

## Security Benefits

### HTTP-Only Flag

- **Protection**: JavaScript cannot access the token
- **Benefit**: Prevents XSS attacks from stealing tokens
- **Trade-off**: Token cannot be read by client-side code

### SameSite Attribute

- **Setting**: `lax` in development, `strict` in production
- **Protection**: Prevents CSRF attacks
- **Behavior**: Cookie only sent with same-site requests

### Secure Flag

- **Setting**: Enabled in production only
- **Protection**: Cookie only sent over HTTPS
- **Development**: Disabled to allow HTTP testing

### Max-Age

- **Duration**: 7 days (604800 seconds)
- **Benefit**: Automatic token expiration
- **Behavior**: Browser automatically deletes expired cookies

## Testing

### Manual Testing

```bash
# 1. Login and save cookies
curl -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nexus.cards","password":"Admin123!"}'

# 2. Use cookie for protected request
curl -b cookies.txt http://localhost:3001/api/users/me

# 3. Logout and clear cookie
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3001/api/auth/logout

# 4. Verify access denied after logout
curl -b cookies.txt http://localhost:3001/api/users/me
# Should return 401 Unauthorized
```

### Browser Testing

1. Open browser DevTools → Application → Cookies
2. Login via frontend
3. Observe `access_token` cookie with `HttpOnly` flag
4. Try accessing cookie via console:
   ```javascript
   document.cookie; // Should NOT show access_token
   ```
5. Logout and verify cookie is removed

## Environment Configuration

### Development

```env
NODE_ENV=development
WEB_URL=http://localhost:3000
JWT_SECRET=your-secret-key
```

- Cookies use `SameSite=Lax`
- `Secure` flag disabled (allows HTTP)
- CORS allows localhost:3000

### Production

```env
NODE_ENV=production
WEB_URL=https://yourdomain.com
JWT_SECRET=strong-random-secret
```

- Cookies use `SameSite=Strict`
- `Secure` flag enabled (HTTPS only)
- CORS restricted to production domain

## Backward Compatibility

The JWT strategy supports both cookie-based and Bearer token authentication:

```typescript
// Cookie-based (primary)
Cookie: access_token=<JWT>

// Bearer token (fallback for API clients)
Authorization: Bearer <JWT>
```

This allows:

- Web frontend to use secure HTTP-only cookies
- API clients to use Bearer tokens
- Mobile apps to use Bearer tokens
- Gradual migration from localStorage to cookies

## Common Issues

### CORS Errors

**Symptom**: Cookies not being set/sent

**Solution**: Ensure `credentials: true` in CORS config and `credentials: 'include'` in fetch

### Cookie Not Persisted

**Symptom**: Cookie disappears after request

**Solution**: Check `Max-Age` is set and browser allows cookies

### 401 on Protected Routes

**Symptom**: Authenticated requests return 401

**Solution**: Verify cookie name matches (`access_token`) and is being sent

### SameSite Issues

**Symptom**: Cookie not sent on cross-site requests

**Solution**: Use `SameSite=Lax` for development, check domain configuration

## Migration from localStorage

If migrating from localStorage-based tokens:

1. ✅ **Backend**: Add cookie-parser middleware
2. ✅ **Backend**: Update auth endpoints to set cookies
3. ✅ **Backend**: Update JWT strategy to extract from cookies
4. ✅ **Backend**: Enable CORS credentials
5. ✅ **Frontend**: Add `credentials: 'include'` to fetch
6. ✅ **Frontend**: Remove localStorage get/set/remove calls
7. ✅ **Frontend**: Update auth context to not manage tokens
8. ⚠️ **Users**: Existing users need to re-login (old tokens invalidated)

## Security Checklist

- ✅ HTTP-only cookies enabled
- ✅ SameSite attribute set (`lax`/`strict`)
- ✅ Secure flag enabled in production
- ✅ CORS configured with credentials
- ✅ Token expiration implemented (7 days)
- ✅ Logout clears cookie
- ✅ No token storage in localStorage
- ✅ Bearer token fallback for API clients

## References

- [OWASP Cookie Security](https://owasp.org/www-community/controls/SecureCookieAttribute)
- [MDN HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [SameSite Cookies Explained](https://web.dev/samesite-cookies-explained/)
