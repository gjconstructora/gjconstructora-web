# -*- coding: utf-8 -*-
"""Chequeos locales del sitio estatico de GJ Constructora.
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
    if rel in ("elements.html", "generic.html"):
        continue
    s = io.open(p, encoding="utf-8").read()
    check("<title>" in s, "%s tiene <title>" % rel)
    check(s.count("<h1") == 1, "%s tiene exactamente un <h1>" % rel)
    check('name="description"' in s, "%s tiene meta description" % rel)
    check('rel="canonical"' in s, "%s tiene canonical" % rel)

# 4. contenido sin JavaScript: minimo 500 caracteres de texto real
for rel in ["index.html", "contacto.html", "privacidad.html", "nosotros.html",
            "servicios.html", "obras.html"]:
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
for loc in re.findall(r"<loc>https://gjconstructora\.net/([^<]*)</loc>", sm):
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


# 8. posicionamiento comercial: el sitio tiene que decir que GJ construye Y vende
for rel, needles in [
    ("index.html", ["dise", "construimos", "vendemos unidades propias"]),
    ("ventas.html", ["Unidades terminadas", "Unidades en pozo", "no intermediamos"]),
    ("contacto.html", ["Construir a medida", "Comprar una unidad propia"]),
    ("servicios.html", ["terminadas o en pozo"]),
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

# 10. la direccion de obra no debe venderse como servicio suelto
t = io.open(os.path.join(ROOT, "direccion-de-obra-cipolletti.html"), encoding="utf-8").read()
check("Cu\u00e1ndo tiene sentido contratar solo la direcci\u00f3n" not in t,
      "direccion-de-obra: no promociona la direccion suelta como recomendable")
check("Antes que nada: qu\u00e9 hacemos" in t,
      "direccion-de-obra: aclara que GJ disena y construye")

# 11. errores de redaccion ya corregidos
t = io.open(os.path.join(ROOT, "nosotros.html"), encoding="utf-8").read()
for mal in ["d\u00e9cadas dedicadas", "superiores a cada proyecto", "ya sean en material de",
            "la conformidad de nuestros clientes"]:
    check(mal not in t, "nosotros.html sin el error %r" % mal)

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
