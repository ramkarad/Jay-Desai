/* ============================================================================
   TAITVA PURE BY NATURE — STOREFRONT JAVASCRIPT
   Centralized Config + IndexedDB Catalog + Cart + Coupons + Checkout +
   UPI / COD + WhatsApp Order + Reorder + Reviews + Product Detail Modal
   ============================================================================ */

const CART_KEY = "freshsip_cart";
const ORDER_HISTORY_KEY = "taitva_order_history_v1";
const REVIEWS_KEY = "taitva_reviews_v1";

const DB_NAME = "zivago_database";
const DB_VERSION = 1;
const STORE_NAME = "products";

function getConfig() {
  return window.TAITVA_CONFIG || {
    brand: { name: "Taitva Pure by Nature", shortName: "Taitva", foundedYear: 2026 },
    announcement: { enabled: true, text: "Freshly made juices · Order directly on", linkText: "WhatsApp", linkHref: "https://wa.me/919724307705" },
    contact: { whatsappNumber: "919724307705", displayPhone: "+91 97243 07705", email: "zivagoworld@gmail.com", instagramUrl: "https://www.instagram.com/zivago.world", address: "Rajkot, Gujarat, India" },
    payment: { upiId: "tusharsanandiya@okicici", payeeName: "Taitva Pure by Nature", upiNote: "Taitva Juice Order", codAvailable: true },
    shipping: { estimatedDelivery: "3–6 business days across India" },
    products: [],
    faqs: []
  };
}

// =============================================
// 1. SAFE HELPERS & ESCAPING
// =============================================

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function getImagePath(image) {
  if (!image) return "/T500.jpg";
  const str = String(image).trim();
  if (
    str.startsWith("https://") ||
    str.startsWith("http://") ||
    str.startsWith("data:image/") ||
    str.startsWith("blob:")
  ) {
    return str;
  }
  const cleaned = str.replace(/^\.\/+/, "").replace(/^\/+/, "");
  return "/" + cleaned;
}

function imageError(img) {
  img.onerror = null;
  const fallback = img.closest(".product-image-wrap, .cart-row, .pdp-media");
  if (fallback) {
    fallback.classList.add("image-fallback-active");
  }
  img.alt = img.alt || "Taitva Pure by Nature product";
  img.style.opacity = "0";
}

function formatINR(amount) {
  const num = Number(amount) || 0;
  return "₹" + (Number.isInteger(num) ? num.toLocaleString("en-IN") : num.toFixed(2));
}

function safeHref(url) {
  const str = String(url || "").trim();
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(str)) return str;
  return "#";
}

// =============================================
// 2. INDEXEDDB PRODUCT CATALOG
// =============================================

function openProductDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB is not supported."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = function () {
      resolve(request.result);
    };
    request.onerror = function () {
      reject(request.error);
    };
  });
}

async function initializeProducts() {
  const cfgProducts = getConfig().products || [];
  if (!window.indexedDB) return true;

  const db = await openProductDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const countReq = store.count();

    countReq.onsuccess = function () {
      if (countReq.result === 0) {
        cfgProducts.forEach((product) => {
          store.put({
            ...product,
            image: getImagePath(product.image)
          });
        });
      }
    };

    tx.oncomplete = function () {
      db.close();
      resolve(true);
    };
    tx.onerror = function () {
      db.close();
      reject(tx.error);
    };
    tx.onabort = function () {
      db.close();
      reject(tx.error);
    };
  });
}

async function getProducts() {
  const cfgProducts = getConfig().products || [];
  try {
    const db = await openProductDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = function () {
        const rows = Array.isArray(req.result) && req.result.length > 0 ? req.result : cfgProducts;
        const cleanHimalayan = (val) => (typeof val === "string" ? val.replace(/\bHimalayan\s+/gi, "") : val);
        const normalized = rows.map((p) => {
          const baseMatch = cfgProducts.find((b) => String(b.id) === String(p.id)) || {};
          const merged = {
            ...baseMatch,
            ...p,
            inStock: p.inStock !== false,
            image: getImagePath(p.image)
          };
          merged.name = cleanHimalayan(merged.name);
          merged.shortDescription = cleanHimalayan(merged.shortDescription);
          merged.description = cleanHimalayan(merged.description);
          merged.ingredients = cleanHimalayan(merged.ingredients);
          if (Array.isArray(merged.highlights)) {
            merged.highlights = merged.highlights.map((h) => cleanHimalayan(h));
          }
          return merged;
        });
        db.close();
        resolve(normalized);
      };
      req.onerror = function () {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return cfgProducts.map((p) => ({
      ...p,
      inStock: p.inStock !== false,
      image: getImagePath(p.image)
    }));
  }
}

// =============================================
// 3. SHARED HEADER, ANNOUNCEMENT & FOOTER HYDRATION
// =============================================

function toggleMenu() {
  const navbar = document.getElementById("navbar");
  const btn = document.querySelector(".menu-btn");
  if (navbar) {
    const open = navbar.classList.toggle("show");
    if (btn) btn.setAttribute("aria-expanded", String(open));
  }
}

function hydrateSiteChrome() {
  const cfg = getConfig();

  // Announcement bar
  const bar = document.getElementById("announcement-bar");
  if (bar && cfg.announcement) {
    if (!cfg.announcement.enabled) {
      bar.hidden = true;
    } else {
      bar.hidden = false;
      const waHref = `https://wa.me/${encodeURIComponent(cfg.contact.whatsappNumber)}`;
      bar.innerHTML = `
        <span>${escapeHTML(cfg.announcement.text)}</span>
        <a href="${waHref}" target="_blank" rel="noopener noreferrer">${escapeHTML(cfg.announcement.linkText || "WhatsApp")}</a>
      `;
    }
  }

  // Contact links across page
  document.querySelectorAll("[data-config-email]").forEach((el) => {
    el.href = `mailto:${cfg.contact.email}`;
    el.textContent = cfg.contact.email;
  });

  document.querySelectorAll("[data-config-phone]").forEach((el) => {
    el.textContent = cfg.contact.displayPhone;
    if (el.tagName === "A") {
      el.href = `tel:${cfg.contact.displayPhone.replace(/\s+/g, "")}`;
    }
  });

  document.querySelectorAll("[data-config-whatsapp]").forEach((el) => {
    el.href = `https://wa.me/${encodeURIComponent(cfg.contact.whatsappNumber)}`;
  });

  document.querySelectorAll("[data-config-instagram]").forEach((el) => {
    el.href = safeHref(cfg.contact.instagramUrl);
  });

  document.querySelectorAll("[data-config-address]").forEach((el) => {
    el.textContent = cfg.contact.address;
  });

  document.querySelectorAll("[data-config-hours]").forEach((el) => {
    el.textContent = cfg.contact.supportHours;
  });

  document.querySelectorAll("[data-config-year]").forEach((el) => {
    el.textContent = String(cfg.brand.foundedYear || 2026);
  });

  document.querySelectorAll("[data-config-brand]").forEach((el) => {
    el.textContent = cfg.brand.name;
  });

  // Active nav accessibility attribute
  document.querySelectorAll("#navbar a.active").forEach((el) => {
    el.setAttribute("aria-current", "page");
  });

  // Packaging certifications & advisory note
  const certs = Array.isArray(cfg.certifications) ? cfg.certifications : [];
  ["packaging-seals-grid", "about-seals-grid"].forEach((gridId) => {
    const grid = document.getElementById(gridId);
    if (grid && certs.length) {
      grid.innerHTML = certs
        .map(
          (c) => `
          <div class="seal-item">
            <strong>${escapeHTML(c.label)}</strong>
            <span>${escapeHTML(c.detail)}</span>
          </div>
        `
        )
        .join("");
    }
  });
}

// =============================================
// 4. CART STORAGE & COUNT
// =============================================

function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = String(count);
  });
}

// =============================================
// 5. UNIFIED CART SUCCESS TOAST (WITH COUNT)
// =============================================

let cartToastTimer;

function getCartItemCount() {
  return getCart().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

function showCartToast(productName, productImage) {
  let popup = document.getElementById("cart-success-popup");

  if (!popup) {
    popup = document.createElement("div");
    popup.id = "cart-success-popup";
    popup.className = "cart-success-popup";
    popup.setAttribute("role", "status");
    popup.setAttribute("aria-live", "polite");
    popup.innerHTML = `
      <div class="popup-thumb">
        <img id="popup-img" src="" alt="" referrerpolicy="no-referrer">
        <span class="popup-check" aria-hidden="true">✓</span>
      </div>
      <div class="popup-body">
        <div class="popup-title">Added to cart</div>
        <div class="popup-text" id="popup-message"></div>
        <div class="popup-count" id="popup-count"></div>
      </div>
      <div class="popup-actions">
        <button type="button" class="popup-close" aria-label="Close notification" onclick="closeCartToast()">×</button>
        <a href="/cart.html" class="popup-view-cart">
          View Cart <span class="popup-badge" id="popup-badge">0</span>
        </a>
      </div>
    `;
    document.body.appendChild(popup);
  }

  const count = getCartItemCount();
  const shortName = String(productName || "Item").replace(/^Taitva\s+/i, "");

  const msg = popup.querySelector("#popup-message");
  if (msg) msg.textContent = shortName;

  const countEl = popup.querySelector("#popup-count");
  if (countEl) {
    countEl.innerHTML = `<strong>${count}</strong> ${count === 1 ? "item" : "items"} in your cart`;
  }

  const badge = popup.querySelector("#popup-badge");
  if (badge) badge.textContent = String(count);

  const img = popup.querySelector("#popup-img");
  const thumb = popup.querySelector(".popup-thumb");
  if (img && thumb) {
    if (productImage) {
      img.src = getImagePath(productImage);
      img.alt = shortName;
      img.style.display = "";
      img.onerror = () => { img.style.display = "none"; };
    } else {
      img.style.display = "none";
    }
  }

  clearTimeout(cartToastTimer);
  popup.classList.remove("active");
  void popup.offsetWidth;
  popup.classList.add("active");

  cartToastTimer = setTimeout(closeCartToast, 3000);
}

function closeCartToast() {
  const popup = document.getElementById("cart-success-popup");
  if (popup) popup.classList.remove("active");
  clearTimeout(cartToastTimer);
}

// =============================================
// 6. PRODUCT CARDS, DETAIL MODAL & FILTERING
// =============================================

function getProductPriceHTML(product) {
  const price = Number(product.price) || 0;
  const originalPrice = Number(product.originalPrice) || 0;
  const hasDiscount = originalPrice > price && price > 0;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return `
    <div class="product-price">
      <span class="price tabular-nums">${formatINR(price)}</span>
      ${hasDiscount ? `<span class="original-price tabular-nums">${formatINR(originalPrice)}</span>` : ""}
      ${hasDiscount ? `<span class="price-save">Save ${discountPercent}%</span>` : ""}
    </div>
  `;
}

function getServingMeta(product) {
  if (!product.servings) return "";
  const match = String(product.servings).match(/(\d+)/);
  const count = match ? Number(match[1]) : 0;
  const price = Number(product.price) || 0;
  if (count > 0 && price > 0) {
    const perServing = Math.round((price / count) * 10) / 10;
    return `${product.servings} · ~₹${perServing}/serving`;
  }
  return product.servings;
}

function productCard(product) {
  const image = escapeHTML(getImagePath(product.image));
  const name = escapeHTML(product.name);
  const desc = escapeHTML(product.shortDescription || product.description || "");
  const id = escapeHTML(product.id);
  const category = escapeHTML(product.category || "Natural Juice");
  const volume = escapeHTML(product.volume || "");
  const inStock = product.inStock !== false;
  const metaParts = [category, volume, inStock ? "In Stock" : "Out of Stock"].filter(Boolean);

  return `
    <article class="product-card" data-product-id="${id}">
      <div class="product-image-wrap" onclick="openProductDetail('${id}')" role="button" tabindex="0" aria-label="View details for ${name}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openProductDetail('${id}');}">
        <img
          src="${image}"
          alt="${name}"
          loading="lazy"
          referrerpolicy="no-referrer"
          onerror="imageError(this)">
        <div class="image-fallback-label" aria-hidden="true">${escapeHTML(product.shortName || product.name)}</div>
      </div>
      <div class="product-info">
        <div class="product-meta">${metaParts.map(escapeHTML).join(" · ")}</div>
        <h3><button type="button" class="product-title-btn" onclick="openProductDetail('${id}')">${name}</button></h3>
        <p>${desc}</p>
        <div class="product-bottom">
          ${getProductPriceHTML(product)}
          <div class="product-actions">
            <button type="button" class="btn-outline-sm" onclick="openProductDetail('${id}')">Details</button>
            <button
              type="button"
              class="add-btn"
              ${inStock ? "" : "disabled"}
              onclick="addToCart('${id}', 1, this)">
              ${inStock ? "Add to Cart" : "Out of Stock"}
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

let cachedProducts = [];
let activeCategoryFilter = "all";
let activeSearchQuery = "";

async function displayProducts() {
  try {
    const products = await getProducts();
    cachedProducts = products;

    const featured = document.getElementById("featured-products");
    const all = document.getElementById("all-products");
    const empty = document.getElementById("empty-products");

    if (featured) {
      featured.innerHTML = products.slice(0, 3).map(productCard).join("");
    }

    if (all) {
      renderFilteredProducts();
    }

    if (empty && all && products.length === 0) {
      empty.hidden = false;
    }

    const revProductSelect = document.getElementById("rev-product");
    if (revProductSelect && products.length > 0) {
      revProductSelect.innerHTML = products
        .map((p) => `<option value="${escapeHTML(p.name)}">${escapeHTML(p.name)}</option>`)
        .join("");
    }

    injectProductSchema(products);
  } catch (error) {
    console.error("Display products error:", error);
  }
}

function renderFilteredProducts() {
  const all = document.getElementById("all-products");
  const empty = document.getElementById("empty-products");
  if (!all) return;

  const query = activeSearchQuery.trim().toLowerCase();
  const filtered = cachedProducts.filter((p) => {
    const matchesCat =
      activeCategoryFilter === "all" ||
      (p.category || "").toLowerCase() === activeCategoryFilter.toLowerCase();
    const haystack = `${p.name} ${p.description} ${p.category} ${p.volume}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesCat && matchesQuery;
  });

  all.innerHTML = filtered.map(productCard).join("");
  if (empty) {
    empty.hidden = filtered.length !== 0;
  }
}

function setProductCategoryFilter(category, btnEl) {
  activeCategoryFilter = category || "all";
  document.querySelectorAll(".filter-tab").forEach((b) => b.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");
  renderFilteredProducts();
}

function handleProductSearch(value) {
  activeSearchQuery = value || "";
  renderFilteredProducts();
}

// Product Detail Modal
async function openProductDetail(id) {
  const products = cachedProducts.length ? cachedProducts : await getProducts();
  const product = products.find((p) => String(p.id) === String(id));
  if (!product) return;

  let modal = document.getElementById("pdp-modal-overlay");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "pdp-modal-overlay";
    modal.className = "pdp-overlay";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeProductDetail();
    });
    document.body.appendChild(modal);
  }

  const inStock = product.inStock !== false;
  const highlights = Array.isArray(product.highlights) ? product.highlights : [];
  const cfg = getConfig();

  const related = products.filter((p) => String(p.id) !== String(product.id) && p.inStock !== false).slice(0, 2);

  modal.innerHTML = `
    <div class="pdp-modal">
      <button type="button" class="pdp-close" aria-label="Close product details" onclick="closeProductDetail()">×</button>
      <div class="pdp-grid">
        <div class="pdp-media">
          <img src="${escapeHTML(getImagePath(product.image))}" alt="${escapeHTML(product.name)}" referrerpolicy="no-referrer" onerror="imageError(this)">
        </div>
        <div class="pdp-body">
          <div class="product-meta">${escapeHTML(product.category || "Pure Juice")} · ${escapeHTML(product.volume || "")} · ${inStock ? escapeHTML(product.stockNote || "In Stock") : "Out of Stock"}</div>
          <h2>${escapeHTML(product.name)}</h2>
          ${getProductPriceHTML(product)}
          <p class="pdp-desc">${escapeHTML(product.description)}</p>

          ${highlights.length ? `
            <ul class="pdp-highlights">
              ${highlights.map((h) => `<li>${escapeHTML(h)}</li>`).join("")}
            </ul>
          ` : ""}

          <div class="pdp-specs">
            <div><strong>Ingredients</strong><span>${escapeHTML(product.ingredients || "Sea Buckthorn Berry Juice")}</span></div>
            ${product.servings ? `<div><strong>Servings</strong><span>${escapeHTML(product.servings)}</span></div>` : ""}
            <div><strong>Recommended Usage</strong><span>${escapeHTML(product.usage || "15 ml diluted in 150–200 ml water once daily.")}</span></div>
            <div><strong>Storage</strong><span>${escapeHTML(product.storage || "Store in a cool, dry place. Refrigerate after opening.")}</span></div>
            <div><strong>Standards</strong><span>100% Vegetarian · Made in India · No Added Preservatives</span></div>
            <div><strong>Delivery</strong><span>${escapeHTML(cfg.shipping?.estimatedDelivery || "3–6 business days across India")}</span></div>
          </div>

          <div class="pdp-cta-row">
            <div class="pdp-qty">
              <button type="button" aria-label="Decrease quantity" onclick="stepModalQty(-1)">−</button>
              <span id="pdp-qty-val">1</span>
              <button type="button" aria-label="Increase quantity" onclick="stepModalQty(1)">+</button>
            </div>
            <button type="button" class="btn pdp-add-btn" ${inStock ? "" : "disabled"} onclick="addModalQtyToCart('${escapeHTML(product.id)}')">
              ${inStock ? "Add to Cart" : "Currently Out of Stock"}
            </button>
          </div>

          ${inStock ? `
            <button type="button" class="btn-secondary pdp-whatsapp-btn" onclick="quickOrderProductWhatsApp('${escapeHTML(product.id)}')">
              Quick Order on WhatsApp →
            </button>
          ` : ""}

          ${related.length ? `
            <div class="pdp-related">
              <h4>Other Pack Options</h4>
              ${related.map((r) => `
                <button type="button" class="pdp-related-btn" onclick="openProductDetail('${escapeHTML(r.id)}')">
                  <span>${escapeHTML(r.name)}</span>
                  <span class="tabular-nums" style="color:var(--green);">${formatINR(r.price)} →</span>
                </button>
              `).join("")}
            </div>
          ` : ""}
        </div>
      </div>
    </div>
  `;

  modal.classList.add("show");
  document.body.style.overflow = "hidden";
}

async function quickOrderProductWhatsApp(id) {
  const products = cachedProducts.length ? cachedProducts : await getProducts();
  const product = products.find((p) => String(p.id) === String(id));
  if (!product) return;
  const qty = Math.max(1, Number(document.getElementById("pdp-qty-val")?.textContent || 1) || 1);
  const cfg = getConfig();
  const total = Number(product.price) * qty;
  const msg = `Hello ${cfg.brand.shortName}! I want to order:\n\n${product.name} x ${qty} = ₹${total.toFixed(2)}\n\nPlease confirm my order.`;
  const url = `https://wa.me/${encodeURIComponent(cfg.contact.whatsappNumber)}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function closeProductDetail() {
  const modal = document.getElementById("pdp-modal-overlay");
  if (modal) modal.classList.remove("show");
  document.body.style.overflow = "";
}

function stepModalQty(delta) {
  const el = document.getElementById("pdp-qty-val");
  if (!el) return;
  const next = Math.max(1, Math.min(20, (Number(el.textContent) || 1) + delta));
  el.textContent = String(next);
}

async function addModalQtyToCart(id) {
  const el = document.getElementById("pdp-qty-val");
  const qty = Math.max(1, Number(el ? el.textContent : 1) || 1);
  await addToCart(id, qty);
  closeProductDetail();
}

// =============================================
// 7. ADD / UPDATE CART
// =============================================

async function addToCart(id, qtyToAdd = 1, triggerBtn = null) {
  try {
    const products = await getProducts();
    const product = products.find((item) => String(item.id) === String(id));
    if (!product) return;
    if (product.inStock === false) return;

    const cart = getCart();
    const existing = cart.find((item) => String(item.id) === String(id));
    const qty = Math.max(1, Number(qtyToAdd) || 1);

    if (existing) {
      existing.quantity = (Number(existing.quantity) || 0) + qty;
    } else {
      cart.push({ id: product.id, quantity: qty });
    }

    saveCart(cart);
    showCartToast(product.name, product.image);

    if (triggerBtn && triggerBtn.tagName === "BUTTON") {
      const originalText = triggerBtn.dataset.origLabel || triggerBtn.textContent.trim();
      triggerBtn.dataset.origLabel = originalText;
      triggerBtn.textContent = "✓ Added";
      triggerBtn.classList.add("added-feedback");
      clearTimeout(triggerBtn._addedTimer);
      triggerBtn._addedTimer = setTimeout(() => {
        triggerBtn.textContent = originalText;
        triggerBtn.classList.remove("added-feedback");
      }, 1200);
    }

    if (document.getElementById("cart-items")) {
      await displayCart();
    }
  } catch (error) {
    console.error("Add to cart error:", error);
  }
}

function changeQuantity(id, change) {
  const cart = getCart();
  const item = cart.find((p) => String(p.id) === String(id));
  if (!item) return;

  item.quantity = (Number(item.quantity) || 0) + change;
  const updated = cart.filter((p) => p.quantity > 0);
  saveCart(updated);
  displayCart();
}

function removeFromCart(id) {
  const updated = getCart().filter((item) => String(item.id) !== String(id));
  saveCart(updated);
  displayCart();
}

// =============================================
// 8. CART PRICING CALCULATOR
// =============================================

async function calculateCartBreakdown() {
  const cart = getCart();
  const products = await getProducts();

  let subtotal = 0;
  let mrpTotal = 0;
  const lineItems = [];

  cart.forEach((item) => {
    const product = products.find((p) => String(p.id) === String(item.id));
    if (!product) return;
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const price = Number(product.price) || 0;
    const mrp = Math.max(price, Number(product.originalPrice) || price);
    const lineTotal = price * quantity;
    subtotal += lineTotal;
    mrpTotal += mrp * quantity;
    lineItems.push({ product, quantity, price, mrp, lineTotal });
  });

  return {
    lineItems,
    subtotal,
    mrpTotal,
    total: subtotal
  };
}

async function calculateCartTotal() {
  const breakdown = await calculateCartBreakdown();
  return breakdown.total;
}

// =============================================
// 9. CART PAGE & ORDER HISTORY
// =============================================

function getOrderHistory() {
  try {
    const raw = localStorage.getItem(ORDER_HISTORY_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOrderToHistory(orderRecord) {
  const history = getOrderHistory();
  history.unshift(orderRecord);
  localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
}

async function displayCart() {
  const container = document.getElementById("cart-items");
  const summary = document.getElementById("cart-summary");
  if (!container || !summary) return;

  try {
    const products = await getProducts();
    let cart = getCart();
    cart = cart.filter((item) => products.some((product) => String(product.id) === String(item.id)));
    saveCart(cart);

    if (cart.length === 0) {
      container.innerHTML = `
        <div class="empty-cart">
          <h2>Your Cart is Empty</h2>
          <p>Explore our Sea Buckthorn Juices and start your daily wellness routine.</p>
          <a href="/products.html" class="btn">Shop Fresh Juices</a>
        </div>
      `;
      summary.hidden = true;
      return;
    }

    summary.hidden = false;
    const breakdown = await calculateCartBreakdown();

    container.innerHTML = breakdown.lineItems
      .map(({ product, quantity, price, mrp, lineTotal }) => {
        const id = escapeHTML(product.id);
        const hasDiscount = mrp > price;
        return `
          <div class="cart-row">
            <img
              src="${escapeHTML(getImagePath(product.image))}"
              alt="${escapeHTML(product.name)}"
              style="cursor:pointer;"
              onclick="openProductDetail('${id}')"
              referrerpolicy="no-referrer"
              onerror="imageError(this)">
            <div class="cart-details">
              <h3><button type="button" class="product-title-btn" onclick="openProductDetail('${id}')">${escapeHTML(product.name)}</button></h3>
              <p class="cart-price tabular-nums">
                ${formatINR(price)}
                ${hasDiscount ? `<span class="original-price">${formatINR(mrp)}</span>` : ""}
              </p>
              <div class="quantity-control">
                <button type="button" aria-label="Decrease quantity" onclick="changeQuantity('${id}', -1)">−</button>
                <span class="tabular-nums">${quantity}</span>
                <button type="button" aria-label="Increase quantity" onclick="changeQuantity('${id}', 1)">+</button>
              </div>
              <button type="button" class="remove-btn" onclick="removeFromCart('${id}')">Remove</button>
            </div>
            <strong class="cart-line-total tabular-nums">${formatINR(lineTotal)}</strong>
          </div>
        `;
      })
      .join("");

    const totalQty = breakdown.lineItems.reduce((sum, item) => sum + item.quantity, 0);
    const countEl = document.getElementById("summary-item-count");
    if (countEl) {
      countEl.textContent = `${totalQty} ${totalQty === 1 ? "item" : "items"}`;
    }

    const summaryItemsEl = document.getElementById("summary-items-list");
    if (summaryItemsEl) {
      summaryItemsEl.innerHTML = breakdown.lineItems
        .map(({ product, quantity, lineTotal }) => {
          const label = escapeHTML(product.shortName || product.name);
          return `
            <div class="summary-item-row">
              <span class="summary-item-name">${label} × ${quantity}</span>
              <span class="tabular-nums">₹${Number(lineTotal).toFixed(2)}</span>
            </div>
          `;
        })
        .join("");
    }

    const savings = Math.max(0, breakdown.mrpTotal - breakdown.subtotal);
    const mrpRow = document.getElementById("summary-mrp-row");
    const mrpEl = document.getElementById("summary-mrp");
    if (mrpRow && mrpEl) {
      mrpRow.hidden = breakdown.mrpTotal <= breakdown.subtotal;
      mrpEl.textContent = "₹" + breakdown.mrpTotal.toFixed(2);
    }

    const discountRow = document.getElementById("summary-discount-row");
    const discountEl = document.getElementById("summary-discount");
    if (discountRow && discountEl) {
      discountRow.hidden = savings <= 0;
      discountEl.textContent = "−₹" + savings.toFixed(2);
    }

    const savingsBanner = document.getElementById("summary-savings-banner");
    const savingsAmt = document.getElementById("summary-savings-amt");
    if (savingsBanner && savingsAmt) {
      savingsBanner.hidden = savings <= 0;
      savingsAmt.textContent = "₹" + savings.toFixed(2);
    }

    const totalEl = document.getElementById("cart-total");
    if (totalEl) {
      totalEl.textContent = "₹" + breakdown.subtotal.toFixed(2);
    }
  } catch (error) {
    console.error("Display cart error:", error);
  }
}

// =============================================
// 10. CHECKOUT VALIDATION, UPI, COD & WHATSAPP ORDER
// =============================================

let lastValidatedOrder = null;

function validateCheckoutForm() {
  const name = (document.getElementById("cust-name")?.value || "").trim();
  const phone = (document.getElementById("cust-phone")?.value || "").replace(/\D/g, "");
  const address = (document.getElementById("cust-address")?.value || "").trim();
  const city = (document.getElementById("cust-city")?.value || "").trim();
  const pincode = (document.getElementById("cust-pincode")?.value || "").replace(/\D/g, "");
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || "UPI";
  const whatsappConsent = Boolean(document.getElementById("whatsapp-consent")?.checked);
  const errEl = document.getElementById("checkout-error");

  const showError = (msg) => {
    if (errEl) {
      errEl.textContent = msg;
      errEl.hidden = false;
    }
    return null;
  };

  if (errEl) {
    errEl.textContent = "";
    errEl.hidden = true;
  }

  if (name.length < 2) return showError("Please enter your full name (at least 2 characters).");
  if (!/^[6-9]\d{9}$/.test(phone)) return showError("Please enter a valid 10-digit Indian mobile number.");
  if (address.length < 8) return showError("Please enter your complete delivery address (house/flat, street, landmark).");
  if (city.length < 2) return showError("Please enter your city and state.");
  if (!/^\d{6}$/.test(pincode)) return showError("Please enter a valid 6-digit Indian PIN code.");

  return {
    name,
    phone,
    address,
    city,
    pincode,
    paymentMethod,
    whatsappConsent
  };
}

function generateOrderId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TV-${y}${m}${d}-${rand}`;
}

async function handleCheckoutSubmit(event) {
  if (event) event.preventDefault();

  const breakdown = await calculateCartBreakdown();
  if (breakdown.lineItems.length === 0) {
    const errEl = document.getElementById("checkout-error");
    if (errEl) {
      errEl.textContent = "Your cart is empty. Please add a product first.";
      errEl.hidden = false;
    }
    return;
  }

  const customer = validateCheckoutForm();
  if (!customer) return;

  const orderId = generateOrderId();
  const orderRecord = {
    orderId,
    createdAt: new Date().toISOString(),
    customer,
    items: breakdown.lineItems.map(({ product, quantity, price, lineTotal }) => ({
      id: product.id,
      name: product.name,
      quantity,
      price,
      lineTotal
    })),
    subtotal: breakdown.subtotal,
    total: breakdown.total
  };

  lastValidatedOrder = orderRecord;
  saveOrderToHistory(orderRecord);
  renderOrderConfirmation(orderRecord);

  if (customer.paymentMethod === "UPI" && typeof window.openPayment === "function") {
    window.openPayment(breakdown.total, orderRecord);
  }
}

function renderOrderConfirmation(order) {
  const box = document.getElementById("order-confirmation-box");
  if (!box) return;

  const cfg = getConfig();
  box.hidden = false;
  box.innerHTML = `
    <div class="confirmation-header">
      <span class="confirm-badge">Order Reference Created</span>
      <h3>Order ${escapeHTML(order.orderId)}</h3>
      <p>Thank you, <strong>${escapeHTML(order.customer.name)}</strong>. Complete the final step below to send your order to our team on WhatsApp.</p>
    </div>
    <div class="confirmation-details">
      <div><strong>Payment Mode:</strong> ${escapeHTML(order.customer.paymentMethod)}</div>
      <div><strong>Delivery To:</strong> ${escapeHTML(order.customer.address)}, ${escapeHTML(order.customer.city)} – ${escapeHTML(order.customer.pincode)}</div>
      <div><strong>Total Payable:</strong> <span class="tabular-nums">${formatINR(order.total)}</span></div>
      <div><strong>Estimated Delivery:</strong> ${escapeHTML(cfg.shipping.estimatedDelivery)}</div>
    </div>
    <div class="confirmation-actions">
      <button type="button" class="btn whatsapp-btn" onclick="orderWhatsApp()">
        Confirm &amp; Send Order on WhatsApp →
      </button>
      ${order.customer.paymentMethod === "UPI" ? `
        <button type="button" class="btn-outline-sm" onclick="openPayment(${order.total})">
          Open UPI Payment Details
        </button>
      ` : ""}
    </div>
  `;
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function payWithUPI() {
  const cfg = getConfig();
  const total = await calculateCartTotal();
  if (!Number.isFinite(total) || total <= 0) return;

  const params = new URLSearchParams({
    pa: cfg.payment.upiId,
    pn: cfg.payment.payeeName,
    am: total.toFixed(2),
    cu: "INR",
    tn: cfg.payment.upiNote
  });
  window.location.href = "upi://pay?" + params.toString();
}

async function orderWhatsApp(options = {}) {
  try {
    const cfg = getConfig();
    const breakdown = await calculateCartBreakdown();

    if (breakdown.lineItems.length === 0) return;

    const items = breakdown.lineItems.map(({ product, quantity, price, lineTotal }) => ({
      id: product.id,
      name: product.name,
      quantity,
      price,
      lineTotal
    }));

    const orderId = generateOrderId();
    const total = breakdown.subtotal;
    const paymentMethod = options.paymentMethod || "UPI";
    const customer = options.customer || {};

    saveOrderToHistory({
      orderId,
      createdAt: new Date().toISOString(),
      items,
      paymentMethod,
      customer,
      total
    });

    let message = `Hello ${cfg.brand.shortName}! I want to place an order (${orderId}):\n\n`;
    items.forEach((item) => {
      message += `• ${item.name} x ${item.quantity} = ₹${Number(item.lineTotal).toFixed(2)}\n`;
    });
    message += `\nTotal Amount: ₹${Number(total).toFixed(2)}`;
    message += `\nPayment Method: ${paymentMethod}`;

    if (customer.name || customer.phone || customer.address) {
      message += "\n\nDelivery Details:";
      if (customer.name) message += `\nName: ${customer.name}`;
      if (customer.phone) message += `\nPhone: ${customer.phone}`;
      if (customer.address) message += `\nAddress: ${customer.address}`;
    }

    message += "\n\nPlease confirm my order.";

    const url = `https://wa.me/${encodeURIComponent(cfg.contact.whatsappNumber)}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (error) {
    console.error("WhatsApp order error:", error);
  }
}

// =============================================
// 11. CUSTOMER REVIEWS (PURE CLIENT JS + STAR PICKER)
// =============================================

const RATING_LABELS = {
  5: "5 / 5 – Excellent",
  4: "4 / 5 – Very Good",
  3: "3 / 5 – Good",
  2: "2 / 5 – Fair",
  1: "1 / 5 – Needs Improvement"
};

function setReviewRating(value) {
  const rating = Math.max(1, Math.min(5, Number(value) || 5));
  const input = document.getElementById("rev-rating");
  if (input) input.value = String(rating);

  const label = document.getElementById("rev-rating-text");
  if (label) label.textContent = RATING_LABELS[rating] || `${rating} / 5`;

  document.querySelectorAll(".star-picker .star-btn").forEach((btn) => {
    const starVal = Number(btn.dataset.star) || 0;
    btn.classList.toggle("active", starVal <= rating);
  });
}

function getStoredReviews() {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function nextClientReviewNumber(list) {
  let maxSeq = 1000;
  for (const r of list) {
    const match = String(r.reviewNumber || "").match(/REV-(\d+)/);
    if (match) {
      const n = Number(match[1]);
      if (Number.isFinite(n) && n > maxSeq) maxSeq = n;
    }
  }
  return `REV-${maxSeq + 1}`;
}

async function fetchReviews() {
  return getStoredReviews().map((r) => ({
    id: r.id,
    name: r.name,
    city: r.city,
    product: r.product,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt
  }));
}

async function renderCustomerReviews() {
  const list = document.getElementById("customer-reviews-list");
  const layout = document.getElementById("reviews-layout");
  if (!list) return;

  const reviews = await fetchReviews();
  if (reviews.length === 0) {
    list.innerHTML = "";
    list.hidden = true;
    if (layout) layout.classList.add("single-col");
    return;
  }

  list.hidden = false;
  if (layout) layout.classList.remove("single-col");

  const avg = (reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1);
  const summaryHTML = `
    <div class="reviews-summary-bar">
      <span>★ ${escapeHTML(avg)} / 5.0 Average Rating</span>
      <span class="product-meta" style="margin-bottom:0;">${reviews.length} ${reviews.length === 1 ? "Customer Review" : "Customer Reviews"}</span>
    </div>
  `;

  list.innerHTML =
    summaryHTML +
    reviews
      .map((r) => {
        const stars = "★".repeat(Math.max(1, Math.min(5, Number(r.rating) || 5))) +
          "☆".repeat(5 - Math.max(1, Math.min(5, Number(r.rating) || 5)));
        return `
          <article class="review-card">
            <div class="review-top">
              <strong>${escapeHTML(r.name)}</strong>
              <span class="review-stars" aria-label="${Number(r.rating)} out of 5 stars">${stars}</span>
            </div>
            <div class="product-meta">
              ${escapeHTML(r.city || "India")} · ${escapeHTML(r.product || "Sea Buckthorn Juice")}
            </div>
            <p>${escapeHTML(r.comment)}</p>
          </article>
        `;
      })
      .join("");
}

function validateReviewCommentLength(forceError = false) {
  const textarea = document.getElementById("rev-comment");
  const counter = document.getElementById("rev-comment-count");
  const errorEl = document.getElementById("rev-comment-error");
  if (!textarea) return true;

  const trimmedLen = textarea.value.trim().length;
  const rawLen = textarea.value.length;

  if (counter) {
    counter.textContent = `${rawLen} / 800`;
    counter.classList.remove("invalid", "valid");
  }

  let errorMsg = "";
  if (rawLen > 800) {
    errorMsg = `Your Experience cannot exceed 800 characters (currently ${rawLen} / 800).`;
  } else if (forceError && trimmedLen === 0) {
    errorMsg = "Please share your experience before submitting.";
  }

  if (errorMsg) {
    textarea.classList.add("input-error");
    textarea.setAttribute("aria-invalid", "true");
    if (errorEl) errorEl.textContent = errorMsg;
    if (counter) counter.classList.add("invalid");
    return false;
  }

  textarea.classList.remove("input-error");
  textarea.setAttribute("aria-invalid", "false");
  if (errorEl) errorEl.textContent = "";
  if (counter && trimmedLen > 0) {
    counter.classList.add("valid");
  }
  return trimmedLen > 0 && rawLen <= 800;
}

function normalizeReviewPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  return digits;
}

function validateReviewName(forceError = false) {
  const nameInput = document.getElementById("rev-name");
  const errorEl = document.getElementById("rev-name-error");
  if (!nameInput) return true;
  const len = nameInput.value.trim().length;
  let errorMsg = "";
  if (len > 0 && len < 2) {
    errorMsg = "Name must be at least 2 characters.";
  } else if (forceError && len < 2) {
    errorMsg = "Please enter your full name (at least 2 characters).";
  }

  if (errorMsg) {
    nameInput.classList.add("input-error");
    nameInput.setAttribute("aria-invalid", "true");
    if (errorEl) errorEl.textContent = errorMsg;
    return false;
  }
  nameInput.classList.remove("input-error");
  nameInput.setAttribute("aria-invalid", "false");
  if (errorEl) errorEl.textContent = "";
  return len >= 2;
}

function validateReviewPhone(forceError = false) {
  const phoneInput = document.getElementById("rev-phone");
  const errorEl = document.getElementById("rev-phone-error");
  if (!phoneInput) return true;
  const raw = phoneInput.value.trim();
  const normalized = normalizeReviewPhone(raw);

  let errorMsg = "";
  if (raw.length > 0 && !/^[6-9]\d{9}$/.test(normalized)) {
    errorMsg = "Enter a valid 10-digit Indian mobile number.";
  } else if (forceError && !/^[6-9]\d{9}$/.test(normalized)) {
    errorMsg = "Please enter your 10-digit mobile number (kept private).";
  }

  if (errorMsg) {
    phoneInput.classList.add("input-error");
    phoneInput.setAttribute("aria-invalid", "true");
    if (errorEl) errorEl.textContent = errorMsg;
    return false;
  }
  phoneInput.classList.remove("input-error");
  phoneInput.setAttribute("aria-invalid", "false");
  if (errorEl) errorEl.textContent = "";
  return /^[6-9]\d{9}$/.test(normalized);
}

async function submitCustomerReview(event) {
  event.preventDefault();
  const nameInput = document.getElementById("rev-name");
  const phoneInput = document.getElementById("rev-phone");
  const name = (nameInput?.value || "").trim();
  const phone = normalizeReviewPhone(phoneInput?.value || "");
  const city = (document.getElementById("rev-city")?.value || "").trim();
  const product = (document.getElementById("rev-product")?.value || "Taitva Sea Buckthorn Juice").trim();
  const rating = Number(document.getElementById("rev-rating")?.value || 5);
  const commentEl = document.getElementById("rev-comment");
  const comment = (commentEl?.value || "").trim();
  const status = document.getElementById("rev-status");

  if (!validateReviewName(true)) {
    if (nameInput) nameInput.focus();
    if (status) {
      status.textContent = "Please enter your name (at least 2 characters).";
      status.className = "form-status error";
    }
    return;
  }

  if (!validateReviewPhone(true)) {
    if (phoneInput) phoneInput.focus();
    if (status) {
      status.textContent = "Please enter a valid 10-digit mobile number.";
      status.className = "form-status error";
    }
    return;
  }

  const isCommentValid = validateReviewCommentLength(true);
  if (!isCommentValid || comment.length < 1 || comment.length > 800) {
    if (commentEl) commentEl.focus();
    if (status) {
      status.textContent = comment.length > 800
        ? "Your Experience exceeds the 800-character limit."
        : "Please share your experience before submitting.";
      status.className = "form-status error";
    }
    return;
  }

  const reviews = getStoredReviews();
  const entry = {
    id: Date.now(),
    reviewNumber: nextClientReviewNumber(reviews),
    name,
    phone,
    city: city || "India",
    product,
    rating: Math.max(1, Math.min(5, rating)),
    comment,
    createdAt: new Date().toISOString()
  };

  reviews.unshift(entry);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews.slice(0, 100)));

  event.target.reset();
  setReviewRating(5);
  validateReviewName(false);
  validateReviewPhone(false);
  validateReviewCommentLength(false);
  if (status) {
    status.textContent = "Thank you for sharing your review!";
    status.className = "form-status success";
  }
  await renderCustomerReviews();
}

// =============================================
// 12. CONTACT ENQUIRY FORM (contact.html)
// =============================================

function submitContactEnquiry(event) {
  event.preventDefault();
  const cfg = getConfig();
  const name = (document.getElementById("contact-name")?.value || "").trim();
  const phone = (document.getElementById("contact-phone")?.value || "").trim();
  const topic = (document.getElementById("contact-topic")?.value || "Product Question").trim();
  const message = (document.getElementById("contact-message")?.value || "").trim();
  const status = document.getElementById("contact-form-status");

  if (name.length < 2 || message.length < 8) {
    if (status) {
      status.textContent = "Please enter your name and enquiry message.";
      status.className = "form-status error";
    }
    return;
  }

  const text = `Hello ${cfg.brand.shortName},\nName: ${name}\nPhone: ${phone || "Not provided"}\nTopic: ${topic}\nMessage: ${message}`;
  const url = `https://wa.me/${encodeURIComponent(cfg.contact.whatsappNumber)}?text=${encodeURIComponent(text)}`;
  if (status) {
    status.textContent = "Opening WhatsApp with your enquiry details…";
    status.className = "form-status success";
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

// =============================================
// 13. FAQ RENDERING & SCHEMA.ORG STRUCTURED DATA
// =============================================

function renderDynamicFAQs() {
  const faqContainer = document.getElementById("faq-list");
  if (!faqContainer) return;

  const faqs = getConfig().faqs || [];
  faqContainer.innerHTML = faqs
    .map(
      (item, idx) => `
      <div class="faq-item">
        <button class="faq-question" type="button" aria-expanded="false" aria-controls="faq-ans-${idx}">
          <span>${escapeHTML(item.q)}</span>
          <span class="faq-icon" aria-hidden="true">+</span>
        </button>
        <div class="faq-answer" id="faq-ans-${idx}">
          ${escapeHTML(item.a)}
        </div>
      </div>
    `
    )
    .join("");

  faqContainer.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.parentElement;
      const wasActive = item.classList.contains("active");
      faqContainer.querySelectorAll(".faq-item").forEach((faq) => {
        faq.classList.remove("active");
        const btn = faq.querySelector(".faq-question");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
      if (!wasActive) {
        item.classList.add("active");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });
}

function injectProductSchema(products) {
  if (!products || products.length === 0) return;
  const existing = document.getElementById("dynamic-product-schema");
  if (existing) existing.remove();

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((p, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: p.name,
        description: p.description,
        image: window.location.origin + getImagePath(p.image),
        brand: { "@type": "Brand", name: "Taitva Pure by Nature" },
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price: String(p.price),
          availability: p.inStock !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        }
      }
    }))
  };

  const script = document.createElement("script");
  script.id = "dynamic-product-schema";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

// =============================================
// 14. INITIALIZATION
// =============================================

document.addEventListener("DOMContentLoaded", async function () {
  hydrateSiteChrome();
  updateCartCount();
  renderDynamicFAQs();
  renderCustomerReviews();

  const revComment = document.getElementById("rev-comment");
  if (revComment) {
    revComment.addEventListener("input", () => validateReviewCommentLength(false));
    revComment.addEventListener("blur", () => {
      if (revComment.value.length > 0) {
        validateReviewCommentLength(true);
      }
    });
  }
  const revName = document.getElementById("rev-name");
  if (revName) {
    revName.addEventListener("input", () => validateReviewName(false));
    revName.addEventListener("blur", () => {
      if (revName.value.trim().length > 0) validateReviewName(true);
    });
  }
  const revPhone = document.getElementById("rev-phone");
  if (revPhone) {
    revPhone.addEventListener("input", () => validateReviewPhone(false));
    revPhone.addEventListener("blur", () => {
      if (revPhone.value.trim().length > 0) validateReviewPhone(true);
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeProductDetail();
      const navbar = document.getElementById("navbar");
      const btn = document.querySelector(".menu-btn");
      if (navbar && navbar.classList.contains("show")) {
        navbar.classList.remove("show");
        if (btn) btn.setAttribute("aria-expanded", "false");
      }
    }
  });

  document.addEventListener("click", (e) => {
    const navbar = document.getElementById("navbar");
    const btn = document.querySelector(".menu-btn");
    if (!navbar || !navbar.classList.contains("show")) return;
    if (!navbar.contains(e.target) && (!btn || !btn.contains(e.target))) {
      navbar.classList.remove("show");
      if (btn) btn.setAttribute("aria-expanded", "false");
    }
  });

  try {
    await initializeProducts();
    await displayProducts();
    await displayCart();
    updateCartCount();
  } catch (error) {
    console.error("Website initialization error:", error);
  }
});
