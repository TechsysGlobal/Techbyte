// ─── API Service Layer ───────────────────────────────────────────────────────
// Centralizes all backend API calls and field mapping.
// The backend (Prisma) uses different field names than the frontend expects.
// mapProduct() normalizes the essential fields while preserving ALL raw fields.

const API_BASE = import.meta.env.VITE_API_URL || '/api';


/**
 * Maps a backend product object to the shape the frontend components expect.
 * Preserves ALL original fields from the database so the product detail page
 * can display everything (sim, warranty, inBox, model, etc.)
 */
export function mapProduct(p) {
    if (!p) return null;
    return {
        // All raw database fields are spread first
        ...p,
        // Normalized fields for frontend component compatibility
        id: p.id,                  // Real UUID for API calls (orders, cart validation)
        handle: p.handle,          // URL slug for routing
        name: p.title,             // displayed as product.name
        price: parseFloat(p.finalPrice || p.variantPrice) || 0,
        originalPrice: parseFloat(p.variantPrice) || 0,
        inStock: p.variantInventoryQty || 0,
        image: p.imageSrc || 'https://via.placeholder.com/400',
        category: p.category ? p.category.name : p.productCategory,
        brand: p.brandRel ? p.brandRel.name : p.brand,
    };
}

/**
 * Fetch products list with optional filters, sorting, and pagination.
 * All filtering/sorting/pagination is done server-side.
 * Returns: { products, pagination, availableFilters }
 */
export async function fetchProducts(params = {}) {
    const query = new URLSearchParams();

    if (params.search) query.set('search', params.search);
    if (params.brand) query.set('brand', params.brand);
    if (params.category) query.set('category', params.category);
    if (params.color) query.set('color', params.color);
    if (params.storage) query.set('storage', params.storage);
    if (params.region) query.set('region', params.region);
    if (params.minPrice != null) query.set('minPrice', params.minPrice);
    if (params.maxPrice != null) query.set('maxPrice', params.maxPrice);
    if (params.sort) query.set('sort', params.sort);
    if (params.order) query.set('order', params.order);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.inStock) query.set('inStock', params.inStock);

    const res = await fetch(`${API_BASE}/products?${query.toString()}`, { credentials: 'include' });
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();

    // Map from new backend { products, meta: { pagination, availableFilters } }
    const pagination = data.meta?.pagination || data.pagination || { currentPage: 1, totalItems: 0, totalPages: 1 };

    return {
        products: (data.products || []).map(mapProduct),
        pagination: {
            page: pagination.currentPage ?? pagination.page ?? 1,
            limit: pagination.itemsPerPage ?? pagination.limit ?? 24,
            total: pagination.totalItems ?? pagination.total ?? 0,
            totalPages: pagination.totalPages ?? 1,
        },
        availableFilters: data.meta?.availableFilters || null,
    };
}

/**
 * Fetch a single product by its handle (URL slug).
 */
export async function fetchProduct(handle) {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(handle)}`, { credentials: 'include' });
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`API error: ${res.status}`);
    }
    const data = await res.json();
    return mapProduct(data);
}

/**
 * Fetch all brands
 */
export async function fetchBrands() {
    const res = await fetch(`${API_BASE}/brands`, { credentials: 'include' });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

/**
 * Fetch a single brand by its slug (and its products if backend includes them)
 */
export async function fetchBrand(slug) {
    const res = await fetch(`${API_BASE}/brands/${encodeURIComponent(slug)}`, { credentials: 'include' });
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`API error: ${res.status}`);
    }
    return res.json();
}

/**
 * AUTHENTICATION METHODS
 */

export async function login(credentials) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Login failed: ${res.status}`);
    }
    return res.json();
}

export async function register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const err = await res.json();
        const error = new Error(err.error || `Registration failed: ${res.status}`);
        error.fields = err.fields;
        throw error;
    }
    return res.json();
}

export async function logout() {
    const res = await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    if (!res.ok) console.error('Logout failed');
}

export async function getCurrentUser() {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) throw new Error(`Auth check failed: ${res.status}`);
    const data = await res.json();
    return data.user;
}

export async function forgotPassword(email) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send reset link');
    }
    return res.json();
}

export async function resetPassword(token, code, password) {
    const body = { password };

    if (token != null) body.token = token;
    if (code != null) body.code = code;

    const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reset password');
    }
    return res.json();
}

export async function sendContactMessage(formData) {
    const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send message');
    }
    return res.json();
}


export async function validateCart(items) {
    const res = await fetch(`${API_BASE}/cart/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items })
    });
    if (!res.ok) throw new Error('Failed to validate cart');
    return res.json();
}

export async function createOrder(orderData) {
    const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderData)
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Order failed: ${res.status}`);
    }
    return res.json();
}

export async function fetchOrders() {
    const res = await fetch(`${API_BASE}/orders`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
}

export async function setPassword(token, password) {
    const res = await fetch(`${API_BASE}/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to set password');
    }
    return res.json();
}

