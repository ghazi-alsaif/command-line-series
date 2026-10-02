#!/usr/bin/env python3
"""
أصول الفيديو ثلاثي الأبعاد «رف السلسلة» — كلها من مصادر المستودع نفسه:

  • الغلاف الخلفي: آخر صفحة من كل كتاب مرندرة بـ Typst (كما في الـ PDF الرسمي).
  • صفحات داخلية حقيقية من الكتاب الأول (افتتاحية الفصل الأول).
  • الكعوب: تُصفّ بـ Typst بخطوط المستودع؛ عرض كل كعب = سماكة الكتاب المحسوبة من عدد صفحاته.
  • حافة الصفحات: نسيج خطوط ورق.

الاستعمال:  TYPST=/path/to/typst python3 scripts/make-3d-assets.py
"""
import json
import os
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
MOTION = os.path.dirname(HERE)
REPO = os.path.dirname(MOTION)
OUT = os.path.join(MOTION, "public/3d")
TYPST = os.environ.get("TYPST", "typst")
os.makedirs(OUT, exist_ok=True)

data = json.load(open(os.path.join(MOTION, "src/data/generated.json")))
books = data["books"]
TITLE_COLOR = {
    "1-linux": "#6E2C12", "2-macos": "#234A5F", "3-windows": "#5E3E0A", "4-bsd": "#5E1A13",
    "5-workbook": "#382863", "6-unix-story": "#363B5E", "7-automation": "#145A54",
    "8-server": "#145A54", "9-network": "#145A54", "10-projects": "#145A54",
}

# سماكة الكتاب (مم): ورق 80غ ≈ 0.1 مم للورقة (صفحتان) + غلافان مقوّيان
def thickness_mm(pages):
    return pages / 2 * 0.1 + 3.0


def typst(main, out_pattern, pages=None, ppi=150, root=REPO):
    cmd = [TYPST, "compile", "--root", root, "--font-path", os.path.join(REPO, "fonts"), "--ignore-system-fonts", "--ppi", str(ppi)]
    if pages:
        cmd += ["--pages", pages]
    subprocess.run(cmd + [main, out_pattern], check=True)


def to_jpg(src, dst, width):
    im = Image.open(src).convert("RGB")
    im = im.resize((width, round(width * im.height / im.width)), Image.LANCZOS)
    im.save(dst, quality=90, optimize=True)


with tempfile.TemporaryDirectory() as tmp:
    # 1) الأغلفة الخلفية
    for b in books:
        print("back:", b["id"])
        typst(os.path.join(REPO, "books", b["id"], "ar/main.typ"), os.path.join(tmp, f"{b['id']}-back-{{p}}.png"), str(b["pages"]), 140)
        to_jpg(os.path.join(tmp, f"{b['id']}-back-{b['pages']}.png"), os.path.join(OUT, f"back-{b['id']}.jpg"), 800)

    # 2) صفحات داخلية من الكتاب الأول: افتتاحية الفصل الأول «ما هي الطرفية؟»
    print("pages: 1-linux 13–15")
    typst(os.path.join(REPO, "books/1-linux/ar/main.typ"), os.path.join(tmp, "p-{p}.png"), "13-15", 170)
    for p in (13, 14, 15):
        to_jpg(os.path.join(tmp, f"p-{p}.png"), os.path.join(OUT, f"page-1-linux-{p}.jpg"), 1000)

    # 3) الكعوب
    spines = []
    for b in books:
        t = thickness_mm(b["pages"])
        size = 11 if t > 20 else (8.5 if t > 9 else 6.2)
        spines.append(
            f'''#page(width: {t:.2f}mm, height: 210mm, margin: 0mm, fill: rgb("#D9C394"))[
  #place(top + center, dy: 6mm, box(width: {t*0.62:.2f}mm, height: 0.6pt, fill: rgb("{TITLE_COLOR[b['id']]}")))
  #place(center + horizon, rotate(90deg, reflow: true, text(font: "Noto Kufi Arabic", weight: 800, size: {size}pt, fill: rgb("{TITLE_COLOR[b['id']]}"), lang: "ar", dir: rtl)[{b['title']}]))
  #place(bottom + center, dy: -7mm, text(font: "JetBrains Mono", weight: 700, size: {min(size, 8)}pt, fill: rgb("{TITLE_COLOR[b['id']]}"))[{b['n']:02d}])
  #place(bottom + center, dy: -4mm, box(width: {t*0.62:.2f}mm, height: 0.6pt, fill: rgb("{TITLE_COLOR[b['id']]}")))
]'''
        )
    src = os.path.join(tmp, "spines.typ")
    open(src, "w").write("\n".join(spines))
    typst(src, os.path.join(tmp, "spine-{p}.png"), ppi=200, root=tmp)
    for i, b in enumerate(books, 1):
        im = Image.open(os.path.join(tmp, f"spine-{i}.png")).convert("RGB")
        im.save(os.path.join(OUT, f"spine-{b['id']}.jpg"), quality=92)

# 4) حافة الصفحات: خطوط ورق دقيقة
w, h = 64, 1024
edge = Image.new("RGB", (w, h), (236, 226, 202))
d = ImageDraw.Draw(edge)
import random

random.seed(7)
for x in range(w):
    c = 222 + random.randint(-14, 10)
    d.line([(x, 0), (x, h)], fill=(c, c - 9, c - 30))
edge = edge.filter(ImageFilter.GaussianBlur(0.4))
edge.save(os.path.join(OUT, "page-edge.jpg"), quality=90)

meta = {b["id"]: {"thicknessMm": round(thickness_mm(b["pages"]), 2)} for b in books}
json.dump(meta, open(os.path.join(MOTION, "src/data/books3d.json"), "w"), indent=2)
print("✓", OUT)
