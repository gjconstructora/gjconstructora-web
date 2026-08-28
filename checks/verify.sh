#!/usr/bin/env bash
# Verificacion de endpoints publicos de gjconstructora.net tras el deploy.
# Uso: bash checks/verify.sh [dominio]   (por defecto https://gjconstructora.net)
BASE="${1:-https://gjconstructora.net}"
fails=0

expect() { # url codigo_esperado descripcion
  code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 3 "$1")
  if [ "$code" = "$2" ]; then echo "OK   [$code] $3"; else echo "FAIL [$code, esperado $2] $3"; fails=$((fails+1)); fi
}

contains() { # url texto descripcion
  if curl -s "$1" | grep -q -- "$2"; then echo "OK   contiene '$2' -> $3"; else echo "FAIL falta '$2' -> $3"; fails=$((fails+1)); fi
}

echo "== Status codes =="
expect "$BASE/" 200 "portada"
expect "$BASE/contacto.html" 200 "contacto"
expect "$BASE/privacidad.html" 200 "privacidad"
expect "$BASE/about/" 200 "alias /about/"
expect "$BASE/contact/" 200 "alias /contact/"
expect "$BASE/privacy/" 200 "alias /privacy/"
expect "$BASE/llms.txt" 200 "llms.txt"
expect "$BASE/robots.txt" 200 "robots.txt"
expect "$BASE/sitemap.xml" 200 "sitemap.xml"

echo "== 404 real en rutas inexistentes =="
expect "$BASE/esta-ruta-no-existe-12345" 404 "ruta inexistente devuelve 404"
expect "$BASE/carpeta/inexistente/profunda" 404 "ruta profunda inexistente devuelve 404"

echo "== Contenido para agentes =="
contains "$BASE/esta-ruta-no-existe-12345" "text/markdown" "cuerpo markdown en el 404"
contains "$BASE/llms.txt" "Cuando usar este sitio" "seccion when-to-use en llms.txt"
contains "$BASE/" "LocalBusiness" "tipo de identidad en el JSON-LD"
contains "$BASE/" "contactPoint" "contactPoint en el JSON-LD"

echo "== JSON-LD de la portada parsea =="
if curl -s "$BASE/" | python3 -c "
import sys,re,json
s=sys.stdin.read()
b=re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>',s,re.S)
assert b, 'sin JSON-LD'
[json.loads(x) for x in b]
print('bloques:',len(b))
"; then echo "OK   JSON-LD valido"; else echo "FAIL JSON-LD invalido"; fails=$((fails+1)); fi

echo
echo "$fails fallos"
exit $((fails>0))
