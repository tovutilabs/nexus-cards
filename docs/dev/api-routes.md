# API Routes Documentation

## Base URL

All API routes are prefixed with `/api` as configured in `apps/api/src/main.ts`:

```typescript
app.setGlobalPrefix('api');
```

## Available Endpoints

### Root Information
`GET /api/`

Returns API metadata and available endpoints.

**Response:**
```json
{
  "name": "Nexus Cards API",
  "version": "0.1.0",
  "apiPrefix": "/api",
  "endpoints": ["/api/health"]
}
```

### Health Check
`GET /api/health`

Returns API health status and current timestamp.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-17T21:49:22.647Z"
}
```

## Common Issues

### 404 Not Found at Root URL

**Problem:** Accessing `http://localhost:3001/` returns:
```json
{
  "message": "Cannot GET /",
  "error": "Not Found",
  "statusCode": 404
}
```

**Explanation:** This is **expected behavior**. All API routes require the `/api` prefix.

**Solution:** Use the correct endpoint:
- ✅ `http://localhost:3001/api/` - API information
- ✅ `http://localhost:3001/api/health` - Health check
- ❌ `http://localhost:3001/` - Not Found (no route defined)

## Route Structure

The API follows NestJS conventions with a global prefix:

```
http://localhost:3001/
├── /api/               # Root API information (AppController @Get())
├── /api/health         # Health check (AppController @Get('health'))
└── (future routes)
    ├── /api/auth/*     # Authentication (Prompt 4)
    ├── /api/users/*    # User management
    ├── /api/cards/*    # Card operations
    ├── /api/nfc/*      # NFC tag management
    └── ...more routes to be added
```

## Adding New Routes

When creating new controllers, routes automatically get the `/api` prefix:

```typescript
@Controller('users')  // Results in /api/users/*
export class UsersController {
  @Get()              // /api/users
  @Get(':id')         // /api/users/:id
  @Post()             // /api/users
}
```

## Testing Endpoints

### Using curl
```bash
# API info
curl http://localhost:3001/api/

# Health check
curl http://localhost:3001/api/health
```

### Using a browser
- Visit: http://localhost:3001/api/
- Visit: http://localhost:3001/api/health

### Using Postman/Insomnia
- Base URL: `http://localhost:3001`
- All requests must start with `/api`

## CORS Configuration

The API is configured to accept requests from the web frontend:

```typescript
app.enableCors({
  origin: process.env.WEB_URL || 'http://localhost:3000',
  credentials: true,
});
```

Default allowed origin: `http://localhost:3000`

## Future API Routes

As development progresses through the prompts, these routes will be added:

### Prompt 3 - Domain Model
- Module skeletons created (no routes yet)

### Prompt 4 - Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`

### Prompt 5 - Cards & NFC
- `GET /api/cards`
- `POST /api/cards`
- `GET /api/cards/:id`
- `PATCH /api/cards/:id`
- `DELETE /api/cards/:id`
- `GET /api/public/cards/:slug`
- `GET /api/nfc/resolve?uid=:uid`

See `prompts.md` for the full implementation roadmap.
