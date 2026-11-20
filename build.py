"""Build every course in courses/ plus the hub page into site/.

    python3 build.py

Each course folder holds a course.json and its module fragments (m00.html, m01.html, ...).
The shared page shell lives in engine/. Output: site/index.html and site/<slug>/index.html.
"""
import json, pathlib, re, html as htmlmod

ROOT = pathlib.Path(__file__).parent
ENGINE = ROOT / "engine"
SITE = ROOT / "site"


# ---------------------------------------------------------------- heroes
def hero_loom(cfg):
    """Harness Engineering: one wire per module, fanning out from the model."""
    mods = cfg["hero_modules"]
    W, H = 1000, 610
    parts = [f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" role="group">',
             '<defs><pattern id="stripe" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">'
             '<rect width="6" height="12" fill="var(--w8)"/><rect x="6" width="6" height="12" fill="var(--w8b)"/></pattern>'
             '<linearGradient id="multi" gradientUnits="userSpaceOnUse" x1="190" y1="0" x2="620" y2="0">'
             '<stop offset="0" stop-color="var(--w2)"/><stop offset=".33" stop-color="var(--w4)"/><stop offset=".66" stop-color="var(--w6)"/><stop offset="1" stop-color="var(--w10)"/></linearGradient></defs>']
    strands, terms, signals = [], [], []
    for i, (mid, title, color) in enumerate(mods):
        sy, ty = 262 + i * 7.5, 34 + i * 49
        d = f"M190 {sy} H430 C530 {sy} 520 {ty} 612 {ty} H622"
        strands.append(f'<path class="strand" id="st{i}" d="{d}" style="stroke:{color}"/>')
        b = f"{2.2 + i * 0.62:.2f}"
        signals.append(f'<circle class="signal" r="4" style="fill:var(--paper);stroke:var(--ink);stroke-width:1.5" opacity="0">'
                       f'<animateMotion dur="8s" begin="{b}s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;.35;1" calcMode="linear"><mpath href="#st{i}"/></animateMotion>'
                       f'<animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;.03;.32;.36;1" dur="8s" begin="{b}s" repeatCount="indefinite"/></circle>')
        terms.append(f'<a href="#{mid}" data-i="{i}" aria-label="Module {i+1}: {title}"><rect class="term" x="622" y="{ty-19}" width="360" height="38" rx="4"/>'
                     f'<text x="640" y="{ty+6}"><tspan style="font-variant-numeric:tabular-nums" class="muted">{i+1:>2}</tspan>  {title}</text></a>')
    parts += strands
    for x in (262, 352):
        parts.append(f'<rect x="{x}" y="252" width="10" height="106" rx="3" fill="var(--ink)"/>')
    parts.append('<rect x="20" y="236" width="170" height="138" rx="8" fill="var(--ink)"/>'
                 '<text x="105" y="300" text-anchor="middle" style="fill:var(--paper);font-size:26px;font-weight:700">Model</text>'
                 '<text x="105" y="326" text-anchor="middle" style="fill:var(--paper);font-size:14px;opacity:.75">the part you rent</text>')
    parts.append('<text x="300" y="392" text-anchor="middle" class="muted" style="font-size:14px">the harness: everything else</text>')
    parts += terms + signals + ['</svg>']
    mob = "".join(f'<li><a href="#{m}" data-mod="{m}" class="{"striped" if "stripe" in c else ("multi" if "multi" in c else "")}" '
                  f'style="--wire:{c if c.startswith("var") else "var(--ink)"};--i:{i}"><span>{i+1}. {t}</span><span class="done" aria-hidden="true">✓</span></a></li>'
                  for i, (m, t, c) in enumerate(mods))
    return "\n".join(parts) + '</div><ol class="mobile-index">' + mob + '</ol><div hidden>'


def hero_tokens(cfg):
    """LLM Engineering: the course as a model's streamed completion, one token per week."""
    prompt = htmlmod.escape(cfg["hero_prompt"])
    chips = []
    for i, (mid, label, color, tag) in enumerate(cfg["hero_modules"]):
        chips.append(f'<a class="tok" href="#{mid}" style="--tc:{color};--i:{i}" data-mod="{mid}">'
                     f'<small>{tag}</small><span>{htmlmod.escape(label)}</span><i class="done" aria-hidden="true">✓</i></a>')
    return (f'<div class="token-stream" aria-label="Course map: select a week to open it.">'
            f'<p class="ts-prompt"><span class="ts-role">prompt</span>{prompt}</p>'
            f'<p class="ts-out"><span class="ts-role">completion</span>{"".join(chips)}<span class="caret" aria-hidden="true"></span></p></div>')


def hero_trace(cfg):
    """Agentic AI: the course as one agent run, shown in a trace viewer. Each module is a span."""
    root = htmlmod.escape(cfg["hero_prompt"])
    rows = [f'<div class="tr-row tr-root"><span class="tr-kind">run</span><span class="tr-name"><code>{root}</code></span>'
            f'<span class="tr-lane"><i class="tr-bar" style="--s:0;--l:100;--i:0"></i></span></div>']
    for i, (mid, kind, label, color, start, length) in enumerate(cfg["hero_modules"]):
        rows.append(f'<a class="tr-row" href="#{mid}" data-mod="{mid}" style="--tc:{color}">'
                    f'<span class="tr-kind">{kind}</span><span class="tr-name">{htmlmod.escape(label)}'
                    f'<i class="done" aria-hidden="true"> ✓</i></span>'
                    f'<span class="tr-lane"><i class="tr-bar" style="--s:{start};--l:{length};--i:{i + 1}"></i></span></a>')
    return ('<div class="trace" aria-label="Course map as an agent trace: select a span to open that module.">'
            '<p class="tr-head"><span>Trace</span><span>one span per module</span></p>' + "".join(rows) + '</div>')


HEROES = {"loom": hero_loom, "tokens": hero_tokens, "trace": hero_trace}


# ---------------------------------------------------------------- charts
def leaderboard(cfg, stage):
    """Horizontal bar chart of the published Price Is Right results, up to a given week."""
    rows = [r for r in cfg["leaderboard"] if r["week"] <= stage]
    rows = sorted(rows, key=lambda r: -r["error"])
    top = max(r["error"] for r in rows)
    W, rowh, x0, x1 = 540, 28, 210, 460
    H = 40 + rowh * len(rows) + 30
    out = [f'<svg class="chart" viewBox="0 0 {W} {H}" role="img" aria-label="Average prediction error in dollars for each approach, lower is better.">',
           f'<text x="{x0}" y="22" class="muted" style="font-size:14px">average error in dollars, lower is better</text>']
    for i, r in enumerate(rows):
        y = 36 + i * rowh
        w = (x1 - x0) * r["error"] / top
        new = r["week"] == stage
        col = {"baseline": "var(--muted)", "human": "var(--ink)", "nn": "var(--w3)", "frontier": "var(--w1)",
               "finetune": "var(--w7)", "agent": "var(--w8)"}[r["kind"]]
        label = htmlmod.escape(r["name"])
        out.append(f'<g><text x="{x0-10}" y="{y+18}" text-anchor="end" style="font-size:15px{";font-weight:700" if new else ""}">{label}</text>'
                   f'<rect class="bar" x="{x0}" y="{y+3}" width="{w:.1f}" height="{rowh-8}" rx="3" style="fill:{col};opacity:{1 if new else .55}"/>'
                   f'<text x="{x0 + w + 8:.1f}" y="{y+18}" style="font-size:14px;font-variant-numeric:tabular-nums">${r["error"]:.2f}</text></g>')
    out.append('</svg>')
    return "\n".join(out)


# ---------------------------------------------------------------- code highlighting
# Modules can hold plain code in <code class="hl-py">, "hl-sh" or "hl-yaml"; the build colors it.
# The other courses carry hand-highlighted spans, which pass through untouched.
import io, keyword, tokenize

PY_KW = set(keyword.kwlist) | {"match", "case", "self"}


def _wrap(cls, text):
    return f'<span class="{cls}">{htmlmod.escape(text, quote=False)}</span>'


def hl_python(src):
    lines = src.splitlines(keepends=True)
    starts = [0]
    for ln in lines:
        starts.append(starts[-1] + len(ln))
    off = lambda rc: starts[rc[0] - 1] + rc[1]
    out, pos, prev, fdepth, fstart = [], 0, None, 0, None
    try:
        toks = list(tokenize.generate_tokens(io.StringIO(src).readline))
    except (tokenize.TokenError, SyntaxError):
        return htmlmod.escape(src, quote=False)
    FS, FE = getattr(tokenize, "FSTRING_START", -1), getattr(tokenize, "FSTRING_END", -2)
    for t in toks:
        a, b = off(t.start), off(t.end)
        if fdepth:                       # inside an f-string: color it whole at its end
            if t.type == FS:
                fdepth += 1
            elif t.type == FE:
                fdepth -= 1
                if not fdepth:
                    out.append(_wrap("s", src[fstart:b])); pos = b
            continue
        if a > pos:
            out.append(htmlmod.escape(src[pos:a], quote=False))
        text = src[a:b]
        if t.type == FS:
            fdepth, fstart = 1, a
            continue
        if t.type == tokenize.STRING:
            out.append(_wrap("s", text))
        elif t.type == tokenize.COMMENT:
            out.append(_wrap("c", text))
        elif t.type == tokenize.NAME and text in PY_KW:
            out.append(_wrap("k", text))
        elif t.type == tokenize.NAME and prev and prev.string in ("def", "class", "@"):
            out.append(_wrap("f", text))
        elif t.type == tokenize.NUMBER:
            out.append(_wrap("s", text))
        else:
            out.append(htmlmod.escape(text, quote=False))
        pos = max(pos, b)
        if t.type not in (tokenize.NL, tokenize.NEWLINE, tokenize.INDENT, tokenize.DEDENT):
            prev = t
    out.append(htmlmod.escape(src[pos:], quote=False))
    return "".join(out)


def hl_sh(src):
    out = []
    for line in src.splitlines(keepends=True):
        code, hash_, comment = line.partition(" #") if not line.lstrip().startswith("#") else ("", "", line)
        esc = htmlmod.escape(code, quote=False)
        esc = re.sub(r"(&quot;|\"|')(.*?)\1", lambda m: _wrap("s", htmlmod.unescape(m.group(0))), esc)
        out.append(esc + (_wrap("c", (" #" if hash_ else "") + comment.rstrip("\n")) + ("\n" if line.endswith("\n") else "") if comment else ""))
    return "".join(out)


def hl_yaml(src):
    out = []
    for line in src.splitlines(keepends=True):
        m = re.match(r"(\s*)([\w-]+)(:)(.*)", line, re.S)
        if line.lstrip().startswith("#"):
            out.append(_wrap("c", line.rstrip("\n")) + ("\n" if line.endswith("\n") else ""))
        elif m:
            out.append(m.group(1) + _wrap("k", m.group(2)) + m.group(3) + htmlmod.escape(m.group(4), quote=False))
        else:
            out.append(htmlmod.escape(line, quote=False))
    return "".join(out)


HL = {"py": hl_python, "sh": hl_sh, "yaml": hl_yaml}


def highlight(page):
    def one(m):
        lang, body = m.group(1), htmlmod.unescape(m.group(2))
        return "<code>" + HL[lang](body.strip("\n")) + "</code>"
    return re.sub(r'<code class="hl-(py|sh|yaml)">(.*?)</code>', one, page, flags=re.S)


# ---------------------------------------------------------------- page assembly
attr_re = re.compile(r'\s(fill|stroke|stop-color)="((?:var|color-mix)\([^"]*\))"')


def fix_tag(m):
    """CSS variables are unreliable in SVG presentation attributes; move them into style."""
    tag = m.group(0)
    moved = attr_re.findall(tag)
    if not moved:
        return tag
    tag = attr_re.sub('', tag)
    decl = ";".join(f"{k}:{v}" for k, v in moved)
    if ' style="' in tag:
        return tag.replace(' style="', f' style="{decl};', 1)
    return re.sub(r'(/?>)$', f' style="{decl}"\\1', tag)


def build_course(folder):
    cfg = json.loads((folder / "course.json").read_text())
    body = "".join((folder / f).read_text() for f in sorted(p.name for p in folder.glob("m*.html")))
    head = (ENGINE / "head.html").read_text()
    css = (folder / "course.css").read_text() if (folder / "course.css").exists() else ""
    public = {k: cfg[k] for k in ("slug", "title", "storage")}
    for k, v in {"{{TITLE}}": cfg["title"], "{{SHORT}}": cfg["short"], "{{KIND}}": cfg["kind"],
                 "{{SUBTITLE}}": cfg["subtitle"], "{{COURSE_CSS}}": css,
                 "{{COURSE_JSON}}": json.dumps(public)}.items():
        head = head.replace(k, v)
    page = highlight(head + body + (ENGINE / "tail.html").read_text())
    if (folder / "sims.js").exists():          # hands-on simulators: shared toolkit, then the course's own
        js = (ENGINE / "sims.js").read_text() + "\n" + (folder / "sims.js").read_text()
        page = page.replace("</body>", "<script>\n" + js + "\n</script>\n</body>", 1)

    # static navigation from the sections themselves
    secs = re.findall(r'<section class="module" id="([^"]+)" data-title="([^"]+)" data-wire="([^"]+)"([^>]*)>', page)
    nav, last = [], None
    for sid, title, wire, rest in secs:
        grp = re.search(r'data-group="([^"]+)"', rest).group(1)
        cls = "striped" if "data-stripe" in rest else ("multi" if "data-multi" in rest else "")
        if not re.match(r"m\d+$", sid):
            cls = (cls + " ref").strip()
        if grp != last:
            nav.append(f'<li class="grp" aria-hidden="true">{grp}</li>')
            last = grp
        num = re.match(r"m(\d+)$", sid)
        label = (num.group(1) + ". " if num else "") + title
        nav.append(f'<li><a href="#{sid}" data-mod="{sid}" class="{cls}" style="--wire:{wire}"><span>{label}</span>'
                   f'<span class="done" aria-hidden="true">✓</span></a></li>')
    page = page.replace("{{NAV}}", "".join(nav))
    page = page.replace("{{HERO}}", HEROES[cfg["hero"]](cfg))
    page = re.sub(r"\{\{LEADERBOARD:(\d+)\}\}", lambda m: leaderboard(cfg, int(m.group(1))), page)

    # diagrams: drawable connector lines, swipe on phones
    page = re.sub(r'<figure class="diagram">.*?</figure>',
                  lambda m: re.sub(r'<(path|line)((?:(?!>).)*?class="ln")', r'<\1 pathLength="1"\2', m.group(0)), page, flags=re.S)
    page = re.sub(r'(<figure class="diagram">)\s*(<svg.*?</svg>)',
                  r'\1\n<p class="diagram-hint">Swipe sideways to see the whole diagram.</p><div class="diagram-scroll">\2</div>', page, flags=re.S)
    page = re.sub(r'<(?:rect|circle|path|stop|line|ellipse|polygon|text)\b[^>]*>', fix_tag, page)

    out = SITE / cfg["slug"] / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page)
    core = len([s for s in secs if re.match(r"m\d+$", s[0])])
    print(f"  {out.relative_to(ROOT)}  {len(page):,} bytes, {core} modules")
    return cfg, core, [(s[0], s[1]) for s in secs if re.match(r"m\d+$", s[0])]


def build_hub(courses):
    tpl = (ROOT / "hub" / "index.html").read_text()
    data = [{"slug": c["slug"], "title": c["title"], "storage": c["storage"], "modules": n,
             "titles": dict(titles)} for c, n, titles in courses]
    cards = []
    for c, n, _ in courses:
        cards.append(f'<li class="course" data-slug="{c["slug"]}" style="--accent:{c["accent"]}">'
                     f'<a href="{c["slug"]}/"><span class="motif motif-{c["hero"]}" aria-hidden="true">{c["motif"]}</span>'
                     f'<span class="c-body"><b>{c["title"]}</b><span class="c-blurb">{c["blurb"]}</span>'
                     f'<span class="c-meta">{n} modules · {c["time"]}</span>'
                     f'<span class="c-prog"><i></i></span><span class="c-status"></span></span></a></li>')
    page = tpl.replace("{{CARDS}}", "".join(cards)).replace("{{COURSES_JSON}}", json.dumps(data))
    (SITE / "index.html").write_text(page)
    (SITE / ".nojekyll").write_text("")
    print(f"  site/index.html  hub with {len(courses)} courses")


if __name__ == "__main__":
    folders = sorted(p for p in (ROOT / "courses").iterdir() if (p / "course.json").exists())
    order = {"llm-engineering": 0, "agents": 1, "harness-engineering": 2}
    folders.sort(key=lambda p: order.get(p.name, 9))
    print("Building courses:")
    built = [build_course(f) for f in folders]
    build_hub(built)
