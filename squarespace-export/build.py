"""Convert the Squarespace page snapshots in squarespace-export/ into the static site at the repo root.

Usage (from repo root): python squarespace-export/build.py .
Already run; only needed again if the snapshots change. Fetches assets from the Squarespace CDN."""
import hashlib, html, os, re, sys, urllib.parse, urllib.request

SRC = sys.argv[1]
PAGES = {"home 1.html": "index.html", "about 1.html": "about.html",
         "services 1.html": "services.html", "contactus 1.html": "contactus.html"}
ROUTES = {"/": "./", "/about": "about", "/services": "services", "/contactus": "contactus"}
CDN = r"(?:https?:)?//(?:images\.squarespace-cdn\.com|static1\.squarespace\.com|definitions\.sqspcdn\.com|assets\.squarespace\.com)/[^\"'\s)]+"
cache = {}


def fetch(url, kind):
    url = html.unescape(url)
    if url.startswith("//"):
        url = "https:" + url
    base = url.split("?")[0].split("#")[0]
    if base in cache:
        return cache[base]
    name = urllib.parse.unquote(base.rsplit("/", 1)[-1]).replace(" ", "-").replace("+", "-")
    name = re.sub(r"[^A-Za-z0-9._-]", "", name).lower()
    stem, ext = os.path.splitext(name)
    name = f"{stem[:40]}-{hashlib.md5(base.encode()).hexdigest()[:6]}{ext}"
    rel = f"assets/{kind}/{name}"
    dest = os.path.join(SRC, rel)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if not os.path.exists(dest):
        # Large photos: ask the CDN for a web-sized rendition instead of the raw upload.
        get = base + ("?format=2500w" if "images.squarespace-cdn.com" in base and ext in (".jpg", ".jpeg", ".png") else "")
        data = urllib.request.urlopen(urllib.request.Request(get, headers={"User-Agent": "Mozilla/5.0"})).read()
        if ext == ".css":
            text = data.decode("utf-8")
            text = re.sub(r"url\((['\"]?)(" + CDN + r")\1\)",
                          lambda m: f"url({m[1]}../{fetch_rel(m[2])}{frag(m[2])}{m[1]})", text)
            data = text.encode("utf-8")
        with open(dest, "wb") as f:
            f.write(data)
        print("saved", rel, len(data))
    cache[base] = rel
    return rel


def frag(url):
    return "#" + url.split("#", 1)[1] if "#" in url else ""


def fetch_rel(url):
    """Asset referenced from inside a CSS file (fonts/images) -> path relative to assets/."""
    base = url.split("?")[0].split("#")[0]
    kind = "fonts" if re.search(r"\.(eot|woff2?|ttf|svg|otf)$", base) else "img"
    return fetch(url, kind)[len("assets/"):]


def kind_of(url):
    base = url.split("?")[0]
    if base.endswith(".css"):
        return "css"
    if base.endswith(".js"):
        return None
    return "img"


def localize(m):
    attr, url = m[1], m[2]
    kind = kind_of(url)
    if not kind:
        return m[0]
    return f'{attr}="{fetch(url, kind)}"'


EXTRA_HEAD = """
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/static-site.css">
"""
CONTACT_FORM = """<form class="static-contact-form" data-mailto="sales@neuralnavigators.com">
  <input name="name" placeholder="Name" required>
  <input name="email" type="email" placeholder="Email" required>
  <input name="subject" placeholder="Subject">
  <textarea name="message" rows="6" placeholder="Message" required></textarea>
  <button type="submit">Send</button>
</form>"""
MAP_IFRAME = ('<iframe class="static-map" title="Map to Neural Navigators" loading="lazy" '
              'src="https://maps.google.com/maps?q=1250+Wood+Branch+Park+Dr+Ste+490,+Houston,+TX+77079&amp;z=13&amp;output=embed"></iframe>')
EXTRA_BODY ='\n<script src="assets/js/static-site.js"></script>\n'


def convert(src_name, out_name):
    s = open(os.path.join(SRC, "squarespace-export", src_name), encoding="utf-8").read()
    # Drop hints for CDNs we no longer use.
    s = re.sub(r'<link rel="preconnect"[^>]*>\s*', "", s)
    # Lazy-loaded images only carry data-src; give them a real src.
    s = re.sub(r'<img\b[^>]*>', lambda m: m[0] if re.search(r'\ssrc=', m[0]) else
               re.sub(r'\sdata-src="([^"]+)"', r' src="\1" data-src="\1"', m[0], count=1), s)
    # Section dividers clip to a path Squarespace's JS computed at runtime; the "M0,0"
    # placeholder clips the whole section away, so use the full box instead.
    s = s.replace('<path class="section-divider-clip" d="M0,0">',
                  '<path class="section-divider-clip" d="M0,0 H1 V1 H0 Z">')
    # Localize every CDN asset referenced from an attribute.
    s = re.sub(r'\b(href|src|data-src|data-image|content)="(' + CDN + r')"', localize, s)
    s = re.sub(r'\bsrcset="[^"]*"', "", s)
    s = re.sub(r'\s*data-block-(?:css|scripts)="[^"]*"', "", s)
    # Internal links: root-relative and absolute-domain -> relative, so the site works under any base path.
    def route(m):
        key = (m[2] or "/").rstrip("/") or "/"
        return f'href="{ROUTES[key]}"' if key in ROUTES else m[0]
    s = re.sub(r'href="(https?://(?:www\.)?neuralnavigators\.com)?(/[a-z]*)?"', route, s)
    # The contact form and map were rendered by Squarespace JS; only empty shells remain.
    s = re.sub(r'<div class="form-wrapper">\s*</div>', CONTACT_FORM, s)
    s = re.sub(r'(data-definition-name="website\.components\.map"[^>]*><div class="sqs-block-content">)\s*<div data-context="[^"]*"[^>]*>',
               r'\1' + MAP_IFRAME + '<div hidden>', s)
    # Social icon sprites are already inlined in the page; point at those symbols.
    s = s.replace('xlink:href="/universal/svg/social-accounts.svg#', 'xlink:href="#')
    s = s.replace('<base href="">', "")
    s = s.replace("</head>", EXTRA_HEAD + "</head>", 1)
    s = s.replace("</body>", EXTRA_BODY + "</body>", 1)
    with open(os.path.join(SRC, out_name), "w", encoding="utf-8", newline="\n") as f:
        f.write(s)
    print("wrote", out_name)


for src_name, out_name in PAGES.items():
    convert(src_name, out_name)
