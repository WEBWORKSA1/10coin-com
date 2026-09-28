/* 10Coin.com — markets, top-10 index, heatmap, gauge, watchlist */
(function () {
  "use strict";
  const { $, $$, store, money, pct, sparkline, esc, api, STABLES } = window.TC;
  let state = { cur: store.get("tc-cur", "usd"), data: [], sort: { k: "market_cap_rank", dir: 1 }, filter: "all", q: "" };
  const watch = () => store.get("tc-watch", []);

  function row(c, i) {
    const on = watch().includes(c.id);
    return `<tr>
      <td class="l"><button class="star ${on ? "on" : ""}" data-star="${esc(c.id)}" aria-label="Toggle watchlist for ${esc(c.name)}">${on ? "★" : "☆"}</button> ${c.market_cap_rank || i + 1}</td>
      <td class="l"><span class="coin-cell"><img src="${esc(c.image)}" alt="" loading="lazy" width="24" height="24">${esc(c.name)} <small>${esc(c.symbol)}</small></span></td>
      <td class="num">${money(c.current_price, state.cur)}</td>
      <td class="num">${pct(c.price_change_percentage_1h_in_currency)}</td>
      <td class="num">${pct(c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h)}</td>
      <td class="num">${pct(c.price_change_percentage_7d_in_currency)}</td>
      <td class="num">${money(c.total_volume, state.cur, true)}</td>
      <td class="num">${money(c.market_cap, state.cur, true)}</td>
      <td>${sparkline(c.sparkline_in_7d && c.sparkline_in_7d.price)}</td>
    </tr>`;
  }
  const HEAD = `<thead><tr><th class="l" data-k="market_cap_rank">#</th><th class="l" data-k="name">Coin</th><th data-k="current_price">Price</th><th data-k="price_change_percentage_1h_in_currency">1h</th><th data-k="price_change_percentage_24h_in_currency">24h</th><th data-k="price_change_percentage_7d_in_currency">7d</th><th data-k="total_volume">Volume 24h</th><th data-k="market_cap">Market cap</th><th>Last 7 days</th></tr></thead>`;

  function renderTable(el, list) {
    el.innerHTML = HEAD + "<tbody>" + (list.length ? list.map(row).join("") : `<tr><td colspan="9" class="center muted">No coins match. ${state.filter === "watch" ? "Tap ☆ on any coin to add it to your watchlist." : ""}</td></tr>`) + "</tbody>";
    $$("th[data-k]", el).forEach((th) => th.addEventListener("click", () => {
      const k = th.dataset.k;
      state.sort = { k, dir: state.sort.k === k ? -state.sort.dir : (k === "name" || k === "market_cap_rank" ? 1 : -1) };
      draw();
    }));
    $$("[data-star]", el).forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.star; let w = watch();
      w = w.includes(id) ? w.filter((x) => x !== id) : w.concat(id);
      store.set("tc-watch", w); draw();
    }));
  }
  function filtered() {
    let l = state.data.slice();
    if (state.filter === "watch") l = l.filter((c) => watch().includes(c.id));
    if (state.filter === "gainers") l = l.sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)).slice(0, 20);
    if (state.filter === "losers") l = l.sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0)).slice(0, 20);
    if (state.filter === "nostable") l = l.filter((c) => !STABLES.includes(c.id));
    if (state.q) { const q = state.q.toLowerCase(); l = l.filter((c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)); }
    if (state.filter !== "gainers" && state.filter !== "losers") {
      const { k, dir } = state.sort;
      l.sort((a, b) => { const x = a[k], y = b[k]; if (typeof x === "string") return x.localeCompare(y) * dir; return ((x ?? -Infinity) - (y ?? -Infinity)) * dir; });
    }
    return l;
  }
  function draw() { const el = $("#market-table"); if (el) renderTable(el, filtered()); }

  function renderHeat(list) {
    const el = $("#heatmap"); if (!el) return;
    el.innerHTML = list.filter((c) => !STABLES.includes(c.id)).slice(0, 48).map((c) => {
      const p = c.price_change_percentage_24h || 0;
      const a = Math.min(1, Math.abs(p) / 8) * 0.75 + 0.25;
      const bg = p >= 0 ? `rgba(22,199,132,${a})` : `rgba(234,57,67,${a})`;
      return `<div class="heat" style="background:${bg}" title="${esc(c.name)}"><span>${esc(c.symbol.toUpperCase())}</span><small>${p >= 0 ? "+" : ""}${p.toFixed(2)}%</small></div>`;
    }).join("");
  }

  function renderTop10(list) {
    const el = $("#top10-table"); if (!el) return;
    const top = list.filter((c) => !STABLES.includes(c.id)).slice(0, 10);
    el.innerHTML = HEAD + "<tbody>" + top.map(row).join("") + "</tbody>";
    $$("th", el).forEach((th) => (th.style.cursor = "default"));
    // equal-weight Top-10 index (24h)
    const idx = top.reduce((s, c) => s + (c.price_change_percentage_24h || 0), 0) / (top.length || 1);
    const i7 = top.reduce((s, c) => s + (c.price_change_percentage_7d_in_currency || 0), 0) / (top.length || 1);
    const set = (id, h) => { const e = $(id); if (e) e.innerHTML = h; };
    set("#idx-24h", pct(idx)); set("#idx-7d", pct(i7));
    const best = top.slice().sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)[0];
    if (best) set("#idx-best", `${esc(best.symbol.toUpperCase())} ${pct(best.price_change_percentage_24h)}`);
  }

  async function renderGlobal() {
    try {
      const g = (await api.global()).data;
      const set = (id, h) => { const e = $(id); if (e) e.innerHTML = h; };
      set("#g-mcap", money(g.total_market_cap[state.cur] || g.total_market_cap.usd, state.cur, true) + " " + pct(g.market_cap_change_percentage_24h_usd));
      set("#g-vol", money(g.total_volume[state.cur] || g.total_volume.usd, state.cur, true));
      set("#g-btc", (g.market_cap_percentage.btc || 0).toFixed(1) + "%");
      set("#g-coins", (g.active_cryptocurrencies || 0).toLocaleString());
    } catch (e) { /* silent */ }
  }
  async function renderFng() {
    const el = $("#fng"); if (!el) return;
    try {
      const d = (await api.fng()).data[0];
      const v = +d.value, ang = -90 + v * 1.8;
      const col = v < 25 ? "#ea3943" : v < 45 ? "#f39c12" : v < 55 ? "#f5b82e" : v < 75 ? "#93d900" : "#16c784";
      el.innerHTML = `<div class="gauge"><svg viewBox="0 0 200 110" role="img" aria-label="Fear and Greed ${v}">
        <path d="M10 100 A90 90 0 0 1 190 100" fill="none" stroke="var(--card2)" stroke-width="16" stroke-linecap="round"/>
        <path d="M10 100 A90 90 0 0 1 190 100" fill="none" stroke="${col}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${(v / 100 * 283).toFixed(0)} 400"/>
        <line x1="100" y1="100" x2="100" y2="30" stroke="var(--text)" stroke-width="3" transform="rotate(${ang} 100 100)" stroke-linecap="round"/><circle cx="100" cy="100" r="6" fill="var(--text)"/></svg>
        <div class="g-val">${v}</div></div><p class="center" style="margin:6px 0 0;font-weight:700;color:${col}">${esc(d.value_classification)}</p>`;
    } catch (e) { el.innerHTML = '<p class="muted center small">Sentiment index temporarily unavailable.</p>'; }
  }
  async function renderTrending() {
    const el = $("#trending"); if (!el) return;
    try {
      const t = (await api.trending()).coins.slice(0, 7);
      el.innerHTML = t.map((x, i) => `<li class="coin-cell" style="justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)"><span class="coin-cell"><span class="muted">${i + 1}</span><img src="${esc(x.item.thumb)}" alt="" width="22" height="22" loading="lazy">${esc(x.item.name)} <small>${esc(x.item.symbol)}</small></span><span class="small muted">#${x.item.market_cap_rank || "—"}</span></li>`).join("");
    } catch (e) { el.innerHTML = '<li class="muted small">Trending list unavailable right now.</li>'; }
  }
  async function renderMetals() {
    const el = $("#metals"); if (!el) return;
    try {
      const m = await api.metals(state.cur);
      window.TC.metals = m;
      el.innerHTML = `<div class="stat card"><div class="label">Gold ≈ (per troy oz)</div><div class="value num">${money(m.gold, state.cur)}</div>${pct(m.goldChg)}</div>
        <div class="stat card"><div class="label">Silver ≈ (per troy oz)</div><div class="value num">${money(m.silver, state.cur)}</div>${pct(m.silverChg)}</div>
        <div class="stat card"><div class="label">Gold / Silver ratio</div><div class="value num">${m.gold && m.silver ? (m.gold / m.silver).toFixed(1) : "—"}</div><span class="muted small">oz of silver per oz of gold</span></div>`;
      document.dispatchEvent(new CustomEvent("tc:metals", { detail: m }));
    } catch (e) { el.innerHTML = '<p class="muted small">Metal reference prices unavailable — enter spot prices manually in the <a href="tools.html#melt">melt calculator</a>.</p>'; }
  }

  async function load() {
    const need = $("#market-table") || $("#top10-table") || $("#heatmap");
    renderGlobal(); renderFng(); renderTrending(); renderMetals();
    if (!need) return;
    const skel = "<tbody>" + Array.from({ length: 8 }, () => `<tr><td colspan="9"><div class="skeleton"></div></td></tr>`).join("") + "</tbody>";
    ["#market-table", "#top10-table"].forEach((s) => { const e = $(s); if (e) e.innerHTML = HEAD + skel; });
    try {
      const n = $("#market-table") ? 100 : 25;
      state.data = await api.markets(state.cur, n, true);
      draw(); renderTop10(state.data); renderHeat(state.data);
      const u = $("#updated"); if (u) u.textContent = "Updated " + new Date().toLocaleTimeString();
    } catch (e) {
      ["#market-table", "#top10-table"].forEach((s) => { const el = $(s); if (el) el.innerHTML = `<tbody><tr><td class="center muted" style="padding:30px">Live market data is temporarily rate-limited. Please refresh in a minute.</td></tr></tbody>`; });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const cs = $("#currency");
    if (cs) { cs.value = state.cur; cs.addEventListener("change", () => { state.cur = cs.value; store.set("tc-cur", state.cur); load(); }); }
    $$("[data-filter]").forEach((p) => p.addEventListener("click", () => {
      $$("[data-filter]").forEach((x) => x.classList.remove("active")); p.classList.add("active");
      state.filter = p.dataset.filter; draw();
    }));
    const s = $("#coin-search"); if (s) s.addEventListener("input", () => { state.q = s.value.trim(); draw(); });
    load();
    setInterval(() => { if (!document.hidden) load(); }, 180000);
  });
})();
