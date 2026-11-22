/* ============================================================================
   TAITVA PURE BY NATURE — CENTRALIZED STORE CONFIGURATION
   ============================================================================
   HOW TO UPDATE YOUR WEBSITE:
   Edit the values below and save this file. Every page (Home, Products, About,
   Contact, Cart, Policies) automatically reads from this single configuration.
   You can also manage products, coupons, and settings visually in /admin.html
   and click "Download store-config.js" to export your changes back to GitHub.
   ============================================================================ */

(function (global) {
  "use strict";

  const BASE_CONFIG = {
    brand: {
      name: "Taitva Pure by Nature",
      shortName: "Taitva",
      tagline: "Sun in a Bottle · 100% Natural Sea Buckthorn Juice",
      foundedYear: 2026,
      location: "Rajkot, Gujarat, India",
      logoImage: "/Taitva Pure by Nature Logo.jpg"
    },

    announcement: {
      enabled: true,
      text: "Freshly made juices · Order directly on",
      linkText: "WhatsApp",
      linkHref: "https://wa.me/919724307705"
    },

    hero: {
      eyebrow: "100% Natural · No Added Preservatives",
      headline: "Freshness in Every Sip!",
      description:
        "Taitva Pure by Nature brings you 100% Natural Sea Buckthorn Juice crafted for your daily wellness routine. Vegetarian, Made in India, and delivered fresh to your doorstep.",
      primaryCtaText: "Shop Sea Buckthorn",
      primaryCtaHref: "/products.html",
      secondaryCtaText: "How to Consume",
      secondaryCtaHref: "#how-to-consume",
      image: "/Taitva Pure by Nature Logo.jpg",
      imageAlt: "Taitva Pure by Nature Sea Buckthorn logo surrounded by golden berries"
    },

    contact: {
      whatsappNumber: "919724307705",
      displayPhone: "+91 97243 07705",
      email: "zivagoworld@gmail.com",
      instagramUrl: "https://www.instagram.com/zivago.world",
      instagramHandle: "@zivago.world",
      address: "Rajkot, Gujarat, India",
      supportHours: "Direct WhatsApp & Email Support"
    },

    payment: {
      upiId: "tusharsanandiya@okicici",
      payeeName: "Taitva Pure by Nature",
      upiNote: "Taitva Juice Order",
      codAvailable: true,
      codNote: "Cash on Delivery (COD) is available across serviceable Indian pin codes."
    },

    shipping: {
      estimatedDelivery: "3–6 business days across India",
      dispatchCutoff: "Orders confirmed before 2:00 PM IST are processed the same business day."
    },

    // ========================================================================
    // PRODUCT CATALOG
    // Add, edit, or mark products out of stock here.
    // ========================================================================
    products: [
      {
        id: 1,
        name: "Taitva Sea Buckthorn Juice – 500ml",
        shortName: "Sea Buckthorn 500ml",
        category: "Single Bottle",
        volume: "500 ml",
        servings: "33 daily servings (15 ml each)",
        price: 289,
        originalPrice: 499,
        inStock: true,
        stockNote: "In Stock · Ships in 24 hrs",
        image: "/T500.jpg",
        shortDescription:
          "100% Natural Sea Buckthorn Juice in a 500ml bottle. Tangy, rich in naturally occurring Vitamin C and antioxidants. No added preservatives.",
        description:
          "Enjoy the natural goodness of Sea Buckthorn Juice in a 500ml bottle. Refreshing, tangy, and packed with naturally occurring vitamins and antioxidants. A simple daily wellness addition with no added preservatives.",
        ingredients: "Sea Buckthorn Berry Pulp & Juice (100% Vegetarian, No Added Preservatives)",
        usage: "Take 15 ml (approx. 1 tablespoon) diluted in 150–200 ml of water once daily, or follow label directions.",
        storage: "Store in a cool, dry place away from direct sunlight. Refrigerate after opening and consume within 30 days.",
        highlights: [
          "100% Natural Sea Buckthorn berries",
          "No added preservatives",
          "100% Vegetarian · Made in India",
          "Food-grade recyclable bottle"
        ],
        relatedIds: [2]
      },
      {
        id: 2,
        name: "Taitva Sea Buckthorn Juice – Pack of 2 (2 × 500ml)",
        shortName: "Sea Buckthorn Pack of 2",
        category: "Value Pack",
        volume: "1000 ml (2 × 500 ml)",
        servings: "66 daily servings (2-month supply)",
        price: 549,
        originalPrice: 899,
        inStock: true,
        stockNote: "In Stock · Value Pack of 2",
        image: "/T1000.jpg",
        shortDescription:
          "2-bottle value pack (1000ml total) for your consistent daily wellness routine.",
        description:
          "Double the goodness with our 1000ml Value Pack (two 500ml bottles). Ideal for a consistent two-month wellness routine or sharing with family.",
        ingredients: "Sea Buckthorn Berry Pulp & Juice (100% Vegetarian, No Added Preservatives)",
        usage: "Take 15 ml (approx. 1 tablespoon) diluted in 150–200 ml of water once daily, or follow label directions.",
        storage: "Store unopened bottles in a cool, dry place. Refrigerate the opened bottle and consume within 30 days.",
        highlights: [
          "Save ₹350 vs MRP + Extra ₹29 off vs 2 singles",
          "No added preservatives · Made in India",
          "Approx. 66 daily servings"
        ],
        relatedIds: [1]
      }
    ],

    coupons: [],

    qualityPillars: [
      {
        title: "Pure Sea Buckthorn",
        detail: "Crafted from sea buckthorn berries known for naturally occurring Vitamin C and antioxidants."
      },
      {
        title: "Zero Added Preservatives",
        detail: "Pure vegetarian formulation made in India without synthetic preservatives."
      },
      {
        title: "Transparent Labelling",
        detail: "Clear 15 ml daily serving guidance, storage instructions, and full batch transparency."
      },
      {
        title: "UPI & Cash on Delivery",
        detail: "Pay safely via any UPI app or Cash on Delivery (COD) with WhatsApp order confirmation."
      }
    ],

    faqs: [
      {
        q: "What is Sea Buckthorn Juice?",
        a: "Sea Buckthorn Juice is made from tangy orange sea buckthorn berries that naturally contain vitamin C, antioxidants, and plant nutrients."
      },
      {
        q: "How should I consume Taitva Sea Buckthorn Juice?",
        a: "Take 15 ml (1 tablespoon) once daily and dilute it in 150–200 ml of water, or follow the specific serving instructions printed on your bottle label."
      },
      {
        q: "How should I store the bottle after opening?",
        a: "Keep unopened bottles in a cool, dry place away from direct sunlight. Once opened, refrigerate and consume as directed on the bottle label."
      },
      {
        q: "Is Sea Buckthorn Juice suitable for everyone?",
        a: "Adults can include it in a daily routine as directed on the label. Anyone with known allergies, medical conditions, pregnancy, or ongoing medication should consult a healthcare professional before use."
      },
      {
        q: "What payment and delivery options are available?",
        a: "You can pay securely via any UPI app (GPay, PhonePe, Paytm, BHIM) or choose Cash on Delivery (COD) with WhatsApp order confirmation."
      },
      {
        q: "How does order confirmation and tracking work?",
        a: "After placing your order at checkout, you receive an Order Reference ID and can send your order details directly on WhatsApp. Our team verifies UPI or COD orders and shares dispatch updates with you."
      },
      {
        q: "What is your return, refund, or cancellation policy?",
        a: "Unopened orders can be cancelled before dispatch via WhatsApp or email. If a bottle arrives damaged or leaked in transit, share an unboxing photo within 48 hours of delivery for a replacement or full refund."
      }
    ]
  };

  // Apply optional local admin overrides (used for live preview from /admin.html)
  function loadOverrides() {
    try {
      const raw = global.localStorage && global.localStorage.getItem("taitva_store_overrides_v1");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function mergeConfig(base, overrides) {
    if (!overrides) return base;
    return {
      ...base,
      brand: { ...base.brand, ...(overrides.brand || {}) },
      announcement: { ...base.announcement, ...(overrides.announcement || {}) },
      hero: { ...base.hero, ...(overrides.hero || {}) },
      contact: { ...base.contact, ...(overrides.contact || {}) },
      payment: { ...base.payment, ...(overrides.payment || {}) },
      shipping: { ...base.shipping, ...(overrides.shipping || {}) },
      coupons: Array.isArray(overrides.coupons) ? overrides.coupons : base.coupons
    };
  }

  global.TAITVA_BASE_CONFIG = BASE_CONFIG;
  global.TAITVA_CONFIG = mergeConfig(BASE_CONFIG, loadOverrides());
})(typeof window !== "undefined" ? window : globalThis);
