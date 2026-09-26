# -*- coding: utf-8 -*-
"""Chequeos locales del sitio estatico de Mauri Jocou Constructora.
Uso: python3 checks/validate_local.py   (desde la raiz del repo)
Salida: lista de FAIL/OK y codigo de salida 1 si hay algun FAIL."""
import io, os, re, json, glob, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
fails = []
def check(cond, msg):
    print(("OK   " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)

def text_of(html):
    b = html.split("<body", 1)[-1]
    b = re.sub(r"<script.*?</script>", " ", b, flags=re.S)
    b = re.sub(r"<style.*?</style>", " ", b, flags=re.S)
    b = re.sub(r'<header id="header".*?</header>', " ", b, flags=re.S)
    b = re.sub(r'<nav id="menu".*?</nav>', " ", b, flags=re.S)
    b = re.sub(r"<footer.*?</footer>", " ", b, flags=re.S)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", b)).strip()

pages = sorted(glob.glob(os.path.join(ROOT, "*.html")))
pages += sorted(glob.glob(os.path.join(ROOT, "*", "index.html")))

# Paginas dadas de baja que quedan solo como redireccion (no tienen h1 ni contenido propio)
def es_stub(path):
    return 'http-equiv="refresh"' in io.open(path, encoding="utf-8").read()
BAJAS = ["contacto.html", "nosotros.html", "servicios.html", "construccion-de-viviendas-cipolletti.html",
         "direccion-de-obra-cipolletti.html", "ejecucion-integral-llave-en-mano.html",
         "obra-hospitalaria-alto-valle.html", "construccion-duplex-cipolletti.html"]

# 1. archivos obligatorios para agentes
for f in ["robots.txt", "sitemap.xml", "llms.txt", "404.html", "CNAME",
          "contacto.html", "privacidad.html",
          "about/index.html", "contact/index.html", "privacy/index.html"]:
    check(os.path.isfile(os.path.join(ROOT, f)), "existe %s" % f)

# 2. JSON-LD valido en todas las paginas
ident = set(["Organization", "LocalBusiness", "Person", "Product",
             "SoftwareApplication", "Article"])
home_ident = False
for p in pages:
    s = io.open(p, encoding="utf-8").read()
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        rel = os.path.relpath(p, ROOT)
        try:
            data = json.loads(block)
        except Exception as e:
            check(False, "JSON-LD parsea en %s (%s)" % (rel, e)); continue
        check(True, "JSON-LD parsea en %s" % rel)
        if rel == "index.html":
            t = data.get("@type")
            t = t if isinstance(t, list) else [t]
            if ident & set(t):
                home_ident = True
check(home_ident, "index.html declara un @type de identidad reconocible")

# 3. estructura minima por pagina
for p in pages:
    rel = os.path.relpath(p, ROOT)
    if rel in ("elements.html", "generic.html") or es_stub(p):
        continue
    s = io.open(p, encoding="utf-8").read()
    check("<title>" in s, "%s tiene <title>" % rel)
    check(s.count("<h1") == 1, "%s tiene exactamente un <h1>" % rel)
    check('name="description"' in s, "%s tiene meta description" % rel)
    check('rel="canonical"' in s, "%s tiene canonical" % rel)

# 4. contenido sin JavaScript: minimo 500 caracteres de texto real
for rel in ["index.html", "privacidad.html", "ventas.html",
            "duplex-ecuador-411-cipolletti.html"]:
    n = len(text_of(io.open(os.path.join(ROOT, rel), encoding="utf-8").read()))
    check(n >= 500, "%s tiene %d caracteres de texto sin JS (>=500)" % (rel, n))

# 5. el 404 no debe depender de rutas relativas
s404 = io.open(os.path.join(ROOT, "404.html"), encoding="utf-8").read()
bad = [v for v in re.findall(r'\b(?:href|src)="([^"]+)"', s404)
       if not re.match(r"^(https?:|//|#|mailto:|tel:|data:|/)", v)]
check(not bad, "404.html usa rutas absolutas (relativas encontradas: %s)" % bad[:3])
check('type="text/markdown"' in s404, "404.html incluye cuerpo markdown para agentes")

# 6. sitemap: todas las URL apuntan a archivos existentes
sm = io.open(os.path.join(ROOT, "sitemap.xml"), encoding="utf-8").read()
for loc in re.findall(r"<loc>https://mjconstructora\.com/([^<]*)</loc>", sm):
    f = loc if loc else "index.html"
    check(os.path.isfile(os.path.join(ROOT, f)), "sitemap: existe %s" % f)

# 7. enlaces internos rotos
for p in pages:
    base = os.path.dirname(p)
    s = io.open(p, encoding="utf-8").read()
    for h in set(re.findall(r'href="([^"#?]+\.html)"', s)):
        if re.match(r"^(https?:|//|mailto:|tel:)", h):
            continue
        t = os.path.join(ROOT, h.lstrip("/")) if h.startswith("/") else os.path.join(base, h)
        if not os.path.isfile(t):
            check(False, "enlace roto en %s -> %s" % (os.path.relpath(p, ROOT), h))


# 8. posicionamiento comercial: el sitio tiene que decir que Mauri Jocou construye Y vende
for rel, needles in [
    ("index.html", ["Qui\u00e9nes somos", "construimos", "venta de unidades propias", "Nuestros Valores"]),
    ("ventas.html", ["D\u00faplex en venta en Cipolletti", "Venta directa"]),
    ("llms.txt", ["Comprar en pozo", "unidades de desarrollo propio"]),
]:
    t = io.open(os.path.join(ROOT, rel), encoding="utf-8").read()
    for nd in needles:
        check(nd in t, "%s menciona %r" % (rel, nd))

# 9. coherencia de zona: ninguna pagina puede contradecir la politica de cobertura
prohibidas = [
    "no dispersamos la operacion fuera de la region",
    "no dispersamos la operaci\u00f3n fuera de la regi\u00f3n",
    "Tambien ejecutamos obras fuera de la region cuando el proyecto lo justifica",
    "Tambi\u00e9n ejecutamos obras fuera de la regi\u00f3n cuando el proyecto lo justifica",
]
for p2 in pages:
    t = io.open(p2, encoding="utf-8").read()
    for fr in prohibidas:
        if fr in t:
            check(False, "%s contiene una frase de zona contradictoria: %r" % (os.path.relpath(p2, ROOT), fr))

# 10. paginas dadas de baja: existen solo como redireccion y nadie las enlaza
for rel in BAJAS:
    fp = os.path.join(ROOT, rel)
    check(os.path.isfile(fp) and es_stub(fp), "%s es una redireccion (pagina dada de baja)" % rel)
for p2 in pages:
    rel2 = os.path.relpath(p2, ROOT)
    if es_stub(p2):
        continue
    t = io.open(p2, encoding="utf-8").read()
    for rel in BAJAS:
        if re.search(r'href="(?:https://mjconstructora\.com)?/?' + re.escape(rel) + '"', t):
            check(False, "%s enlaza a la pagina dada de baja %s" % (rel2, rel))
check("nosotros.html" not in io.open(os.path.join(ROOT, "sitemap.xml"), encoding="utf-8").read(),
      "sitemap sin paginas dadas de baja")

# 11. WhatsApp: un solo numero en todo el sitio
for p2 in pages + [os.path.join(ROOT, "llms.txt")]:
    t = io.open(p2, encoding="utf-8").read()
    check("4194155" not in t and "419-4155" not in t, "%s sin el numero viejo de WhatsApp/telefono" % os.path.relpath(p2, ROOT))

# 12. 404: markdown visible ademas del script
s404b = io.open(os.path.join(ROOT, "404.html"), encoding="utf-8").read()
check("<pre" in s404b and "## Donde buscar" in s404b,
      "404.html expone el markdown como texto visible")

# 13. CSS: las tarjetas del gemelo digital se estiran a la misma altura
css = io.open(os.path.join(ROOT, "assets/css/main.css"), encoding="utf-8").read()
import re as _re
for blk in _re.findall(r"\.gemelo-pair-cards\s*\{[^}]*\}", css):
    check("align-items: center" not in blk,
          "CSS .gemelo-pair-cards sin align-items:center (alturas desparejas)")

print("\n%d fallos" % len(fails))
sys.exit(1 if fails else 0)
