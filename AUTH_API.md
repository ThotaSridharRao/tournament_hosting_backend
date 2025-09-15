# EArena Authentication API

## Base URL
```
https://earena-backend.onrender.com/api/auth
```

## Endpoints

### 1. Register User
**POST** `/register`

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "avatarUrl": "",
      "roles": ["user"],
      "createdAt": "2025-01-15T10:30:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

**Validation Rules:**
- Username: 3-30 characters, alphanumeric only
- Email: Valid email format
- Password: Min 8 characters, must contain uppercase, lowercase, and number
- Confirm Password: Must match password

### 2. Login User
**POST** `/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123",
  "rememberMe": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "username": "johndoe",
      "email": "john@example.com",
      "avatarUrl": "",
      "roles": ["user"],
      "createdAt": "2025-01-15T10:30:00.000Z"
    },
    "token": "jwt_token_here",
    "expiresIn": "30d",
    "rememberMe": true
  }
}
```

### 3. Get Current User
**GET** `/me`

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "avatarUrl": "",
    "roles": ["user"],
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### 4. Logout User
**POST** `/logout`

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 5. Refresh Token
**POST** `/refresh`

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "user": { /* user object */ },
    "token": "new_jwt_token_here"
  }
}
```

### 6. Check Email Availability
**POST** `/check-email`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "available": false,
    "exists": true
  }
}
```

### 7. Check Username Availability
**POST** `/check-username`

**Request Body:**
```json
{
  "username": "johndoe"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "available": false,
    "exists": true
  }
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "error": "Invalid email or password",
  "field": "password"
}
```

### Rate Limit Error (429)
```json
{
  "success": false,
  "error": "Too many login attempts. Please try again in 15 minutes.",
  "retryAfter": "15 minutes"
}
```

### Account Locked (401)
```json
{
  "success": false,
  "error": "Account is temporarily locked due to multiple failed login attempts.",
  "code": "ACCOUNT_LOCKED",
  "lockUntil": "2025-01-15T12:30:00.000Z"
}
```

## Rate Limits

- **Registration**: 3 attempts per hour per IP
- **Login**: 5 attempts per 15 minutes per IP
- **General Auth**: 10 requests per 15 minutes per IP
- **Account Lock**: 5 failed login attempts locks account for 2 hours

## Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT token authentication
- ✅ Rate limiting on auth endpoints
- ✅ Account locking after failed attempts
- ✅ Input validation and sanitization
- ✅ Case-insensitive email handling
- ✅ Username uniqueness (case-insensitive)
- ✅ Token expiration handling
- ✅ Remember me functionality

## Test Accounts

```
Admin: admin@earena.com / password123
User 1: captain1@example.com / password123
User 2: player2@example.com / password123
Test: test@earena.com / password123
```