# Frontend Changes Required

This document outlines the React frontend modifications needed to integrate with the new backend API.
**No frontend code has been modified** — this is documentation only.

---

## 1. Replace Static Data with API Calls

### Products
- **Current:** `import { products } from '../data/products'`
- **New:** `fetch('/api/products?page=1&limit=12&search=...')`
- Response includes `finalPrice` (after customer discount) alongside `variantPrice` (original)
- Display `finalPrice` when the customer is authenticated

### Categories
- **Current:** Hardcoded sidebar options
- **New:** `fetch('/api/categories')` → dynamic category list

### Brands
- **Current:** Not implemented
- **New:** `fetch('/api/brands')` → brand filter with logos

---

## 2. Auth Context → `/api/auth`

Replace the mock `AuthContext.jsx` with real API calls:

| Action | Endpoint | Notes |
|--------|----------|-------|
| Register | `POST /api/auth/register` | Sends 7-section form data |
| Login | `POST /api/auth/login` | Only `status: approved` customers |
| Logout | `POST /api/auth/logout` | Destroys session |
| Get user | `GET /api/auth/me` | Returns user + discount info |
| Set password | `POST /api/auth/set-password` | Token from approval email |

### Registration Status Feedback
After registration, show message:
> "Your account is pending approval. You will receive an email once approved."

---

## 3. Checkout → `/api/orders`

Replace `handlePlaceOrder` in `Checkout.jsx`:

```javascript
// POST /api/orders with body:
{
  items: [{ productId, quantity }, ...],
  shippingPrice: 0   // or calculated value
}
```

The backend calculates totals using the customer's discounted prices.

---

## 4. Cart Validation → `/api/cart/validate`

Before checkout, validate cart:

```javascript
// POST /api/cart/validate with body:
{
  items: [{ productId, quantity }, ...]
}
// Returns latest prices, stock status, and any out-of-stock flags
```

---

## 5. Price Display Logic

When customer is authenticated AND has a discount:
- Show original price with strikethrough: ~~€100~~
- Show discounted price: **€90**
- Show discount badge: "10% off"

When not authenticated (guest browsing):
- Show `variantPrice` only (no discount)

---

## 6. New Pages Needed

### Password Set Page (`/set-password?token=...`)
- Shown when customer clicks link in approval email
- Form: new password + confirm
- Calls `POST /api/auth/set-password`

### Registration Pending Page (`/registration-pending`)
- Simple page shown after successful registration
- Message explaining the approval process

---

## 7. Environment Setup

Add to React app's environment:
```env
VITE_API_URL=http://localhost:3000
```

Update all fetch calls to use this base URL.
