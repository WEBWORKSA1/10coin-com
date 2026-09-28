/* 10Coin.com — calculators, coin value guide, lead funnel, contests, glossary, videos */
(function () {
  "use strict";
  const { $, $$, store, money, esc, api } = window.TC;
  const C = window.TENCOIN_CONFIG || {};
  const num = (el) => parseFloat(($(el) || {}).value) || 0;

  /* ---------- Crypto converter ---------- */
  async function converter() {
    const f = $("#conv"); if (!f) return;
    const sel = $("#conv-coin"), cur = $("#conv-cur"), amt = $("#conv-amt"), out = $("#conv-out");
    let list = [];
    try {
      list = (await api.markets("usd", 50, false)).filter((c) => !["tether", "usd-coin"].includes(c.id) || true);
      sel.innerHTML = list.map((c) => `<option value="${esc(c.id)}">${esc(c.name)} (${esc(c.symbol.toUpperCase())})</option>`).join("");
    } catch (e) { out.textContent = "Live prices unavailable — try again shortly."; return; }
    async function calc() {
      try {
        const d = await api.byIds([sel.value], cur.value);
        const p = d[0] ? d[0].current_price : 0;
        out.innerHTML = `${(+amt.value || 0).toLocaleString()} ${esc(d[0].symbol.toUpperCase())} = <b class="num">${money((+amt.value || 0) * p, cur.value)}</b><br><span class="small muted">1 ${esc(d[0].symbol.toUpperCase())} = ${money(p, cur.value)}</span>`;
      } catch (e) { out.textContent = "Rate-limited — wait a moment and retry."; }
    }
    [sel, cur, amt].forEach((e) => e.addEventListener("input", calc));
    calc();
  }

  /* ---------- Profit / ROI ---------- */
  function roi() {
    const f = $("#roi"); if (!f) return;
    const run = () => {
      const inv = num("#roi-inv"), buy = num("#roi-buy"), sell = num("#roi-sell"), fee = num("#roi-fee") / 100;
      if (!inv || !buy) { $("#roi-out").textContent = "Enter an investment and buy price."; return; }
      const units = (inv * (1 - fee)) / buy;
      const exit = units * sell * (1 - fee);
      const pnl = exit - inv;
      $("#roi-out").innerHTML = `Units: <b class="num">${units.toLocaleString(undefined, { maximumFractionDigits: 8 })}</b><br>Exit value: <b class="num">${money(exit)}</b><br>Profit / loss: <b class="num ${pnl >= 0 ? "up" : "down"}">${money(pnl)} (${((pnl / inv) * 100).toFixed(2)}%)</b><br><span class="small muted">Break-even sell price: ${money(buy / Math.pow(1 - fee, 2))}</span>`;
    };
    $$("input", f).forEach((i) => i.addEventListener("input", run)); run();
  }

  /* ---------- If you had invested ---------- */
  async function history() {
    const f = $("#hist"); if (!f) return;
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const out = $("#hist-out"); out.textContent = "Fetching historical price…";
      const id = $("#hist-coin").value, amt = num("#hist-amt"), date = $("#hist-date").value;
      if (!date) { out.textContent = "Pick a date."; return; }
      const [y, m, d] = date.split("-");
      try {
        const [h, now] = await Promise.all([api.history(id, `${d}-${m}-${y}`), api.byIds([id])]);
        const then = h.market_data && h.market_data.current_price.usd;
        if (!then) throw new Error("no data");
        const val = (amt / then) * now[0].current_price;
        out.innerHTML = `${money(amt)} in ${esc(now[0].name)} on ${esc(date)} (at ${money(then)}) would be worth <b class="num ${val >= amt ? "up" : "down"}">${money(val)}</b> today — ${(((val - amt) / amt) * 100).toFixed(1)}%.`;
      } catch (err) { out.textContent = "No data for that date (the free API covers roughly the last 365 days). Try a more recent date."; }
    });
    const di = $("#hist-date"); if (di) { const t = new Date(Date.now() - 180 * 864e5); di.value = t.toISOString().slice(0, 10); di.max = new Date().toISOString().slice(0, 10); }
  }

  /* ---------- Melt value ---------- */
  const MELT = [
    { k: "us-dime-90", n: "US dime (1964 & earlier, 90% silver)", m: "silver", oz: 0.07234 },
    { k: "us-quarter-90", n: "US quarter (1964 & earlier, 90% silver)", m: "silver", oz: 0.18084 },
    { k: "us-half-90", n: "US half dollar (1964 & earlier, 90% silver)", m: "silver", oz: 0.36169 },
    { k: "us-half-40", n: "US Kennedy half (1965–1970, 40% silver)", m: "silver", oz: 0.14792 },
    { k: "us-dollar-90", n: "US Morgan / Peace dollar (90% silver)", m: "silver", oz: 0.77344 },
    { k: "us-war-nickel", n: "US 'war' nickel (1942–45, 35% silver)", m: "silver", oz: 0.05626 },
    { k: "ca-dime-80", n: "Canada 10¢ (1966 & earlier, 80% silver)", m: "silver", oz: 0.06 },
    { k: "ca-quarter-80", n: "Canada 25¢ (1966 & earlier, 80% silver)", m: "silver", oz: 0.15 },
    { k: "ca-50-80", n: "Canada 50¢ (1966 & earlier, 80% silver)", m: "silver", oz: 0.3 },
    { k: "ca-dollar-80", n: "Canada $1 (1966 & earlier, 80% silver)", m: "silver", oz: 0.6 },
    { k: "eagle-silver", n: "American Silver Eagle (1 oz)", m: "silver", oz: 1 },
    { k: "maple-silver", n: "Silver Maple Leaf (1 oz)", m: "silver", oz: 1 },
    { k: "eagle-gold", n: "American Gold Eagle (1 oz)", m: "gold", oz: 1 },
    { k: "maple-gold", n: "Gold Maple Leaf (1 oz)", m: "gold", oz: 1 },
    { k: "krugerrand", n: "Krugerrand (1 oz)", m: "gold", oz: 1 },
    { k: "sovereign", n: "British Sovereign", m: "gold", oz: 0.2354 }
  ];
  function melt() {
    const f = $("#melt"); if (!f) return;
    $("#melt-coin").innerHTML = MELT.map((x) => `<option value="${x.k}">${esc(x.n)}</option>`).join("");
    const run = () => {
      const c = MELT.find((x) => x.k === $("#melt-coin").value);
      const spot = c.m === "gold" ? num("#melt-gold") : num("#melt-silver");
      const q = num("#melt-qty") || 1;
      const v = c.oz * spot * q;
      $("#melt-out").innerHTML = `${q} × ${esc(c.n)} contains <b>${(c.oz * q).toFixed(4)} troy oz</b> of ${c.m}.<br>Melt value ≈ <b class="num">${money(v)}</b><br><span class="small muted">Dealers typically pay a percentage of melt; numismatic (collector) value can be far higher — <a href="appraisal.html?item=coins">request a free valuation</a>.</span>`;
    };
    $$("input,select", f).forEach((i) => i.addEventListener("input", run));
    document.addEventListener("tc:metals", (e) => {
      if (e.detail.gold && !$("#melt-gold").dataset.touched) $("#melt-gold").value = e.detail.gold.toFixed(2);
      if (e.detail.silver && !$("#melt-silver").dataset.touched) $("#melt-silver").value = e.detail.silver.toFixed(2);
      run();
    });
    ["#melt-gold", "#melt-silver"].forEach((s) => $(s).addEventListener("input", () => ($(s).dataset.touched = 1)));
    api.metals("usd").then((m) => document.dispatchEvent(new CustomEvent("tc:metals", { detail: m }))).catch(() => {});
    run();
  }

  /* ---------- 10-coin savings habit (compound) ---------- */
  function savings() {
    const f = $("#save"); if (!f) return;
    const run = () => {
      const daily = num("#save-daily"), yrs = num("#save-years"), r = num("#save-rate") / 100;
      let bal = 0; const monthly = daily * 30.4375, mr = r / 12, rows = [];
      for (let m = 1; m <= yrs * 12; m++) { bal = bal * (1 + mr) + monthly; if (m % 12 === 0) rows.push(bal); }
      const paid = monthly * yrs * 12;
      $("#save-out").innerHTML = `Contributed: <b class="num">${money(paid)}</b><br>Projected balance: <b class="num up">${money(bal)}</b><br>Growth: <b class="num">${money(bal - paid)}</b>`;
      const max = Math.max(...rows, 1);
      $("#save-chart").innerHTML = rows.map((v, i) => `<div title="Year ${i + 1}: ${money(v)}" style="flex:1;background:linear-gradient(180deg,var(--brand),var(--accent));height:${(v / max) * 100}%;border-radius:4px 4px 0 0;min-width:4px"></div>`).join("");
    };
    $$("input", f).forEach((i) => i.addEventListener("input", run)); run();
  }

  /* ---------- Coin value guide ---------- */
  function values() {
    const t = $("#values-table"); if (!t || !window.COIN_VALUES) return;
    let country = "all", q = "";
    const draw = () => {
      const l = window.COIN_VALUES.filter((c) => (country === "all" || c.country === country) && (!q || (c.name + c.why + c.year).toLowerCase().includes(q)));
      t.innerHTML = `<thead><tr><th class="l">Coin</th><th class="l">Country</th><th class="l">Why it's valuable</th><th>Indicative value range</th><th class="l">Check</th></tr></thead><tbody>` +
        (l.length ? l.map((c) => `<tr><td class="l"><b>${esc(c.name)}</b></td><td class="l">${esc(c.country)}</td><td class="l" style="white-space:normal;min-width:260px">${esc(c.why)}</td><td class="num"><b>${esc(c.range)}</b></td><td class="l"><a href="appraisal.html?item=coins&coin=${encodeURIComponent(c.name)}" class="btn btn-sm btn-ghost">Value mine</a></td></tr>`).join("") : `<tr><td colspan="5" class="center muted">No matches — <a href="appraisal.html">ask our team</a>.</td></tr>`) + "</tbody>";
    };
    $$("[data-country]").forEach((p) => p.addEventListener("click", () => { $$("[data-country]").forEach((x) => x.classList.remove("active")); p.classList.add("active"); country = p.dataset.country; draw(); }));
    const s = $("#value-search"); if (s) s.addEventListener("input", () => { q = s.value.toLowerCase().trim(); draw(); });
    draw();
  }

  /* ---------- Grade quiz ---------- */
  function gradeQuiz() {
    const f = $("#grade-quiz"); if (!f) return;
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const s = $$("input:checked", f).reduce((a, i) => a + +i.value, 0);
      const g = s >= 11 ? ["MS-60 to MS-70 (Mint State)", "No wear. Luster intact. Worth a professional grade."] :
        s >= 8 ? ["AU-50 to AU-58 (About Uncirculated)", "Trace wear on high points only."] :
        s >= 6 ? ["XF-40 to XF-45 (Extremely Fine)", "Light wear; all major details sharp."] :
        s >= 4 ? ["VF-20 to VF-35 (Very Fine)", "Moderate wear; major details clear."] :
        s >= 2 ? ["F-12 to F-15 (Fine)", "Even, moderate-to-heavy wear."] : ["G-4 to VG-10 (Good / Very Good)", "Heavy wear; outline and main design visible."];
      $("#grade-out").innerHTML = `<b>Estimated range: ${g[0]}</b><br>${g[1]} <a href="appraisal.html?item=coins&goal=appraise">Get a free expert opinion →</a>`;
    });
  }

  /* ---------- Multi-step lead funnel ---------- */
  function funnel() {
    const f = $("#lead-funnel"); if (!f) return;
    const steps = $$(".step", f), bar = $(".progress span", f.parentElement) || $(".progress span");
    let i = 0;
    const show = (n) => {
      steps.forEach((s, k) => s.classList.toggle("active", k === n));
      if (bar) bar.style.width = ((n + 1) / steps.length) * 100 + "%";
      const lab = $("#step-label"); if (lab) lab.textContent = `Step ${n + 1} of ${steps.length}`;
      i = n;
    };
    const valid = () => {
      const req = $$("[required]", steps[i]);
      for (const el of req) {
        if (el.type === "radio") { if (!$(`input[name="${el.name}"]:checked`, steps[i])) { window.TC.toast("Please choose an option to continue."); return false; } }
        else if (!el.checkValidity()) { el.reportValidity(); return false; }
      }
      return true;
    };
    $$("[data-next]", f).forEach((b) => b.addEventListener("click", () => { if (valid()) show(Math.min(i + 1, steps.length - 1)); }));
    $$("[data-prev]", f).forEach((b) => b.addEventListener("click", () => show(Math.max(i - 1, 0))));
    $$(".choice input[type=radio]", f).forEach((r) => r.addEventListener("change", () => { if (r.closest(".step").dataset.auto !== undefined) setTimeout(() => show(Math.min(i + 1, steps.length - 1)), 180); }));
    f.addEventListener("tc:submitted", () => show(0));
    // skip auto-steps already answered via URL prefill (e.g. ?item=coins&goal=sell)
    let start = 0;
    while (start < steps.length - 1 && steps[start].dataset.auto !== undefined && $("input[type=radio]:checked", steps[start])) start++;
    show(start);
  }

  /* ---------- Countdown ---------- */
  function countdown() {
    $$("[data-countdown]").forEach((el) => {
      const now = new Date();
      const end = el.dataset.countdown === "month" ? new Date(now.getFullYear(), now.getMonth() + 1, 1) : new Date(el.dataset.countdown);
      const tick = () => {
        let s = Math.max(0, (end - Date.now()) / 1000);
        const d = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60); s = Math.floor(s % 60);
        el.innerHTML = [[d, "days"], [h, "hrs"], [m, "min"], [s, "sec"]].map(([v, l]) => `<div><b class="num">${String(v).padStart(2, "0")}</b><small>${l}</small></div>`).join("");
      };
      tick(); setInterval(tick, 1000);
    });
    $$("[data-month-name]").forEach((e) => (e.textContent = new Date().toLocaleString("en-US", { month: "long", year: "numeric" })));
  }

  /* ---------- Glossary search ---------- */
  function glossary() {
    const s = $("#gloss-search"); if (!s) return;
    s.addEventListener("input", () => {
      const q = s.value.toLowerCase();
      $$(".glossary dt").forEach((dt) => { const dd = dt.nextElementSibling; const hit = (dt.textContent + dd.textContent).toLowerCase().includes(q); dt.hidden = dd.hidden = !hit; });
    });
  }

  /* ---------- Videos ---------- */
  function videos() {
    const el = $("#video-grid"); if (!el) return;
    const vids = C.youtubeVideos || [];
    const lite = (v) => `<div class="card" style="padding:12px"><div class="video" data-yt="${esc(v.id)}" role="button" tabindex="0" aria-label="Play ${esc(v.title)}"><img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="" loading="lazy"><span class="play"></span></div><h3 style="margin:10px 0 0;font-size:1rem">${esc(v.title)}</h3><span class="badge">${esc(v.cat || "Video")}</span></div>`;
    if (vids.length) {
      el.insertAdjacentHTML("afterbegin", vids.map(lite).join(""));
      $$("[data-yt]", el).forEach((v) => { const play = () => { v.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.dataset.yt}?autoplay=1&rel=0" title="YouTube video" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`; }; v.addEventListener("click", play); v.addEventListener("keydown", (e) => { if (e.key === "Enter") play(); }); });
    }
    const ch = $("#yt-channel"); if (ch && C.youtubeChannel) { ch.href = C.youtubeChannel; ch.hidden = false; }
  }

  /* ---------- Browser price alerts ---------- */
  function alerts() {
    const f = $("#alert-form"); if (!f) return;
    const list = $("#alert-list");
    const draw = () => { const a = store.get("tc-alerts", []); list.innerHTML = a.length ? a.map((x, i) => `<li>${esc(x.sym)} ${x.dir === "above" ? "≥" : "≤"} ${money(x.price)} <button class="btn btn-sm btn-ghost" data-del="${i}">Remove</button></li>`).join("") : '<li class="muted small">No alerts yet.</li>'; $$("[data-del]", list).forEach((b) => b.addEventListener("click", () => { const a = store.get("tc-alerts", []); a.splice(+b.dataset.del, 1); store.set("tc-alerts", a); draw(); })); };
    api.markets("usd", 50, false).then((l) => { $("#alert-coin").innerHTML = l.map((c) => `<option value="${esc(c.id)}|${esc(c.symbol.toUpperCase())}">${esc(c.name)}</option>`).join(""); }).catch(() => {});
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const [id, sym] = $("#alert-coin").value.split("|");
      const a = store.get("tc-alerts", []); a.push({ id, sym, dir: $("#alert-dir").value, price: num("#alert-price") }); store.set("tc-alerts", a); draw();
      if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
      window.TC.toast("Alert saved in this browser.");
    });
    draw();
    const check = async () => {
      const a = store.get("tc-alerts", []); if (!a.length) return;
      try {
        const d = await api.byIds([...new Set(a.map((x) => x.id))]);
        const hit = a.filter((x) => { const c = d.find((y) => y.id === x.id); return c && (x.dir === "above" ? c.current_price >= x.price : c.current_price <= x.price); });
        hit.forEach((x) => { const m = `${x.sym} is ${x.dir} ${money(x.price)}`; window.TC.toast("🔔 " + m); if ("Notification" in window && Notification.permission === "granted") new Notification("10Coin price alert", { body: m }); });
        if (hit.length) store.set("tc-alerts", a.filter((x) => !hit.includes(x)));
        draw();
      } catch (e) {}
    };
    check(); setInterval(check, 180000);
  }

  document.addEventListener("DOMContentLoaded", () => {
    converter(); roi(); history(); melt(); savings(); values(); gradeQuiz(); funnel(); countdown(); glossary(); videos(); alerts();
  });
})();
