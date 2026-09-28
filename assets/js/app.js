/* 10Coin.com — shared runtime */
(function () {
  "use strict";
  const C = window.TENCOIN_CONFIG || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    sget(k) { try { const v = sessionStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    sset(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- formatting ---------- */
  const CUR_SYM = { usd: "$", cad: "C$", eur: "€", gbp: "£", inr: "₹", aud: "A$" };
  function money(n, cur = "usd", compact = false) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    const sym = CUR_SYM[cur] || "";
    if (compact) {
      const a = Math.abs(n);
      if (a >= 1e12) return sym + (n / 1e12).toFixed(2) + "T";
      if (a >= 1e9) return sym + (n / 1e9).toFixed(2) + "B";
      if (a >= 1e6) return sym + (n / 1e6).toFixed(2) + "M";
      if (a >= 1e3) return sym + (n / 1e3).toFixed(1) + "K";
    }
    const d = Math.abs(n) >= 1000 ? 0 : Math.abs(n) >= 1 ? 2 : Math.abs(n) >= 0.01 ? 4 : 8;
    return sym + Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function pct(n) {
    if (n === null || n === undefined || isNaN(n)) return '<span class="muted">—</span>';
    const cls = n >= 0 ? "up" : "down";
    return `<span class="${cls}">${n >= 0 ? "▲" : "▼"} ${Math.abs(n).toFixed(2)}%</span>`;
  }
  function sparkline(arr, w = 120, h = 36) {
    if (!arr || arr.length < 2) return "";
    const step = Math.max(1, Math.floor(arr.length / 60));
    const pts = arr.filter((_, i) => i % step === 0);
    const min = Math.min(...pts), max = Math.max(...pts), r = max - min || 1;
    const d = pts.map((v, i) => `${(i / (pts.length - 1) * w).toFixed(1)},${(h - 2 - (v - min) / r * (h - 4)).toFixed(1)}`).join(" ");
    const col = pts[pts.length - 1] >= pts[0] ? "var(--up)" : "var(--down)";
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="${col}" stroke-width="1.6" points="${d}"/></svg>`;
  }
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- market data (CoinGecko public API, cached) ---------- */
  const API = "https://api.coingecko.com/api/v3";
  async function getJSON(url, ttlMs = 180000) {
    const key = "tc:" + url;
    const hit = store.sget(key);
    if (hit && Date.now() - hit.t < ttlMs) return hit.d;
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const d = await res.json();
    store.sset(key, { t: Date.now(), d });
    return d;
  }
  const api = {
    markets: (cur = "usd", n = 100, spark = true, page = 1) =>
      getJSON(`${API}/coins/markets?vs_currency=${cur}&order=market_cap_desc&per_page=${n}&page=${page}&sparkline=${spark}&price_change_percentage=1h,24h,7d`),
    byIds: (ids, cur = "usd") => getJSON(`${API}/coins/markets?vs_currency=${cur}&ids=${ids.join(",")}&sparkline=false&price_change_percentage=24h`),
    global: () => getJSON(`${API}/global`),
    trending: () => getJSON(`${API}/search/trending`, 600000),
    history: (id, dmy) => getJSON(`${API}/coins/${id}/history?date=${dmy}&localization=false`, 86400000),
    fng: () => getJSON("https://api.alternative.me/fng/?limit=1", 900000),
    /* Gold/silver reference via tokenized-metal proxies (≈ 1 troy oz each) */
    metals: async (cur = "usd") => {
      const d = await getJSON(`${API}/simple/price?ids=pax-gold,tether-gold,kinesis-silver&vs_currencies=${cur}&include_24hr_change=true`);
      const g = d["pax-gold"] || d["tether-gold"] || {};
      const s = d["kinesis-silver"] || {};
      return { gold: g[cur], goldChg: g[cur + "_24h_change"], silver: s[cur], silverChg: s[cur + "_24h_change"] };
    }
  };
  const STABLES = ["tether", "usd-coin", "dai", "first-digital-usd", "ethena-usde", "usds", "paypal-usd", "binance-usd", "true-usd", "usd1-wlfi", "staked-ether", "wrapped-bitcoin", "wrapped-steth", "weth", "wrapped-eeth", "coinbase-wrapped-btc", "binance-bridged-usdt-bnb-smart-chain"];

  /* ---------- ticker ---------- */
  async function initTicker() {
    const t = $(".ticker-track");
    if (!t) return;
    try {
      const [coins, m] = await Promise.all([api.markets("usd", 15, false), api.metals("usd").catch(() => ({}))]);
      let items = coins.filter((c) => !STABLES.includes(c.id)).slice(0, 10).map((c) =>
        `<span class="ticker-item"><b>${esc(c.symbol.toUpperCase())}</b> <span class="num">${money(c.current_price)}</span> ${pct(c.price_change_percentage_24h)}</span>`);
      if (m.gold) items.unshift(`<span class="ticker-item"><b>GOLD≈</b> <span class="num">${money(m.gold)}</span> ${pct(m.goldChg)}</span>`);
      if (m.silver) items.unshift(`<span class="ticker-item"><b>SILVER≈</b> <span class="num">${money(m.silver)}</span> ${pct(m.silverChg)}</span>`);
      const html = items.join("");
      t.innerHTML = html + html;
    } catch (e) {
      t.innerHTML = '<span class="ticker-item muted">Live prices are refreshing — check the <a href="markets.html">Markets</a> page.</span>';
      t.style.animation = "none";
    }
  }

  /* ---------- theme, nav ---------- */
  function initTheme() {
    const saved = store.get("tc-theme", null);
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    $$("[data-theme-toggle]").forEach((b) => b.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", cur);
      store.set("tc-theme", cur);
    }));
  }
  function initNav() {
    const btn = $(".menu-toggle"), links = $(".nav-links");
    if (btn && links) btn.addEventListener("click", () => {
      const o = links.classList.toggle("open");
      btn.setAttribute("aria-expanded", o);
    });
    $$(".dd").forEach((dd) => {
      const b = $(".dd-btn", dd);
      if (!b) return;
      b.addEventListener("click", (e) => { e.stopPropagation(); const o = dd.classList.toggle("open"); b.setAttribute("aria-expanded", o); });
    });
    document.addEventListener("click", () => $$(".dd.open").forEach((d) => d.classList.remove("open")));
    const here = location.pathname.split("/").pop() || "index.html";
    $$(".nav-links a").forEach((a) => { if (a.getAttribute("href") === here) a.setAttribute("aria-current", "page"); });
  }

  /* ---------- private contact channel (address never rendered) ---------- */
  function addr() { try { return atob((C._k || []).join("").split("").reverse().join("")); } catch (e) { return ""; } }
  function endpoint() { return C.formEndpoint || ("https://formsubmit.co/ajax/" + addr()); }
  function initMailLinks() {
    $$("[data-mail]").forEach((a) => {
      a.setAttribute("href", "#contact");
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const subj = encodeURIComponent(a.getAttribute("data-mail") || "10Coin inquiry");
        window.location.href = "mai" + "lto:" + addr() + "?subject=" + subj;
      });
    });
  }

  /* ---------- forms ---------- */
  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 4000);
  }
  async function submitForm(form) {
    const msg = $(".form-msg", form) || (() => { const d = document.createElement("div"); d.className = "form-msg"; form.appendChild(d); return d; })();
    msg.className = "form-msg";
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if ($('input[name="_honey"]', form)?.value) return; // bot
    const fd = new FormData(form);
    const data = {};
    fd.forEach((v, k) => { if (k === "_honey") return; data[k] = data[k] ? data[k] + ", " + v : v; });
    data._subject = "[10Coin] " + (form.dataset.form || "Form") + " — " + (data.name || data.email || "new submission");
    data._template = "table";
    data._captcha = "false";
    data.page = location.href;
    data.submitted_at = new Date().toISOString();
    const btn = $('button[type="submit"]', form);
    const label = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
    try {
      const res = await fetch(endpoint(), { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(res.status);
      msg.className = "form-msg ok";
      msg.textContent = form.dataset.success || "Thanks! Your submission was received — we’ll be in touch shortly.";
      form.reset();
      if (window.gtag) window.gtag("event", "generate_lead", { form: form.dataset.form });
      form.dispatchEvent(new CustomEvent("tc:submitted"));
    } catch (e) {
      msg.className = "form-msg err";
      msg.innerHTML = 'We couldn’t send that automatically. <a href="#" data-fallback>Click here to send it by email instead</a>.';
      $("[data-fallback]", msg).addEventListener("click", (ev) => {
        ev.preventDefault();
        const body = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join("\n");
        window.location.href = "mai" + "lto:" + addr() + "?subject=" + encodeURIComponent(data._subject) + "&body=" + encodeURIComponent(body);
      });
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = label; }
    }
  }
  function initForms() {
    $$("form[data-form]").forEach((f) => {
      if (!$('input[name="_honey"]', f)) f.insertAdjacentHTML("afterbegin", '<input type="text" name="_honey" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">');
      f.addEventListener("submit", (e) => { e.preventDefault(); submitForm(f); });
    });
    // prefill from query string
    const q = new URLSearchParams(location.search);
    q.forEach((v, k) => $$(`form [name="${CSS.escape(k)}"]`).forEach((el) => {
      if (el.type === "radio" || el.type === "checkbox") { if (el.value === v) el.checked = true; } else el.value = v;
    }));
  }

  /* ---------- ads ---------- */
  function initAds() {
    const slots = $$(".ad-slot");
    if (!C.adsenseClient) {
      slots.forEach((s) => { s.innerHTML = `<div><span class="ad-label">Advertisement</span>Your brand here — reach coin collectors & crypto investors.<br><a href="advertise.html">Advertise on 10Coin →</a></div>`; });
      return;
    }
    const sc = document.createElement("script");
    sc.async = true; sc.crossOrigin = "anonymous";
    sc.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + C.adsenseClient;
    document.head.appendChild(sc);
    slots.forEach((s) => {
      const slotId = (C.adsenseSlots || {})[s.dataset.slot] || "";
      s.classList.add("filled");
      s.innerHTML = `<span class="ad-label">Advertisement</span><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(C.adsenseClient)}" ${slotId ? `data-ad-slot="${esc(slotId)}"` : ""} data-ad-format="auto" data-full-width-responsive="true"></ins>`;
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    });
  }
  function initGA() {
    if (!C.ga4) return;
    const s = document.createElement("script"); s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + C.ga4; document.head.appendChild(s);
    window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); };
    gtag("js", new Date()); gtag("config", C.ga4, { anonymize_ip: true });
  }

  /* ---------- cookie notice + newsletter modal ---------- */
  function initCookie() {
    const c = $(".cookie");
    if (!c || store.get("tc-cookie", false)) return;
    c.classList.add("show");
    $$("[data-cookie]", c).forEach((b) => b.addEventListener("click", () => { store.set("tc-cookie", b.dataset.cookie); c.classList.remove("show"); }));
  }
  function initModal() {
    const m = $("#newsletter-modal");
    if (!m) return;
    const close = () => { m.classList.remove("open"); store.set("tc-nl-seen", Date.now()); };
    $$("[data-close]", m).forEach((b) => b.addEventListener("click", close));
    m.addEventListener("click", (e) => { if (e.target === m) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    $$("[data-open-newsletter]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); m.classList.add("open"); }));
    const seen = store.get("tc-nl-seen", 0);
    if (Date.now() - seen < 5 * 86400000) return;
    let shown = false;
    const show = () => { if (!shown) { shown = true; m.classList.add("open"); } };
    setTimeout(show, 45000);
    document.addEventListener("mouseout", (e) => { if (!e.relatedTarget && e.clientY < 5) show(); });
  }

  /* ---------- donation buttons ---------- */
  function initDonate() {
    const D = C.donate || {};
    $$("[data-donate]").forEach((b) => {
      const k = b.dataset.donate;
      if (D[k]) { b.href = D[k]; b.target = "_blank"; b.rel = "noopener"; }
      else {
        b.href = "support.html#pledge";
        b.addEventListener("click", () => { const amt = b.dataset.amount; const f = $('#pledge [name="amount"]'); if (f && amt) f.value = amt; });
      }
    });
    $$("[data-affiliate]").forEach((a) => { const u = (C.affiliates || {})[a.dataset.affiliate]; if (u) { a.href = u; a.target = "_blank"; a.rel = "sponsored noopener"; } });
  }

  function initYear() { $$("[data-year]").forEach((e) => (e.textContent = new Date().getFullYear())); }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.style.opacity = 1; e.target.style.transform = "none"; io.unobserve(e.target); } }), { threshold: 0.08 });
    $$(".reveal").forEach((el) => { el.style.opacity = 0; el.style.transform = "translateY(12px)"; el.style.transition = "opacity .5s, transform .5s"; io.observe(el); });
  }

  window.TC = { $, $$, store, money, pct, sparkline, esc, api, STABLES, toast, CUR_SYM, config: C };

  document.addEventListener("DOMContentLoaded", () => {
    initTheme(); initNav(); initMailLinks(); initForms(); initAds(); initGA();
    initCookie(); initModal(); initDonate(); initYear(); initReveal(); initTicker();
  });
})();
