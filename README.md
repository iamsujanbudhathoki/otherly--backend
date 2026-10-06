# Otherly — Backend API

> REST & GraphQL API backend for Otherly reverse-commerce marketplace, built with Node.js, Express, TypeScript, Type-GraphQL, TSOA, TypeORM, and PostgreSQL.

---

## Tech Stack

- **Runtime**: Node.js >= 22
- **Framework**: Express + [TSOA](https://tsoa-community.github.io/docs/) + [Type-GraphQL](https://typegraphql.com/)
- **Database & ORM**: PostgreSQL + TypeORM
- **DI Container**: TSyringe
- **Validation**: `class-validator` & `class-transformer`
- **Caching**: Redis (`ioredis`, optional)
- **Email**: Nodemailer
- **Documentation**: Swagger UI (`/api-docs`) & GraphQL Playground/Sandbox (`/graphql`)

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Generate TSOA OpenAPI spec & routes and start dev server
pnpm run start:dev

# Seed initial admin
pnpm run seed:admin

# Build for production
pnpm run build
```

---

© 2026 Otherly. All rights reserved.
