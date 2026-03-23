# TechByte Frontend Documentation

This document provides a detailed overview of the frontend architecture, file structure, and data flow for the TechByte React application.

## Project Structure (Frontend)

The frontend is a modern **React** application built with **Vite** and styled with **Tailwind CSS**.

```text
Techbyte/
├── index.html              # HTML entry point
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # CSS styling configuration
├── src/                    # Source code
│   ├── main.jsx            # React mounting point
│   ├── App.jsx             # Main router & providers
│   ├── components/         # Reusable UI components
│   │   ├── layout/         # Header, Footer, Navigation
│   │   ├── products/       # ProductCard, ProductList
│   │   └── shared/         # Modals, Buttons, Inputs
│   ├── pages/              # Full-page components (Home, Products, etc.)
│   ├── context/            # Global state (Cart, Auth)
│   ├── hooks/              # Custom React hooks (useAuth, useCart)
│   ├── services/           # API call logic (Axios/Fetch wrappers)
│   ├── lib/                # Configured libraries (React Query)
│   └── assets/             # Images, Global CSS
└── public/                 # Static public assets
```

---

## File-by-File Explanation

### 1. Root Configuration
- **`index.html`**: The single HTML page where Vite injects the React app into the `<div id="root">`.
- **`vite.config.js`**: Configures Vite plugins (React support) and build settings.
- **`tailwind.config.js`**: Customizes the design system (colors, fonts, spacing).
- **`package.json`**: Lists dependencies like `react-router-dom`, `@tanstack/react-query`, and `lucide-react`.

### 2. Core Source (`src/`)
- **`main.jsx`**: Renders the `<App />` component into the DOM.
- **`App.jsx`**: The command center. It sets up the Routing structure and wraps the app in Global Context Providers (`AuthProvider`, `CartProvider`) and `QueryClientProvider`.
- **`index.css`**: Contains Tailwind directives and custom global styles (e.g., custom animations).

### 3. Components (`src/components/`)
- **`Layout.jsx`**: A wrapper component that includes the Header and Footer, rendering page content in between.
- **`Header.jsx` / `Navigation.jsx`**: Persistent bars for browsing categories and searching.
- **`shared/ProductCard.jsx`**: A reusable card showing product image, price, and "Add to Cart" button.
- **`products/FilterSidebar.jsx`**: Handles filtering logic (price ranges, categories, brands).

### 4. Pages (`src/pages/`)
- **`Home.jsx`**: The landing page with hero banners, featured collections, and promotional sections.
- **`Products.jsx`**: The catalog page where users filter and browse items.
- **`ProductDetail.jsx`**: Deep-dive page for a single product with specs and detailed descriptions.
- **`Account.jsx` / `Login.jsx` / `Signup.jsx`**: Auth-related pages for user management.

### 5. State & Data (`src/context/` & `src/lib/`)
- **`AuthContext.jsx`**: Manages the logged-in user state, storing user data and handling the login/logout flow.
- **`CartContext.jsx`**: Tracks items in the user's shopping cart, calculating totals and syncing with localStorage or API.
- **`lib/react-query.js`**: Configures global settings for TanStack Query (caching times, retry logic).

---

## Frontend Flow

1. **Initialization**: `main.jsx` loads. `App.jsx` initializes global states (is the user logged in? what's in the cart?).
2. **Navigation**: User clicks a link. `react-router-dom` intercepts the click and renders the corresponding **Page** component without a browser refresh.
3. **Data Fetching**:
    - A page component (like `Products.jsx`) uses `useQuery` (React Query).
    - It calls a service function that hits `http://localhost:3000/api/products`.
    - React Query handles the loading/error states and caches the results.
4. **User Interactivity**:
    - User adds to cart → `CartContext` updates.
    - User filters → Page re-renders with new filtered product list.
5. **Responsive Design**: Tailwind's utility classes ensure the UI adapts perfectly to Mobile, Tablet, and Desktop screens.
