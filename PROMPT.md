# 10Coin.com — Concept, Revenue Logic & Phase-Wise Build Prompt

## 1. The winning idea

**10Coin.com = "Coin intelligence hub": collectible coin values + live top-10 crypto & bullion data + free tools + free-valuation lead engine.**

Why this beats the alternatives (pure crypto tracker, pure numismatics blog, token project):

| Option | Traffic ceiling | Ad RPM | Lead value | Moat vs. giants | Trademark risk | Verdict |
|---|---|---|---|---|---|---|
| Pure crypto price tracker | High | High (finance) | Medium (exchange CPA) | Very low: CoinGecko/CMC own the SERPs | **Elevated**: a "10COIN" US application (crypto rewards, classes 35/42) exists and TENC/TEN tokens exist | ❌ |
| Launch a "10Coin" token | Speculative | n/a | n/a | n/a | High + securities/regulatory risk | ❌ |
| Pure coin-values blog | Very high, evergreen ("what is my penny worth", "valuable quarters") | Medium–high | **High** (estates, sell/appraise) | Medium: SERPs full of thin listicles | Low | ✅ core |
| **Hybrid hub (chosen)** | Evergreen coin-value SEO + daily-return crypto/bullion users | Blended high | **High**: valuation, sell-coins, bullion, crypto-tax referrals | Tools + human valuation + "Top 10" brand hook | Low (positioned as an information site, with a disclaimer) | ✅✅ |

The "10" in the name becomes the content system: Top 10 crypto, 10 valuable pennies, 10 red flags, 10-minute guides, the 10Coin Top-10 index, and The 10Coin Brief ("10 things worth knowing").

## 2. Revenue model (assumption-driven; validate with real analytics)

Scenario: **50,000 sessions/month** (realistic 9–15 months after launch with ~150 value-guide pages).

| Stream | Assumption | Monthly |
|---|---|---|
| AdSense display | 2.2 pageviews/session, 110k PV, RPM $8–15 | $880 – $1,650 |
| Valuation / sell-coins leads | 1.2% conversion = 600 leads; 25% qualified, sold or referred at $15–40 | $2,250 – $6,000 |
| Bullion dealer affiliate | 0.3% click-to-buy, $30 average commission | $450 |
| Crypto exchange / tax-software affiliate | 0.2% × $40 CPA | $400 |
| Sponsorship (newsletter, tool, contest) | 1–3 sponsors | $500 – $3,000 |
| Donations | 0.05% of sessions × $15 | ~$375 |
| **Total** | | **≈ $4.8k – $11.9k / month** |

Leads, not ads, are the profit engine: one estate-collection lead can be worth more than 10,000 pageviews. That's why the valuation funnel sits in the header, the hero, the mobile sticky bar and every value table row.

## 3. Benchmark research (37 sites analysed)

- **Crypto data:** CoinGecko, CoinMarketCap, CoinPaprika, CoinCodex, LiveCoinWatch, CryptoRank, DefiLlama, TradingView, CoinStats, CryptoCompare, Coinranking.
- **News and education:** CoinDesk, Cointelegraph, Decrypt, The Block, Bitcoin.org, Coinbase Learn, Binance Academy, CryptoSlate.
- **Numismatics and bullion:** PCGS, NGC, Numista, USA CoinBook, CoinWeek, Coin World, Greysheet, Heritage, APMEX, JM Bullion, CoinValues, CoinSite, goldprice.org.
- **Lead-generation benchmarks:** NerdWallet, Bankrate, MoneySavingExpert, SmartAsset, Kitco.

Two sites blocked access (Messari, Investopedia), and substitutes were used instead.

**Patterns adopted:**
- Live ticker, sortable market table with sparklines, watchlist, and gainers/losers.
- Heatmap and Fear & Greed gauge.
- Converter, ROI calculator, "if you had invested", melt calculator and price alerts.
- Value lookup table, Sheldon grading guide with a quiz, glossary and scam red flags.
- A SmartAsset-style multi-step lead funnel: single-tap choices first, contact details last.
- Heritage-style "Free Appraisal" CTAs, and a MoneySavingExpert-style free weekly email.
- Sponsored labels, an editorial standards statement, dark navy/gold visual language and a mobile sticky CTA.

---

## 4. Phase-wise build prompt (reusable)

> Copy each phase into your AI builder in order. Each phase must be completed and tested before the next.

### Phase 0 — Guardrails (paste first, applies to all phases)
```
You are building 10Coin.com, a static, GitHub Pages–compatible website (HTML/CSS/vanilla JS, no server).
Rules:
- Brand: "10Coin" is only the website/domain name. Never present it as a token, coin offering or rewards program. Include a trademark disclaimer stating non-affiliation with any "10COIN"/"TenCoin" mark, token or project.
- Every page begins with a top bar: "Contact, if you are interested in this website / domain name / Sponsorship / Advertisement / Partnership" linking to https://web.works/contact.
- All forms and mail links deliver to ONE private inbox. The address must never appear in HTML, text, meta tags or README. Store it obfuscated (reversed base64 chunks in config.js), decode only at submit/click time, and post via FormSubmit AJAX with a mailto fallback.
- Mobile-first, WCAG AA, dark/light mode, no horizontal scroll at 360px, Lighthouse ≥ 90.
- No fabricated statistics, testimonials or user counts.
```

### Phase 1 — Architecture & design system
```
Create: /assets/css/style.css (design tokens: navy #0b1020 background, gold #f5b82e brand, teal #3dd6b0 accent, green/red for up/down; Inter + Space Grotesk), /assets/js/config.js (all monetization IDs: adsenseClient, adsenseSlots, ga4, youtubeChannel, youtubeVideos[], donate links, crypto wallets, fundraising goal, affiliates, formEndpoint), /assets/js/app.js (theme, nav, ticker, forms, ads, cookie notice, newsletter modal), and a Jekyll layout (built natively by GitHub Pages) plus a Python generator that wraps page bodies in a shared header/footer and emits SEO meta, Open Graph, JSON-LD (WebSite, Organization, BreadcrumbList, auto-FAQPage from <details data-faq>), sitemap.xml and robots.txt.
Header: logo, Home, Markets, Coin Values, Tools, Learn, Videos, More ▾ (Contests, Support, Careers, Advertise, About, Contact), "Free Coin Valuation" CTA, theme toggle, mobile menu. Footer: newsletter form, 4 link columns, legal links, copyright and trademark notice. Mobile sticky CTA bar.
```

### Phase 2 — Live data layer
```
Use the CoinGecko public API (client-side, with sessionStorage caching for 3 minutes and graceful fallbacks): /coins/markets (top 100, sparkline, 1h/24h/7d), /global, /search/trending, /coins/{id}/history, and /simple/price for pax-gold, tether-gold and kinesis-silver as ≈1 oz gold/silver references. Add the Alternative.me Fear & Greed index. Build: a scrolling ticker (gold, silver and top 10 non-stable coins), a sortable/searchable market table with a currency switch (USD/CAD/EUR/GBP/INR/AUD), a localStorage watchlist, gainers/losers filters, a heatmap, an SVG gauge, and an equal-weight "10Coin Top-10 index" (24h, 7d, best performer). Auto-refresh every 3 minutes while visible.
```

### Phase 3 — Money pages (SEO core)
```
coin-values.html: searchable table of 40 valuable coins (USA, Canada, UK, Euro, India) with "why it's valuable", an indicative range, and a "Value mine" button deep-linking to the funnel with ?coin= prefill. Add a 5-step identification guide, bullion reference cards and FAQ schema.
learn.html: 6 guides, Sheldon 1–70 table, 60-second grading quiz, scam red flags, and a 40-term searchable glossary.
Plan for programmatic expansion: one page per coin series and key date (e.g. /coins/lincoln-cent/1955-ddo.html), each with a value table, identification photos, FAQ and the funnel CTA.
```

### Phase 4 — Tools
```
tools.html: crypto converter; profit/ROI with fees and break-even; "if I had invested" (historical API); melt value for 16 coins (US 90%/40%/35%, Canada 80%, Eagles, Maples, Krugerrand, Sovereign) auto-filled with live metal prices; a "10-coin savings habit" compound calculator with a bar chart; browser price alerts (Notification API).
```

### Phase 5 — Lead generation (highest priority for revenue)
```
appraisal.html: 5-step funnel with a progress bar. 1) item type (auto-advance) 2) goal: sell/appraise/insure/grade/buy/tax (auto-advance) 3) description, quantity, value band, photo link 4) country, region, timeline 5) name, email, phone, contact preference, consent, newsletter opt-in. URL prefill skips answered steps. Trust row, how-it-works, FAQ.
Secondary capture: hero one-field form → funnel; home lead band; exit-intent/45-second newsletter modal (5-day frequency cap); footer newsletter; a crypto "portfolio review" band on the markets page.
Track generate_lead events in GA4.
```

### Phase 6 — Monetization & community
```
AdSense: .ad-slot[data-slot] placeholders (header, inContent, sidebar, footer) that render <ins class="adsbygoogle"> when adsenseClient is set, otherwise "Advertise here" house ads; ads.txt template; cookie notice (use Google's certified CMP for EEA/UK).
videos.html: lite YouTube embeds (youtube-nocookie, click-to-load) from config, topic cards, creator submission form.
support.html: goal bar, fund allocation (operations 35%, promotion & marketing 25%, hiring 20%, contests & prizes 20%), 4 tiers, PayPal/Stripe/BMC/Ko-fi/Patreon buttons from config (fallback to pledge form), crypto addresses, pledge form, "not tax-deductible / no investment return" note.
contests.html: monthly countdown, Coin Spotter Challenge, BTC price prediction, quarterly story award, entry form, sponsor CTA, official rules (no purchase necessary, 18+, void where prohibited).
careers.html: 6 roles + application form. advertise.html: 6 products, audience standards, inquiry form, domain acquisition link.
```

### Phase 7 — Legal & trust
```
disclaimer.html (trademark notice, third-party marks, copyright/DMCA, not financial advice, data accuracy, affiliate/ad disclosure, donations), privacy.html (AdSense-required cookie language, rights under GDPR/CCPA/PIPEDA/DPDP), terms.html, cookies.html, about.html (mission, editorial standards, funding), contact.html (form + hidden mail link + owner link), 404.html.
```

### Phase 8 — QA, deploy, grow
```
Test with Playwright at 1366px and 390px: no console errors, no horizontal scroll, funnel end-to-end, zero occurrences of the inbox address in the repository. Deploy to GitHub Pages (main branch root; Jekyll renders the layout). Then: point 10coin.com DNS (A records 185.199.108-111.153 + CNAME file), update url/baseurl in _config.yml, submit the sitemap to Search Console, apply for AdSense once there are 25–30 quality pages, activate FormSubmit (first submission sends a confirmation email), and publish 3 value-guide pages per week.
```
