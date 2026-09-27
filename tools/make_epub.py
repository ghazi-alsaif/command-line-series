#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
مولّد EPUB لسلسلة سطر الأوامر — بلا أدوات خارجية (Python خالص + zipfile).
يحوّل ملفّات Typst (.typ) لكتابٍ إلى EPUB3 عربيٍّ RTL يُقرأ على الجوّال.

    python3 tools/make_epub.py <book_dir> <out.epub> [title] [author] [--cover <cover.png>]

يعالج المحتوى التقنيّ كلَّه: العناوين، والأجزاء، والملاحق، وصناديق التنبيه
(note/tip/warn/danger/distro/ethics/deep/try-it)، والتعريف، وأهداف الفصل،
وتحدّي الفصل، وجلسات الطرفيّة، والجداول، وكتل الكود (```)، ومفاتيح لوحة
المفاتيح، وبطاقات دفتر التمارين (win/linux/mac/bsd, ex, goal, doit, diff,
ex-challenge). العنوان/المؤلّف يُستنتجان من مجلّد الكتاب أو يُمرَّران وسيطين.
"""
import argparse, os, re, html, zipfile, datetime, hashlib, subprocess

AUTHOR = "غازي السيف — صاحب الفكرة والمشروع، والإعداد والإشراف والمراجعة"
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERSION_FILE = os.path.join(PROJECT_ROOT, "VERSION")
PROJECT_VERSION = open(VERSION_FILE, encoding="utf-8").read().strip()
BOOKMETA = {
    "1-linux":      ("مِن الصِّفر إلى الجَذر", "$", "على توزيعات أخرى"),
    "2-macos":      ("ماك من الطرفية", "%", "على أنظمةٍ أخرى"),
    "3-windows":    ("مِن الصِّفر إلى المسؤول", "C:\\>", "على أنظمةٍ أخرى"),
    "4-bsd":        ("مِن الصِّفر إلى العِفريت", "$", "على أنظمةٍ أخرى"),
    "5-workbook":   ("الطرفيّةُ بالممارسة", "$", "على أنظمةٍ أخرى"),
    "6-unix-story": ("رُوحٌ في الآلة — حكايةُ يونِكس", "$", None),
    "7-automation": ("مِن الأمر إلى الأتمتة", "$", "على أنظمةٍ أخرى"),
    "8-server":     ("الخادمُ الذي لا ينام", "$", "على أنظمةٍ أخرى"),
    "9-network":    ("الشبكةُ من الطرفية", "$", "على أنظمةٍ أخرى"),
    "10-projects":  ("10+ مشاريع كبرى من الطرفية", "$", "على أنظمةٍ أخرى"),
}
LABELS = {
    "note":"ملاحظة", "tip":"حيلة", "warn":"تحذير", "warning":"تحذير", "danger":"انتبه",
    "distro":"على توزيعات أخرى", "try-it":"جرّب بنفسك", "ethics":"أخلاقيات وقانون",
    "deep":"تعمُّق", "challenge":"تحدّي الفصل", "objectives":"في هذا الفصل ستتعلّم",
    "diff":"لاحظِ الفرق", "ex-challenge":"تحدٍّ",
}
SYS = {
    "win":  ("ويندوز · PowerShell", "PS>", "#B07A1E"),
    "linux":("لِينُكس", "$", "#C0592B"),
    "mac":  ("ماك", "%", "#4E7E9E"),
    "bsd":  ("BSD", "$", "#A5342B"),
}
CALLOUTS = {"note","tip","warn","warning","danger","distro","ethics","deep","try-it","diff","ex-challenge"}
BLOCK_FUNCS = (CALLOUTS | {
    "chapter","section","subsection","part","appendix","front-title",
    "define","objectives","challenge","session","table",
    "ex","goal","doit","win","linux","mac","bsd",
})

def esc(s):
    return html.escape(s, quote=False)

def source_datetime():
    """تاريخ حتميّ للبناء: SOURCE_DATE_EPOCH ثم تاريخ آخر commit."""
    raw = os.environ.get("SOURCE_DATE_EPOCH")
    if raw is None:
        try:
            raw = subprocess.check_output(
                ["git", "-C", PROJECT_ROOT, "log", "-1", "--format=%ct"],
                text=True,
            ).strip()
        except (OSError, subprocess.CalledProcessError):
            raw = "315532800"  # 1980-01-01، الحد الأدنى لـZIP
    dt = datetime.datetime.fromtimestamp(int(raw), datetime.timezone.utc)
    return dt

def zip_write(zf, path, data, dt):
    """اكتب عضو ZIP بطابع زمني ثابت."""
    info = zipfile.ZipInfo(path, dt.timetuple()[:6])
    info.compress_type = zipfile.ZIP_STORED if path == "mimetype" else zipfile.ZIP_DEFLATED
    info.external_attr = 0o100644 << 16
    zf.writestr(info, data)

# ── قارئات متوازنة ─────────────────────────────────────────────────────────
OPEN, CLOSE = "([{", ")]}"

def _skip_string(text, j, q):
    j += 1; n = len(text)
    while j < n:
        if q == '"' and text[j] == "\\":
            j += 2; continue
        if text[j] == q:
            return j + 1
        j += 1
    return j

def read_group(text, i):
    """text[i] فاتحةٌ ([{ ؛ يعيد (الداخل بلا القوسين، الفهرس بعد الغالقة)."""
    depth, j, n = 0, i, len(text)
    while j < n:
        c = text[j]
        if c == '"': j = _skip_string(text, j, '"'); continue
        if c == '`': j = _skip_string(text, j, '`'); continue
        if c in OPEN: depth += 1
        elif c in CLOSE:
            depth -= 1
            if depth == 0:
                return text[i+1:j], j+1
        j += 1
    return text[i+1:], n

def split_top(s, sep=','):
    out, buf, depth, j, n = [], [], 0, 0, len(s)
    while j < n:
        c = s[j]
        if c == '"': k = _skip_string(s, j, '"'); buf.append(s[j:k]); j = k; continue
        if c == '`': k = _skip_string(s, j, '`'); buf.append(s[j:k]); j = k; continue
        if c in OPEN: depth += 1
        elif c in CLOSE: depth -= 1
        if c == sep and depth == 0:
            out.append(''.join(buf)); buf = []; j += 1; continue
        buf.append(c); j += 1
    if buf: out.append(''.join(buf))
    return out

def _find_top_colon(seg):
    depth, j, n = 0, 0, len(seg)
    while j < n:
        c = seg[j]
        if c == '"': j = _skip_string(seg, j, '"'); continue
        if c == '`': j = _skip_string(seg, j, '`'); continue
        if c in OPEN: depth += 1
        elif c in CLOSE: depth -= 1
        elif c == ':' and depth == 0: return j
        j += 1
    return -1

def parse_args(inner):
    """يفصل محتوى (...) إلى (positional[], named{})."""
    pos, named = [], {}
    for seg in split_top(inner):
        if not seg.strip(): continue
        ci = _find_top_colon(seg)
        if ci != -1:
            key = seg[:ci].strip()
            if re.match(r'^[A-Za-z][\w-]*$', key):
                named[key] = seg[ci+1:].strip(); continue
        pos.append(seg.strip())
    return pos, named

def arg_text(v):
    """قيمةٌ قد تكون "نصًّا" أو `كودًا` أو [محتوى] أو مجرّدة → نصًّا خامًا."""
    v = v.strip()
    if len(v) >= 2 and v[0] == '"' and v[-1] == '"':
        return v[1:-1].replace('\\"', '"').replace('\\\\', '\\')
    if len(v) >= 2 and v[0] == '`' and v[-1] == '`':
        return v[1:-1]
    if len(v) >= 2 and v[0] == '[' and v[-1] == ']':
        return v[1:-1].strip()
    return v

# ── التنسيق السطريّ ────────────────────────────────────────────────────────
def render_inline(s, _holds=None):
    root = _holds is None
    holds = [] if root else _holds
    def hold(h):
        holds.append(h); return "\x00%d\x01" % (len(holds) - 1)
    # كود مضمّن `...`
    s = re.sub(r'`([^`]+)`', lambda m: hold('<code>%s</code>' % esc(m.group(1))), s)
    # مفاتيح #kbd(...) / #kbd[...]
    def kbd_sub(m):
        raw = (m.group(1) or m.group(2) or "").strip().strip('`"[]').strip()
        return hold('<kbd>%s</kbd>' % esc(raw))
    s = re.sub(r'#kbd\(([^()]*)\)|#kbd\[([^\]]*)\]', kbd_sub, s)
    # روابط Typst: #link("https://example.test")[النص]
    link_pat = re.compile(r'#link\(')
    out = []
    k = 0
    while True:
        mm = link_pat.search(s, k)
        if not mm:
            out.append(s[k:])
            break
        out.append(s[k:mm.start()])
        inner, end = read_group(s, mm.end() - 1)
        pos, _named = parse_args(inner)
        href = arg_text(pos[0]) if pos else ""
        j = end
        while j < len(s) and s[j].isspace():
            j += 1
        if j < len(s) and s[j] == '[':
            label, final = read_group(s, j)
        else:
            label, final = href, end
        rendered = render_inline(label, holds)
        if re.match(r'^(?:https?://|mailto:|#)', href):
            safe_href = html.escape(href, quote=True)
            out.append(hold('<a href="%s">%s</a>' % (safe_href, rendered)))
        else:
            out.append(hold(rendered))
        k = final
    s = ''.join(out)
    # #strong[..] / #emph[..] / #box[..] / #footnote[..]
    for name, tag in [("strong","strong"), ("emph","em"), ("box",""), ("footnote","")]:
        pat = re.compile(r'#%s\[' % name); out = []; k = 0
        while True:
            mm = pat.search(s, k)
            if not mm: out.append(s[k:]); break
            out.append(s[k:mm.start()])
            body, end = read_group(s, mm.end() - 1)
            rendered = render_inline(body, holds)
            out.append(hold('<%s>%s</%s>' % (tag, rendered, tag)) if tag else hold(rendered))
            k = end
        s = ''.join(out)
    s = re.sub(r'#linebreak\(\)|#linebreak\b|\\(?=\s|$)', lambda m: hold('<br/>'), s)
    # أهربِ الباقي
    s = esc(s)
    for a, b in [("\\@","@"),("\\#","#"),("\\$","$"),("\\_","_"),("\\*","*"),("\\~","~"),("\\\\","\\")]:
        s = s.replace(a, b)
    s = re.sub(r'\*([^*\n]+)\*', r'<strong>\1</strong>', s)
    s = re.sub(r'(?<!\w)_([^_\n]+)_(?!\w)', r'<em>\1</em>', s)
    s = s.replace('~', '\u00a0')
    if root:
        while re.search(r'\x00(\d+)\x01', s):
            s = re.sub(r'\x00(\d+)\x01', lambda m: holds[int(m.group(1))], s)
    return s

# ── عناصر متخصّصة ──────────────────────────────────────────────────────────
def render_prose(text):
    out = []
    for para in re.split(r'\n\s*\n', text):
        lines = [l.strip() for l in para.split('\n') if l.strip()]
        if not lines: continue
        if all(l.startswith('- ') for l in lines):
            out.append('<ul>%s</ul>' % ''.join('<li>%s</li>' % render_inline(l[2:]) for l in lines))
        elif all(l.startswith('+ ') for l in lines):
            out.append('<ol>%s</ol>' % ''.join('<li>%s</li>' % render_inline(l[2:]) for l in lines))
        else:
            out.append('<p>%s</p>' % render_inline(' '.join(lines)))
    return '\n'.join(out)

def render_terminal_lines(text, css_class):
    """يعزل اتجاه كل سطر خرج كي لا تقلبه بيئة الطرفية ذات الاتجاه LTR."""
    return '\n'.join(
        '<span class="%s terminal-line" dir="auto">%s</span>' % (css_class, esc(line))
        for line in text.split('\n')
    )

def render_session(prompt, cmd, output):
    h = ('<pre class="term" dir="ltr"><span class="pr">%s </span>'
         '<span class="cmd" dir="ltr">%s</span>') % (esc(prompt), esc(cmd))
    if output not in (None, ""):
        h += '\n' + render_terminal_lines(output, "out")
    return h + '</pre>'

def render_sol(kind, cmd, output):
    name, prompt, color = SYS[kind]
    body = ('<pre class="term" dir="ltr"><span class="pr" style="color:%s">%s </span>'
            '<span class="cmd" dir="ltr">%s</span>') % (color, esc(prompt), esc(cmd))
    if output not in (None, ""):
        body += '\n' + render_terminal_lines(output, "out")
    body += '</pre>'
    return ('<div class="sol" style="border-color:%s"><div class="solname" style="color:%s">%s</div>%s</div>'
            % (color, color, esc(name), body))

def render_table(inner):
    cols, header, cells = 1, [], []
    for seg in split_top(inner):
        st = seg.strip()
        if not st: continue
        if st.startswith('columns:'):
            v = st[len('columns:'):].strip()
            if v.startswith('('):
                gi = v.index('('); gend = v.rindex(')')
                cols = max(1, len([x for x in split_top(v[gi+1:gend]) if x.strip()]))
            elif v.isdigit():
                cols = int(v)
            continue
        if re.match(r'^(align|stroke|inset|fill|gutter|rows|row-gutter|column-gutter)\s*:', st):
            continue
        if st.startswith('table.header'):
            gi = st.index('('); hinner, _ = read_group(st, gi)
            header = [arg_text(c) for c in split_top(hinner) if c.strip()]
            continue
        if st.startswith('table.cell'):
            b = st.rfind('['); e = st.rfind(']')
            if b != -1 and e > b: cells.append(st[b+1:e])
            continue
        if st.startswith('table.'):
            continue
        cells.append(st[1:-1] if st.startswith('[') else arg_text(st))
    h = ['<table>']
    if header:
        cols = len(header)
        h.append('<thead><tr>%s</tr></thead>' % ''.join('<th>%s</th>' % render_inline(c) for c in header))
    h.append('<tbody>')
    for r in range(0, len(cells), cols):
        row = cells[r:r+cols]
        h.append('<tr>%s</tr>' % ''.join('<td>%s</td>' % render_inline(c) for c in row))
    h.append('</tbody></table>')
    return '\n'.join(h)

def render_objectives(g0):
    inner = g0.strip()
    if inner.startswith('(') and inner.endswith(')'):
        inner = inner[1:-1]
    items = []
    for seg in split_top(inner):
        st = seg.strip()
        if not st: continue
        if st.startswith('[') and st.endswith(']'): st = st[1:-1]
        items.append('<li>%s</li>' % render_inline(st))
    return '<aside class="box objectives"><div class="lbl">%s</div><ul>%s</ul></aside>' % (
        LABELS["objectives"], ''.join(items))

# ── المحرّك الكتليّ ─────────────────────────────────────────────────────────
CALL_RE = re.compile(r'#([A-Za-z][A-Za-z0-9-]*)')

def find_block_call(text, start):
    k = start
    while True:
        m = CALL_RE.search(text, k)
        if not m: return None
        name = m.group(1)
        if name not in BLOCK_FUNCS:
            k = m.end(); continue
        j = m.end()
        while j < len(text) and text[j] in ' \t': j += 1
        if j >= len(text) or text[j] not in '([':
            k = m.end(); continue
        groups = []
        while j < len(text) and text[j] in '([':
            g_inner, j = read_group(text, j)
            groups.append(g_inner)
            while j < len(text) and text[j] in ' \t': j += 1
        return m.start(), name, groups, j

def strip_directives(text):
    keep = []
    for l in text.split('\n'):
        ls = l.lstrip()
        if ls.startswith(('#import', '#include', '#show', '#set ', '//')):
            continue
        keep.append(l)
    return '\n'.join(keep)

def extract_fences(text, ctx):
    """يحمي كتل ``` بعلاماتٍ مؤقّتة قبل أيّ معالجة. القائمة مشترَكةٌ عبر ctx
    فلا تضيع الفهارس في الاستدعاءات المتداخلة (صناديق تحوي كودًا)."""
    fences = ctx["fences"]
    def repl(m):
        fences.append('<pre class="code">%s</pre>' % esc(m.group(2).strip('\n')))
        return '\n\x02%d\x03\n' % (len(fences) - 1)
    return re.sub(r'```([A-Za-z0-9+-]*)\n(.*?)```', repl, text, flags=re.S)

FENCE_RE = re.compile(r'\x02(\d+)\x03')
def render_prose_with_fences(chunk, ctx):
    parts, last = [], 0
    for m in FENCE_RE.finditer(chunk):
        pre = chunk[last:m.start()]
        if pre.strip(): parts.append(render_prose(pre))
        parts.append(ctx["fences"][int(m.group(1))]); last = m.end()
    tail = chunk[last:]
    if tail.strip(): parts.append(render_prose(tail))
    return '\n'.join(parts)

def render_blocks(text, ctx, top=False):
    # احمِ الكود أوّلًا (كي لا يحذف strip_directives سطرًا مثل #include داخل كود C)
    text = extract_fences(text, ctx)
    text = strip_directives(text)
    out, pos = [], 0
    while True:
        found = find_block_call(text, pos)
        if not found: break
        mstart, name, groups, end = found
        if mstart > pos:
            out.append(render_prose_with_fences(text[pos:mstart], ctx))
        out.append(render_call(name, groups, ctx, top))
        pos = end
    if pos < len(text):
        out.append(render_prose_with_fences(text[pos:], ctx))
    return '\n'.join(x for x in out if x)

def _heading(ctx, top, nav_level, tag, txt):
    aid = ""
    if top and nav_level <= 2:
        ctx["hcount"] += 1
        hid = "h%d" % ctx["hcount"]
        ctx["headings"].append((nav_level, txt, ctx["fname"] + "#" + hid))
        aid = ' id="%s"' % hid
    return '<%s%s>%s</%s>' % (tag, aid, render_inline(txt), tag)

def _first_pos(g0):
    pos, _ = parse_args(g0)
    return arg_text(pos[0]) if pos else g0.strip()

def render_call(name, groups, ctx, top):
    g0 = groups[0] if groups else ""
    if name == "chapter":     return _heading(ctx, top, 2, "h1", _first_pos(g0))
    if name == "section":     return _heading(ctx, top, 3, "h2", _first_pos(g0))
    if name == "subsection":  return _heading(ctx, top, 4, "h3", _first_pos(g0))
    if name == "front-title": return _heading(ctx, top, 2, "h1", _first_pos(g0))
    if name == "part":
        pos, _ = parse_args(g0)
        ordi = arg_text(pos[0]) if len(pos) > 0 else ""
        title = arg_text(pos[1]) if len(pos) > 1 else ordi
        eyebrow = ("الجزء %s" % ordi) if ordi else ""
        if top:
            ctx["hcount"] += 1; hid = "h%d" % ctx["hcount"]
            ctx["headings"].append((1, title, ctx["fname"] + "#" + hid))
            return ('<div class="part-divider" id="%s"><div class="eyebrow">%s</div><h1>%s</h1></div>'
                    % (hid, esc(eyebrow), render_inline(title)))
        return '<h1 class="part">%s</h1>' % render_inline(title)
    if name == "appendix":
        pos, _ = parse_args(g0)
        letter = arg_text(pos[0]) if len(pos) > 0 else ""
        title = arg_text(pos[1]) if len(pos) > 1 else ""
        return '<div class="eyebrow">الملحق %s</div>\n%s' % (esc(letter), _heading(ctx, top, 2, "h1", title))
    if name == "define":
        pos, _ = parse_args(g0)
        term = arg_text(pos[0]) if pos else ""
        body = pos[1] if len(pos) > 1 else ""
        if body.strip().startswith('['): body = body.strip()[1:-1]
        return ('<aside class="box define"><div class="lbl">تعريف · %s</div>%s</aside>'
                % (render_inline(term), render_blocks(body, ctx)))
    if name == "objectives": return render_objectives(g0)
    if name == "session":
        pos, named = parse_args(g0)
        cmd = arg_text(pos[0]) if pos else ""
        output = arg_text(named["output"]) if "output" in named else None
        prompt = arg_text(named["prompt"]) if "prompt" in named else ctx["prompt"]
        return render_session(prompt, cmd, output)
    if name == "table": return render_table(g0)
    if name in SYS:
        pos, named = parse_args(g0)
        cmd = arg_text(pos[0]) if pos else ""
        output = arg_text(named["output"]) if "output" in named else None
        return render_sol(name, cmd, output)
    if name == "ex":
        pos, _ = parse_args(g0)
        num = arg_text(pos[0]) if len(pos) > 0 else ""
        title = arg_text(pos[1]) if len(pos) > 1 else ""
        level = arg_text(pos[2]) if len(pos) > 2 else ""
        return ('<div class="ex"><span class="exh">تمرين %s — %s</span><span class="exl">%s</span></div>'
                % (render_inline(num), render_inline(title), esc(level)))
    if name == "goal":
        return '<p class="label-p"><strong>الهدف:</strong> %s</p>' % render_inline(_content(g0))
    if name == "doit":
        return '<p class="label-p"><strong>المهمّة:</strong> %s</p>' % render_inline(_content(g0))
    if name == "challenge":
        return ('<aside class="box challenge"><div class="lbl">%s</div>%s</aside>'
                % (LABELS["challenge"], render_blocks(_content(g0), ctx)))
    if name in CALLOUTS:
        label = LABELS.get(name, name)
        if name == "distro" and ctx.get("distro"): label = ctx["distro"]
        cls = {"warning":"warn"}.get(name, name).replace("-", "")
        return ('<aside class="box %s"><div class="lbl">%s</div>%s</aside>'
                % (cls, esc(label), render_blocks(_content(g0), ctx)))
    return ""

def _content(g):
    g = g.strip()
    return g[1:-1] if (g.startswith('[') and g.endswith(']')) else g

# ── القراءة والتغليف ───────────────────────────────────────────────────────
def read_contents(book_dir):
    items = []
    c = open(os.path.join(book_dir, '_contents.typ')).read()
    for line in c.split('\n'):
        mp = re.search(r'#part\("([^"]*)",\s*"([^"]+)"\)', line)
        if mp: items.append(('part', (mp.group(1), mp.group(2))))
        mi = re.search(r'#include "([^"]+)"', line)
        if mi: items.append(('file', os.path.join(book_dir, mi.group(1))))
    return items

def xhtml_page(title, body):
    return ('<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n'
        '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ar" lang="ar" dir="rtl">\n'
        '<head><meta charset="utf-8"/><title>%s</title>'
        '<link rel="stylesheet" type="text/css" href="style.css"/></head>\n'
        '<body dir="rtl">\n%s\n</body>\n</html>\n' % (esc(title), body))

CSS = """@namespace epub "http://www.idpf.org/2007/ops";
html { direction: rtl; }
body { direction: rtl; text-align: justify; font-family: serif; line-height: 1.9; margin: 1.1em; color: #26242E; }
h1 { font-size: 1.7em; color: #164A3E; text-align: center; margin: 1.4em 0 0.8em; line-height: 1.4; }
h2 { font-size: 1.28em; color: #1F6F5C; margin: 1.4em 0 0.55em; border-right: 3px solid #C0592B; padding-right: 0.5em; }
h3 { font-size: 1.1em; color: #26242E; margin: 1.1em 0 0.45em; }
p  { margin: 0 0 0.85em; text-align: justify; text-align-last: start; hyphens: none; }
.part-divider { text-align: center; margin: 3.2em 0; }
.part-divider h1 { font-size: 2.1em; color: #164A3E; border: 0; }
.eyebrow { color: #C0592B; font-weight: 700; font-size: 0.95em; text-align: center; margin-bottom: 0.2em; }
.box { border-radius: 5px; padding: 0.6em 0.9em; margin: 1.1em 0; font-size: 0.96em; }
.box .lbl { font-weight: 700; font-size: 0.92em; margin-bottom: 0.35em; }
.box p:last-child, .box ul:last-child { margin-bottom: 0; }
.note, .distro { background: #EAF1F6; border-right: 3px solid #2C6084; } .note>.lbl,.distro>.lbl{color:#2C6084;}
.tip  { background: #E9F1EE; border-right: 3px solid #1F6F5C; } .tip>.lbl{color:#1F6F5C;}
.warn { background: #FBF3E3; border-right: 3px solid #9C6B10; } .warn>.lbl{color:#9C6B10;}
.danger { background: #F7EAE9; border-right: 3px solid #A5342B; } .danger>.lbl{color:#A5342B;}
.ethics { background: #F7EAE9; border-right: 3px solid #A5342B; } .ethics>.lbl{color:#A5342B;}
.deep { background: #F0F0F2; border-right: 3px solid #6E6B78; } .deep>.lbl{color:#6E6B78;}
.tryit { background: #FBEEE6; border-right: 3px solid #C0592B; } .tryit>.lbl{color:#C0592B;}
.define { background: #E9F1EE; border-right: 3px solid #164A3E; } .define>.lbl{color:#164A3E;}
.challenge { background: #EAF2EF; border: 1px solid #164A3E; } .challenge>.lbl{color:#164A3E;}
.objectives { background: #F4F5F0; border-right: 3px solid #164A3E; } .objectives>.lbl{color:#164A3E;}
.diff { background: #FBF3E8; border-right: 3px solid #B07A1E; } .diff>.lbl{color:#8A5A12;}
.exchallenge { background: #FBEEE6; border-right: 3px solid #C0592B; } .exchallenge>.lbl{color:#C0592B;}
.objectives ul { margin: 0; padding-right: 1.2em; }
pre.term, pre.code { direction: ltr; text-align: left; unicode-bidi: isolate;
  font-family: monospace; font-size: 0.86em; background: #F5F3EC; border-radius: 4px;
  border-left: 2.5px solid #1F6F5C; padding: 0.6em 0.8em; margin: 0.9em 0;
  white-space: pre-wrap; word-wrap: break-word; overflow-wrap: anywhere; line-height: 1.5; }
pre.term .pr { color: #1F6F5C; font-weight: 700; }
pre.term .cmd { direction: ltr; unicode-bidi: isolate; }
pre.term .terminal-line { unicode-bidi: isolate; }
pre.term .out, pre.code .out { color: #6E6B78; }
.sol { border-right: 3px solid; border-radius: 5px; padding: 0.45em 0.7em; margin: 0.55em 0; background: #FAFAF8; }
.sol .solname { font-weight: 700; font-size: 0.86em; margin-bottom: 0.2em; }
.sol pre.term { margin: 0.25em 0 0; border-left: 0; background: #F5F3EC; }
.ex { background: #E9F1EE; border-radius: 5px; padding: 0.5em 0.8em; margin: 1.5em 0 0.6em;
  display: flex; justify-content: space-between; align-items: center; }
.ex .exh { font-weight: 800; color: #164A3E; font-size: 1.02em; }
.ex .exl { background: #EFE2C4; color: #6E5109; font-size: 0.72em; font-weight: 700; padding: 0.15em 0.5em; border-radius: 3px; }
.label-p { margin: 0.3em 0; } .label-p strong { color: #164A3E; }
kbd { font-family: monospace; font-size: 0.82em; background: #FAFAFA; border: 1px solid #E4E1D9;
  border-radius: 3px; padding: 0 0.35em; direction: ltr; unicode-bidi: embed; }
table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 0.9em; }
th, td { border-bottom: 0.6px solid #E4E1D9; padding: 0.4em 0.55em; text-align: right; vertical-align: top; }
th { color: #164A3E; font-weight: 700; background: #F4F5F0; }
code { font-family: monospace; direction: ltr; unicode-bidi: embed; background: #F1F0EC;
  padding: 0 0.2em; border-radius: 3px; font-size: 0.9em; }
strong { font-weight: 700; color: #164A3E; } em { font-style: italic; }
ul, ol { margin: 0 0 0.85em; padding-right: 1.4em; } li { margin: 0.28em 0; }
.cover { text-align: center; margin: 0; padding: 0; } .cover img { max-width: 100%; height: auto; }
"""

def build_nav(headings):
    tops = []  # each: [anchor_html, [child_html,...] or None]
    for level, text, target in headings:
        a = '<a href="%s">%s</a>' % (target, esc(text))
        if level <= 1:
            tops.append([a, []])
        else:
            if tops and tops[-1][1] is not None:
                tops[-1][1].append(a)
            else:
                tops.append([a, None])
    lis = []
    for a, children in tops:
        if children:
            sub = ''.join('<li>%s</li>' % c for c in children)
            lis.append('<li>%s<ol>%s</ol></li>' % (a, sub))
        else:
            lis.append('<li>%s</li>' % a)
    return '<ol>%s</ol>' % ''.join(lis)

def main():
    parser = argparse.ArgumentParser(description="بناء EPUB3 عربي من مصادر Typst")
    parser.add_argument("book_dir")
    parser.add_argument("out_path")
    parser.add_argument("title", nargs="?")
    parser.add_argument("author", nargs="?")
    parser.add_argument("--cover", help="غلاف PNG معنون مولّد من مصدر Typst الحالي")
    parser.add_argument(
        "--draft",
        action="store_true",
        help="وسم EPUB بوضوح بوصفه مسودة تطويرية غير منشورة",
    )
    parser.add_argument(
        "--typst-only-cover",
        action="store_true",
        help="الإفصاح أن الغلاف مصمم داخل Typst بلا صورة خارجية",
    )
    parser.add_argument(
        "--development-cover",
        action="store_true",
        help="الإفصاح عن غلاف مسودة مولد في جلسة تطوير المشروع",
    )
    args = parser.parse_args()

    book_dir = args.book_dir.rstrip('/')
    out_path = args.out_path
    key = os.path.basename(os.path.dirname(book_dir))
    meta = BOOKMETA.get(key, ("سلسلة سطر الأوامر", "$", None))
    title = args.title or meta[0]
    author = args.author or AUTHOR
    display_version = "مسودة تطويرية" if args.draft else PROJECT_VERSION
    edition_note = (
        "هذه مسودة تطويرية غير منشورة، وليست إصدارًا رسميًا من السلسلة."
        if args.draft
        else "هذه نسخة رسمية من المصدر المعتمد."
    )
    description = (
        "مسودة تطويرية عربية غير منشورة من سلسلة سطر الأوامر."
        if args.draft
        else "كتاب عربي من سلسلة سطر الأوامر؛ النسخة الرسمية من المستودع المعتمد."
    )
    if args.typst_only_cover and args.development_cover:
        parser.error("لا يجتمع --typst-only-cover و--development-cover")
    cover_disclosure = (
        "غلاف هذه النسخة مصمم بالكامل داخل المشروع باستخدام Typst، "
        "ولا يعتمد على صورة مولدة أو أصل بصري خارجي. يخضع نصه وتصميمه "
        "البرمجي لخريطة التراخيص المحددة في LICENSES/README.md."
        if args.typst_only_cover
        else
        "أُنشئ فن غلاف هذه المسودة عبر ChatGPT Images من وصف نصي "
        "أصلي ولوحة أساس فارغة مولدة داخل المشروع لضبط هوية السلسلة، "
        "دون مدخلات بصرية خارجية. أضيفت العناوين والنصوص والتنسيق "
        "النهائي باستخدام Typst. صورة الغلاف مستثناة من CC BY-SA 4.0."
        if args.development_cover
        else
        "استُخدمت أدوات توليد الصور في إعداد الفن الأساسي للأغلفة، "
        "ثم نُسّقت العناصر النصية والتصميمية بأداة Typst. وثّق صاحب "
        "المشروع أن الصور وُلّدت بالكامل عبر ChatGPT Images من أوصاف "
        "نصية أصلية دون مدخلات بصرية خارجية. صورة الغلاف مستثناة من "
        "CC BY-SA 4.0، فلا تمنح رخصة المحتوى حق إعادة استخدامها "
        "تلقائيًا."
    )
    ctx = {"prompt": meta[1], "distro": meta[2], "fname": "", "headings": [], "hcount": 0, "fences": []}

    items = read_contents(book_dir)
    pages = []
    idx = [0]

    def add_page(text):
        idx[0] += 1
        fname = 'p%d.xhtml' % idx[0]
        ctx["fname"] = fname
        start = len(ctx["headings"])
        body = render_blocks(text, ctx, top=True)
        body = FENCE_RE.sub(lambda m: ctx["fences"][int(m.group(1))], body)
        ph = ctx["headings"][start:]
        nav_title = ph[0][1] if ph else 'صفحة %d' % idx[0]
        pages.append(('p%d' % idx[0], fname, body))

    add_page('#front-title("صفحة العنوان", outlined: true)\n\n'
             '*%s*\n\nسلسلة سطر الأوامر · الإصدار %s\n\n'
             'صاحب الفكرة والمشروع، والإعداد والإشراف والمراجعة:\n'
             'المهندس غازي السيف — أبو هيثم' % (title, display_version))
    add_page('#front-title("الحقوق والرخصة", outlined: true)\n\n'
             'المحتوى العام المحدد في خريطة تراخيص المستودع منشور، '
             'ابتداءً من الإصدار 1.3، بموجب المشاع الإبداعي — '
             'نَسْبُ الـمُصنَّف، الترخيص بالمثل 4.0 دولي (CC BY-SA 4.0).\n\n'
             'تسمح الرخصة بالنسخ وإعادة التوزيع والطباعة والبيع والترجمة '
             'والتعديل، مع النسب وبيان التغيير والمشاركة بالمثل. لا تشمل '
             'الرخصة المواد غير المدرجة أو مواد الأطراف الثالثة أو الأصول '
             'المستثناة في LICENSES/README.md.\n\n'
             'الرخصة: https://creativecommons.org/licenses/by-sa/4.0/\n\n'
             'المصدر الرسمي: https://github.com/ghazi-alsaif/command-line-series\n\n'
             '%s لا يعني النسب اعتماد أي نسخة معدلة أو مترجمة مستقلة.'
             % edition_note)
    add_page('#front-title("الإفصاح عن الذكاء الاصطناعي", outlined: true)\n\n'
             'هذا المشروع من فكرة غازي السيف وتصميمه وإشرافه. جميع مسودات '
             'الكتب ونصوصها الأساسية وُلّدت باستخدام أدوات الذكاء '
             'الاصطناعي. وتولّى غازي وضع فكرة المشروع، وبناء هيكله، وتوجيه '
             'عملية الكتابة، وتنظيم مادته، ومراجعتها وتدقيقها، واختيار ما '
             'يُعتمد منها، واعتماد النسخة المنشورة، ويتحمّل مسؤولية '
             'القرارات التحريرية والمحتوى النهائي. لا تُنسب أدوات الذكاء '
             'الاصطناعي بوصفها مؤلفًا أو مؤلفًا مشاركًا.\n\n'
             '%s' % cover_disclosure)
    add_page('#front-title("طريقة النسب", outlined: true)\n\n'
             'العمل الأصلي: سلسلة سطر الأوامر\n\n'
             'صاحب الفكرة والمشروع، والإعداد والإشراف والمراجعة: '
             'المهندس غازي السيف — أبو هيثم\n\n'
             'المصدر الرسمي: https://github.com/ghazi-alsaif/command-line-series\n\n'
             'الرخصة: CC BY-SA 4.0\n\n'
             'على النسخة المعدلة أو المترجمة أن تبيّن التعديل وألا توحي '
             'بأن غازي السيف راجعها أو اعتمدها.')

    for fmname in ('preface.typ', 'how-to-read.typ'):
        p = os.path.join(book_dir, 'frontmatter', fmname)
        if os.path.exists(p):
            add_page(open(p, encoding='utf-8').read())
    for kind, val in items:
        if kind == 'part':
            add_page('#part("%s", "%s")' % (val[0], val[1]))
        elif os.path.exists(val):
            add_page(open(val, encoding='utf-8').read())

    # يمرّر مسار الإصدار غلافًا مولّدًا مباشرة من cover.typ، فلا يعتمد EPUB
    # على لقطة قديمة. يبقى الرجوع إلى الأصل المعنون للتشغيل اليدوي المتوافق.
    cover_img = args.cover
    if cover_img and not os.path.isfile(cover_img):
        parser.error("ملف الغلاف غير موجود: %s" % cover_img)
    if not cover_img:
        cover_img = os.path.join(book_dir, 'assets/cover-front-titled.png')
        if not os.path.exists(cover_img):
            cover_img = os.path.join(book_dir, 'assets/cover-front.png')
    has_cover = os.path.exists(cover_img)
    uid = 'urn:uuid:' + hashlib.md5((title + author).encode()).hexdigest()
    build_dt = source_datetime()
    source_date = build_dt.date().isoformat()
    modified = build_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)
    z = zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED)
    zip_write(z, 'mimetype', 'application/epub+zip', build_dt)
    zip_write(z, 'META-INF/container.xml',
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n'
        '<rootfiles><rootfile full-path="OEBPS/content.opf" '
        'media-type="application/oebps-package+xml"/></rootfiles></container>', build_dt)
    zip_write(z, 'OEBPS/style.css', CSS, build_dt)

    manifest = ['<item id="css" href="style.css" media-type="text/css"/>',
                '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>']
    spine = []
    if has_cover:
        zip_write(z, 'OEBPS/images/cover.png', open(cover_img, 'rb').read(), build_dt)
        manifest.append('<item id="coverimg" href="images/cover.png" media-type="image/png" properties="cover-image"/>')
        zip_write(z, 'OEBPS/cover.xhtml', xhtml_page(title,
            '<div class="cover"><img src="images/cover.png" alt="الغلاف"/></div>'), build_dt)
        manifest.append('<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>')
        spine.append('<itemref idref="cover"/>')

    for pid, fname, body in pages:
        zip_write(z, 'OEBPS/' + fname, xhtml_page(title, body), build_dt)
        manifest.append('<item id="%s" href="%s" media-type="application/xhtml+xml"/>' % (pid, fname))
        spine.append('<itemref idref="%s"/>' % pid)

    zip_write(z, 'OEBPS/nav.xhtml', xhtml_page('الفهرس',
        '<nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops" id="toc">'
        '<h1>الفهرس</h1>%s</nav>' % build_nav(ctx["headings"])), build_dt)

    meta_cover = '<meta name="cover" content="coverimg"/>' if has_cover else ''
    opf = ('<?xml version="1.0" encoding="utf-8"?>\n'
        '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" '
        'xml:lang="ar" prefix="schema: http://schema.org/">\n'
        '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n'
        '<dc:identifier id="bookid">%s</dc:identifier>\n<dc:title>%s</dc:title>\n'
        '<dc:creator>%s</dc:creator>\n'
        '<dc:contributor>أدوات ذكاء اصطناعي: توليد جميع مسودات الكتب ونصوصها الأساسية؛ ليست مؤلفًا أو مؤلفًا مشاركًا</dc:contributor>\n'
        '<dc:language>ar</dc:language>\n<dc:date>%s</dc:date>\n'
        '<dc:description>%s</dc:description>\n'
        '<dc:source>https://github.com/ghazi-alsaif/command-line-series</dc:source>\n'
        '<dc:rights>CC BY-SA 4.0 للمحتوى العام المحدد؛ راجع LICENSES/README.md للاستثناءات.</dc:rights>\n'
        '<meta property="schema:version">%s</meta>\n'
        '<meta property="dcterms:modified">%s</meta>\n%s\n</metadata>\n'
        '<manifest>%s</manifest>\n<spine page-progression-direction="rtl">%s</spine>\n</package>'
        % (uid, esc(title), esc(author), source_date, esc(description),
           esc(display_version), modified,
           meta_cover, "".join(manifest), "".join(spine)))
    zip_write(z, 'OEBPS/content.opf', opf, build_dt)
    z.close()
    print('✔ %s  (%d صفحة، %d ملحوظة عنوان، %d كيلوبايت)'
          % (out_path, len(pages), len(ctx["headings"]), os.path.getsize(out_path)//1024))

if __name__ == '__main__':
    main()
