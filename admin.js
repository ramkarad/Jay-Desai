/* ============================================================================
   TAITVA PURE BY NATURE — ADMIN DASHBOARD SCRIPT (Pure Client-Side JS)
   SHA-256 Passcode Auth + Product CRUD + Settings Overrides +
   Customer Review Moderation + Copy / Download store-config.js
   ============================================================================ */

const ADMIN_PASSCODE_HASH_KEY = "taitva_admin_passcode_hash_v1";
const ADMIN_SESSION_KEY = "taitva_admin_session_v1";

let isBootstrapMode = false;
let uploadedImageDataUrl = "";

function simpleSha256Fallback(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = "";
  const words = [];
  const asciiBitLength = ascii.length * 8;
  const hash = [];
  const k = [];
  let primeCounter = 0;

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += "\x80";
  while ((ascii.length % 64) - 56) ascii += "\x00";
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash.unshift((temp1 + temp2) | 0);
      hash.pop();
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

async function hashPasscodeClient(passcode) {
  const salted = "taitva-admin-salt-v1:" + String(passcode || "");
  if (window.crypto && window.crypto.subtle && typeof TextEncoder !== "undefined") {
    try {
      const encoded = new TextEncoder().encode(salted);
      const digest = await window.crypto.subtle.digest("SHA-256", encoded);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch {
      // fallback below
    }
  }
  const utf8 = unescape(encodeURIComponent(salted));
  return simpleSha256Fallback(utf8);
}

async function checkAdminStatus() {
  const loginBox = document.getElementById("login-box");
  const dashboard = document.getElementById("dashboard");
  const title = document.getElementById("auth-title");
  const subtitle = document.getElementById("auth-subtitle");
  const confirmWrap = document.getElementById("confirm-passcode-wrap");
  const submitBtn = document.getElementById("auth-submit-btn");

  try {
    const storedHash = localStorage.getItem(ADMIN_PASSCODE_HASH_KEY) || "";
    const isAuthenticated = Boolean(storedHash) && sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";

    if (isAuthenticated) {
      loginBox.hidden = true;
      dashboard.hidden = false;
      await loadAdminDashboard();
      return;
    }

    loginBox.hidden = false;
    dashboard.hidden = true;

    if (!storedHash) {
      isBootstrapMode = true;
      title.textContent = "Create Admin Passcode";
      subtitle.textContent = "Create a store admin passcode (min 6 characters) to protect your dashboard on this browser.";
      confirmWrap.hidden = false;
      submitBtn.textContent = "Create Passcode & Enter";
    } else {
      isBootstrapMode = false;
      title.textContent = "Store Admin Login";
      subtitle.textContent = "Enter your store admin passcode to manage products and settings.";
      confirmWrap.hidden = true;
      submitBtn.textContent = "Login";
    }
  } catch (error) {
    console.error("Admin status error:", error);
  }
}

document.getElementById("login-form")?.addEventListener("submit", async function (event) {
  event.preventDefault();
  const errEl = document.getElementById("login-error");
  const passcode = (document.getElementById("admin-passcode")?.value || "").trim();
  const confirm = (document.getElementById("admin-passcode-confirm")?.value || "").trim();

  errEl.textContent = "";

  if (passcode.length < 6) {
    errEl.textContent = "Passcode must be at least 6 characters.";
    return;
  }

  if (isBootstrapMode) {
    if (passcode !== confirm) {
      errEl.textContent = "Passcodes do not match.";
      return;
    }
    const newHash = await hashPasscodeClient(passcode);
    localStorage.setItem(ADMIN_PASSCODE_HASH_KEY, newHash);
    sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
    document.getElementById("admin-passcode").value = "";
    document.getElementById("admin-passcode-confirm").value = "";
    await checkAdminStatus();
    return;
  }

  const storedHash = localStorage.getItem(ADMIN_PASSCODE_HASH_KEY) || "";
  const candidateHash = await hashPasscodeClient(passcode);
  if (!storedHash || candidateHash !== storedHash) {
    errEl.textContent = "Invalid admin passcode.";
    return;
  }

  sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
  document.getElementById("admin-passcode").value = "";
  document.getElementById("admin-passcode-confirm").value = "";
  await checkAdminStatus();
});

async function adminLogout() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  await checkAdminStatus();
}

// =============================================
// DASHBOARD LOAD & PRODUCT CRUD
// =============================================

async function loadAdminDashboard() {
  await renderAdminProducts();
  loadSettingsIntoForm();
  await renderAdminReviews();
}

async function renderAdminProducts() {
  const container = document.getElementById("admin-products");
  const countEl = document.getElementById("admin-product-count");
  if (!container) return;

  const products = await getProducts();
  if (countEl) countEl.textContent = String(products.length);

  if (products.length === 0) {
    container.innerHTML = `<p class="empty-message">No products in catalog.</p>`;
    return;
  }

  container.innerHTML = products
    .map((p) => {
      const id = escapeHTML(p.id);
      const inStock = p.inStock !== false;
      return `
        <div class="admin-product">
          <div class="admin-product-left">
            <img src="${escapeHTML(getImagePath(p.image))}" alt="${escapeHTML(p.name)}" onerror="imageError(this)">
            <div>
              <strong>${escapeHTML(p.name)}</strong>
              <div class="product-meta">
                ${escapeHTML(p.category || "Juice")} · ${escapeHTML(p.volume || "")} ·
                <span class="tabular-nums">${formatINR(p.price)}</span>
                ${p.originalPrice > p.price ? ` (MRP ${formatINR(p.originalPrice)})` : ""} ·
                <strong>${inStock ? "In Stock" : "Out of Stock"}</strong>
              </div>
            </div>
          </div>
          <div class="admin-product-actions">
            <button type="button" class="btn-outline-sm" onclick="editAdminProduct('${id}')">Edit</button>
            <button type="button" class="btn-outline-sm" onclick="toggleAdminStock('${id}')">${inStock ? "Mark Out of Stock" : "Mark In Stock"}</button>
            <button type="button" class="delete-btn" onclick="deleteAdminProduct('${id}')">Delete</button>
          </div>
        </div>
      `;
    })
    .join("");
}

document.getElementById("product-image-file")?.addEventListener("change", function (event) {
  const file = event.target.files?.[0];
  const preview = document.getElementById("image-preview");
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    uploadedImageDataUrl = String(e.target?.result || "");
    if (preview && uploadedImageDataUrl) {
      preview.src = uploadedImageDataUrl;
      preview.hidden = false;
    }
  };
  reader.readAsDataURL(file);
});

document.getElementById("product-form")?.addEventListener("submit", async function (event) {
  event.preventDefault();
  const editId = document.getElementById("edit-product-id").value;
  const name = document.getElementById("product-name").value.trim();
  const category = document.getElementById("product-category").value;
  const volume = document.getElementById("product-volume").value.trim();
  const inStock = document.getElementById("product-stock").value === "true";
  const price = Number(document.getElementById("product-price").value);
  const originalPrice = Number(document.getElementById("product-original-price").value) || price;
  const pathVal = document.getElementById("product-image-path").value.trim();
  const description = document.getElementById("product-description").value.trim();
  const ingredients = document.getElementById("product-ingredients").value.trim();
  const usage = document.getElementById("product-usage").value.trim();
  const msg = document.getElementById("save-message");

  if (!name || !Number.isFinite(price) || price <= 0) {
    msg.textContent = "Please provide a valid product name and selling price.";
    msg.className = "form-status error";
    return;
  }

  const image = uploadedImageDataUrl || pathVal || "/T500.jpg";
  const products = await getProducts();
  const existing = editId ? products.find((p) => String(p.id) === String(editId)) : null;

  const productRecord = {
    ...(existing || {}),
    id: existing ? existing.id : Date.now(),
    name,
    shortName: name.replace(/^Taitva\s+/i, ""),
    category,
    volume,
    inStock,
    stockNote: inStock ? "In Stock · Ships in 24 hrs" : "Currently Out of Stock",
    price,
    originalPrice: Math.max(price, originalPrice),
    image: getImagePath(image),
    shortDescription: description,
    description,
    ingredients: ingredients || "Sea Buckthorn Berry Pulp & Juice",
    usage: usage || "Take 15 ml diluted in 150–200 ml water once daily."
  };

  const db = await openProductDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(productRecord);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });

  resetProductForm();
  msg.textContent = "Product saved to catalog.";
  msg.className = "form-status success";
  await renderAdminProducts();
});

async function editAdminProduct(id) {
  const products = await getProducts();
  const p = products.find((item) => String(item.id) === String(id));
  if (!p) return;

  document.getElementById("edit-product-id").value = String(p.id);
  document.getElementById("product-name").value = p.name || "";
  document.getElementById("product-category").value = p.category || "Single Bottle";
  document.getElementById("product-volume").value = p.volume || "";
  document.getElementById("product-stock").value = p.inStock !== false ? "true" : "false";
  document.getElementById("product-price").value = p.price || "";
  document.getElementById("product-original-price").value = p.originalPrice || "";
  document.getElementById("product-image-path").value = p.image || "";
  document.getElementById("product-description").value = p.description || "";
  document.getElementById("product-ingredients").value = p.ingredients || "";
  document.getElementById("product-usage").value = p.usage || "";
  uploadedImageDataUrl = "";

  const preview = document.getElementById("image-preview");
  if (preview && p.image) {
    preview.src = getImagePath(p.image);
    preview.hidden = false;
  }

  document.getElementById("product-form-heading").textContent = "Editing: " + p.name;
  document.getElementById("cancel-edit-btn").hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetProductForm() {
  const form = document.getElementById("product-form");
  if (form) form.reset();
  document.getElementById("edit-product-id").value = "";
  uploadedImageDataUrl = "";
  const preview = document.getElementById("image-preview");
  if (preview) preview.hidden = true;
  document.getElementById("product-form-heading").textContent = "Add / Edit Product";
  document.getElementById("cancel-edit-btn").hidden = true;
}

async function toggleAdminStock(id) {
  const products = await getProducts();
  const p = products.find((item) => String(item.id) === String(id));
  if (!p) return;
  p.inStock = p.inStock === false;
  p.stockNote = p.inStock ? "In Stock · Ships in 24 hrs" : "Currently Out of Stock";

  const db = await openProductDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(p);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
  await renderAdminProducts();
}

async function deleteAdminProduct(id) {
  const db = await openProductDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(Number(id) || id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
  await renderAdminProducts();
}

async function resetCatalogToDefaults() {
  const db = await openProductDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    (window.TAITVA_BASE_CONFIG?.products || []).forEach((p) => {
      store.put({ ...p, image: getImagePath(p.image) });
    });
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
  await renderAdminProducts();
}

// =============================================
// STORE SETTINGS & COUPONS OVERRIDES
// =============================================

function getOverrides() {
  try {
    return JSON.parse(localStorage.getItem("taitva_store_overrides_v1") || "{}") || {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides) {
  localStorage.setItem("taitva_store_overrides_v1", JSON.stringify(overrides));
  if (window.TAITVA_BASE_CONFIG) {
    window.TAITVA_CONFIG = {
      ...window.TAITVA_BASE_CONFIG,
      announcement: { ...window.TAITVA_BASE_CONFIG.announcement, ...(overrides.announcement || {}) },
      contact: { ...window.TAITVA_BASE_CONFIG.contact, ...(overrides.contact || {}) },
      payment: { ...window.TAITVA_BASE_CONFIG.payment, ...(overrides.payment || {}) },
      shipping: { ...window.TAITVA_BASE_CONFIG.shipping, ...(overrides.shipping || {}) }
    };
  }
}

function loadSettingsIntoForm() {
  const cfg = getConfig();
  document.getElementById("cfg-announcement").value = cfg.announcement?.text || "";
  document.getElementById("cfg-whatsapp").value = cfg.contact?.whatsappNumber || "";
  document.getElementById("cfg-email").value = cfg.contact?.email || "";
  document.getElementById("cfg-upi").value = cfg.payment?.upiId || "";
}

function saveStoreSettings(event) {
  event.preventDefault();
  const overrides = getOverrides();
  overrides.announcement = {
    ...(overrides.announcement || {}),
    text: document.getElementById("cfg-announcement").value.trim()
  };
  overrides.contact = {
    ...(overrides.contact || {}),
    whatsappNumber: document.getElementById("cfg-whatsapp").value.trim(),
    email: document.getElementById("cfg-email").value.trim()
  };
  overrides.payment = {
    ...(overrides.payment || {}),
    upiId: document.getElementById("cfg-upi").value.trim()
  };

  saveOverrides(overrides);
  const status = document.getElementById("settings-status");
  if (status) {
    status.textContent = "Store settings saved for this browser. Use 'Copy store-config.js' to update GitHub.";
  }
}

// =============================================
// COPY / DOWNLOAD store-config.js FOR GITHUB
// =============================================

async function buildStoreConfigFileContent() {
  const products = await getProducts();
  const cfg = getConfig();
  const exportPayload = {
    ...cfg,
    products
  };

  return `/* TAITVA PURE BY NATURE — EXPORTED STORE CONFIGURATION */
(function (global) {
  "use strict";
  const BASE_CONFIG = ${JSON.stringify(exportPayload, null, 2)};
  global.TAITVA_BASE_CONFIG = BASE_CONFIG;
  global.TAITVA_CONFIG = BASE_CONFIG;
})(typeof window !== "undefined" ? window : globalThis);
`;
}

function setConfigCopyStatus(msg, type = "success") {
  const el = document.getElementById("config-copy-status");
  if (!el) return;
  el.textContent = msg;
  el.className = msg ? `form-status ${type}` : "form-status";
}

function fallbackCopyText(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "-9999px";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, ta.value.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

let copyBtnTimer = null;

async function copyStoreConfigFile() {
  const btn = document.getElementById("copy-config-btn");
  const originalLabel = "Copy store-config.js";

  try {
    const content = await buildStoreConfigFileContent();
    let copied = false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(content);
        copied = true;
      } catch {
        copied = false;
      }
    }
    if (!copied) copied = fallbackCopyText(content);

    if (copied) {
      if (btn) {
        btn.textContent = "✓ Copied!";
        clearTimeout(copyBtnTimer);
        copyBtnTimer = setTimeout(() => { btn.textContent = originalLabel; }, 2000);
      }
      setConfigCopyStatus("store-config.js copied. Paste it into GitHub and commit.", "success");
    } else {
      setConfigCopyStatus("Copy blocked by the browser. Use 'Download store-config.js' instead.", "error");
    }
  } catch (error) {
    console.error("Copy store-config error:", error);
    setConfigCopyStatus("Could not copy. Use 'Download store-config.js' instead.", "error");
  }
}

async function exportStoreConfigFile() {
  const fileContent = await buildStoreConfigFileContent();
  const blob = new Blob([fileContent], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "store-config.js";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  setConfigCopyStatus("store-config.js downloaded.", "success");
}

// =============================================
// CUSTOMER REVIEWS MODERATION
// =============================================

let confirmDeleteAllTimer = null;

function setAdminReviewsStatus(msg, type = "success") {
  const statusEl = document.getElementById("admin-reviews-status");
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.className = msg ? `form-status ${type}` : "form-status";
}

async function fetchAdminReviewsList() {
  return typeof getStoredReviews === "function" ? getStoredReviews() : [];
}

async function renderAdminReviews() {
  const container = document.getElementById("admin-reviews-list");
  const countEl = document.getElementById("admin-review-count");
  const deleteAllBtn = document.getElementById("delete-all-reviews-btn");
  if (!container) return;

  const reviews = await fetchAdminReviewsList();
  if (reviews === null) return;

  if (countEl) countEl.textContent = String(reviews.length);
  if (deleteAllBtn) {
    deleteAllBtn.hidden = reviews.length === 0;
    deleteAllBtn.dataset.confirmed = "";
    deleteAllBtn.textContent = "Delete All Reviews";
  }

  if (reviews.length === 0) {
    container.innerHTML = `<p class="empty-message" style="padding:12px 0;">No customer reviews submitted yet.</p>`;
    return;
  }

  container.innerHTML = reviews
    .map((r) => {
      const ref = r.reviewNumber ? `${r.reviewNumber} · ` : "";
      const phonePart = r.phone ? ` · Mobile: ${escapeHTML(r.phone)}` : "";
      const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
      const label = r.reviewNumber || r.name || "Review";
      return `
      <div class="admin-product">
        <div style="flex:1;min-width:240px;">
          <strong>${escapeHTML(ref)}${escapeHTML(r.name)} (${escapeHTML(String(r.rating))}/5 ★)</strong>
          <div class="product-meta">
            ${escapeHTML(r.city || "India")}${phonePart} · ${escapeHTML(r.product || "")}${dateStr ? ` · ${escapeHTML(dateStr)}` : ""}
          </div>
          <p style="font-size:13px;color:var(--text-muted);margin-top:4px;">${escapeHTML(r.comment)}</p>
        </div>
        <div class="admin-product-actions">
          <button type="button" class="delete-btn" onclick="deleteAdminReview('${escapeHTML(r.id)}', '${escapeHTML(label)}')">Delete</button>
        </div>
      </div>
    `;
    })
    .join("");
}

async function deleteAdminReview(id, label = "Review") {
  setAdminReviewsStatus("");
  const local = getStoredReviews().filter((r) => String(r.id) !== String(id));
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(local));
  setAdminReviewsStatus(`Deleted ${label}.`, "success");
  await renderAdminReviews();
}

async function deleteAllAdminReviews() {
  const btn = document.getElementById("delete-all-reviews-btn");
  if (!btn) return;

  if (btn.dataset.confirmed !== "true") {
    btn.dataset.confirmed = "true";
    btn.textContent = "Click again to confirm Delete All";
    clearTimeout(confirmDeleteAllTimer);
    confirmDeleteAllTimer = setTimeout(() => {
      if (btn) {
        btn.dataset.confirmed = "";
        btn.textContent = "Delete All Reviews";
      }
    }, 4000);
    return;
  }

  clearTimeout(confirmDeleteAllTimer);
  btn.dataset.confirmed = "";
  btn.textContent = "Delete All Reviews";

  localStorage.setItem(REVIEWS_KEY, "[]");
  setAdminReviewsStatus("All customer reviews deleted.", "success");
  await renderAdminReviews();
}

document.addEventListener("DOMContentLoaded", checkAdminStatus);
