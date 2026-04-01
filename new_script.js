/* ============================================================
   OASIS Dashboard — Final, fully functional
   ============================================================ */

/* ── 1. STATE ── */
let rows = [];           // all products
let nextId = 1;            // auto-increment ID
let pendingImg = null;         // base64 image
let currentPage = 1;            // current page
let currentFilter = "";           // current search term
const ROWS_PER_PAGE = 5;          // items per page

/* ── 2. HELPER: Get filtered rows (by product name) ── */
function getFilteredRows() {
    if (!currentFilter) return rows;
    const term = currentFilter.toLowerCase();
    return rows.filter(r => r.product.toLowerCase().includes(term));
}

/* ── 3. RENDER TABLE (paginated, filtered) ── */
function renderTable() {
    const filtered = getFilteredRows();
    const totalRows = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * ROWS_PER_PAGE;
    const paged = filtered.slice(start, start + ROWS_PER_PAGE);

    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    if (!paged.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No records found.</td></tr>`;
        updatePaginationControls(totalRows);
        return;
    }

    paged.forEach((record, idx) => {
        const tr = document.createElement('tr');
        if (idx === 0 && filtered.length > 0) tr.classList.add('row-selected');
        tr.dataset.id = record.id;
        tr.style.cursor = 'pointer';

        const isPaid = record.status === 'Paid';
        tr.innerHTML = `
        <td>${escapeHtml(record.customer)}</td>
        <td class="td-muted">${escapeHtml(record.product)}</td>
        <td class="td-muted">${escapeHtml(record.date)}</td>
        <td class="td-bold">${escapeHtml(record.amount)}</td>
        <td><span class="badge ${isPaid ? 'badge-paid' : 'badge-pending'}">${escapeHtml(record.status)}</span></td>
    `;

        tr.addEventListener('click', () => {
            document.querySelectorAll('#tableBody tr').forEach(r => r.classList.remove('row-selected'));
            tr.classList.add('row-selected');
            updatePanels(record);
        });

        tbody.appendChild(tr);
    });

    updatePaginationControls(totalRows);
}

/* Update pagination UI (page numbers, prev/next) */
function updatePaginationControls(totalRows) {
    const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));
    const container = document.getElementById('paginationNumbers');
    if (!container) return;

    container.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = 'page-num-btn' + (i === currentPage ? ' page-num-active' : '');
        btn.addEventListener('click', () => {
            currentPage = i;
            renderTable();
        });
        container.appendChild(btn);
    }

    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

/* Change page by direction (used by Previous/Next) */
function changePage(direction) {
    const filtered = getFilteredRows();
    const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
    let newPage = currentPage + direction;
    if (newPage < 1) newPage = 1;
    if (newPage > totalPages) newPage = totalPages;
    if (newPage !== currentPage) {
        currentPage = newPage;
        renderTable();
    }
}

/* Search filter */
function filterTable(query) {
    currentFilter = query.trim();
    currentPage = 1;               // reset to first page
    renderTable();

    // Update top panels with first record if any, else clear
    const filtered = getFilteredRows();
    if (filtered.length) {
        updatePanels(filtered[0]);
    } else {
        clearPanels();
    }
}

/* ── 4. TOP PANELS ── */
function updatePanels(record) {
    _updateProductPanel(record);
    _updateImagePanel(record);
    _updatePricePanel(record);
}

function _updateProductPanel(record) {
    const el = document.getElementById('productDisplay');
    el.className = 'product-name-display';
    el.innerHTML = `
    ${escapeHtml(record.product)}
    ${record.desc ? `<div class="product-desc-display">${escapeHtml(record.desc)}</div>` : ''}
  `;
}

function _updateImagePanel(record) {
    const panel = document.getElementById('imagePanel');
    if (record.image) {
        panel.innerHTML = `<img src="${record.image}" alt="${escapeHtml(record.product)}" style="max-height:150px; max-width:100%; object-fit:contain; border-radius:8px;">`;
    } else {
        panel.innerHTML = _imagePlaceholder(record.product);
    }
}

function _updatePricePanel(record) {
    const priceEl = document.getElementById('priceDisplay');
    priceEl.textContent = record.price ? `${Number(record.price).toLocaleString()} DA` : '— DA';
    priceEl.classList.add('flash');
    setTimeout(() => priceEl.classList.remove('flash'), 600);
    document.getElementById('priceBadge').textContent = `+${rows.length}`;
}

function clearPanels() {
    const productDisplay = document.getElementById('productDisplay');
    productDisplay.className = 'product-empty';
    productDisplay.textContent = 'No product added yet — click ADD below.';
    document.getElementById('imagePanel').innerHTML = _imagePlaceholder('');
    document.getElementById('priceDisplay').textContent = '— DA';
    document.getElementById('priceBadge').textContent = '+0';
}

function _imagePlaceholder(label) {
    return `
    <div class="img-placeholder">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9l4-4 4 4 4-4 4 4"/>
        <circle cx="8.5" cy="14.5" r="1.5"/>
      </svg>
      <p style="font-size:12px; color:#bbb;">${escapeHtml(label) || 'No image'}</p>
    </div>`;
}

/* ── 5. IMAGE UPLOAD ── */
function previewImage(input) {
    if (!input.files[0]) return;
    const fileName = input.files[0].name;
    const reader = new FileReader();
    reader.onload = (e) => {
        pendingImg = e.target.result;
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.add('has-file');
        uploadArea.innerHTML = `
      <input type="file" accept="image/*" onchange="previewImage(this)"/>
      <img src="${pendingImg}" class="upload-preview" alt="preview"/>
      <p>✓ ${escapeHtml(fileName)}</p>
    `;
    };
    reader.readAsDataURL(input.files[0]);
}

function resetUploadArea() {
    pendingImg = null;
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.classList.remove('has-file');
    uploadArea.innerHTML = `
    <input type="file" accept="image/*" onchange="previewImage(this)"/>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.5">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    <p>Click or drag an image here</p>
  `;
}

/* ── 6. MODAL CONTROLS (Add only) ── */
function openAddModal() {
    ['addName', 'addPrice', 'addCustomer', 'addAmount', 'addDesc'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('addStatus').value = 'Paid';
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    document.getElementById('addDate').value = `${dd}.${mm}.${yyyy}`;
    resetUploadArea();
    document.getElementById('addModal').classList.add('open');
}

function closeModals() {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('open'));
}

/* ── 7. ADD PRODUCT with automatic timestamp ── */
function confirmAdd() {
    const product = document.getElementById('addName').value.trim();
    const price = document.getElementById('addPrice').value.trim();
    const customer = document.getElementById('addCustomer').value.trim();
    const amount = document.getElementById('addAmount').value.trim();
    const status = document.getElementById('addStatus').value;
    const desc = document.getElementById('addDesc').value.trim();

    if (!product || !price || !customer || !amount) {
        alert('Please fill in all required fields (marked with *).');
        return;
    }

    // Generate current timestamp (DD.MM.YYYY HH:MM)
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${dd}.${mm}.${yyyy} ${hours}:${minutes}`;

    const newRecord = {
        id: nextId++,
        product,
        price: Number(price),
        customer,
        date: timestamp,          // store the timestamp
        amount,
        status,
        desc,
        image: pendingImg,
    };

    rows.unshift(newRecord);
    // Reset search and go to first page
    currentFilter = "";
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) searchInput.value = "";
    currentPage = 1;
    renderTable();
    if (rows.length) updatePanels(rows[0]);
    closeModals();
}

/* ── 8. DELETE SELECTED PRODUCT ── */
function deleteSelectedProduct() {
    const selectedRow = document.querySelector('#tableBody tr.row-selected');
    if (!selectedRow) {
        alert('Please select a product first by clicking on a row.');
        return;
    }

    const recordId = Number(selectedRow.dataset.id);
    const record = rows.find(r => r.id === recordId);
    if (!record) return;

    const confirmed = confirm(
        `Delete this product?\n\n` +
        `Product: ${record.product}\n` +
        `Customer: ${record.customer}\n` +
        `Amount: ${record.amount}`
    );

    if (confirmed) {
        rows = rows.filter(r => r.id !== recordId);
        // Reset search and pagination
        currentFilter = "";
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) searchInput.value = "";
        currentPage = 1;
        renderTable();

        if (rows.length) {
            updatePanels(rows[0]);
        } else {
            clearPanels();
        }
    }
}

/* ── 9. HELPER: Escape HTML to prevent injection ── */
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

/* ── 10. INIT ── */
document.addEventListener('DOMContentLoaded', () => {
    renderTable();
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModals();
        });
    });
});

/* ── Real‑time Clock ── */
function updateDateTime() {
    const now = new Date();

    // Format time: hh:mm am/pm
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12; // convert to 12‑hour format

    // Format date: DD MMM YYYY
    const day = now.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();

    const dateString = `${day} ${month} ${year}`;
    const timeString = `${hours}.${minutes} ${ampm}`;

    const dateTimeString = `${timeString} ${dateString}`;

    const elem = document.getElementById('liveDateTime');
    if (elem) elem.textContent = dateTimeString;
}

// Update immediately and then every second
updateDateTime();
setInterval(updateDateTime, 1000);