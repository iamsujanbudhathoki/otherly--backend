# Otherly Platform — API & GraphQL Master Documentation

> **Complete REST Routes & GraphQL Operations Reference for Frontend (Web) and Mobile (iOS / Android) Engineering Teams.**  
> **Backend Version:** 1.0.0  
> **Last Updated:** October 2026

---

## Table of Contents

1. [Architectural Overview & Standards](#1-architectural-overview--standards)
   - [Base URLs & Endpoints](#base-urls--endpoints)
   - [When to Use REST vs GraphQL](#when-to-use-rest-vs-graphql)
   - [Authentication & JWT Token Lifecycle](#authentication--jwt-token-lifecycle)
   - [User Roles & Permissions](#user-roles--permissions)
   - [Standard Request & Response Formats](#standard-request--response-formats)
   - [Error Handling & Status Codes](#error-handling--status-codes)
   - [Rate Limiting & Security Controls](#rate-limiting--security-controls)
   - [Media & File Upload Workflow](#media--file-upload-workflow)
2. [REST API Documentation (Exhaustive)](#2-rest-api-documentation)
   - [🔐 Authentication & User Account (`/api/v1/auth`)](#-authentication--user-account-apiv1auth)
   - [🛡️ Admin Authentication (`/api/v1/admin/auth`)](#️-admin-authentication-apiv1adminauth)
   - [📁 Media Storage & Uploads (`/api/v1/media`)](#-media-storage--uploads-apiv1media)
   - [📬 Contact Inquiries (`/api/v1/contact`)](#-contact-inquiries-apiv1contact)
   - [💓 System & Health Checks (`/health`, `/api/v1/health`, `/`)](#-system--health-checks)
3. [GraphQL API Documentation (Exhaustive)](#3-graphql-api-documentation)
   - [GraphQL Protocol & Headers](#graphql-protocol--headers)
   - [Marketplace Core Business Flows](#marketplace-core-business-flows)
   - [GraphQL Queries Reference](#graphql-queries-reference)
   - [GraphQL Mutations Reference](#graphql-mutations-reference)
4. [GraphQL Type System & Enums Dictionary](#4-graphql-type-system--enums-dictionary)
5. [Frontend & Mobile Integration Playbook](#5-frontend--mobile-integration-playbook)
   - [Auth Storage & Auto-Refresh Interceptor Pattern](#auth-storage--auto-refresh-interceptor-pattern)
   - [Media Upload + GraphQL Mutation Recipe](#media-upload--graphql-mutation-recipe)
   - [Handling Pagination on Mobile](#handling-pagination-on-mobile)

---

# 1. Architectural Overview & Standards

### Base URLs & Endpoints

| Environment | Base URL | REST Base Path | GraphQL Endpoint | Swagger UI (Docs) |
| :--- | :--- | :--- | :--- | :--- |
| **Development** | `http://localhost:4000` | `http://localhost:4000/api/v1` | `http://localhost:4000/graphql` | `http://localhost:4000/api-docs` |
| **Staging** | `https://staging-api.otherly.com` | `https://staging-api.otherly.com/api/v1` | `https://staging-api.otherly.com/graphql` | *(Disabled in non-dev)* |
| **Production** | `https://api.otherly.com` | `https://api.otherly.com/api/v1` | `https://api.otherly.com/graphql` | *(Disabled in production)* |

---

### When to Use REST vs GraphQL

| Protocol | Primary Responsibility | Why |
| :--- | :--- | :--- |
| **REST API (`/api/v1/*`)** | **Authentication & File Uploads** | Standard cookie/header token management, binary multipart streaming (`multipart/form-data`) for files, reset tokens, password management. |
| **GraphQL API (`/graphql`)** | **Marketplace Domain Operations** | Reverse marketplace requests, vendor quotes/offers, products, categories, orders, user profiles, stats, in-app notifications. Enables single-query nested data fetching without over-fetching. |

---

### Authentication & JWT Token Lifecycle

Otherly uses stateless JWT tokens:
- **`accessToken`**: Short-lived (typically 15m to 2h) used in all authorized calls.
- **`refreshToken`**: Long-lived (7 to 30 days) used solely to issue a new `accessToken`.

#### HTTP Header
Send the Bearer token in the standard HTTP `Authorization` header:
```http
Authorization: Bearer <accessToken>
```

#### Token Expiration Flow
1. API responds with `401 Unauthorized` or GraphQL returns `UNAUTHENTICATED`.
2. Frontend/Mobile intercepts the `401` error.
3. Call `POST /api/v1/auth/refresh` (or `/api/v1/admin/auth/refresh` for admin) with `{ "refreshToken": "<token>" }`.
4. Store the new `accessToken` and retry the original failed request.
5. If the refresh request itself fails (e.g. token expired/invalidated), log the user out and redirect to Login screen.

---

### User Roles & Permissions

#### User Roles (`Role` enum)
- `CUSTOMER`: End consumer who creates project/item requests, browses products, accepts offers, and places orders.
- `VENDOR`: Merchant or supplier who lists products, discovers customer requests, submits competitive offers/quotes, and fulfills orders.
- `ADMIN`: Platform staff with administrative dashboards.
- `SUPER_ADMIN`: Root platform super administrator with global bypass permissions.

#### Admin Permissions (`AdminPermission` enum)
- `PRODUCT`, `CATEGORIES`, `REQUESTS`, `OFFERS`, `ORDERS`, `VENDORS`, `CUSTOMERS`, `CONTACTS`, `LOGS`.

---

### Standard Request & Response Formats

#### Standard REST Response Envelope (`ApiResponse<T>`)
Every REST response follows this JSON structure:
```json
{
  "success": true,
  "message": "Action completed successfully",
  "data": { ... }
}
```

#### Standard REST Error Envelope
```json
{
  "success": false,
  "message": "Descriptive error message",
  "data": null
}
```

#### Standard GraphQL Response
```json
{
  "data": {
    "me": {
      "id": "c138b321-4d1a-466d-8b09-cf8bf9515556",
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }
}
```

---

### Error Handling & Status Codes

| HTTP Status | Meaning | Scenario |
| :--- | :--- | :--- |
| **200 OK** | Request succeeded | Successful GET, PUT, PATCH, DELETE, or Login/Refresh |
| **201 Created** | Resource created | Successful entity creation (e.g. `/register`, `/contact`) |
| **400 Bad Request** | Validation failed | Missing required input, invalid email, password too short, invalid UUID |
| **401 Unauthorized** | Missing or invalid token | Bearer token missing, expired, or malformed |
| **403 Forbidden** | Insufficient permissions | A `CUSTOMER` attempting to execute vendor-only actions |
| **404 Not Found** | Resource not found | Product, Request, Category, or Media ID does not exist |
| **429 Too Many Requests** | Rate limit triggered | Brute-force protection or hitting query rate limits |
| **500 Internal Error** | Server failure | Database connection error, unhandled exception |

---

### Rate Limiting & Security Controls

- **Global REST Rate Limit:** `1000 requests per 10 minutes` per IP address.
- **Authentication Endpoints:** `25 attempts per 15 minutes` per IP address on:
  - `/api/v1/auth/otp/send` (Plus 60s cooldown per mobile number)
  - `/api/v1/auth/otp/verify` (Max 5 attempts per OTP code)
  - `/api/v1/auth/login` (Restricted to Administrators/Superadmins)
  - `/api/v1/auth/register`
  - `/api/v1/auth/forgot-password`
  - `/api/v1/auth/reset-password`
  - `/api/v1/admin/auth/login`
- **GraphQL Rate Limit:** `300 requests per 1 minute` per IP address.
- **GraphQL Query Depth Limit:** Maximum nesting depth is `7` levels.
- **Request Correlation ID:** Every request receives/maintains an `X-Request-Id` response header.

---

### Media & File Upload Workflow

Otherly uses centralized Media entities (`Media`).

```
[ Mobile / Web App ]
       │
       │ 1. POST /api/v1/media (multipart/form-data)
       ▼
 [ Media Service ] ──► Uploads to Cloudinary / Firebase / Local Disk
       │
       ▼
 Returns: { id: "media-uuid", url: "https://...", mediaType: "PRODUCT_IMAGE" }
       │
       │ 2. Use media-uuid in GraphQL Mutations:
       │    createProduct(input: { imageMediaIds: ["media-uuid"] })
       │    createRequest(input: { attachmentMediaIds: ["media-uuid"] })
       ▼
 [ GraphQL API ] ──► Associates Media to Product / Request / Category
```

---

# 2. REST API Documentation

---

## 🔐 Authentication & User Account (`/api/v1/auth`)

> **Authentication Model:**
> - **Customers & Marketplace Users:** Authenticate using passwordless **Mobile OTP** (`/api/v1/auth/otp/send` and `/api/v1/auth/otp/verify`).
> - **Administrators & Superadmins:** Authenticate using email and password (`/api/v1/admin/auth/login` or `/api/v1/auth/login`). Password login for regular customers/vendors is strictly restricted.

---

### 1. Request OTP Code (Mobile Authentication)
- **Method:** `POST`
- **Path:** `/api/v1/auth/otp/send`
- **Auth:** Public
- **Description:** Sends a 6-digit OTP code to the user's mobile number. Enforces a 60-second cooldown between requests.
- **Rate Limit:** Strict (25 per 15m IP rate limit + 60s per-phone cooldown)

#### Request Body (`application/json`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `phoneNumber` | `string` | **Yes** | Phone number with country code (e.g., `+9779812345678`) |

```json
{
  "phoneNumber": "+9779812345678"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Verification code sent to your mobile number successfully",
  "data": {
    "cooldownSeconds": 60,
    "otp": "492817"
  }
}
```

> **Notes:**
> - `cooldownSeconds`: Wait 60 seconds before showing/allowing a "Resend OTP" button.
> - `data.otp` is present only in development / testing environments. In production, this field is omitted.

#### Error Response (`400 Bad Request` - Cooldown Active)
```json
{
  "success": false,
  "message": "Please wait 45 seconds before requesting another code.",
  "data": null
}
```

---

### 2. Verify OTP & Login
- **Method:** `POST`
- **Path:** `/api/v1/auth/otp/verify`
- **Auth:** Public
- **Description:** Verifies the 6-digit code and logs the user in. If no account exists with this mobile number, automatically registers a new Customer account and logs in.
- **Rate Limit:** Strict (25 per 15m IP limit + 5 attempts per OTP code)

#### Request Body (`application/json`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `phoneNumber` | `string` | **Yes** | Phone number with country code (e.g., `+9779812345678`) |
| `otp` | `string` | **Yes** | 6-digit OTP code (e.g., `492817`) |

```json
{
  "phoneNumber": "+9779812345678",
  "otp": "492817"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Logged in Successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "e22a45d0-9f22-4809-9f7a-8b8d9633e9bf",
      "name": "User 5678",
      "email": "",
      "role": "CUSTOMER",
      "isEmailVerified": false,
      "isPhoneVerified": true,
      "isVendorVerified": false,
      "isActive": true,
      "phoneNumber": "+9779812345678",
      "avatar": null,
      "customer": {
        "id": "78ff0f81-64d8-4a61-9c1a-2895f57dd21b"
      },
      "createdAt": "2026-10-08T12:00:00.000Z"
    }
  }
}
```

#### Error Response (`400 Bad Request` - Expired or Invalid OTP)
```json
{
  "success": false,
  "message": "Invalid verification code.",
  "data": null
}
```
```json
{
  "success": false,
  "message": "Verification code has expired or was not requested. Please request a new code.",
  "data": null
}
```

---

### 3. Register User (Legacy / Optional Email Registration)
- **Method:** `POST`
- **Path:** `/api/v1/auth/register`
- **Auth:** Public
- **Description:** Registers a new `CUSTOMER` or `VENDOR` account with email and password. Automatically triggers an email verification message.
- **Rate Limit:** Strict (25 per 15m)

#### Request Body (`application/json`)
| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | `string` | **Yes** | - | Full name of the user |
| `email` | `string` | **Yes** | - | Valid email address |
| `password` | `string` | **Yes** | - | Minimum 8 characters |
| `role` | `string` | No | `CUSTOMER` | Enum: `CUSTOMER` or `VENDOR` |
| `phoneNumber` | `string` | No | - | Contact phone number |
| `businessName` | `string` | No | - | Required/recommended if registering as `VENDOR` |
| `businessAddress`| `string` | No | - | Business address for vendors |

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123!",
  "role": "CUSTOMER",
  "phoneNumber": "+1234567890"
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "id": "e22a45d0-9f22-4809-9f7a-8b8d9633e9bf",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "CUSTOMER",
    "isEmailVerified": false,
    "isVendorVerified": false,
    "isActive": true,
    "phoneNumber": "+1234567890",
    "avatar": null,
    "customer": {
      "id": "78ff0f81-64d8-4a61-9c1a-2895f57dd21b"
    },
    "createdAt": "2026-10-08T12:00:00.000Z"
  }
}
```

---

### 2. Verify Email
- **Method:** `POST`
- **Path:** `/api/v1/auth/verify-email`
- **Auth:** Public
- **Description:** Verifies user email address using the token received in email.

#### Request Body (`application/json`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `token` | `string` | **Yes** | Secure email verification token |

```json
{
  "token": "d74bf080-6923-45c1-90a2-2591fa7c06eb"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Email verified successfully.",
  "data": null
}
```

---

### 3. Resend Email Verification
- **Method:** `POST`
- **Path:** `/api/v1/auth/resend-verification`
- **Auth:** Public
- **Description:** Resends a verification email if previous token expired or was lost.

#### Request Body (`application/json`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Yes** | Registered email address |

```json
{
  "email": "jane@example.com"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Verification email sent.",
  "data": null
}
```

---

### 4. Administrator Password Login
- **Method:** `POST`
- **Path:** `/api/v1/auth/login`
- **Auth:** Public
- **Description:** Authenticates an Administrator or Superadmin with email & password.
> **Note:** Password login is restricted strictly to administrators. Customers and vendors must authenticate via the passwordless **Mobile OTP** flow (`/api/v1/auth/otp/send` & `/api/v1/auth/otp/verify`). If a regular customer/vendor attempts email/password login, the server returns `403 Forbidden`.
- **Rate Limit:** Strict (25 per 15m)

#### Request Body (`application/json`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Yes** | Registered administrator email |
| `password` | `string` | **Yes** | Account password |

```json
{
  "email": "jane@example.com",
  "password": "SecurePassword123!"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "e22a45d0-9f22-4809-9f7a-8b8d9633e9bf",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "CUSTOMER",
      "isEmailVerified": true,
      "isVendorVerified": false,
      "isActive": true,
      "phoneNumber": "+1234567890",
      "avatar": null,
      "customer": {
        "id": "78ff0f81-64d8-4a61-9c1a-2895f57dd21b",
        "shippingAddress": "123 Main St",
        "city": "Austin",
        "state": "TX",
        "postalCode": "78701",
        "country": "USA"
      },
      "createdAt": "2026-10-08T12:00:00.000Z"
    }
  }
}
```

---

### 5. Refresh Access Token
- **Method:** `POST`
- **Path:** `/api/v1/auth/refresh`
- **Auth:** Public
- **Description:** Exchanges a valid refresh token for a newly signed access token and rotated refresh token.

#### Request Body (`application/json`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `refreshToken` | `string` | **Yes** | Current refresh token |

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Token refreshed successfully.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 6. Logout
- **Method:** `POST`
- **Path:** `/api/v1/auth/logout`
- **Auth:** Bearer Token (`CUSTOMER`, `VENDOR`, `ADMIN`)
- **Description:** Revokes current refresh tokens for the authenticated user session.

#### Headers
```http
Authorization: Bearer <accessToken>
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Logged out successfully.",
  "data": null
}
```

---

### 7. Get Current User Profile (`/me`)
- **Method:** `GET`
- **Path:** `/api/v1/auth/me`
- **Auth:** Bearer Token
- **Description:** Returns the complete user identity, including nested customer or vendor profile details.

#### Headers
```http
Authorization: Bearer <accessToken>
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Data fetched successfully.",
  "data": {
    "id": "e22a45d0-9f22-4809-9f7a-8b8d9633e9bf",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "CUSTOMER",
    "isEmailVerified": true,
    "isVendorVerified": false,
    "isActive": true,
    "phoneNumber": "+1234567890",
    "avatar": "https://res.cloudinary.com/.../avatar.jpg",
    "customer": {
      "id": "78ff0f81-64d8-4a61-9c1a-2895f57dd21b",
      "shippingAddress": "123 Market St",
      "city": "Austin",
      "state": "TX",
      "postalCode": "78701",
      "country": "USA",
      "preferences": "Eco-friendly packaging"
    },
    "createdAt": "2026-10-08T12:00:00.000Z"
  }
}
```

---

### 8. Change Password
- **Method:** `POST`
- **Path:** `/api/v1/auth/change-password`
- **Auth:** Bearer Token
- **Description:** Updates password for the authenticated user session. Requires current password verification.

#### Request Body (`application/json`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `oldPassword` | `string` | **Yes** | Current password |
| `newPassword` | `string` | **Yes** | New password (minimum 8 characters) |

```json
{
  "oldPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword456!"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Password changed successfully.",
  "data": null
}
```

---

### 9. Forgot Password
- **Method:** `POST`
- **Path:** `/api/v1/auth/forgot-password`
- **Auth:** Public
- **Description:** Initiates password reset flow by sending a reset email with token.
- **Rate Limit:** Strict (25 per 15m)

#### Request Body (`application/json`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Yes** | Account email address |

```json
{
  "email": "jane@example.com"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Password reset email sent if account exists.",
  "data": null
}
```

---

### 10. Reset Password
- **Method:** `POST`
- **Path:** `/api/v1/auth/reset-password`
- **Auth:** Public
- **Description:** Resets account password using token from reset email.
- **Rate Limit:** Strict (25 per 15m)

#### Request Body (`application/json`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `token` | `string` | **Yes** | Reset token received in email |
| `newPassword`| `string` | **Yes** | New password (minimum 8 characters) |

```json
{
  "token": "4a713997-76fe-4f18-bb9e-ff9d63c22071",
  "newPassword": "BrandNewPassword789!"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Password reset successfully.",
  "data": null
}
```

---

### 11. Check Email Availability
- **Method:** `GET`
- **Path:** `/api/v1/auth/check-email`
- **Auth:** Public
- **Description:** Utility endpoint for signup forms to check if an email is already registered in real time.

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Yes** | Email to check |

#### Example Request
```http
GET /api/v1/auth/check-email?email=newuser@example.com
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Action completed successfully.",
  "data": {
    "available": true
  }
}
```

---

### 12. Update Base User Profile
- **Method:** `PATCH`
- **Path:** `/api/v1/auth/profile`
- **Auth:** Bearer Token
- **Description:** Updates user profile information (name, phone, avatar URL, business info).

#### Request Body (`application/json`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | No | Full name |
| `phoneNumber` | `string` | No | Contact phone number |
| `avatar` | `string` | No | Public URL or Media URL of avatar image |
| `businessName` | `string` | No | Business display name (for Vendors) |
| `businessAddress`| `string` | No | Business address (for Vendors) |

```json
{
  "name": "Jane Alexander Doe",
  "phoneNumber": "+19876543210",
  "avatar": "https://storage.googleapis.com/.../profile.png"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Data updated successfully.",
  "data": {
    "id": "e22a45d0-9f22-4809-9f7a-8b8d9633e9bf",
    "name": "Jane Alexander Doe",
    "email": "jane@example.com",
    "role": "CUSTOMER",
    "isEmailVerified": true,
    "isVendorVerified": false,
    "isActive": true,
    "phoneNumber": "+19876543210",
    "avatar": "https://storage.googleapis.com/.../profile.png",
    "createdAt": "2026-10-08T12:00:00.000Z"
  }
}
```

---

### 13. Deactivate / Delete Account
- **Method:** `DELETE`
- **Path:** `/api/v1/auth/account`
- **Auth:** Bearer Token
- **Description:** Soft-deactivates the authenticated user account and revokes active sessions.

#### Headers
```http
Authorization: Bearer <accessToken>
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Data deleted successfully.",
  "data": null
}
```

---

## 🛡️ Admin Authentication (`/api/v1/admin/auth`)

---

### 1. Admin Login
- **Method:** `POST`
- **Path:** `/api/v1/admin/auth/login`
- **Auth:** Public
- **Description:** Admin-portal sign-in for `ADMIN` and `SUPER_ADMIN` staff.
- **Rate Limit:** Strict (25 per 15m)

#### Request Body (`application/json`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Yes** | Admin email |
| `password` | `string` | **Yes** | Admin password (minimum 8 characters) |

```json
{
  "email": "admin@otherly.com",
  "password": "AdminSuperSecretPassword123!"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "id": "99bb12a0-43f1-4df6-a67b-1188339900aa",
    "name": "System Administrator",
    "email": "admin@otherly.com",
    "role": "ADMIN",
    "permissions": ["PRODUCT", "CATEGORIES", "REQUESTS", "OFFERS", "ORDERS", "VENDORS", "CUSTOMERS", "CONTACTS"],
    "isActive": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Admin Refresh Token
- **Method:** `POST`
- **Path:** `/api/v1/admin/auth/refresh`
- **Auth:** Public
- **Description:** Refreshes admin access token.

#### Request Body (`application/json`)
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Token refreshed successfully.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Admin Logout
- **Method:** `POST`
- **Path:** `/api/v1/admin/auth/logout`
- **Auth:** Bearer Token (Admin)
- **Description:** Revokes current admin refresh token session.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Logged out successfully.",
  "data": null
}
```

---

### 4. Admin Profile (`/me`)
- **Method:** `GET`
- **Path:** `/api/v1/admin/auth/me`
- **Auth:** Bearer Token (Admin)
- **Description:** Retrieves currently logged-in administrator's profile and permissions.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Data fetched successfully.",
  "data": {
    "id": "99bb12a0-43f1-4df6-a67b-1188339900aa",
    "name": "System Administrator",
    "email": "admin@otherly.com",
    "role": "ADMIN",
    "permissions": ["PRODUCT", "CATEGORIES", "REQUESTS", "OFFERS", "ORDERS", "VENDORS", "CUSTOMERS", "CONTACTS"],
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### 5. Admin Change Password
- **Method:** `POST`
- **Path:** `/api/v1/admin/auth/change-password`
- **Auth:** Bearer Token (Admin)

#### Request Body (`application/json`)
```json
{
  "oldPassword": "CurrentAdminPassword123!",
  "newPassword": "NewAdminPassword456!"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Password changed successfully.",
  "data": null
}
```

---

### 6. Admin Forgot Password
- **Method:** `POST`
- **Path:** `/api/v1/admin/auth/forgot-password`
- **Auth:** Public

#### Request Body (`application/json`)
```json
{
  "email": "admin@otherly.com"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Password reset email sent if account exists.",
  "data": null
}
```

---

### 7. Admin Reset Password
- **Method:** `POST`
- **Path:** `/api/v1/admin/auth/reset-password`
- **Auth:** Public

#### Request Body (`application/json`)
```json
{
  "token": "admin-reset-token-uuid",
  "newPassword": "NewAdminPassword789!"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Password reset successfully.",
  "data": null
}
```

---

## 📁 Media Storage & Uploads (`/api/v1/media`)

---

### 1. Upload File (Single)
- **Method:** `POST`
- **Path:** `/api/v1/media`
- **Auth:** Bearer Token (Authenticated user)
- **Content-Type:** `multipart/form-data`
- **Description:** Central file upload endpoint for product images, user avatars, category icons/banners, and request attachments. Automatically uploads to Cloudinary or Firebase Storage (or local storage fallback).

#### Constraints & Form Fields
| Field Name | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `file` | `binary` | **Yes** | Max file size: **10MB**. Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`, `.pdf`, `.doc`, `.docx` |
| `mediaType`| `string` | **Yes** | Must match one of `MediaType` enum values: <br>• `PRODUCT_IMAGE`<br>• `AVATAR`<br>• `CATEGORY_ICON`<br>• `CATEGORY_BANNER`<br>• `REQUEST_ATTACHMENT`<br>• `DOCUMENT` |

#### Example `curl`
```bash
curl -X POST http://localhost:4000/api/v1/media \
  -H "Authorization: Bearer <accessToken>" \
  -F "file=@/path/to/product-photo.png" \
  -F "mediaType=PRODUCT_IMAGE"
```

#### Success Response (`201 Created`)
```json
{
  "status": "success",
  "data": {
    "id": "19e8cf16-c14f-4d6d-88f5-46aa1d6ce2d0",
    "name": "1728400000000-84729104.png",
    "mimeType": "image/png",
    "fileSize": "2048576",
    "mediaType": "PRODUCT_IMAGE",
    "url": "https://res.cloudinary.com/otherly/image/upload/v1728400000/products/1728400000000-84729104.png"
  }
}
```

---

### 2. Get Media Asset by ID
- **Method:** `GET`
- **Path:** `/api/v1/media/{id}`
- **Auth:** Public
- **Description:** Retrieves metadata and direct CDN/public URL of an uploaded media asset.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Yes** | UUID of the Media entity |

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "19e8cf16-c14f-4d6d-88f5-46aa1d6ce2d0",
    "name": "1728400000000-84729104.png",
    "mimeType": "image/png",
    "fileSize": "2048576",
    "mediaType": "PRODUCT_IMAGE",
    "url": "https://res.cloudinary.com/otherly/image/upload/v1728400000/products/1728400000000-84729104.png"
  }
}
```

---

### 3. Delete Media Asset
- **Method:** `DELETE`
- **Path:** `/api/v1/media/{id}`
- **Auth:** Bearer Token
- **Description:** Deletes media metadata record and removes physical asset from storage.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Yes** | UUID of the Media entity to delete |

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Media asset deleted successfully"
}
```

---

## 📬 Contact Inquiries (`/api/v1/contact`)

---

### 1. Submit Contact Form
- **Method:** `POST`
- **Path:** `/api/v1/contact`
- **Auth:** Public
- **Rate Limit:** 5 requests per 10 minutes per IP
- **Description:** Submits customer or partner inquiry to platform administrators. Sends acknowledgement email.

#### Request Body (`application/json`)
| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `name` | `string` | **Yes** | Max 100 characters |
| `email` | `string` | **Yes** | Valid email, max 255 characters |
| `company` | `string` | No | Max 120 characters |
| `topic` | `string` | **Yes** | Enum: `Partnership`, `Our Products`, `Investment`, `Other` |
| `message` | `string` | **Yes** | 10 to 1000 characters |
| `turnstileToken`| `string`| No | Cloudflare Turnstile CAPTCHA token |

```json
{
  "name": "Alex Mercer",
  "email": "alex@mercerlogistics.com",
  "company": "Mercer Logistics",
  "topic": "Partnership",
  "message": "We would like to explore vendor integrations for bulk surplus inventory."
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Thank you for reaching out. We will get back to you shortly.",
  "data": {
    "id": "22ff1100-33bb-44aa-55cc-66dd77ee88ff",
    "name": "Alex Mercer",
    "email": "alex@mercerlogistics.com",
    "company": "Mercer Logistics",
    "topic": "Partnership",
    "message": "We would like to explore vendor integrations for bulk surplus inventory.",
    "status": "NEW",
    "createdAt": "2026-10-08T15:30:00.000Z"
  }
}
```

---

### 2. List Contact Inquiries (Admin Only)
- **Method:** `GET`
- **Path:** `/api/v1/contact`
- **Auth:** Bearer Token (Requires `AdminPermission.CONTACTS`)
- **Query Parameters:**
  - `page` (`number`, optional, default: 1)
  - `limit` (`number`, optional, default: 20)
  - `search` (`string`, optional)
  - `topic` (`string`, optional, Enum: `Partnership`, `Our Products`, `Investment`, `Other`)
  - `status` (`string`, optional, Enum: `NEW`, `IN_PROGRESS`, `RESOLVED`, `ARCHIVED`)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Data fetched successfully.",
  "data": [
    {
      "id": "22ff1100-33bb-44aa-55cc-66dd77ee88ff",
      "name": "Alex Mercer",
      "email": "alex@mercerlogistics.com",
      "topic": "Partnership",
      "status": "NEW",
      "createdAt": "2026-10-08T15:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### 3. Get Contact Inquiry by ID (Admin Only)
- **Method:** `GET`
- **Path:** `/api/v1/contact/{id}`
- **Auth:** Bearer Token (Requires `AdminPermission.CONTACTS`)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Data fetched successfully.",
  "data": {
    "id": "22ff1100-33bb-44aa-55cc-66dd77ee88ff",
    "name": "Alex Mercer",
    "email": "alex@mercerlogistics.com",
    "company": "Mercer Logistics",
    "topic": "Partnership",
    "message": "We would like to explore vendor integrations for bulk surplus inventory.",
    "status": "NEW",
    "createdAt": "2026-10-08T15:30:00.000Z"
  }
}
```

---

### 4. Update Contact Status (Admin Only)
- **Method:** `PATCH`
- **Path:** `/api/v1/contact/{id}/status`
- **Auth:** Bearer Token (Requires `AdminPermission.CONTACTS`)

#### Request Body (`application/json`)
| Field | Type | Required | Values |
| :--- | :--- | :--- | :--- |
| `status` | `string` | **Yes** | `NEW`, `IN_PROGRESS`, `RESOLVED`, `ARCHIVED` |

```json
{
  "status": "IN_PROGRESS"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Data updated successfully.",
  "data": {
    "id": "22ff1100-33bb-44aa-55cc-66dd77ee88ff",
    "status": "IN_PROGRESS"
  }
}
```

---

### 5. Delete Contact Inquiry (Admin Only)
- **Method:** `DELETE`
- **Path:** `/api/v1/contact/{id}`
- **Auth:** Bearer Token (Requires `AdminPermission.CONTACTS`)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Data deleted successfully.",
  "data": null
}
```

---

## 💓 System & Health Checks

---

### 1. Root Service Greeting
- **Method:** `GET`
- **Path:** `/`
- **Auth:** Public

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Welcome to Otherly Marketplace API",
  "data": {
    "service": "Marketplace API",
    "status": "healthy",
    "docs": "http://localhost:4000/api-docs",
    "graphql": "http://localhost:4000/graphql"
  }
}
```

---

### 2. Deep Health Check Probe
- **Method:** `GET`
- **Path:** `/health`
- **Auth:** Public
- **Description:** Verifies database connectivity. Returns `200 OK` when healthy, `503 Service Unavailable` if database is down. Suitable for Docker / Kubernetes liveness & readiness probes.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok",
    "database": "connected",
    "timestamp": "2026-10-08T16:00:00.000Z"
  }
}
```

---

### 3. API Health Check Route
- **Method:** `GET`
- **Path:** `/api/v1/health`
- **Auth:** Public

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok",
    "database": "connected",
    "uptimeSeconds": 3600,
    "timestamp": "2026-10-08T16:00:00.000Z"
  }
}
```

---

# 3. GraphQL API Documentation

## GraphQL Protocol & Headers

All operations are executed via HTTP `POST` to `/graphql`.

```http
POST /graphql
Content-Type: application/json
Authorization: Bearer <accessToken>
```

```json
{
  "query": "query GetMe { me { id name email role } }",
  "variables": {}
}
```

---

## Marketplace Core Business Flows

### Flow A: Reverse Marketplace Request & Offer Lifecycle
1. **Customer Posts Request:** Calls `createRequest(...)` with specifications, budget, deadline, and optional media attachment IDs. Status begins at `OPEN`.
2. **Vendors Browse Requests:** Suppliers view open demands via `requests(filter: { status: OPEN })` or `paginatedRequests(...)`.
3. **Vendor Submits Quote / Offer:** A vendor submits an offer via `submitOffer(...)` specifying unit price, offered quantity, delivery timeline, and fulfillment type (`IN_STOCK`, `PARTIAL_STOCK`, `CAN_SOURCE`).
4. **Customer Accepts Offer:** Customer executes `acceptOffer(offerId: "...")`. This automatically:
   - Updates Offer status to `ACCEPTED`.
   - Closes / marks Request status as `FULFILLED`.
   - Creates an `OrderEntity` with `sourceType = REQUEST_OFFER` and `status = PENDING`.
   - Notifies the vendor in-app (`OFFER_ACCEPTED`).
5. **Vendor Fulfills Order:** Vendor updates order status sequentially (`CONFIRMED` ➔ `SHIPPED` ➔ `DELIVERED`).

### Flow B: Traditional Direct Marketplace Purchase
1. **Vendor Lists Product:** Vendor runs `createProduct(...)` with pricing, stock quantity, SKU, subcategory, and uploaded media images.
2. **Customer Buys Product:** Customer executes `createDirectOrder(...)` with `productId`, `quantity`, and `shippingAddress`.
3. **Inventory Deducted:** Product inventory is reduced by the ordered quantity, creating an `OrderEntity` with `sourceType = DIRECT_PURCHASE`.
4. **Fulfillment:** Vendor updates status to `SHIPPED` and `DELIVERED`.

---

## GraphQL Queries Reference

---

### 1. Current Authenticated Profile (`me`)
- **Access:** Authenticated (`CUSTOMER`, `VENDOR`, `ADMIN`)
- **Description:** Returns the active profile for the session token.

#### GraphQL Query
```graphql
query GetMyProfile {
  me {
    id
    name
    email
    role
    phoneNumber
    avatar
    isEmailVerified
    isVendorVerified
    isActive
    customer {
      id
      shippingAddress
      city
      state
      postalCode
      country
    }
    vendor {
      id
      businessName
      businessAddress
      isVerified
      rating
      totalReviews
    }
  }
}
```

#### Example Response
```json
{
  "data": {
    "me": {
      "id": "e22a45d0-9f22-4809-9f7a-8b8d9633e9bf",
      "name": "John Buyer",
      "email": "buyer@example.com",
      "role": "CUSTOMER",
      "phoneNumber": "+1234567890",
      "avatar": "https://cdn.otherly.com/avatars/user.jpg",
      "isEmailVerified": true,
      "isVendorVerified": false,
      "isActive": true,
      "customer": {
        "id": "78ff0f81-64d8-4a61-9c1a-2895f57dd21b",
        "shippingAddress": "456 Market Lane",
        "city": "Dallas",
        "state": "TX",
        "postalCode": "75001",
        "country": "USA"
      },
      "vendor": null
    }
  }
}
```

---

### 2. Categories & Subcategories

#### A. `categories(activeOnly: Boolean = true)`
- **Access:** Public
- **Description:** Returns all top-level marketplace categories with subcategories and media.

```graphql
query GetCategories {
  categories(activeOnly: true) {
    id
    name
    slug
    description
    iconUrl
    bannerImageUrl
    displayOrder
    isFeatured
    subcategories {
      id
      name
      slug
      description
    }
  }
}
```

#### B. `category(slug: String!)` & `categoryById(id: String!)`
- **Access:** Public
- **Description:** Fetches a category by slug or UUID.

```graphql
query GetCategoryBySlug($slug: String!) {
  category(slug: $slug) {
    id
    name
    slug
    description
    subcategories {
      id
      name
      slug
    }
  }
}
```

#### C. `featuredCategories`
- **Access:** Public
- **Description:** Homepage featured categories list.

```graphql
query GetFeaturedCategories {
  featuredCategories {
    id
    name
    slug
    iconUrl
    bannerImageUrl
  }
}
```

#### D. `subcategories(activeOnly: Boolean = true, categoryId: String)`
- **Access:** Public
- **Description:** Returns subcategories filtered optionally by parent `categoryId`.

```graphql
query GetSubcategories($categoryId: String) {
  subcategories(activeOnly: true, categoryId: $categoryId) {
    id
    name
    slug
    category {
      id
      name
    }
  }
}
```

---

### 3. Products

#### A. `products(filter: ProductFilterInput)`
- **Access:** Public
- **Description:** Browse unpaginated products list matching filters.

#### B. `paginatedProducts(filter: ProductFilterInput)`
- **Access:** Public
- **Description:** Paginated catalog search with metadata (`total`, `totalPages`, `page`, `limit`).

#### Filter Parameters (`ProductFilterInput`)
| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `search` | `String` | - | Text search in title and description |
| `categoryId` | `String` | - | Category UUID |
| `subcategoryId` | `String` | - | Subcategory UUID |
| `vendorId` | `String` | - | Filter products belonging to a vendor |
| `minPrice` | `Float` | - | Minimum price filter |
| `maxPrice` | `Float` | - | Maximum price filter |
| `inStockOnly` | `Boolean` | `false` | Only items with `stockQuantity > 0` |
| `activeOnly` | `Boolean` | `true` | Only active products |
| `page` | `Int` | `1` | Page number |
| `limit` | `Int` | `30` | Items per page |

#### GraphQL Query
```graphql
query GetCatalog($filter: ProductFilterInput) {
  paginatedProducts(filter: $filter) {
    total
    totalPages
    page
    limit
    data {
      id
      title
      slug
      description
      price
      compareAtPrice
      stockQuantity
      sku
      imageUrls
      vendor {
        id
        businessName
        rating
        isVerified
      }
      subcategory {
        id
        name
      }
    }
  }
}
```

#### Variables Example
```json
{
  "filter": {
    "search": "wireless headphones",
    "minPrice": 20,
    "maxPrice": 200,
    "inStockOnly": true,
    "page": 1,
    "limit": 10
  }
}
```

#### C. `product(slug: String!)` & `productById(id: String!)`
- **Access:** Public
- **Description:** Detailed view of a single product.

```graphql
query GetProductDetails($slug: String!) {
  product(slug: $slug) {
    id
    title
    slug
    description
    price
    compareAtPrice
    stockQuantity
    imageUrls
    media {
      id
      url
      mimeType
    }
    vendor {
      id
      businessName
      businessAddress
      rating
      totalReviews
      isVerified
    }
  }
}
```

#### D. `myVendorProducts(activeOnly: Boolean)`
- **Access:** Vendor Only (`Role.VENDOR`)
- **Description:** Returns all products listed by the currently authenticated vendor.

```graphql
query GetMyVendorInventory {
  myVendorProducts {
    id
    title
    sku
    price
    stockQuantity
    isActive
    imageUrls
  }
}
```

---

### 4. Reverse Marketplace Requests

#### A. `requests(filter: RequestFilterInput)` & `paginatedRequests(filter: RequestFilterInput)`
- **Access:** Public / Vendors / Buyers
- **Description:** Discovers open consumer requests in the marketplace.

#### Filter Parameters (`RequestFilterInput`)
| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `search` | `String` | - | Keyword match on title & description |
| `categoryId` | `String` | - | Category UUID |
| `subcategoryId` | `String` | - | Subcategory UUID |
| `status` | `RequestStatus` | - | `OPEN`, `IN_REVIEW`, `FULFILLED`, `CANCELLED`, `EXPIRED`, `DRAFT` |
| `page` | `Int` | `1` | Page number |
| `limit` | `Int` | `30` | Items per page |

#### GraphQL Query
```graphql
query BrowseRequests($filter: RequestFilterInput) {
  paginatedRequests(filter: $filter) {
    total
    totalPages
    page
    limit
    data {
      id
      title
      description
      quantity
      budget
      location
      requiredWithinDays
      deadline
      status
      attachmentUrls
      customer {
        id
        city
        country
      }
      subcategory {
        id
        name
      }
      createdAt
    }
  }
}
```

#### B. `request(id: String!)`
- **Access:** Public / Authenticated
- **Description:** Fetches full specification of a single customer request.

```graphql
query GetRequestDetail($id: String!) {
  request(id: $id) {
    id
    title
    description
    quantity
    budget
    location
    deadline
    status
    attachmentUrls
    attachments {
      id
      url
      name
    }
    customer {
      id
      user {
        name
      }
    }
  }
}
```

#### C. `myRequests(status: RequestStatus)` / `myCustomerRequests(status: RequestStatus)`
- **Access:** Customer Only (`Role.CUSTOMER`)
- **Description:** Returns all requests posted by the authenticated buyer.

```graphql
query GetMyRequests($status: RequestStatus) {
  myRequests(status: $status) {
    id
    title
    quantity
    budget
    status
    createdAt
  }
}
```

---

### 5. Vendor Offers & Quotes

#### A. `requestOffers(requestId: String!)`
- **Access:** Authenticated
  - **Customers:** Can view all offers submitted for *their own* request.
  - **Vendors:** Can view only their own submitted offer for the given request.
  - **Admins:** Can view all offers.

```graphql
query GetOffersForRequest($requestId: String!) {
  requestOffers(requestId: $requestId) {
    id
    unitPrice
    totalPrice
    offeredQuantity
    deliveryDays
    fulfillType
    status
    notes
    vendor {
      id
      businessName
      rating
      isVerified
    }
    createdAt
  }
}
```

#### B. `offer(id: String!)`
- **Access:** Authenticated
- **Description:** Fetches a specific offer by ID.

```graphql
query GetOfferById($id: String!) {
  offer(id: $id) {
    id
    unitPrice
    totalPrice
    offeredQuantity
    deliveryDays
    fulfillType
    status
    notes
  }
}
```

#### C. `myOffers(status: OfferStatus)` / `myVendorOffers(status: OfferStatus)`
- **Access:** Vendor Only (`Role.VENDOR`)
- **Description:** Lists all offers submitted across all customer requests by the authenticated vendor.

```graphql
query GetMyVendorOffers($status: OfferStatus) {
  myOffers(status: $status) {
    id
    unitPrice
    totalPrice
    offeredQuantity
    status
    request {
      id
      title
      quantity
      budget
    }
  }
}
```

---

### 6. Orders

#### A. `myOrders`
- **Access:** Authenticated
  - If user is `CUSTOMER`: returns orders placed by them.
  - If user is `VENDOR`: returns sales orders to be fulfilled by them.

```graphql
query GetMyOrders {
  myOrders {
    id
    orderNumber
    sourceType
    status
    unitPrice
    quantity
    totalAmount
    shippingAddress
    notes
    createdAt
    product {
      id
      title
      imageUrls
    }
    request {
      id
      title
    }
    vendor {
      id
      businessName
    }
    customer {
      id
      shippingAddress
    }
  }
}
```

#### B. `order(id: String!)`
- **Access:** Authenticated (Buyer, Vendor of the order, or Admin)

```graphql
query GetOrderDetails($id: String!) {
  order(id: $id) {
    id
    orderNumber
    sourceType
    status
    unitPrice
    quantity
    totalAmount
    shippingAddress
    notes
    createdAt
  }
}
```

---

### 7. User & Vendor Profiles & Activity Statistics

#### A. `myCustomerProfile` & `customerStats`
- **Access:** Customer Only (`Role.CUSTOMER`)

```graphql
query GetCustomerDashboard {
  myCustomerProfile {
    id
    shippingAddress
    city
    state
    postalCode
    country
    preferences
  }
  customerStats {
    totalRequests
    activeRequests
    totalOrders
  }
}
```

#### B. `myVendorProfile` & `vendorStats`
- **Access:** Vendor Only (`Role.VENDOR`)

```graphql
query GetVendorDashboard {
  myVendorProfile {
    id
    businessName
    businessAddress
    businessRegistrationNumber
    description
    isVerified
    rating
    totalReviews
  }
  vendorStats {
    totalProducts
    activeOffers
    totalOrders
    rating
    totalReviews
  }
}
```

#### C. `vendors(filter: VendorFilterInput)` & `vendor(id: String!)`
- **Access:** Public
- **Description:** Marketplace vendor directory & storefront profiles.

```graphql
query BrowseVendors($filter: VendorFilterInput) {
  vendors(filter: $filter) {
    id
    businessName
    city
    country
    description
    rating
    totalReviews
    isVerified
  }
}
```

---

### 8. In-App Notifications

#### A. `myNotifications(unreadOnly: Boolean, page: Int, limit: Int)`
- **Access:** Authenticated

```graphql
query GetNotifications($unreadOnly: Boolean) {
  myNotifications(unreadOnly: $unreadOnly, limit: 20) {
    id
    title
    message
    type
    entityId
    entityType
    isRead
    readAt
    createdAt
  }
  unreadNotificationCount
}
```

---

### 9. Media & Server Health

#### A. `media(id: String!)` & `medias(ids: [String!]!)`
```graphql
query GetMediaDetails($id: String!) {
  media(id: $id) {
    id
    name
    mimeType
    fileSize
    mediaType
    url
  }
}
```

#### B. `ping` & `serverStatus`
```graphql
query HealthCheck {
  ping
  serverStatus {
    service
    status
    timestamp
  }
}
```

---

### 10. Admin Queries (Admin Only)

#### A. `adminUsers(...)` & `adminUser(id: String!)`
- **Access:** Admin Only (`Role.ADMIN`)

```graphql
query AdminUserManagement($page: Int, $limit: Int, $search: String, $role: Role) {
  adminUsers(page: $page, limit: $limit, search: $search, role: $role) {
    total
    totalPages
    page
    limit
    data {
      id
      name
      email
      role
      isActive
      isEmailVerified
      isVendorVerified
      createdAt
    }
  }
}
```

#### B. `contacts(filter: ContactFilterInput, page: Int, limit: Int)` & `contact(id: String!)`
- **Access:** Admin Only (`Role.ADMIN`)

```graphql
query AdminGetContacts($filter: ContactFilterInput) {
  contacts(filter: $filter) {
    total
    totalPages
    data {
      id
      name
      email
      topic
      status
      message
      createdAt
    }
  }
}
```

---

## GraphQL Mutations Reference

---

### 1. Reverse Marketplace: Requests & Offers

#### A. `createRequest(input: CreateRequestInput!)`
- **Access:** Customer Only (`Role.CUSTOMER`)
- **Description:** Posts a new product/project request in the reverse marketplace.

##### Input Fields (`CreateRequestInput`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | `String!` | **Yes** | Project or item title (max 200 chars) |
| `description` | `String!` | **Yes** | Full specifications & requirements |
| `quantity` | `Int!` | No (Default: 1) | Units requested |
| `budget` | `Float` | No | Target price/budget in currency |
| `subcategoryId`| `String` | No | Subcategory UUID |
| `location` | `String` | No | Delivery location / city |
| `requiredWithinDays` | `Int` | No | Maximum acceptable days |
| `deadline` | `DateTimeISO`| No | Absolute expiry deadline |
| `attachmentMediaIds` | `[String!]` | No | Array of Media UUIDs previously uploaded via REST |

##### Mutation
```graphql
mutation CreateNewRequest($input: CreateRequestInput!) {
  createRequest(input: $input) {
    id
    title
    description
    quantity
    budget
    status
    attachmentUrls
    createdAt
  }
}
```

##### Variables
```json
{
  "input": {
    "title": "Custom Walnut Dining Table (8-seater)",
    "description": "Looking for solid kiln-dried American walnut dining table. Dimensions: 96x42 inches, matte polyurethane finish.",
    "quantity": 1,
    "budget": 2400.00,
    "requiredWithinDays": 21,
    "location": "Austin, TX",
    "attachmentMediaIds": ["19e8cf16-c14f-4d6d-88f5-46aa1d6ce2d0"]
  }
}
```

---

#### B. `updateRequest(id: String!, input: UpdateRequestInput!)`
- **Access:** Customer Only (Creator of request)
- **Description:** Updates an open request.

```graphql
mutation UpdateMyRequest($id: String!, $input: UpdateRequestInput!) {
  updateRequest(id: $id, input: $input) {
    id
    title
    budget
    description
    status
  }
}
```

---

#### C. `cancelRequest(id: String!)`
- **Access:** Customer Only (Creator of request)
- **Description:** Sets request status to `CANCELLED`.

```graphql
mutation CancelMyRequest($id: String!) {
  cancelRequest(id: $id) {
    id
    status
  }
}
```

---

#### D. `submitOffer(input: SubmitOfferInput!)`
- **Access:** Vendor Only (`Role.VENDOR`)
- **Description:** Submits a quote/offer responding to an open customer request.

##### Input Fields (`SubmitOfferInput`)
| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `requestId` | `String!` | **Yes** | - | UUID of the customer Request |
| `offeredQuantity`| `Int!` | **Yes** | - | Units vendor is committing to fulfill |
| `unitPrice` | `Float!` | **Yes** | - | Price per single unit |
| `totalPrice` | `Float` | No | Calculated | Optional total (defaults to `offeredQuantity * unitPrice`) |
| `deliveryDays` | `Int` | No | `3` | Estimated turnaround in calendar days |
| `fulfillType` | `OfferFulfillType` | No | `IN_STOCK` | `IN_STOCK`, `PARTIAL_STOCK`, `CAN_SOURCE` |
| `notes` | `String` | No | - | Custom proposal notes or warranty details |

##### Mutation
```graphql
mutation SubmitVendorOffer($input: SubmitOfferInput!) {
  submitOffer(input: $input) {
    id
    unitPrice
    totalPrice
    offeredQuantity
    deliveryDays
    fulfillType
    status
    notes
    createdAt
  }
}
```

##### Variables
```json
{
  "input": {
    "requestId": "4f18bb9e-ff9d-4a71-3997-63c22071aa11",
    "offeredQuantity": 1,
    "unitPrice": 2200.00,
    "deliveryDays": 14,
    "fulfillType": "CAN_SOURCE",
    "notes": "Handcrafted American Walnut with lifetime joinery warranty. Includes white-glove curbside delivery."
  }
}
```

---

#### E. `acceptOffer(offerId: String!)`
- **Access:** Customer Only (Owner of the request)
- **Description:** Accepts a vendor's offer. Closes negotiation, marks request `FULFILLED`, marks offer `ACCEPTED`, and automatically creates an `OrderEntity`.

##### Mutation
```graphql
mutation CustomerAcceptOffer($offerId: String!) {
  acceptOffer(offerId: $offerId) {
    offer {
      id
      status
    }
    order {
      id
      orderNumber
      sourceType
      status
      totalAmount
      quantity
      unitPrice
      shippingAddress
      vendor {
        businessName
      }
    }
  }
}
```

##### Variables
```json
{
  "offerId": "7c12aa80-0011-44ee-bb22-5599ffaa1133"
}
```

---

#### F. `withdrawOffer(offerId: String!)`
- **Access:** Vendor Only (Author of the offer)
- **Description:** Withdraws a pending offer before customer acceptance. Status becomes `WITHDRAWN`.

```graphql
mutation WithdrawVendorOffer($offerId: String!) {
  withdrawOffer(offerId: $offerId) {
    id
    status
  }
}
```

---

### 2. Traditional E-Commerce: Products & Orders

#### A. `createProduct(input: CreateProductInput!)`
- **Access:** Vendor Only (`Role.VENDOR`)
- **Description:** Publishes a new item for sale in the marketplace.

##### Input Fields (`CreateProductInput`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `title` | `String!` | **Yes** | Product title |
| `slug` | `String` | No | Auto-generated from title if omitted |
| `description`| `String!` | **Yes** | Product description |
| `price` | `Float!` | **Yes** | Selling price |
| `compareAtPrice` | `Float` | No | MSRP or strikethrough price |
| `stockQuantity`| `Int` | No (Default: 0) | Available inventory |
| `subcategoryId` | `String` | No | Subcategory UUID |
| `imageMediaIds` | `[String!]`| No | Array of Media UUIDs uploaded via REST |
| `sku` | `String` | No | Stock keeping unit |
| `isActive` | `Boolean` | No (Default: true) | Whether visible in catalog |

##### Mutation
```graphql
mutation VendorCreateProduct($input: CreateProductInput!) {
  createProduct(input: $input) {
    id
    title
    slug
    price
    compareAtPrice
    stockQuantity
    imageUrls
    isActive
  }
}
```

##### Variables
```json
{
  "input": {
    "title": "Industrial Ergonomic Office Chair",
    "description": "High back breathable mesh office chair with adjustable 3D lumbar support and 4D armrests.",
    "price": 349.99,
    "compareAtPrice": 499.99,
    "stockQuantity": 25,
    "subcategoryId": "89ff01aa-22bb-33cc-44dd-55ee66ff7788",
    "imageMediaIds": ["19e8cf16-c14f-4d6d-88f5-46aa1d6ce2d0"],
    "sku": "CHAIR-ERG-001"
  }
}
```

---

#### B. `updateProduct(id: String!, input: UpdateProductInput!)`
- **Access:** Vendor Only (Owner of product)
- **Description:** Updates product metadata, pricing, stock, or images.

```graphql
mutation VendorUpdateProduct($id: String!, $input: UpdateProductInput!) {
  updateProduct(id: $id, input: $input) {
    id
    title
    price
    stockQuantity
    imageUrls
  }
}
```

---

#### C. `deleteProduct(id: String!)`
- **Access:** Vendor Only (Owner of product)
- **Description:** Deletes a product. Returns `Boolean`.

```graphql
mutation VendorDeleteProduct($id: String!) {
  deleteProduct(id: $id)
}
```

---

#### D. `createDirectOrder(input: CreateDirectOrderInput!)`
- **Access:** Customer Only (`Role.CUSTOMER`)
- **Description:** Directly purchases a listed product. Deducts inventory and returns confirmed `OrderEntity`.

##### Input Fields (`CreateDirectOrderInput`)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `productId` | `String!` | **Yes** | Product UUID |
| `quantity` | `Int!` | No (Default: 1) | Quantity to buy |
| `shippingAddress` | `String!` | **Yes** | Physical shipping address |
| `notes` | `String` | No | Special delivery instructions |

##### Mutation
```graphql
mutation PurchaseProductDirect($input: CreateDirectOrderInput!) {
  createDirectOrder(input: $input) {
    id
    orderNumber
    sourceType
    status
    unitPrice
    quantity
    totalAmount
    shippingAddress
    createdAt
  }
}
```

##### Variables
```json
{
  "input": {
    "productId": "89ff01aa-22bb-33cc-44dd-55ee66ff7788",
    "quantity": 2,
    "shippingAddress": "742 Evergreen Terrace, Springfield, OR",
    "notes": "Please leave package by the side door."
  }
}
```

---

#### E. `updateOrderStatus(orderId: String!, status: OrderStatus!)`
- **Access:** Vendor / Admin (`Role.VENDOR`, `Role.ADMIN`)
- **Description:** Transitions order fulfillment status: `PENDING` ➔ `CONFIRMED` ➔ `SHIPPED` ➔ `DELIVERED`.

```graphql
mutation FulfillOrder($orderId: String!, $status: OrderStatus!) {
  updateOrderStatus(orderId: $orderId, status: $status) {
    id
    orderNumber
    status
  }
}
```

---

#### F. `cancelOrder(orderId: String!, reason: String)`
- **Access:** Authenticated (Customer, Vendor, or Admin associated with order)
- **Description:** Cancels an order. If direct purchase, automatically restores inventory.

```graphql
mutation CancelOrder($orderId: String!, $reason: String) {
  cancelOrder(orderId: $orderId, reason: $reason) {
    id
    orderNumber
    status
    notes
  }
}
```

---

### 3. Profiles & Notifications

#### A. `updateCustomerProfile(input: UpdateCustomerProfileInput!)`
- **Access:** Customer Only (`Role.CUSTOMER`)

```graphql
mutation UpdateBuyerProfile($input: UpdateCustomerProfileInput!) {
  updateCustomerProfile(input: $input) {
    id
    shippingAddress
    city
    state
    postalCode
    country
    preferences
  }
}
```

---

#### B. `updateVendorProfile(input: UpdateVendorProfileInput!)`
- **Access:** Vendor Only (`Role.VENDOR`)

```graphql
mutation UpdateSupplierProfile($input: UpdateVendorProfileInput!) {
  updateVendorProfile(input: $input) {
    id
    businessName
    businessAddress
    businessRegistrationNumber
    city
    state
    postalCode
    country
    description
  }
}
```

---

#### C. `markNotificationAsRead(id: String!)` & `markAllNotificationsAsRead`
- **Access:** Authenticated

```graphql
mutation MarkRead($id: String!) {
  markNotificationAsRead(id: $id) {
    id
    isRead
    readAt
  }
}
```

```graphql
mutation MarkAllRead {
  markAllNotificationsAsRead
}
```

---

#### D. `deleteNotification(id: String!)`
- **Access:** Authenticated

```graphql
mutation RemoveNotification($id: String!) {
  deleteNotification(id: $id)
}
```

---

### 4. Admin Mutations (Admin Only)

#### A. `adminUpdateUserStatus(id: String!, isActive: Boolean!)`
- **Access:** Admin Only
- **Description:** Suspends or activates a user account.

```graphql
mutation AdminToggleUser($id: String!, $isActive: Boolean!) {
  adminUpdateUserStatus(id: $id, isActive: $isActive) {
    id
    email
    isActive
  }
}
```

#### B. `adminVerifyVendor(id: String!, isVerified: Boolean!)`
- **Access:** Admin Only
- **Description:** Grants or revokes verified badge for a vendor.

```graphql
mutation AdminToggleVendorVerification($id: String!, $isVerified: Boolean!) {
  adminVerifyVendor(id: $id, isVerified: $isVerified) {
    id
    isVendorVerified
  }
}
```

#### C. Category & Subcategory Management
- `createCategory(input: CreateCategoryInput!): CategoryEntity!`
- `updateCategory(id: String!, input: UpdateCategoryInput!): CategoryEntity!`
- `deleteCategory(id: String!): Boolean!`
- `createSubcategory(input: CreateSubcategoryInput!): SubcategoryEntity!`
- `updateSubcategory(id: String!, input: UpdateSubcategoryInput!): SubcategoryEntity!`
- `deleteSubcategory(id: String!): Boolean!`

---

# 4. GraphQL Type System & Enums Dictionary

### Enums

#### `Role`
| Value | Description |
| :--- | :--- |
| `CUSTOMER` | Regular buyer |
| `VENDOR` | Supplier or merchant |
| `ADMIN` | Platform administrator |
| `SUPER_ADMIN`| Super administrator |

#### `RequestStatus`
| Value | Description |
| :--- | :--- |
| `DRAFT` | Request not yet visible |
| `OPEN` | Active, open for vendor offers |
| `IN_REVIEW` | Customer actively evaluating quotes |
| `FULFILLED` | Offer accepted, converted to order |
| `CANCELLED` | Cancelled by buyer |
| `EXPIRED` | Deadline passed without acceptance |

#### `OfferStatus`
| Value | Description |
| :--- | :--- |
| `PENDING` | Submitted, awaiting customer decision |
| `ACCEPTED` | Accepted by buyer (converted into order) |
| `REJECTED` | Declined by buyer |
| `WITHDRAWN` | Withdrawn by vendor |

#### `OfferFulfillType`
| Value | Description |
| :--- | :--- |
| `IN_STOCK` | Vendor currently has physical units ready to ship |
| `PARTIAL_STOCK`| Partial units in stock, balance to be manufactured/sourced |
| `CAN_SOURCE` | Custom manufacture or on-demand procurement |

#### `OrderStatus`
| Value | Description |
| :--- | :--- |
| `PENDING` | Order created, awaiting payment/processing |
| `CONFIRMED` | Confirmed by seller, preparing shipment |
| `SHIPPED` | Dispatched with tracking |
| `DELIVERED` | Received by customer |
| `CANCELLED` | Order voided |

#### `OrderSourceType`
| Value | Description |
| :--- | :--- |
| `DIRECT_PURCHASE` | Traditional cart purchase from product listing |
| `REQUEST_OFFER` | Originates from an accepted reverse marketplace offer |

#### `NotificationType`
| Value | Description |
| :--- | :--- |
| `ORDER_CREATED` | New order placed |
| `ORDER_STATUS_CHANGED` | Order moved to Confirmed/Shipped/Delivered |
| `ORDER_CANCELLED` | Order was cancelled |
| `OFFER_RECEIVED` | New quote submitted on customer request |
| `OFFER_ACCEPTED` | Vendor's quote was accepted by buyer |
| `OFFER_REJECTED` | Quote rejected |
| `REQUEST_FULFILLED` | Request completed |
| `VENDOR_VERIFIED` | Vendor achieved verified badge |
| `SYSTEM_ALERT` | Security or maintenance notice |
| `GENERAL` | Informational notification |

#### `MediaType`
| Value | Allowed Contexts |
| :--- | :--- |
| `PRODUCT_IMAGE` | Vendor product gallery photos |
| `AVATAR` | User profile avatar |
| `CATEGORY_ICON` | SVG or small raster category icon |
| `CATEGORY_BANNER`| Wide banner image for category page |
| `REQUEST_ATTACHMENT`| Buyer project spec, blueprint, sample photo |
| `DOCUMENT` | Vendor licenses, invoices, certifications |

#### `ContactTopic`
`Partnership`, `Our Products`, `Investment`, `Other`.

#### `ContactStatus`
`NEW`, `IN_PROGRESS`, `RESOLVED`, `ARCHIVED`.

---

# 5. Frontend & Mobile Integration Playbook

---

## Auth Storage & Auto-Refresh Interceptor Pattern

### Axios Interceptor (Web / React Native)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.otherly.com',
});

// Attach token on every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken'); // or AsyncStorage / SecureStore on mobile
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatic token refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // Logout user
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post('https://api.otherly.com/api/v1/auth/refresh', {
          refreshToken,
        });

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## Media Upload + GraphQL Mutation Recipe

### Step 1: Upload File Binary via REST
```typescript
async function uploadMedia(fileUriOrBlob: File | { uri: string; name: string; type: string }, mediaType: string) {
  const formData = new FormData();
  formData.append('file', fileUriOrBlob as any);
  formData.append('mediaType', mediaType);

  const response = await fetch('https://api.otherly.com/api/v1/media', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: formData,
  });

  const json = await response.json();
  if (!response.ok) throw new Error(json.message || 'Media upload failed');
  
  // Return the Media UUID
  return json.data.id;
}
```

### Step 2: Pass Media UUID into GraphQL Mutation
```typescript
async function postProductWithPhotos(productData: any, photos: File[]) {
  // 1. Upload photos in parallel
  const mediaIds = await Promise.all(
    photos.map((file) => uploadMedia(file, 'PRODUCT_IMAGE'))
  );

  // 2. Submit GraphQL mutation linking the IDs
  const graphQLMutation = `
    mutation CreateProduct($input: CreateProductInput!) {
      createProduct(input: $input) {
        id
        title
        imageUrls
      }
    }
  `;

  const response = await fetch('https://api.otherly.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({
      query: graphQLMutation,
      variables: {
        input: {
          title: productData.title,
          description: productData.description,
          price: productData.price,
          stockQuantity: productData.stockQuantity,
          imageMediaIds: mediaIds, // Linked here
        },
      },
    }),
  });

  return await response.json();
}
```

---

## Handling Pagination on Mobile

For infinite scroll or pull-to-refresh on mobile lists (React Native `FlatList`, Flutter `ListView.builder`):

```graphql
query FetchProductsPage($page: Int!, $limit: Int!) {
  paginatedProducts(filter: { page: $page, limit: $limit }) {
    total
    totalPages
    page
    limit
    data {
      id
      title
      price
      imageUrls
    }
  }
}
```

- When `page >= totalPages`, disable fetching more.
- Append incoming `data` to existing state array on each page load.
- On Pull-to-Refresh: reset `page = 1` and replace list state.
