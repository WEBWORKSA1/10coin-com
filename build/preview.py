#!/usr/bin/env python3
"""Local preview of the Jekyll site without Ruby: renders to dist/ using python-liquid.
pip install python-liquid pyyaml ; python3 build/preview.py ; cd dist && python3 -m http.server
"""
import os, re, shutil, datetime, yaml
from liquid import Environment

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
cfg = yaml.safe_load(open(os.path.join(ROOT, "_config.yml")))
env = Environment()


def split(path):
    raw = open(path, encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n", raw, re.S)
    return (yaml.safe_load(m.group(1)) or {}, raw[m.end():]) if m else (None, raw)


shutil.rmtree(DIST, ignore_errors=True)
shutil.copytree(os.path.join(ROOT, "assets"), os.path.join(DIST, "assets"))
for f in ("manifest.webmanifest", "ads.txt"):
    shutil.copy(os.path.join(ROOT, f), DIST)
pages = []
for fn in sorted(os.listdir(ROOT)):
    p = os.path.join(ROOT, fn)
    if os.path.isfile(p) and fn.endswith((".html", ".xml", ".txt")):
        fm, body = split(p)
        if fm is not None:
            fm["path"] = fn
            pages.append((fn, fm, body))
site = {"url": cfg["url"], "baseurl": cfg["baseurl"], "time": datetime.datetime.now(), "pages": [fm for _, fm, _ in pages]}
layout = open(os.path.join(ROOT, "_layouts", "default.html"), encoding="utf-8").read()
for fn, fm, body in pages:
    content = env.from_string(body).render(site=site, page=fm)
    if fm.get("layout") == "default":
        content = env.from_string(layout).render(site=site, page=fm, content=content)
    out = fm.get("permalink", "/" + fn).lstrip("/")
    open(os.path.join(DIST, out), "w", encoding="utf-8").write(content)
print(f"Rendered {len(pages)} files to dist/")
