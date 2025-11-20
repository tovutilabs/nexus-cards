# Authentication Extensions - Implementation Documentation

## Overview

This document details the implementation of advanced authentication features for Nexus Cards as specified in Prompt 10, including OAuth social login, two-factor authentication (2FA), email verification, and secure password recovery.

## Database Schema Changes

### New Models

#### OAuthProvider
Stores OAuth provider connections for social login functionality.

```prisma
enum OAuthProviderType {
  GOOGLE
  LINKEDIN
  MICROSOFT
}

model OAuthProvider {
  id          String            @id @default(cuid())
  userId      String
  provider    OAuthProviderType
  providerId  String
  email       String?
  accessToken String?
  refreshToken String?
  isPrimary   Boolean           @default(false)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerId])
  @@index([userId])
  @@index([provider])
  @@map("oauth_providers")
}
```

### Updated User Model

- `passwordHash`: Changed from required to optional (nullable) to support OAuth-only accounts
- `backupCodes`: Added array of hashed backup codes for 2FA recovery
- `oauthProviders`: Added relation to OAuthProvider model

## Backend Implementation

### 1. OAuth Social Login

#### Providers Implemented
- **Google OAuth 2.0**
- **LinkedIn OAuth 2.0**
- **Microsoft OAuth 2.0**

#### Architecture

**Services:**
- `OAuthService` (`apps/api/src/auth/oauth.service.ts`)
  - `findOrCreateUserFromOAuth()`: Handles OAuth callback, creates or links accounts
  - `getUserProviders()`: Retrieves user's connected OAuth providers
  - `linkProvider()`: Links additional OAuth provider to existing account
  - `unlinkProvider()`: Removes OAuth provider connection with safety checks

**Strategies:**
- `GoogleStrategy` (`apps/api/src/auth/strategies/google.strategy.ts`)
- `LinkedInStrategy` (`apps/api/src/auth/strategies/linkedin.strategy.ts`)
- `MicrosoftStrategy` (`apps/api/src/auth/strategies/microsoft.strategy.ts`)

**Endpoints:**
```
GET  /auth/oauth/google           - Initiates Google OAuth flow
GET  /auth/oauth/google/callback  - Google OAuth callback
GET  /auth/oauth/linkedin          - Initiates LinkedIn OAuth flow
GET  /auth/oauth/linkedin/callback - LinkedIn OAuth callback
GET  /auth/oauth/microsoft         - Initiates Microsoft OAuth flow
GET  /auth/oauth/microsoft/callback - Microsoft OAuth callback
GET  /auth/oauth/providers         - List user's connected providers (authenticated)
DELETE /auth/oauth/providers/:provider - Unlink OAuth provider (authenticated)
```

#### Account Linking Logic

1. **New User**: Creates account with OAuth provider as primary authentication method
2. **Existing User (by email)**: Links OAuth provider to existing account
3. **Existing OAuth Connection**: Authenticates user immediately
4. **Primary Provider**: First OAuth provider or when no password is set
5. **Safety Checks**: Cannot unlink last authentication method

#### Environment Variables

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

### 2. Two-Factor Authentication (2FA)

#### Implementation Details

**Library**: `speakeasy` for TOTP generation and verification

**Service**: `TwoFactorService` (`apps/api/src/auth/two-factor.service.ts`)

**Features:**
- TOTP-based authentication (compatible with Google Authenticator, Authy, 1Password)
- QR code generation for easy setup
- Backup codes (8 single-use codes)
- Time-based code verification with 2-window tolerance

**Endpoints:**
```
POST /auth/2fa/setup                    - Generate 2FA secret and QR code
POST /auth/2fa/enable                   - Enable 2FA with code verification
POST /auth/2fa/disable                  - Disable 2FA (requires code)
POST /auth/2fa/verify                   - Verify 2FA code
POST /auth/2fa/backup-codes/regenerate  - Generate new backup codes
POST /auth/login/2fa                    - Complete login with 2FA code
```

#### Setup Flow

1. User initiates 2FA setup: `POST /auth/2fa/setup`
   - Generates secret
   - Returns QR code (base64 data URL) and secret string
   - Secret temporarily stored in `User.twoFactorSecret`

2. User scans QR code with authenticator app

3. User enables 2FA: `POST /auth/2fa/enable`
   - Verifies code from authenticator
   - Enables 2FA (`User.twoFactorEnabled = true`)
   - Generates and returns backup codes
   - Backup codes are hashed before storage

4. User saves backup codes securely

#### Login Flow with 2FA

1. User submits credentials: `POST /auth/login`
   - If 2FA enabled, returns `{ requires2FA: true, userId, message }`
   - Frontend redirects to 2FA verification page

2. User enters 2FA code: `POST /auth/login/2fa`
   - Verifies TOTP code or backup code
   - Returns JWT token if valid
   - Used backup codes are removed from storage

#### Backup Codes

- 8-digit numeric codes
- Hashed using Argon2id before storage
- Each code usable once
- Automatically removed after use
- Can be regenerated (requires 2FA code verification)

### 3. Email Verification

**Service**: `EmailVerificationService` (`apps/api/src/auth/email-verification.service.ts`)

**Features:**
- Verification token generation
- Email verification status tracking
- Resend verification email capability
- OAuth users are auto-verified

**Endpoints:**
```
POST /auth/email/verify                - Verify email with token
POST /auth/email/resend-verification   - Resend verification email (authenticated)
GET  /auth/email/verification-status   - Check verification status (authenticated)
```

**Flow:**

1. Registration: User receives `emailVerificationToken`
2. Email sent with verification link: `https://nexus.cards/auth/verify?token=TOKEN`
3. User clicks link: Frontend calls `POST /auth/email/verify`
4. Backend verifies token and marks email as verified

**Token Generation:**
- Uses `CryptoService.generateVerificationToken()`
- Cryptographically secure random token
- No expiration (can be regenerated if needed)

### 4. Password Reset Workflow

**Existing Implementation Enhanced**

**Endpoints:**
```
POST /auth/forgot-password   - Request password reset (public)
POST /auth/reset-password    - Reset password with token (public)
```

**Flow:**

1. User requests reset: `POST /auth/forgot-password`
   - Generates `passwordResetToken` and `passwordResetExpires` (1 hour)
   - Stores in database
   - Sends reset email (in development, token returned in response)

2. User receives email with link: `https://nexus.cards/auth/reset-password?token=TOKEN`

3. User submits new password: `POST /auth/reset-password`
   - Validates token and expiration
   - Hashes new password with Argon2id
   - Clears reset token
   - Returns success message

**Security Features:**
- Tokens expire after 1 hour
- Single-use tokens (cleared after use)
- Generic success message (doesn't leak email existence)
- Password strength enforced by frontend validation

## Frontend Implementation

### Pages Created

#### 1. Email Verification Page
**Path**: `/auth/verify`
**File**: `apps/web/src/app/auth/verify/page.tsx`

**Features:**
- Reads token from query parameter
- Automatically verifies email on page load
- Shows loading, success, or error states
- Redirects to dashboard on success

#### 2. Password Reset Page
**Path**: `/auth/reset-password`
**File**: `apps/web/src/app/auth/reset-password/page.tsx`

**Features:**
- Form with password and confirm password fields
- Client-side validation (Zod schema)
- Token validation
- Success/error handling
- Redirect to login after success

#### 3. 2FA Setup Page
**Path**: `/auth/two-factor/setup`
**File**: `apps/web/src/app/auth/two-factor/setup/page.tsx`

**Features:**
- QR code display
- Manual secret key display (for manual entry)
- Code verification input
- Backup codes display and download
- Step-by-step guided process
- Warning about backup code importance

**Flow:**
1. Load: Fetches secret and QR code
2. Display: Shows QR code for scanning
3. Verify: User enters code from authenticator app
4. Success: Shows backup codes with download option
5. Complete: Redirects to settings

#### 4. 2FA Verification Page
**Path**: `/auth/two-factor`
**File**: `apps/web/src/app/auth/two-factor/page.tsx`

**Features:**
- 6-digit code input
- Real-time validation
- Backup code support (mentioned in UI)
- Session handling
- Error handling

**Flow:**
1. Receives email/password from login page via query params
2. User enters 2FA code
3. Submits to `/auth/login/2fa`
4. Redirects to dashboard on success

#### 5. Security Settings Page
**Path**: `/dashboard/settings/security`
**File**: `apps/web/src/app/dashboard/settings/security/page.tsx`

**Features:**
- 2FA status and management
  - Enable/disable 2FA
  - Regenerate backup codes
  - Status badge
- OAuth provider management
  - Connect/disconnect providers
  - Visual provider icons (Google, LinkedIn, Microsoft)
  - Primary provider indication
  - Connected email display
- Email verification status
  - Verification badge
  - Resend verification email button

**Security Checks:**
- Cannot unlink last authentication method
- Cannot disable 2FA without code verification
- Confirmation dialogs for destructive actions

### Updated Login Page

**File**: `apps/web/src/app/auth/login/page.tsx`

**New Features:**
- OAuth provider buttons (Google, LinkedIn, Microsoft)
- 2FA detection and redirection
- Enhanced error handling
- Visual provider icons

**OAuth Flow:**
1. User clicks provider button
2. Redirects to backend OAuth endpoint
3. Backend handles OAuth dance
4. Redirects back to frontend dashboard
5. Session established via HTTP-only cookie

### Auth Context Updates

**File**: `apps/web/src/contexts/auth-context.tsx`

**Changes:**
- `login()` now returns result object
- Handles `requires2FA` response
- Allows login page to redirect to 2FA verification

## Security Considerations

### Password Security
- Argon2id hashing (secure, memory-hard)
- Password field optional (OAuth-only accounts supported)
- Minimum 8 characters enforced on frontend

### Token Security
- All tokens cryptographically secure
- Short expiration times (1 hour for reset tokens)
- Single-use semantics
- Stored hashed when appropriate

### 2FA Security
- TOTP standard (RFC 6238)
- 30-second time window
- 2-window tolerance for clock skew
- Backup codes hashed with Argon2id
- Single-use backup codes

### OAuth Security
- State parameter for CSRF protection (handled by Passport)
- Secure callback URLs
- Account linking based on verified email
- Cannot unlink last authentication method

### Cookie Security
- HTTP-only cookies (prevents XSS)
- Secure flag in production (HTTPS only)
- SameSite=strict in production
- 7-day expiration

### API Security
- All auth mutations require authentication
- Rate limiting on auth endpoints
- No sensitive data in error messages
- Audit logging for security events

## Testing Strategy

### Unit Tests Required

**Backend:**
- `TwoFactorService`
  - Secret generation
  - Code verification (valid/invalid/expired)
  - Backup code generation and verification
  - Backup code single-use enforcement
- `EmailVerificationService`
  - Token generation and validation
  - Status checking
- `OAuthService`
  - Account creation
  - Account linking
  - Provider unlinking with safety checks
- `AuthService`
  - 2FA login flow
  - OAuth login integration

**Frontend:**
- 2FA setup flow
- OAuth button actions
- Email verification status display
- Password reset form validation

### Integration Tests Required

- OAuth complete flow (Google, LinkedIn, Microsoft)
- 2FA setup and login flow
- Email verification flow
- Password reset flow
- Account linking scenarios
- Edge cases (last auth method, primary provider, etc.)

### E2E Tests Required

- Register → Verify Email → Login
- Login with OAuth → Link additional provider
- Enable 2FA → Login with 2FA → Use backup code
- Forgot Password → Reset → Login
- Multiple OAuth providers management

## Environment Setup

### Backend Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nexus_cards"

# JWT
JWT_SECRET="your-secret-key"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

# URLs
API_URL="http://localhost:3001"
WEB_URL="http://localhost:3000"

# Encryption
ENCRYPTION_KEY="64-character-hex-string"
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## OAuth Provider Setup

### Google OAuth 2.0

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable Google+ API
4. Configure OAuth consent screen
5. Create OAuth 2.0 credentials
6. Add authorized redirect URI: `http://localhost:3001/auth/oauth/google/callback`
7. Copy Client ID and Client Secret to `.env`

### LinkedIn OAuth 2.0

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create an app
3. Add "Sign In with LinkedIn" product
4. Configure OAuth 2.0 settings
5. Add redirect URL: `http://localhost:3001/auth/oauth/linkedin/callback`
6. Copy Client ID and Client Secret to `.env`

### Microsoft OAuth 2.0

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory → App registrations
3. Register a new application
4. Configure redirect URI: `http://localhost:3001/auth/oauth/microsoft/callback`
5. Create a client secret
6. Copy Application (client) ID and client secret to `.env`

## Migration Guide

### Running the Migration

```bash
cd apps/api
npx prisma migrate deploy
```

### Migration Details

**Migration**: `20251120071655_add_oauth_and_auth_enhancements`

**Changes:**
1. Makes `User.passwordHash` nullable
2. Adds `User.backupCodes` array field
3. Creates `OAuthProvider` table
4. Creates `OAuthProviderType` enum
5. Adds indexes for performance

### Post-Migration Tasks

1. Generate Prisma client: `npx prisma generate`
2. Restart API server
3. Test OAuth flows
4. Verify existing users can still login

## Known Limitations

1. **Email Sending**: Email verification and password reset emails are not actually sent in development mode. Tokens are returned in API responses for testing.

2. **OAuth Token Refresh**: OAuth access/refresh tokens are stored but not automatically refreshed. Future enhancement needed for long-lived integrations.

3. **Session Management**: Single session per user. No multi-device session tracking.

4. **2FA Recovery**: No admin override for 2FA. Users must use backup codes if they lose access to authenticator app.

## Future Enhancements

1. **Email Service Integration**: Implement actual email sending via SendGrid/Mailchimp
2. **SMS 2FA**: Add SMS as alternative 2FA method
3. **WebAuthn**: Add passwordless authentication with FIDO2/WebAuthn
4. **Session Management**: Track and manage multiple active sessions
5. **OAuth Token Refresh**: Implement automatic token refresh
6. **Social Profile Sync**: Sync profile data from OAuth providers
7. **Admin 2FA Override**: Add emergency 2FA disable for support team
8. **Audit Logging**: Comprehensive security event logging
9. **Device Management**: Track and manage trusted devices
10. **Password Policy**: Configurable password strength requirements

## Troubleshooting

### OAuth Issues

**Problem**: OAuth redirect loops
**Solution**: Check `API_URL` and `WEB_URL` environment variables match your setup

**Problem**: "Provider not found" errors
**Solution**: Ensure OAuth strategies are registered in `AuthModule`

### 2FA Issues

**Problem**: QR code doesn't scan
**Solution**: Check secret format and app compatibility

**Problem**: Codes always invalid
**Solution**: Verify server time is synchronized (TOTP is time-based)

### Email Verification Issues

**Problem**: Verification link expired
**Solution**: Tokens don't expire; check token wasn't already used

**Problem**: Email not verified after OAuth login
**Solution**: OAuth users are auto-verified; check database directly

## Compliance Notes

### GDPR Considerations

- OAuth provider data is personal data
- Users can view and delete connected providers
- Backup codes contain no personal information
- Email verification status is required for audit trail

### Security Standards

- Follows OWASP authentication best practices
- TOTP implementation follows RFC 6238
- OAuth 2.0 implementation follows RFC 6749
- Password hashing follows modern cryptographic standards

## References

- [Passport.js Documentation](http://www.passportjs.org/)
- [Speakeasy TOTP Library](https://github.com/speakeasyjs/speakeasy)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
