# Stradmont Solutions — Backend API

> **Systems over chaos.**
> REST API backend for [Stradmont Solutions](https://stradmontsolutions.com), built with Node.js, Express, TypeScript, TSOA (OpenAPI/Swagger), TypeORM, and PostgreSQL.

---

## Tech Stack

- **Runtime**: Node.js >= 22
- **Framework**: Express + [TSOA](https://tsoa-community.github.io/docs/) (OpenAPI v3 route & spec generation)
- **Database & ORM**: PostgreSQL + TypeORM
- **DI Container**: TSyringe
- **Validation**: `class-validator` & `class-transformer`
- **Caching**: Redis (`ioredis`, optional)
- **Email**: Nodemailer
- **Documentation**: Swagger UI (`/api-docs`)

---

## API Modules & Endpoints

All TSOA routes are mounted under `/api/v1`:

- **Health**:
  - `GET /` — Service welcome & status
  - `GET /health` — Health check
- **Contact Us (`/api/v1/contact`)**:
  - `POST /api/v1/contact` — Submit a contact form enquiry (`name`, `email`, `company`, `topic`, `message`)
  - `GET /api/v1/contact` — List contact enquiries (paginated, filterable by `topic`, `status`, `search`)
  - `GET /api/v1/contact/:id` — Get contact enquiry details
  - `PATCH /api/v1/contact/:id/status` — Update enquiry status (`NEW`, `IN_PROGRESS`, `RESOLVED`, `ARCHIVED`)
  - `DELETE /api/v1/contact/:id` — Soft-delete enquiry
- **Stradmont Letters (`/api/v1/letters`)**:
  - `GET /api/v1/letters` — List published letters, notes, and studies
  - `GET /api/v1/letters/:slug` — Get letter by slug
  - `POST /api/v1/letters` — Create a new letter
  - `PATCH /api/v1/letters/:slug` — Update a letter
  - `DELETE /api/v1/letters/:slug` — Delete a letter
- **Products (`/api/v1/products`)**:
  - `GET /api/v1/products` — List Stradmont products (e.g., Builders Base)
  - `GET /api/v1/products/:slug` — Get product by slug
  - `POST /api/v1/products` — Create a product
  - `PATCH /api/v1/products/:slug` — Update a product
  - `DELETE /api/v1/products/:slug` — Delete a product
- **Admin Auth (`/api/v1/admin/auth`)**:
  - `POST /api/v1/admin/auth` — Authenticate admin user
- **Media (`/api/v1/media`)**:
  - `POST /api/v1/media` — Upload media files

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Generate TSOA OpenAPI spec & routes and start dev server
pnpm run start:dev

# Seed initial admins, products, and letters
pnpm run seed:admin

# Build for production
pnpm run build
```

---

© 2026 Stradmont Solutions. All rights reserved.
