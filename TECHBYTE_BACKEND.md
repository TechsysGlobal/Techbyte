# TechByte Backend Documentation

This document provides a detailed overview of the backend architecture, file structure, and data flow for the TechByte project.

## Project Structure (Backend)

The backend is built using **Node.js** and **Express**, with **Prisma ORM** for database management and **EJS** for the admin dashboard views.

```text
backend/
├── index.js                # Entry point: Server config & middleware
├── prisma/                 # Database schema & migrations
│   ├── schema.prisma       # Data models
│   └── seed.js             # Data seeding script
├── routes/                 # Routing logic
│   ├── api/                # REST API endpoints (JSON)
│   └── admin/              # Admin dashboard routes (SSR)
├── views/                  # EJS templates for Admin Dashboard
│   └── admin/              # Dashboard, Products, Orders, etc.
├── lib/                    # Shared utilities (DB client, Cache)
├── middleware/             # Custom Express middleware (Auth)
├── public/                 # Static assets (CSS, JS) for Admin
└── .env                    # Environment variables
```

---

## File-by-File Explanation

### 1. Root Files
- **`index.js`**: The heart of the server. It initializes Express, configures CORS for the frontend, sets up session management (PostgreSQL store), mounts static folders, and connects all routes (API and Admin).
- **`.env`**: Stores sensitive configuration like `DATABASE_URL`, `SESSION_SECRET`, and `SUPABASE_KEY`.
- **`package.json`**: Defines dependencies like `express`, `prisma`, `ejs`, `bcryptjs`, and `nodemailer`.

### 2. Prisma (`prisma/`)
- **`schema.prisma`**: Defines the database models (Product, Category, Brand, Order, User, ActivityLog, etc.). It acts as the "source of truth" for the database structure.
- **`seed.js`**: A script to populate the database with initial data (categories, brands, and products) from CSV or static arrays.

### 3. Routes (`routes/`)
- **API Routes (`routes/api/`)**:
    - `auth.js`: Handles user login, registration, and session verification.
    - `products.js`: REST endpoints for fetching products, filtering, and searching.
    - `categories.js` & `brands.js`: Endpoints to fetch taxonomy data.
    - `orders.js`: Handles order placement and history.
    - `cart.js`: Manages server-side cart persistence.
- **Admin Routes (`routes/admin/`)**:
    - `index.js`: Main dashboard route providing overview stats.
    - `products.js`: CRUD operations for managing products in the dashboard.
    - `visibility.js`: Specialized routes for managing product/catalog visibility tags.
    - `audit.js`: View and manage activity logs.

### 4. Views (`views/admin/`)
- **`dashboard.ejs`**: The landing page for admins with summary metrics.
- **`products.ejs`**: A table-based view for listing, editing, and deleting products.
- **`categories.ejs` / `brands.ejs`**: Management pages for taxonomy.
- **`partials/`**: Reusable EJS components like `header.ejs`, `sidebar.ejs`, and `footer.ejs`.

### 5. Shared Logic (`lib/` & `middleware/`)
- **`lib/prisma.js`**: Exports a singleton instance of the Prisma Client to prevent multiple connection overheads.
- **`middleware/auth.js`**: Middlewares like `isAdmin` or `isAuth` that protect routes by checking the session.

---

## Backend Flow

1. **Server Initialization**: `index.js` starts the Express server and connects to PostgreSQL.
2. **API Requests (JSON)**:
    - Frontend sends an AJAX request (e.g., `GET /api/products`).
    - Route controller fetches data via Prisma.
    - Data is returned as JSON to the React frontend.
3. **Admin Dashboard (SSR)**:
    - Admin navigates to `/admin`.
    - Express route fetches stats from the DB.
    - Route renders an EJS template, injecting the data on the server.
    - Browser receives a fully formed HTML page.
4. **Data Persistence**: Prisma handles all communication with Supabase/PostgreSQL, ensuring type safety and efficient querying.
