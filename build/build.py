#!/usr/bin/env python3
"""10Coin.com static site builder.

Pages are the root <slug>.html files: JSON-valued front matter (title, desc,
scripts, priority) + HTML body. To add a page, copy an existing one and edit it.
Run:  python3 build/build.py
  -> regenerates _layouts/default.html (shared head/header/footer/nav), _config.yml,
     sitemap.xml, robots.txt, and each page's auto JSON-LD block (breadcrumb + FAQ
     from <details data-faq>). Page content above the marker is never touched.
GitHub Pages renders them automatically (no Actions needed).
Preview locally: python3 build/preview.py  (renders to dist/ with python-liquid)
Custom domain: edit url/baseurl in _config.yml and add a CNAME file.
"""
import json, os, re, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = os.path.join(ROOT, "build", "pages")
INTEREST_URL = "https://web.works/contact"

LOGO = '''<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd66b"/><stop offset="1" stop-color="#e09a12"/></linearGradient></defs><ellipse cx="32" cy="46" rx="24" ry="8" fill="#b97c0c"/><rect x="8" y="30" width="48" height="16" fill="#c98a10"/><ellipse cx="32" cy="30" rx="24" ry="8" fill="#d99a18"/><circle cx="32" cy="24" r="20" fill="url(#lg)" stroke="#9c6a08" stroke-width="2"/><circle cx="32" cy="24" r="15" fill="none" stroke="#9c6a08" stroke-width="1.2" stroke-dasharray="2 2"/><text x="32" y="30.5" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="17" fill="#3a2600">10</text></svg>'''

NAV = [
    ("index.html", "Home"), ("markets.html", "Markets"), ("coin-values.html", "Coin Values"),
    ("tools.html", "Tools"), ("learn.html", "Learn"), ("videos.html", "Videos"),
]
MORE = [
    ("contests.html", "🏆 Contests & Prizes"), ("support.html", "💛 Support / Donate"),
    ("careers.html", "🧑‍💻 Careers & Talent"), ("advertise.html", "📣 Advertise & Sponsor"),
    ("about.html", "ℹ️ About"), ("contact.html", "✉️ Contact"),
]


def header():
    links = "".join(f'<li><a href="{h}">{t}</a></li>' for h, t in NAV)
    more = "".join(f'<li><a href="{h}">{t}</a></li>' for h, t in MORE)
    return f'''<a class="skip" href="#main">Skip to content</a>
<div class="interest-bar" role="note">Contact, if you are interested in this website / domain name / Sponsorship / Advertisement / Partnership — <a href="{INTEREST_URL}" target="_blank" rel="noopener">contact here</a></div>
<div class="ticker" aria-label="Live prices"><div class="ticker-track"><span class="ticker-item muted">Loading live prices…</span></div></div>
<header class="site-header"><div class="container nav">
  <a class="logo" href="index.html" aria-label="10Coin home">{LOGO}<span><b>10</b>Coin</span></a>
  <ul class="nav-links" id="nav-links">{links}
    <li class="dd"><button class="dd-btn" aria-expanded="false" aria-haspopup="true">More ▾</button><ul class="dd-menu">{more}</ul></li>
  </ul>
  <div class="nav-actions">
    <a class="btn btn-primary btn-sm" href="appraisal.html">Free Coin Valuation</a>
    <button class="icon-btn" data-theme-toggle aria-label="Toggle light/dark mode">◐</button>
    <button class="icon-btn menu-toggle" aria-label="Open menu" aria-controls="nav-links" aria-expanded="false">☰</button>
  </div>
</div></header>'''


def footer():
    return f'''<footer class="site-footer"><div class="container">
<div class="footer-grid">
  <div><a class="logo" href="index.html">{LOGO}<span><b>10</b>Coin</span></a>
    <p class="muted" style="margin-top:12px">Coin values, live crypto &amp; bullion markets, calculators and expert help — the top 10 of everything coins, updated daily.</p>
    <form class="inline-form" data-form="Newsletter" data-success="You're in! Watch your inbox for The 10Coin Brief.">
      <label class="sr-only" for="f-nl">Email</label><input id="f-nl" type="email" name="email" placeholder="Your email" required><button class="btn btn-primary" type="submit">Subscribe</button>
      <input type="hidden" name="source" value="footer">
    </form></div>
  <div><h4>Markets</h4><ul><li><a href="markets.html">Crypto prices</a></li><li><a href="markets.html#top10">Top 10 index</a></li><li><a href="markets.html#heat">Heatmap</a></li><li><a href="coin-values.html#bullion">Gold &amp; silver</a></li></ul></div>
  <div><h4>Collectors</h4><ul><li><a href="coin-values.html">Coin value guide</a></li><li><a href="tools.html#melt">Melt calculator</a></li><li><a href="learn.html#grading">Grading guide</a></li><li><a href="appraisal.html">Free valuation</a></li></ul></div>
  <div><h4>Community</h4><ul><li><a href="contests.html">Contests &amp; prizes</a></li><li><a href="videos.html">Videos</a></li><li><a href="support.html">Support us</a></li><li><a href="careers.html">Careers</a></li></ul></div>
  <div><h4>Company</h4><ul><li><a href="about.html">About</a></li><li><a href="advertise.html">Advertise</a></li><li><a href="contact.html">Contact</a></li><li><a href="{INTEREST_URL}" target="_blank" rel="noopener">Buy / partner on this domain</a></li></ul></div>
</div>
<div class="legal-note">
  <p><a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a> · <a href="disclaimer.html">Disclaimer &amp; Trademark Notice</a> · <a href="cookies.html">Cookies</a> · <a href="sitemap.xml">Sitemap</a></p>
  <p>© <span data-year></span> 10Coin.com. All original content, design and code are copyright of the site owner. “10Coin” is used here solely as the descriptive name of this website and domain; this site is <b>not</b> a cryptocurrency, token, coin offering or loyalty program, and is not affiliated with any third party using a similar name. All third-party names, logos and trademarks belong to their respective owners. Market data provided by CoinGecko and Alternative.me. Nothing on this site is financial, investment or tax advice. <a href="disclaimer.html">Read the full disclosure.</a></p>
</div></div></footer>
<div class="mobile-cta"><a class="btn btn-primary" href="appraisal.html">Free Valuation</a><a class="btn btn-ghost" href="markets.html">Live Prices</a></div>
<div class="modal" id="newsletter-modal" role="dialog" aria-modal="true" aria-labelledby="nl-title"><div class="modal-box">
  <button class="modal-close" data-close aria-label="Close">×</button>
  <span class="eyebrow">Free weekly brief</span><h2 id="nl-title">The 10Coin Brief</h2>
  <p class="muted">10 things worth knowing in coins, crypto &amp; bullion every week — valuable finds, market moves and contest alerts. 1 email/week, unsubscribe anytime.</p>
  <form data-form="Newsletter (popup)" data-success="Welcome aboard! Your first brief is on its way.">
    <div class="field"><label for="m-name">First name</label><input id="m-name" name="name" autocomplete="given-name"></div>
    <div class="field"><label for="m-email">Email</label><input id="m-email" type="email" name="email" required autocomplete="email"></div>
    <div class="field"><label class="check"><input type="checkbox" name="interests" value="coins" checked> Collectible coins</label><label class="check"><input type="checkbox" name="interests" value="crypto" checked> Crypto</label><label class="check"><input type="checkbox" name="interests" value="bullion"> Gold &amp; silver</label></div>
    <button class="btn btn-primary btn-block" type="submit">Send me the brief</button>
    <p class="small muted" style="margin-top:8px">By subscribing you agree to our <a href="privacy.html">Privacy Policy</a>.</p>
  </form>
</div></div>
<div class="cookie" role="region" aria-label="Cookie notice"><p style="margin:0 0 10px">We use cookies for analytics and personalised ads (Google AdSense). See our <a href="cookies.html">Cookie Policy</a>.</p><div style="display:flex;gap:8px"><button class="btn btn-primary btn-sm" data-cookie="all">Accept all</button><button class="btn btn-ghost btn-sm" data-cookie="essential">Essential only</button></div></div>'''


LAYOUT_HEAD = """<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">{% if page.base %}
<base href="{{ site.baseurl }}/">{% endif %}
{% assign root = site.url | append: site.baseurl %}
<title>{{ page.full_title | escape }}</title>
<meta name="description" content="{{ page.desc | escape }}">
<meta name="robots" content="{{ page.robots | default: 'index,follow,max-image-preview:large' }}">
<link rel="canonical" href="{{ root }}{{ page.canon }}">
<meta name="theme-color" content="#0b1020">
<meta property="og:type" content="website"><meta property="og:site_name" content="10Coin">
<meta property="og:title" content="{{ page.full_title | escape }}"><meta property="og:description" content="{{ page.desc | escape }}">
<meta property="og:url" content="{{ root }}{{ page.canon }}"><meta property="og:image" content="{{ root }}/assets/img/og.svg">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{{ page.full_title | escape }}"><meta name="twitter:description" content="{{ page.desc | escape }}"><meta name="twitter:image" content="{{ root }}/assets/img/og.svg">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/img/logo.svg">
<link rel="manifest" href="manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://api.coingecko.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
{% assign ver = site.time | date: '%Y%m%d%H%M' %}
<link rel="stylesheet" href="assets/css/style.css?v={{ ver }}">
<script>try{var t=localStorage.getItem("tc-theme");if(t)document.documentElement.setAttribute("data-theme",JSON.parse(t))}catch(e){}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"10Coin","url":"{{ root }}/","description":"Coin values, live crypto and bullion prices, calculators and free coin valuations."}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"10Coin","url":"{{ root }}/","logo":"{{ root }}/assets/img/logo.svg"}</script>
<script src="assets/js/config.js?v={{ ver }}" defer></script>
<script src="assets/js/app.js?v={{ ver }}" defer></script>
{% for s in page.scripts %}<script src="{{ s }}?v={{ ver }}" defer></script>
{% endfor %}<script src="assets/js/features.js?v={{ ver }}" defer></script>
</head>
<body data-page="{{ page.slug }}">
"""


def layout():
    return LAYOUT_HEAD + header() + '\n<main id="main">\n{{ content }}\n</main>\n' + footer() + "\n</body>\n</html>\n"


MARKER = "<!-- auto:jsonld (regenerated by build/build.py) -->"


def page_source(slug, meta, body):
    """Jekyll page: front matter + body + page-level JSON-LD (URLs resolved by Liquid)."""
    title = meta["title"]
    fm = {
        "layout": "default",
        "slug": slug,
        "title": title,
        "full_title": title if "10Coin" in title else f"{title} | 10Coin",
        "desc": meta["desc"],
        "canon": "/" if slug == "index" else f"/{slug}.html",
        "scripts": meta.get("scripts", []),
        "priority": meta.get("priority", "0.7"),
    }
    if meta.get("robots"):
        fm["robots"] = meta["robots"]
    if slug == "404":
        fm["base"] = True
        fm["permalink"] = "/404.html"
        fm["sitemap"] = False
    front = "---\n" + "\n".join(f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in fm.items()) + "\n---\n"
    ld = []
    root = "{{ site.url }}{{ site.baseurl }}"
    if slug != "index":
        ld.append({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": root + "/"},
            {"@type": "ListItem", "position": 2, "name": title, "item": root + fm["canon"]}]})
    faqs = re.findall(r'<details data-faq><summary>(.*?)</summary>(.*?)</details>', body, re.S)
    if faqs:
        ld.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": html.unescape(re.sub('<[^>]+>', '', q)).strip(),
             "acceptedAnswer": {"@type": "Answer", "text": html.unescape(re.sub('<[^>]+>', '', a)).strip()}} for q, a in faqs]})
    ldtags = "".join(f'\n<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in ld)
    return front + body.rstrip("\n") + "\n" + MARKER + ldtags + "\n"


SITEMAP = """---
layout: null
permalink: /sitemap.xml
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{% assign pages = site.pages | sort: "path" %}{% for p in pages %}{% if p.slug and p.sitemap != false %}  <url><loc>{{ site.url }}{{ site.baseurl }}{{ p.canon }}</loc><lastmod>{{ site.time | date: '%Y-%m-%d' }}</lastmod><priority>{% if p.slug == 'index' %}1.0{% else %}{{ p.priority }}{% endif %}</priority></url>
{% endif %}{% endfor %}</urlset>
"""

ROBOTS = """---
layout: null
permalink: /robots.txt
---
User-agent: *
Allow: /

Sitemap: {{ site.url }}{{ site.baseurl }}/sitemap.xml
"""

CONFIG = """# 10Coin.com — Jekyll config (GitHub Pages builds this automatically, free plan)
# Custom domain: set url to https://10coin.com, baseurl to "", and add a CNAME file.
title: 10Coin
url: "https://webworksa1.github.io"
baseurl: "/10coin-com"
exclude: [build, dist, README.md, PROMPT.md, .gitignore]
"""


def main():
    os.makedirs(os.path.join(ROOT, "_layouts"), exist_ok=True)
    open(os.path.join(ROOT, "_layouts", "default.html"), "w", encoding="utf-8").write(layout())
    if not os.path.exists(os.path.join(ROOT, "_config.yml")):  # never overwrite your domain settings
        open(os.path.join(ROOT, "_config.yml"), "w").write(CONFIG)
    open(os.path.join(ROOT, "sitemap.xml"), "w").write(SITEMAP)
    open(os.path.join(ROOT, "robots.txt"), "w").write(ROBOTS)
    n = 0
    for fn in sorted(os.listdir(ROOT)):
        path = os.path.join(ROOT, fn)
        if not fn.endswith(".html") or not os.path.isfile(path):
            continue
        raw = open(path, encoding="utf-8").read()
        m = re.match(r"^---\n(.*?)\n---\n", raw, re.S)
        if not m:
            continue
        fm = {}
        for line in m.group(1).splitlines():
            k, _, v = line.partition(":")
            fm[k.strip()] = json.loads(v.strip())
        body = raw[m.end():].split(MARKER)[0]
        meta = {"title": fm["title"], "desc": fm["desc"], "scripts": fm.get("scripts", []),
                "priority": fm.get("priority", "0.7"), "robots": fm.get("robots")}
        out = page_source(fm.get("slug", fn[:-5]), meta, body)
        # keep any extra front-matter keys the author added
        extra = {k: v for k, v in fm.items() if k not in ("layout", "slug", "title", "full_title", "desc", "canon", "scripts", "priority", "robots", "base", "permalink", "sitemap")}
        if extra:
            out = out.replace("\n---\n", "\n" + "\n".join(f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in extra.items()) + "\n---\n", 1)
        open(path, "w", encoding="utf-8").write(out)
        n += 1
    print(f"Rebuilt layout + {n} pages (JSON-LD refreshed), config, sitemap, robots")


if __name__ == "__main__":
    main()
