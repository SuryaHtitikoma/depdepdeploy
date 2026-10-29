/**
 * INVENKRAFT - Main Application Dashboard Controller
 * Full CRUD, Search, Filter, Sort, Pagination & Stats
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verifikasi Autentikasi
  if (!Storage.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  // State Management
  const state = {
    user: Storage.getUser(),
    search: '',
    category: '',
    status: '',
    sortBy: 'created_at',
    sortOrder: 'DESC',
    page: 1,
    limit: 10,
    totalPages: 1,
    activeDeleteId: null
  };

  // DOM Elements - Header & User
  const userFullnameDisplay = document.getElementById('user-fullname-display');
  const userRoleDisplay = document.getElementById('user-role-display');
  const userAvatarText = document.getElementById('user-avatar-text');
  const btnLogout = document.getElementById('btn-logout');

  // DOM Elements - Metrics
  const statTotalSkus = document.getElementById('stat-total-skus');
  const statTotalUnits = document.getElementById('stat-total-units');
  const statAssetVal = document.getElementById('stat-asset-val');
  const statSalesVal = document.getElementById('stat-sales-val');
  const statLowStock = document.getElementById('stat-low-stock');
  const statOutStock = document.getElementById('stat-out-stock');

  // DOM Elements - Toolbar & Filters
  const filterSearch = document.getElementById('filter-search');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const filterCategory = document.getElementById('filter-category');
  const filterStatus = document.getElementById('filter-status');
  const filterSort = document.getElementById('filter-sort');
  const btnToggleSortOrder = document.getElementById('btn-toggle-sort-order');
  const sortOrderIcon = document.getElementById('sort-order-icon');
  const btnRefresh = document.getElementById('btn-refresh');
  const btnAddProduct = document.getElementById('btn-add-product');
  const btnEmptyAdd = document.getElementById('btn-empty-add');
  const btnResetFilters = document.getElementById('btn-reset-filters');
  const btnRetryFetch = document.getElementById('btn-retry-fetch');

  // DOM Elements - Table & States
  const tableBody = document.getElementById('products-table-body');
  const tableLoading = document.getElementById('table-loading');
  const tableEmpty = document.getElementById('table-empty');
  const tableError = document.getElementById('table-error');
  const tableErrorMessage = document.getElementById('table-error-message');

  // DOM Elements - Pagination
  const paginationMetaText = document.getElementById('pagination-meta-text');
  const selectPageLimit = document.getElementById('select-page-limit');
  const btnPrevPage = document.getElementById('btn-prev-page');
  const btnNextPage = document.getElementById('btn-next-page');
  const paginationNumbers = document.getElementById('pagination-numbers');

  // DOM Elements - Modal Form Product
  const modalProduct = document.getElementById('modal-product');
  const modalProductTitle = document.getElementById('modal-product-title');
  const formProduct = document.getElementById('form-product');
  const btnCloseProductModal = document.getElementById('btn-close-product-modal');
  const btnCancelProductModal = document.getElementById('btn-cancel-product-modal');
  const btnSubmitProduct = document.getElementById('btn-submit-product');
  const spinnerProductSave = document.getElementById('spinner-product-save');

  const prodId = document.getElementById('prod-id');
  const prodSku = document.getElementById('prod-sku');
  const prodName = document.getElementById('prod-name');
  const prodCategory = document.getElementById('prod-category');
  const prodPurchasePrice = document.getElementById('prod-purchase-price');
  const prodSellingPrice = document.getElementById('prod-selling-price');
  const prodStock = document.getElementById('prod-stock');
  const prodMinStock = document.getElementById('prod-min-stock');
  const prodUnit = document.getElementById('prod-unit');
  const prodDesc = document.getElementById('prod-desc');
  const hintPurchasePreview = document.getElementById('hint-purchase-preview');
  const hintSellingPreview = document.getElementById('hint-selling-preview');

  // DOM Elements - Modal Delete
  const modalDelete = document.getElementById('modal-delete');
  const deleteProdName = document.getElementById('delete-prod-name');
  const deleteProdSku = document.getElementById('delete-prod-sku');
  const btnCloseDeleteModal = document.getElementById('btn-close-delete-modal');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');
  const spinnerDelete = document.getElementById('spinner-delete');

  // =========================================================================
  // INITIALIZATION: Profile & Stats
  // =========================================================================
  async function initProfile() {
    try {
      const response = await api.get('/auth/me');
      if (response.success && response.data) {
        state.user = response.data;
        Storage.setUser(response.data);
      }
    } catch {
      // Jika gagal verifikasi profil, api.js sudah mengarahkan jika status 401
    }

    if (state.user) {
      userFullnameDisplay.textContent = state.user.full_name || state.user.username;
      userRoleDisplay.textContent = state.user.role === 'admin' ? 'Administrator' : 'Staff Gudang';
      const initial = (state.user.full_name || state.user.username).charAt(0).toUpperCase();
      userAvatarText.textContent = initial;
    }
  }

  // Logout Handler
  btnLogout.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      Storage.clearAuth();
      showToast('Keluar Selesai', 'Anda telah berhasil keluar dari akun.', 'info');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 400);
    }
  });

  // =========================================================================
  // METRICS & CATEGORIES
  // =========================================================================
  async function loadStats() {
    try {
      const res = await api.get('/products/stats');
      if (res.success && res.data) {
        const { summary, categories } = res.data;

        statTotalSkus.textContent = formatNumber(summary.total_items);
        statTotalUnits.textContent = `${formatNumber(summary.total_units)} Total unit fisik`;
        statAssetVal.textContent = formatRupiah(summary.total_asset_value);
        statSalesVal.textContent = `Estimasi omset jual: ${formatRupiah(summary.total_potential_sales)}`;
        statLowStock.textContent = formatNumber(summary.low_stock_count);
        statOutStock.textContent = formatNumber(summary.out_of_stock_count);

        // Update dropdown kategori jika belum terisi atau berubah
        const currentSelected = filterCategory.value;
        filterCategory.innerHTML = '<option value="">Semua Kategori</option>';
        if (Array.isArray(categories)) {
          categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.category;
            opt.textContent = `${c.category} (${c.count})`;
            if (c.category === currentSelected) opt.selected = true;
            filterCategory.appendChild(opt);
          });
        }
      }
    } catch (err) {
      console.warn('Gagal memuat statistik:', err.message);
    }
  }

  // =========================================================================
  // FETCH & RENDER DATA TABLE
  // =========================================================================
  async function fetchProducts() {
    tableLoading.style.display = 'flex';
    tableEmpty.style.display = 'none';
    tableError.style.display = 'none';
    tableBody.innerHTML = '';

    try {
      const params = {
        search: state.search,
        category: state.category,
        stock_status: state.status,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        page: state.page,
        limit: state.limit
      };

      const res = await api.get('/products', params);

      tableLoading.style.display = 'none';

      if (!res.success) {
        throw new Error(res.message || 'Gagal memuat data produk');
      }

      const products = res.data || [];
      const pagination = res.pagination || { page: 1, limit: 10, totalRecords: 0, totalPages: 1 };

      state.totalPages = pagination.totalPages || 1;

      if (products.length === 0) {
        tableEmpty.style.display = 'flex';
        renderPagination(0, 0, 0);
        return;
      }

      renderTableRows(products);
      renderPagination(pagination.totalRecords, pagination.page, pagination.limit);

    } catch (error) {
      tableLoading.style.display = 'none';
      tableError.style.display = 'flex';
      tableErrorMessage.textContent = error.message || 'Terjadi masalah pada koneksi database.';
    }
  }

  function renderTableRows(products) {
    tableBody.innerHTML = '';

    products.forEach(p => {
      const tr = document.createElement('tr');

      // Margin perhitungan
      const purchase = parseFloat(p.purchase_price) || 0;
      const selling = parseFloat(p.selling_price) || 0;
      let marginPercent = 0;
      if (purchase > 0) {
        marginPercent = (((selling - purchase) / purchase) * 100).toFixed(1);
      }

      // Status Badge
      let badgeClass = 'badge-in_stock';
      let badgeText = 'Stok Aman';

      if (p.stock === 0) {
        badgeClass = 'badge-out_of_stock';
        badgeText = 'Habis';
      } else if (p.stock <= p.min_stock) {
        badgeClass = 'badge-low_stock';
        badgeText = 'Menipis';
      }

      tr.innerHTML = `
        <td class="td-sku">${escapeHtml(p.sku)}</td>
        <td>
          <div class="td-product-name">
            <span>${escapeHtml(p.name)}</span>
            ${p.description ? `<span class="td-product-desc" title="${escapeHtml(p.description)}">${escapeHtml(p.description)}</span>` : ''}
          </div>
        </td>
        <td>
          <span class="badge badge-category">${escapeHtml(p.category)}</span>
        </td>
        <td class="td-price">${formatRupiah(p.purchase_price)}</td>
        <td class="td-price" style="font-weight: 600;">${formatRupiah(p.selling_price)}</td>
        <td class="td-margin">${marginPercent > 0 ? `+${marginPercent}%` : `${marginPercent}%`}</td>
        <td class="text-center">
          <div class="td-stock-wrapper">
            <div>
              <span class="stock-count-mono">${formatNumber(p.stock)}</span> 
              <span class="text-muted" style="font-size: 0.8rem;">${escapeHtml(p.unit)}</span>
            </div>
            <div>
              <span class="badge ${badgeClass}">
                <span class="status-dot"></span>
                ${badgeText}
              </span>
            </div>
          </div>
        </td>
        <td style="font-size: 0.82rem;">
          <div style="font-weight: 500;">${escapeHtml(p.created_by_name || 'Sistem')}</div>
          <div class="text-muted" style="font-size: 0.75rem;">${formatDate(p.created_at)}</div>
        </td>
        <td>
          <div class="row-actions">
            <button type="button" class="btn btn-secondary btn-sm btn-action-edit" data-id="${p.id}" title="Ubah data barang">
              Edit
            </button>
            <button type="button" class="btn btn-danger btn-sm btn-action-delete" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-sku="${escapeHtml(p.sku)}" title="Hapus dari inventaris">
              Hapus
            </button>
          </div>
        </td>
      `;

      tableBody.appendChild(tr);
    });

    // Pasang Event Listener pada Tombol Aksi Tiap Baris
    tableBody.querySelectorAll('.btn-action-edit').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });

    tableBody.querySelectorAll('.btn-action-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        openDeleteModal(btn.dataset.id, btn.dataset.name, btn.dataset.sku);
      });
    });
  }

  function renderPagination(totalRecords, page, limit) {
    btnPrevPage.disabled = page <= 1;
    btnNextPage.disabled = page >= state.totalPages;

    const start = totalRecords === 0 ? 0 : (page - 1) * limit + 1;
    const end = Math.min(page * limit, totalRecords);

    paginationMetaText.innerHTML = `Menampilkan <b>${start}</b> - <b>${end}</b> dari total <b>${formatNumber(totalRecords)}</b> produk`;

    // Tombol angka halaman
    paginationNumbers.innerHTML = '';
    const maxButtons = 5;
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(state.totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.type = 'button';
      pageBtn.className = `page-btn ${i === page ? 'is-active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => {
        if (state.page !== i) {
          state.page = i;
          fetchProducts();
        }
      });
      paginationNumbers.appendChild(pageBtn);
    }
  }

  // =========================================================================
  // FILTER & SEARCH HANDLERS
  // =========================================================================
  let searchDebounceTimer = null;
  filterSearch.addEventListener('input', (e) => {
    state.search = e.target.value;
    btnClearSearch.style.display = state.search ? 'block' : 'none';

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      state.page = 1;
      fetchProducts();
    }, 300);
  });

  btnClearSearch.addEventListener('click', () => {
    filterSearch.value = '';
    state.search = '';
    btnClearSearch.style.display = 'none';
    state.page = 1;
    fetchProducts();
    filterSearch.focus();
  });

  filterCategory.addEventListener('change', (e) => {
    state.category = e.target.value;
    state.page = 1;
    fetchProducts();
  });

  filterStatus.addEventListener('change', (e) => {
    state.status = e.target.value;
    state.page = 1;
    fetchProducts();
  });

  filterSort.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    state.page = 1;
    fetchProducts();
  });

  btnToggleSortOrder.addEventListener('click', () => {
    state.sortOrder = state.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    sortOrderIcon.textContent = state.sortOrder === 'ASC' ? '↑ ASC' : '↓ DESC';
    state.page = 1;
    fetchProducts();
  });

  btnRefresh.addEventListener('click', () => {
    fetchProducts();
    loadStats();
    showToast('Diperbarui', 'Data inventaris telah dimuat ulang.', 'info', 2000);
  });

  btnResetFilters.addEventListener('click', () => {
    filterSearch.value = '';
    filterCategory.value = '';
    filterStatus.value = '';
    filterSort.value = 'created_at';
    btnClearSearch.style.display = 'none';

    state.search = '';
    state.category = '';
    state.status = '';
    state.sortBy = 'created_at';
    state.sortOrder = 'DESC';
    state.page = 1;
    sortOrderIcon.textContent = '↓ DESC';

    fetchProducts();
  });

  btnRetryFetch.addEventListener('click', () => {
    fetchProducts();
    loadStats();
  });

  // Pagination navigation clicks
  btnPrevPage.addEventListener('click', () => {
    if (state.page > 1) {
      state.page--;
      fetchProducts();
    }
  });

  btnNextPage.addEventListener('click', () => {
    if (state.page < state.totalPages) {
      state.page++;
      fetchProducts();
    }
  });

  selectPageLimit.addEventListener('change', (e) => {
    state.limit = parseInt(e.target.value, 10);
    state.page = 1;
    fetchProducts();
  });

  // =========================================================================
  // MODAL CRUD: TAMBAH & EDIT PRODUK
  // =========================================================================
  function openAddModal() {
    formProduct.reset();
    prodId.value = '';
    modalProductTitle.textContent = 'Tambah Produk Baru ke Inventaris';
    btnSubmitProduct.querySelector('.btn-text').textContent = 'Simpan Produk';
    hintPurchasePreview.textContent = 'Rp 0';
    hintSellingPreview.textContent = 'Rp 0';
    clearFormErrors();
    modalProduct.classList.add('is-open');
    prodSku.focus();
  }

  async function openEditModal(id) {
    formProduct.reset();
    clearFormErrors();
    modalProductTitle.textContent = 'Memuat Data Produk...';
    modalProduct.classList.add('is-open');

    try {
      const res = await api.get(`/products/${id}`);
      if (res.success && res.data) {
        const p = res.data;
        prodId.value = p.id;
        prodSku.value = p.sku;
        prodName.value = p.name;
        prodCategory.value = p.category;
        prodPurchasePrice.value = p.purchase_price;
        prodSellingPrice.value = p.selling_price;
        prodStock.value = p.stock;
        prodMinStock.value = p.min_stock;
        prodUnit.value = p.unit || 'pcs';
        prodDesc.value = p.description || '';

        modalProductTitle.textContent = `Edit Produk: ${p.name} (${p.sku})`;
        btnSubmitProduct.querySelector('.btn-text').textContent = 'Perbarui Produk';
        updatePriceHints();
      }
    } catch (err) {
      showToast('Gagal Membuka', err.message || 'Tidak dapat mengambil detail produk.', 'error');
      closeProductModal();
    }
  }

  function closeProductModal() {
    modalProduct.classList.remove('is-open');
    formProduct.reset();
    clearFormErrors();
  }

  btnAddProduct.addEventListener('click', openAddModal);
  btnEmptyAdd.addEventListener('click', openAddModal);
  btnCloseProductModal.addEventListener('click', closeProductModal);
  btnCancelProductModal.addEventListener('click', closeProductModal);

  // Price hint updates
  function updatePriceHints() {
    hintPurchasePreview.textContent = formatRupiah(prodPurchasePrice.value || 0);
    hintSellingPreview.textContent = formatRupiah(prodSellingPrice.value || 0);
  }
  prodPurchasePrice.addEventListener('input', updatePriceHints);
  prodSellingPrice.addEventListener('input', updatePriceHints);

  function clearFormErrors() {
    document.querySelectorAll('.form-group').forEach(grp => grp.classList.remove('has-error'));
  }

  // Submit Product (Create / Update)
  formProduct.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors();

    const id = prodId.value;
    const isEdit = Boolean(id);

    const payload = {
      sku: prodSku.value.trim(),
      name: prodName.value.trim(),
      category: prodCategory.value.trim(),
      purchase_price: parseFloat(prodPurchasePrice.value) || 0,
      selling_price: parseFloat(prodSellingPrice.value) || 0,
      stock: parseInt(prodStock.value, 10) || 0,
      min_stock: parseInt(prodMinStock.value, 10) || 5,
      unit: prodUnit.value,
      description: prodDesc.value.trim()
    };

    // Client Validation
    let hasError = false;
    if (!payload.name) {
      document.getElementById('grp-prod-name').classList.add('has-error');
      hasError = true;
    }
    if (!payload.category) {
      document.getElementById('grp-prod-category').classList.add('has-error');
      hasError = true;
    }

    if (hasError) {
      showToast('Validasi Gagal', 'Mohon lengkapi kolom bertanda bintang.', 'error');
      return;
    }

    // Tombol Loading State
    btnSubmitProduct.disabled = true;
    spinnerProductSave.style.display = 'inline-block';

    try {
      let res;
      if (isEdit) {
        res = await api.put(`/products/${id}`, payload);
      } else {
        res = await api.post('/products', payload);
      }

      if (res.success) {
        closeProductModal();
        showToast('Berhasil', res.message || 'Data produk tersimpan.', 'success');
        fetchProducts();
        loadStats();
      } else {
        showToast('Gagal Menyimpan', res.message || 'Terjadi kesalahan.', 'error');
      }
    } catch (err) {
      showToast('Kesalahan', err.message || 'Gagal menyimpan perubahan ke server.', 'error');
    } finally {
      btnSubmitProduct.disabled = false;
      spinnerProductSave.style.display = 'none';
    }
  });

  // =========================================================================
  // MODAL CRUD: HAPUS PRODUK
  // =========================================================================
  function openDeleteModal(id, name, sku) {
    state.activeDeleteId = id;
    deleteProdName.textContent = name;
    deleteProdSku.textContent = sku;
    modalDelete.classList.add('is-open');
    btnConfirmDelete.focus();
  }

  function closeDeleteModal() {
    modalDelete.classList.remove('is-open');
    state.activeDeleteId = null;
  }

  btnCloseDeleteModal.addEventListener('click', closeDeleteModal);
  btnCancelDelete.addEventListener('click', closeDeleteModal);

  btnConfirmDelete.addEventListener('click', async () => {
    if (!state.activeDeleteId) return;

    btnConfirmDelete.disabled = true;
    spinnerDelete.style.display = 'inline-block';

    try {
      const res = await api.delete(`/products/${state.activeDeleteId}`);
      if (res.success) {
        closeDeleteModal();
        showToast('Dihapus', res.message || 'Produk telah dihapus.', 'success');
        fetchProducts();
        loadStats();
      } else {
        showToast('Gagal Hapus', res.message || 'Gagal menghapus produk.', 'error');
      }
    } catch (err) {
      showToast('Kesalahan', err.message || 'Gagal menghapus data di database.', 'error');
    } finally {
      btnConfirmDelete.disabled = false;
      spinnerDelete.style.display = 'none';
    }
  });

  // Keyboard shortcut: Escape to close modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalProduct.classList.contains('is-open')) closeProductModal();
      if (modalDelete.classList.contains('is-open')) closeDeleteModal();
    }
  });

  // Close modals when clicking backdrop
  modalProduct.addEventListener('click', (e) => {
    if (e.target === modalProduct) closeProductModal();
  });
  modalDelete.addEventListener('click', (e) => {
    if (e.target === modalDelete) closeDeleteModal();
  });

  // Format Helper: Tanggal Indonesia
  function formatDate(isoString) {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // BOOTSTRAP INITIAL RUN
  // =========================================================================
  await initProfile();
  await loadStats();
  await fetchProducts();
});
