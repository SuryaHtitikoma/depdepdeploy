/**
 * INVENKRAFT - API Client & Token Management
 * Standalone fetch wrapper with automatic JWT injection & error handling
 */

const API_BASE_URL = '/api';

const Storage = {
  TOKEN_KEY: 'invenkraft_auth_token',
  USER_KEY: 'invenkraft_auth_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  },

  clearAuth() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  getUser() {
    const raw = localStorage.getItem(this.USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};

/**
 * Universal Fetch API Helper
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = Storage.getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const result = await response.json().catch(() => ({
      success: false,
      message: 'Gagal memproses respons dari server.'
    }));

    // Tangani token kedaluwarsa atau tidak sah (401 / 403)
    if (response.status === 401 || (response.status === 403 && result.message?.includes('Token'))) {
      Storage.clearAuth();
      if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = '/login.html?expired=true';
      }
      throw new Error(result.message || 'Sesi telah berakhir.');
    }

    if (!response.ok) {
      throw new Error(result.message || `HTTP Error ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error(`[API ERROR] ${options.method || 'GET'} ${endpoint}:`, error.message);
    throw error;
  }
}

// Shortcut HTTP Methods
const api = {
  get: (endpoint, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(query ? `${endpoint}?${query}` : endpoint, { method: 'GET' });
  },
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' })
};

// Global Toast Notification Helper
function showToast(title, message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || '•'}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button type="button" class="toast-close" aria-label="Tutup">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }
}

// Format Angka ke Rupiah (IDR)
function formatRupiah(number) {
  const val = parseFloat(number) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val);
}

// Format Angka Ribuan
function formatNumber(number) {
  const val = parseInt(number, 10) || 0;
  return new Intl.NumberFormat('id-ID').format(val);
}
