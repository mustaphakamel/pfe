/* ============================================================
   OASIS Dashboard — app.js
   Sections:
     1. State
     2. Render — Table
     3. Render — Top Panels (Product / Image / Price)
     4. Image Upload Preview
     5. Modal Controls (open / close)
     6. CRUD — Add Record
     7. CRUD — Delete Record
     8. Search / Filter
     9. Pagination
    10. Init
   ============================================================ */


/* ── 1. State ── */
let rows       = [];   // array of product record objects
let nextId     = 1;    // auto-incrementing record ID
let page       = 1;    // current pagination page
let pendingImg = null; // base64 image waiting to be saved


/* ── 2. Render — Table ── */

/**
 * Renders the given data array into #tableBody.
 * Always highlights the first row (most recent).
 * @param {Array} data
 */
function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="table-empty">
          No records yet — click ADD to get started.
        </td>
      </tr>`;
    return;
  }

  data.forEach((record, index) => {
    const tr = document.createElement('tr');
    if (index === 0) tr.classList.add('row-highlight');
    tr.dataset.id = record.id;

    const isPaid = record.status === 'Paid';

    tr.innerHTML = `
      <td>${record.customer}</td>
      <td class="td-muted">${record.product}</td>
      <td class="td-muted">${record.date}</td>
      <td class="td-bold">${record.amount}</td>
      <td>
        <span class="badge ${isPaid ? 'badge-paid' : 'badge-pending'}">
          ${record.status}
        </span>
      </td>
    `;

    tbody.appendChild(tr);
  });
}


/* ── 3. Render — Top Panels ── */

/**
 * Updates the Product name panel, Image panel, and Price panel
 * to reflect the given record (always the most recent one).
 * @param {Object} record
 */
function updatePanels(record) {
  _updateProductPanel(record);
  _updateImagePanel(record);
  _updatePricePanel(record);
}

function _updateProductPanel(record) {
  const el = document.getElementById('productDisplay');
  el.className = 'product-name-display';
  el.innerHTML = `
    ${record.product}
    ${record.desc
      ? `<div class="product-desc-display">${record.desc}</div>`
      : ''}
  `;
}

function _updateImagePanel(record) {
  const panel = document.getElementById('imagePanel');

  if (record.image) {
    panel.innerHTML = `
      <img src="${record.image}"
           alt="${record.product}"
           style="max-height:150px; max-width:100%; object-fit:contain; border-radius:8px;"/>`;
  } else {
    panel.innerHTML = _imagePlaceholder(record.product);
  }
}

function _updatePricePanel(record) {
  const priceEl = document.getElementById('priceDisplay');
  priceEl.textContent = record.price
    ? `${Number(record.price).toLocaleString()} DA`
    : '— DA';

  // Flash animation to signal the update
  priceEl.classList.add('flash');
  setTimeout(() => priceEl.classList.remove('flash'), 600);

  document.getElementById('priceBadge').textContent = `+${rows.length}`;
}

/**
 * Resets all three panels to their empty/default state.
 */
function clearPanels() {
  const productDisplay = document.getElementById('productDisplay');
  productDisplay.className = 'product-empty';
  productDisplay.textContent = 'No product added yet — click ADD below.';

  document.getElementById('imagePanel').innerHTML = _imagePlaceholder('');

  document.getElementById('priceDisplay').textContent = '— DA';
  document.getElementById('priceBadge').textContent = '+0';
}

/**
 * Returns the HTML string for the empty image placeholder.
 * @param {string} label - optional label shown below the icon
 * @returns {string}
 */
function _imagePlaceholder(label) {
  return `
    <div class="img-placeholder">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
           stroke="#ccc" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9l4-4 4 4 4-4 4 4"/>
        <circle cx="8.5" cy="14.5" r="1.5"/>
      </svg>
      <p style="font-size:12px; color:#bbb;">
        ${label || 'No image'}
      </p>
    </div>`;
}


/* ── 4. Image Upload Preview ── */

/**
 * Reads the selected file as base64, stores it in pendingImg,
 * and re-renders the upload area with a thumbnail preview.
 * @param {HTMLInputElement} input
 */
function previewImage(input) {
  if (!input.files[0]) return;

  const fileName = input.files[0].name;
  const reader   = new FileReader();

  reader.onload = (e) => {
    pendingImg = e.target.result;

    const uploadArea = document.getElementById('uploadArea');
    uploadArea.classList.add('has-file');

    // Re-render the area keeping a new file input inside (stays clickable)
    uploadArea.innerHTML = `
      <input type="file" accept="image/*" onchange="previewImage(this)"/>
      <img src="${pendingImg}" class="upload-preview" alt="preview"/>
      <p>✓ ${fileName}</p>
    `;
  };

  reader.readAsDataURL(input.files[0]);
}

/**
 * Resets the upload area back to its default (empty) state.
 */
function resetUploadArea() {
  pendingImg = null;
  const uploadArea = document.getElementById('uploadArea');
  uploadArea.classList.remove('has-file');
  uploadArea.innerHTML = `
    <input type="file" accept="image/*" onchange="previewImage(this)"/>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
         stroke="#aaa" stroke-width="1.5">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    <p>Click or drag an image here</p>
  `;
}


/* ── 5. Modal Controls ── */

/** Opens the Add Product modal and resets all fields. */
function openAddModal() {
  // Clear form fields
  ['addName', 'addPrice', 'addCustomer', 'addAmount', 'addDesc'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('addStatus').value = 'Paid';

  // Auto-fill today's date
  const today = new Date();
  const dd    = String(today.getDate()).padStart(2, '0');
  const mm    = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy  = today.getFullYear();
  document.getElementById('addDate').value = `${dd}.${mm}.${yyyy}`;

  // Reset image upload
  resetUploadArea();

  document.getElementById('addModal').classList.add('open');
}

/** Opens the Delete Record modal and populates the dropdown. */
function openDeleteModal() {
  if (!rows.length) {
    alert('There are no records to delete.');
    return;
  }

  const select = document.getElementById('deleteSelect');
  select.innerHTML = rows
    .map((r) => `<option value="${r.id}">${r.customer} — ${r.product} — ${r.amount}</option>`)
    .join('');

  document.getElementById('deleteModal').classList.add('open');
}

/** Closes all open modals. */
function closeModals() {
  document.querySelectorAll('.overlay').forEach((o) => o.classList.remove('open'));
}


/* ── 6. CRUD — Add Record ── */

/**
 * Reads form values, validates required fields,
 * creates a new record, and updates the UI.
 */
function confirmAdd() {
  const product  = document.getElementById('addName').value.trim();
  const price    = document.getElementById('addPrice').value.trim();
  const customer = document.getElementById('addCustomer').value.trim();
  const date     = document.getElementById('addDate').value.trim();
  const amount   = document.getElementById('addAmount').value.trim();
  const status   = document.getElementById('addStatus').value;
  const desc     = document.getElementById('addDesc').value.trim();

  // Validation
  if (!product || !price || !customer || !date || !amount) {
    alert('Please fill in all required fields (marked with *).');
    return;
  }

  const newRecord = {
    id:       nextId++,
    product,
    price:    Number(price),
    customer,
    date,
    amount,
    status,
    desc,
    image:    pendingImg,
  };

  // Prepend so newest is always first (and highlighted)
  rows.unshift(newRecord);

  renderTable(rows);
  updatePanels(newRecord);
  closeModals();
}


/* ── 7. CRUD — Delete Record ── */

/**
 * Removes the selected record from state and re-renders.
 */
function confirmDelete() {
  const selectedId = Number(document.getElementById('deleteSelect').value);
  rows = rows.filter((r) => r.id !== selectedId);

  renderTable(rows);

  if (rows.length) {
    updatePanels(rows[0]);
  } else {
    clearPanels();
  }

  closeModals();
}


/* ── 8. Search / Filter ── */

/**
 * Filters the table rows by a search query against
 * customer name, product name, date, amount, and status.
 * @param {string} query
 */
function filterTable(query) {
  const q = query.toLowerCase();
  const filtered = rows.filter((r) =>
    [r.customer, r.product, r.date, r.amount, r.status]
      .join(' ')
      .toLowerCase()
      .includes(q)
  );
  renderTable(filtered);
}


/* ── 9. Pagination ── */

/**
 * Advances or retreats the current page counter.
 * @param {number} direction  +1 for next, -1 for previous
 */
function changePage(direction) {
  page = Math.max(1, page + direction);
  document.getElementById('pageInfo').textContent = `Page ${page}`;
}


/* ── 10. Init ── */

document.addEventListener('DOMContentLoaded', () => {
  // Render the (empty) initial state
  renderTable(rows);

  // Close any modal when clicking the dark backdrop
  document.querySelectorAll('.overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModals();
    });
  });
});

function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="table-empty">
          No records yet — click ADD to get started.
        </td>
      </tr>`;
    return;
  }

  data.forEach((record, index) => {
    const tr = document.createElement('tr');

    // First row selected by default
    if (index === 0) {
      tr.classList.add('row-selected');
      updatePanels(record);
    }

    tr.dataset.id = record.id;
    tr.style.cursor = 'pointer';

    const isPaid = record.status === 'Paid';

    tr.innerHTML = `
      <td>${record.customer}</td>
      <td class="td-muted">${record.product}</td>
      <td class="td-muted">${record.date}</td>
      <td class="td-bold">${record.amount}</td>
      <td>
        <span class="badge ${isPaid ? 'badge-paid' : 'badge-pending'}">
          ${record.status}
        </span>
      </td>
    `;

    // Click → remove green from all rows, add to this one, update panels
    tr.addEventListener('click', () => {
      document.querySelectorAll('#tableBody tr').forEach(r => r.classList.remove('row-selected'));
      tr.classList.add('row-selected');
      updatePanels(record);
    });

    tbody.appendChild(tr);
  });
}

// Add to State (section 1)
const ROWS_PER_PAGE = 5;
let currentPage = 1;

function renderPagination(totalRows) {
  const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));
  const container = document.getElementById('paginationNumbers');
  container.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = 'page-num-btn' + (i === currentPage ? ' page-num-active' : '');
    btn.addEventListener('click', () => {
      currentPage = i;
      renderTablePage();
    });
    container.appendChild(btn);
  }

  document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
}

function renderTablePage() {
  const start  = (currentPage - 1) * ROWS_PER_PAGE;
  const paged  = rows.slice(start, start + ROWS_PER_PAGE);
  renderTable(paged);
  renderPagination(rows.length);
}

function changePage(direction) {
  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  currentPage = Math.min(totalPages, Math.max(1, currentPage + direction));
  renderTablePage();
}

function openDeleteModal() {
  if (!rows.length) {
    alert('There are no records to delete.');
    return;
  }

  // Find the currently selected row
  const selectedTr = document.querySelector('#tableBody tr.row-selected');

  if (!selectedTr) {
    alert('Please click on a row in the table to select it first.');
    return;
  }

  const selectedId = Number(selectedTr.dataset.id);
  const record = rows.find(r => r.id === selectedId);

  // Ask for confirmation directly — no modal needed
  const confirmed = confirm(
    `Delete this record?\n\n` +
    `Customer : ${record.customer}\n` +
    `Product  : ${record.product}\n` +
    `Amount   : ${record.amount}`
  );

  if (confirmed) {
    rows = rows.filter(r => r.id !== selectedId);
    currentPage = 1;
    renderTablePage();
    rows.length ? updatePanels(rows[0]) : clearPanels();
  }
}
