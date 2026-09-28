/* ==========================================================
   10Coin.com — SITE CONFIG (edit this file only to monetize)
   ========================================================== */
window.TENCOIN_CONFIG = {
  siteName: "10Coin",
  siteUrl: "https://10coin.com",

  /* Google AdSense — paste your publisher ID (e.g. "ca-pub-1234567890123456").
     Leave empty to show "Advertise here" house slots instead. Also update /ads.txt */
  adsenseClient: "",
  adsenseSlots: { header: "", inContent: "", sidebar: "", footer: "" },

  /* Google Analytics 4 measurement ID (e.g. "G-XXXXXXX"). Optional. */
  ga4: "",

  /* YouTube — your channel URL and videos to embed (IDs only). */
  youtubeChannel: "",
  youtubeVideos: [
    /* { id: "VIDEO_ID", title: "Title", cat: "Crypto" | "Coins" | "Bullion" | "Basics" } */
  ],

  /* Donation / support links. Empty = button opens the pledge form instead. */
  donate: {
    paypal: "",       // e.g. https://www.paypal.com/donate/?hosted_button_id=XXXX
    buymeacoffee: "", // e.g. https://buymeacoffee.com/yourname
    kofi: "",         // e.g. https://ko-fi.com/yourname
    stripe: "",       // Stripe Payment Link
    patreon: "",
    crypto: { BTC: "", ETH: "", USDT_TRC20: "" }
  },
  fundraising: { goal: 10000, raised: 0, currency: "USD" },

  /* Affiliate "Buy / Sell" partner links (optional). */
  affiliates: {
    exchange: "",   // crypto exchange referral link
    bullion: "",    // bullion dealer affiliate link
    grading: ""     // grading service / supplies affiliate link
  },

  /* Owner/partnership inquiries banner target */
  interestUrl: "https://web.works/contact",

  /* Form delivery. Default: FormSubmit AJAX (free, no backend).
     For maximum privacy, after the first activation email, replace
     formEndpoint with your FormSubmit random alias, e.g.
     "https://formsubmit.co/ajax/abc123yourhash". */
  formEndpoint: "",
  _k: ["=02bj5C", "bpFWbnB", "UMhN3ay", "92diV2d"]
};
