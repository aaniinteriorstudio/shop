/* ============================================================
   CREATIVE CHAIRS — Catalog Logic
   No backend. Reads products.json, renders filterable grid,
   builds wa.me deep links with product/qty/color baked in.
   ============================================================ */

const CAT_COLORS = ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6', 'cat-7'];

const COLOR_HEX = {
  'TAN': '#C9A06A', 'BLACK': '#222220', 'BLUE': '#3B6FA0', 'GREY': '#9B968C',
  'GREY MESH': '#9B968C', 'BROWN': '#6B4A30', 'BEIGE': '#E3D3B8', 'WHITE': '#F4F1EA',
  'GREEN': '#4B6B4E', 'DARK BLUE': '#28406B', 'BLUE CUSHION': '#3B6FA0',
  'BLACK CUSHION': '#222220', 'BEIGE + BLUE': '#C9A06A', 'BEIGE + TAN': '#D8B98C',
  'DARK GREY + TAN': '#6B6660', 'TAN + BEIGE': '#C9A06A'
};

function colorHex(name) {
  const key = (name || '').toUpperCase().trim();
  if (COLOR_HEX[key]) return COLOR_HEX[key];
  // best-effort partial match
  for (const k in COLOR_HEX) {
    if (key.includes(k)) return COLOR_HEX[k];
  }
  return '#B0703F';
}

function chairSVG(tint) {
  return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 8h24l-2 22H22L20 8z" stroke="${tint}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M19 30h26l3 14H16l3-14z" stroke="${tint}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M16 44l-4 12M48 44l4 12" stroke="${tint}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M24 44v8M40 44v8" stroke="${tint}" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="20" cy="58" r="2" fill="${tint}"/>
    <circle cx="44" cy="58" r="2" fill="${tint}"/>
  </svg>`;
}

/* Renders real photo if it exists, SVG placeholder if not.
   onerror fires if the image 404s — swaps in the SVG silently. */
function renderImg(p, tint, isModal = false) {
  const src = p.images && p.images[0];
  if (!src) return chairSVG(tint);
  const fit = isModal
    ? 'width:100%;height:100%;object-fit:cover;border-radius:inherit;'
    : 'width:100%;height:100%;object-fit:cover;';
  const fallback = chairSVG(tint).replace(/`/g, "'");
  return `<img
    src="${src}"
    alt="${p.name}"
    style="${fit}"
    onerror="this.style.display='none';this.insertAdjacentHTML('afterend','${chairSVG(tint).replace(/"/g, '&quot;').replace(/'/g, '\\x27')}')"
  >`;
}

const WHATSAPP_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.81 14.07c-.24.68-1.41 1.32-1.95 1.4-.5.08-1.12.11-1.81-.11-.42-.13-.96-.31-1.65-.6-2.91-1.26-4.81-4.21-4.96-4.41-.14-.2-1.19-1.58-1.19-3.01 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.65.5.24.59.82 2.02.89 2.17.07.15.12.32.02.52-.1.2-.15.32-.3.49-.15.17-.31.38-.45.51-.15.15-.3.31-.13.61.17.3.76 1.26 1.64 2.04 1.13 1 2.08 1.32 2.38 1.47.3.15.48.13.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.66-.15.27.1 1.7.8 1.99.95.3.15.49.22.56.35.08.13.08.74-.16 1.42z"/></svg>`;

const PHONE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>`;
const INSTA_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>`;
const ARROW_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;

let CATALOG = null;
let state = {
  category: 'All',
  backType: 'All',
  query: '',
};

function formatINR(n) {
  if (n == null) return 'Enquire for price';
  return '\u20B9' + n.toLocaleString('en-IN');
}

function buildWaLink(product, opts) {
  const { qty, color } = opts;
  const isBulk = qty >= (product.bulkThreshold || 5);
  let msg;
  if (isBulk) {
    msg = `Hi, I'm interested in bulk pricing for the ${product.name} (Qty: ${qty}${color ? ', Color: ' + color : ''}). Please share wholesale pricing & availability.`;
  } else {
    msg = `Hi, I'm interested in the ${product.name} (Qty: ${qty}${color ? ', Color: ' + color : ''}). Please share pricing & availability.`;
  }
  return `https://wa.me/${CATALOG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
}

function categoryColor(catName) {
  const idx = CATALOG.categories.indexOf(catName);
  return CAT_COLORS[idx % CAT_COLORS.length];
}

function renderTabs() {
  const rail = document.getElementById('tabsScroll');
  const allBtn = `<button class="tab-btn ${state.category === 'All' ? 'active' : ''}" data-cat="All" style="--cat-color: var(--accent)">All Chairs</button>`;
  const tabs = CATALOG.categories.map((c) => {
    const color = categoryColor(c);
    return `<button class="tab-btn ${state.category === c ? 'active' : ''}" data-cat="${c}" style="--cat-color: var(--${color})">${c}</button>`;
  }).join('');
  rail.innerHTML = allBtn + tabs;
  rail.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.category = btn.dataset.cat;
      renderTabs();
      renderGrid();
    });
  });
}

function getFiltered() {
  return CATALOG.products.filter((p) => {
    if (state.category !== 'All' && p.category !== state.category) return false;
    if (state.backType !== 'All') {
      const bt = p.backType || '';
      if (!bt.includes(state.backType)) return false;
    }
    if (state.query) {
      const q = state.query.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function renderGrid() {
  const grid = document.getElementById('grid');
  const list = getFiltered();
  document.getElementById('resultCount').textContent = `${list.length} chair${list.length === 1 ? '' : 's'}`;

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">No chairs match these filters. Try clearing a filter or search a different term.</div>`;
    return;
  }

  grid.innerHTML = list.map((p) => {
    const color = categoryColor(p.category);
    const tint = `var(--${color})`;
    const dots = (p.colors || []).slice(0, 4).map((c) => `<span class="color-dot" style="background:${colorHex(c)}" title="${c}"></span>`).join('');
    return `
    <div class="card" data-id="${p.id}" style="--card-tint: color-mix(in srgb, ${tint} 12%, var(--bg-alt));">
      <div class="card-media">
        <span class="card-cat-eyebrow">${p.category}</span>
        ${renderImg(p, tint)}
        <div class="swing-tag"><span class="tag-prefix">FROM</span>${formatINR(p.price)}</div>
      </div>
      <div class="card-body">
        <h3 class="card-name">${p.name}</h3>
        <div class="card-meta">
          ${p.backType ? `<span class="meta-tag">${p.backType}</span>` : ''}
          ${dots ? `<div class="color-dots">${dots}</div>` : ''}
        </div>
        <div class="card-cta">View details ${ARROW_ICON}</div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => openModal(card.dataset.id));
  });
}

let modalState = { qty: 1, color: null, product: null };

function openModal(id) {
  const p = CATALOG.products.find((x) => x.id === id);
  if (!p) return;
  modalState = { qty: 1, color: (p.colors && p.colors[0]) || null, product: p };
  renderModal();
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function renderModal() {
  const p = modalState.product;
  const color = categoryColor(p.category);
  const tint = `var(--${color})`;
  const overlay = document.getElementById('modalOverlay');

  const swatches = (p.colors || []).map((c) => `
    <button class="swatch ${modalState.color === c ? 'selected' : ''}" data-color="${c}">
      <span class="dot" style="background:${colorHex(c)}"></span>${c}
    </button>`).join('');

  const variantRows = (p.priceVariants || []).map((v) => `
    <div class="price-variant-row"><span>${v.label}</span><span>${formatINR(v.price)}</span></div>
  `).join('');

  const specs = (p.specs && p.specs.length)
    ? `<div class="field-block"><div class="field-label">Specifications</div><ul class="specs-list">${p.specs.map((s) => `<li>${s}</li>`).join('')}</ul></div>`
    : '';

  const isBulk = modalState.qty >= (p.bulkThreshold || 5);
  const ctaLabel = isBulk ? 'Get Bulk Pricing on WhatsApp' : 'Order on WhatsApp';

  overlay.querySelector('.modal-sheet').innerHTML = `
    <button class="modal-close" id="modalCloseBtn" aria-label="Close">&times;</button>
    <div class="modal-grid">
      <div class="modal-media" style="--modal-tint: color-mix(in srgb, ${tint} 14%, var(--bg-alt));">
        ${renderImg(p, tint, true)}
      </div>
      <div class="modal-info">
        <div class="modal-eyebrow">${p.category}</div>
        <h2>${p.name}</h2>
        <div class="modal-backtype">${p.backType ? p.backType : ''}${p.description ? (p.backType ? ' \u2014 ' : '') + p.description : ''}</div>

        <div class="modal-price-block">
          <div class="modal-price">${formatINR(p.price)}</div>
          <div class="modal-price-note">${p.priceNote || ''}</div>
          ${variantRows ? `<div class="price-variants">${variantRows}</div>` : ''}
        </div>

        ${p.colors && p.colors.length ? `<div class="field-block"><div class="field-label">Color</div><div class="swatches">${swatches}</div></div>` : ''}

        <div class="field-block">
          <div class="field-label">Quantity</div>
          <div class="qty-row">
            <div class="qty-stepper">
              <button id="qtyMinus" aria-label="Decrease quantity">&minus;</button>
              <span class="qty-val" id="qtyVal">${modalState.qty}</span>
              <button id="qtyPlus" aria-label="Increase quantity">+</button>
            </div>
            <span class="qty-note ${isBulk ? 'bulk' : ''}" id="qtyNote">${isBulk ? `Bulk pricing — we'll share wholesale rates` : `Showing per-unit indicative price`}</span>
          </div>
        </div>

        ${specs}

        <a class="whatsapp-cta" id="modalWaBtn" href="#" target="_blank" rel="noopener">${WHATSAPP_ICON}<span id="ctaLabel">${ctaLabel}</span></a>
      </div>
    </div>
  `;

  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  overlay.querySelectorAll('.swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      modalState.color = btn.dataset.color;
      renderModal();
    });
  });
  const minus = document.getElementById('qtyMinus');
  const plus = document.getElementById('qtyPlus');
  if (minus) minus.addEventListener('click', () => { modalState.qty = Math.max(1, modalState.qty - 1); renderModal(); });
  if (plus) plus.addEventListener('click', () => { modalState.qty = modalState.qty + 1; renderModal(); });

  const waBtn = document.getElementById('modalWaBtn');
  waBtn.href = buildWaLink(p, { qty: modalState.qty, color: modalState.color });
}

function initFilters() {
  document.querySelectorAll('.backtype-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.backType = chip.dataset.bt;
      document.querySelectorAll('.backtype-chip').forEach((c) => c.classList.toggle('active', c === chip));
      renderGrid();
    });
  });
  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.query = e.target.value;
    renderGrid();
  });
}

function initModalChrome() {
  const overlay = document.getElementById('modalOverlay');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function renderFooterAndHeader() {
  document.querySelectorAll('[data-wa-link]').forEach((el) => {
    const msg = `Hi, I'd like to enquire about your chair catalog.`;
    el.href = `https://wa.me/${CATALOG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  });
  document.querySelectorAll('[data-business-name]').forEach((el) => { el.textContent = CATALOG.businessName; });
}

async function init() {
  try {
    const res = await fetch('products.json');
    CATALOG = await res.json();
  } catch (err) {
    document.getElementById('grid').innerHTML = `<div class="empty-state" style="grid-column:1/-1;">Couldn't load the catalog. Please refresh.</div>`;
    return;
  }
  document.getElementById('heroCount').textContent = CATALOG.products.length;
  document.getElementById('heroCatCount').textContent = CATALOG.categories.length;
  renderFooterAndHeader();
  renderTabs();
  initFilters();
  initModalChrome();
  renderGrid();
}

document.addEventListener('DOMContentLoaded', init);
