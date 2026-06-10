const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TOKEN_KEY = 'capivara_token';
const REFRESH_KEY = 'capivara_refresh';

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setTokens(token, refresh) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_KEY, refresh);
}
function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function refreshToken() {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) throw new Error('No refresh token');
  const res = await fetch(`${BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  setTokens(data.token, data.refreshToken);
  return data.token;
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  let res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 401 && auth) {
    try {
      const newToken = await refreshToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch {
      clearTokens();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Auth ──
export async function login(email, password) {
  const data = await api('/api/auth/login', { method: 'POST', body: { email, password }, auth: false });
  setTokens(data.token, data.refreshToken);
  return data;
}

export async function register(name, email, password, phone, cpf) {
  const data = await api('/api/auth/register', { method: 'POST', body: { name, email, password, phone, cpf }, auth: false });
  setTokens(data.token, data.refreshToken);
  return data;
}

export async function getMe() {
  return api('/api/auth/me');
}

export function logout() {
  clearTokens();
}

// ── Addresses ──
export async function fetchAddresses() {
  return api('/api/addresses');
}

export async function createAddress(data) {
  return api('/api/addresses', { method: 'POST', body: data });
}

export async function deleteAddress(id) {
  return api(`/api/addresses/${id}`, { method: 'DELETE' });
}

// ── Orders ──
export async function createOrder(data) {
  return api('/api/orders', { method: 'POST', body: data });
}

export async function fetchOrders() {
  return api('/api/orders');
}

// ── Products (via API) ──
export async function fetchProducts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  const qs = params.toString();
  return api(`/api/products${qs ? `?${qs}` : ''}`, { auth: false });
}

export async function fetchCategories() {
  return api('/api/categories', { auth: false });
}

// ── Admin / Seller Registration ──
export async function registerAdmin(data) {
  const result = await api('/api/auth/register-admin', { method: 'POST', body: data, auth: false });
  setTokens(result.token, result.refreshToken);
  return result;
}

// ── Setup (CPF-based — first user creates the platform) ──
export async function checkSetup() {
  return api('/api/setup/check', { auth: false });
}

export async function setupPlatform(name, email, password, phone, cpf, storeName, storeSlug) {
  const data = await api('/api/setup/register', { method: 'POST', body: { name, email, password, phone, cpf, storeName, storeSlug }, auth: false });
  setTokens(data.token, data.refreshToken);
  return data;
}

// ── Supplier Panel (full management — products/orders/metrics) ──
export async function fetchAdminProducts() {
  return api('/api/supplier-panel/products');
}

export async function createAdminProduct(data) {
  return api('/api/supplier-panel/products', { method: 'POST', body: data });
}

export async function updateAdminProduct(id, data) {
  return api(`/api/supplier-panel/products/${id}`, { method: 'PUT', body: data });
}

export async function deleteAdminProduct(id) {
  return api(`/api/supplier-panel/products/${id}`, { method: 'DELETE' });
}

export async function fetchAdminOrders() {
  return api('/api/supplier-panel/orders');
}

export async function updateOrderStatus(id, status) {
  return api(`/api/supplier-panel/orders/${id}/status`, { method: 'PUT', body: { status } });
}

export async function cancelOrderByAdmin(id) {
  return api(`/api/supplier-panel/orders/${id}/cancel`, { method: 'POST' });
}

export async function fetchAdminMetrics() {
  return api('/api/supplier-panel/metrics');
}

// ── User Profile ──
export async function updateProfile(data) {
  return api('/api/user/profile', { method: 'PUT', body: data });
}

// ── Favorites ──
export async function fetchFavorites() {
  return api('/api/favorites');
}

export async function addFavorite(productId) {
  return api(`/api/favorites/${productId}`, { method: 'POST' });
}

export async function removeFavorite(productId) {
  return api(`/api/favorites/${productId}`, { method: 'DELETE' });
}
