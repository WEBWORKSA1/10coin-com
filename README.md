# 10Coin.com

Coin intelligence hub: collectible coin values, live top-10 crypto and bullion data, free calculators, and a free-valuation lead engine. It's a static Jekyll site, built and hosted free by GitHub Pages (no Actions or server needed).

- **Live:** https://webworksa1.github.io/10coin-com/
- **Concept, revenue model and phase-wise build prompt:** [PROMPT.md](PROMPT.md)

## Structure
```
_config.yml            # site URL / baseurl (switch to 10coin.com here)
_layouts/default.html  # shared <head>, SEO, JSON-LD, header, footer, modal (generated)
build/build.py         # regenerates layout/nav/footer, sitemap, robots, per-page JSON-LD
build/preview.py       # local preview without Ruby (python-liquid) → dist/
assets/css/style.css   # design system
assets/js/config.js    # ← all monetization settings live here
assets/js/app.js       # shared runtime (ticker, forms, ads, theme, modal)
assets/js/markets.js   # live market table, index, heatmap, gauge
assets/js/features.js  # calculators, value guide, lead funnel, contests, videos
assets/js/values-data.js
*.html                 # pages: front matter + content  ← edit content here; copy one to add a page
```

## Edit & rebuild
```bash
python3 build/build.py        # regenerates layout + pages + sitemap + robots
pip install python-liquid pyyaml && python3 build/preview.py   # optional local preview in dist/
```

## Go-live checklist
1. **Forms:** submit any form once. The inbox then receives a FormSubmit activation email; click to confirm. For maximum privacy, paste the random alias FormSubmit gives you into `formEndpoint` in `config.js`.
2. **AdSense:** set `adsenseClient` and slot IDs in `config.js`, then fill in `ads.txt`.
3. **Donations:** add PayPal, Stripe, Buy Me a Coffee, Ko-fi or Patreon links and crypto addresses in `config.js`.
4. **YouTube:** add your channel URL and video IDs in `config.js`.
5. **Custom domain:** add a `CNAME` file containing `10coin.com`. Point DNS A records to 185.199.108.153, .109.153, .110.153 and .111.153. In `_config.yml`, set `url: "https://10coin.com"` and `baseurl: ""`.
6. Submit `sitemap.xml` in Google Search Console.

## Legal
© 10Coin.com. All rights reserved. "10Coin" is used only as the name of this website and domain. It is not a token or coin offering and is not affiliated with any similarly named mark or project. See `disclaimer.html`.
