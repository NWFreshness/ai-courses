import pathlib, re
src = pathlib.Path(__file__).parent / "src"
mods = [
 ("m1","What a harness is","var(--w1)"),("m2","The agent loop","var(--w2)"),
 ("m3","Tools: the action interface","var(--w3)"),("m4","Context engineering","var(--w4)"),
 ("m5","Guides and sensors","var(--w5)"),("m6","Long-running agents","var(--w6)"),
 ("m7","Multi-agent orchestration","var(--w7)"),("m8","Safety, sandboxing, permissions","url(#stripe)"),
 ("m9","Durability and human-in-the-loop","var(--w9)"),("m10","Observability and evals","var(--w10)"),
 ("m11","Evolving the harness","var(--w11)"),("m12","Capstone: build Sentinel","url(#multi)"),
]
W,H = 1000, 610
parts = [f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" role="group">',
 '<defs><pattern id="stripe" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">'
 '<rect width="6" height="12" fill="var(--w8)"/><rect x="6" width="6" height="12" fill="var(--w8b)"/></pattern>'
 '<linearGradient id="multi" gradientUnits="userSpaceOnUse" x1="190" y1="0" x2="620" y2="0">'
 '<stop offset="0" stop-color="var(--w2)"/><stop offset=".33" stop-color="var(--w4)"/><stop offset=".66" stop-color="var(--w6)"/><stop offset="1" stop-color="var(--w10)"/></linearGradient></defs>']
n=len(mods)
strands=[]; terms=[]; signals=[]
for i,(mid,title,color) in enumerate(mods):
    sy = 262 + i*7.5
    ty = 34 + i*49
    d = f"M190 {sy} H430 C530 {sy} 520 {ty} 612 {ty} H622"
    strands.append(f'<path class="strand" id="st{i}" d="{d}" style="stroke:{color}"/>')
    signals.append(f'<circle class="signal" r="4" style="fill:var(--paper);stroke:var(--ink);stroke-width:1.5" opacity="0">'
        f'<animateMotion dur="8s" begin="{2.2 + i*0.62:.2f}s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;.35;1" calcMode="linear"><mpath href="#st{i}"/></animateMotion>'
        f'<animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;.03;.32;.36;1" dur="8s" begin="{2.2 + i*0.62:.2f}s" repeatCount="indefinite"/></circle>')
    terms.append(f'<a href="#{mid}" data-i="{i}" aria-label="Module {i+1}: {title}"><rect class="term" x="622" y="{ty-19}" width="360" height="38" rx="4"/>'
                 f'<text x="640" y="{ty+6}"><tspan style="font-variant-numeric:tabular-nums" class="muted">{i+1:>2}</tspan>  {title}</text></a>')
parts += strands
# cable ties
for x in (262, 352):
    parts.append(f'<rect x="{x}" y="252" width="10" height="106" rx="3" fill="var(--ink)"/>')
parts.append('<rect x="20" y="236" width="170" height="138" rx="8" fill="var(--ink)"/>'
             '<text x="105" y="300" text-anchor="middle" style="fill:var(--paper);font-size:26px;font-weight:700">Model</text>'
             '<text x="105" y="326" text-anchor="middle" style="fill:var(--paper);font-size:14px;opacity:.75">the part you rent</text>')
parts.append('<text x="300" y="392" text-anchor="middle" class="muted" style="font-size:14px">the harness: everything else</text>')
parts += terms
parts += signals
parts.append('</svg>')
loom = "\n".join(parts)
files = ["00-head.html","m00.html"] + [f"m{i:02d}.html" for i in range(1,14)] + ["99-tail.html"]
html = "".join((src/f).read_text() for f in files)

# ---- static nav + phone index from the sections themselves
secs = re.findall(r'<section class="module" id="([^"]+)" data-title="([^"]+)" data-wire="([^"]+)"([^>]*)>', html)
nav=[]; last=None; mob=[]
for sid,title,wire,rest in secs:
    grp = re.search(r'data-group="([^"]+)"', rest).group(1)
    cls = "striped" if "data-stripe" in rest else ("multi" if "data-multi" in rest else "")
    if not re.match(r"m\d+$", sid): cls = (cls+" ref").strip()
    if grp != last:
        nav.append(f'<li class="grp" aria-hidden="true">{grp}</li>'); last = grp
    num = re.match(r"m(\d+)$", sid)
    label = (num.group(1)+". " if num else "") + title
    nav.append(f'<li><a href="#{sid}" data-mod="{sid}" class="{cls}" style="--wire:{wire}"><span>{label}</span><span class="done" aria-hidden="true">✓</span></a></li>')
    if num:
        mob.append(f'<li><a href="#{sid}" data-mod="{sid}" class="{cls}" style="--wire:{wire};--i:{len(mob)}"><span>{label}</span><span class="done" aria-hidden="true">✓</span></a></li>')
html = html.replace("{{NAV}}", "".join(nav))
mobile = '<ol class="mobile-index">' + "".join(mob) + '</ol>'
html = html.replace("{{LOOM}}", loom + "</div>" + mobile + "<div hidden>")
# ---- diagrams: drawable connector lines
def add_pl(m):
    fig = m.group(0)
    return re.sub(r'<(path|line)((?:(?!>).)*?class="ln")', r'<\1 pathLength="1"\2', fig)
html = re.sub(r'<figure class="diagram">.*?</figure>', add_pl, html, flags=re.S)
# ---- diagrams: swipeable wrapper on phones
html = re.sub(r'(<figure class="diagram">)\s*(<svg.*?</svg>)', r'\1\n<p class="diagram-hint">Swipe sideways to see the whole diagram.</p><div class="diagram-scroll">\2</div>', html, flags=re.S)

attr_re = re.compile(r'\s(fill|stroke|stop-color)="((?:var|color-mix)\([^"]*\))"')
def fix_tag(m):
    tag = m.group(0)
    moved = attr_re.findall(tag)
    if not moved: return tag
    tag = attr_re.sub('', tag)
    decl = ";".join(f"{k}:{v}" for k,v in moved)
    if ' style="' in tag:
        tag = tag.replace(' style="', f' style="{decl};', 1)
    else:
        tag = re.sub(r'(/?>)$', f' style="{decl}"\\1', tag)
    return tag
html = re.sub(r'<(?:rect|circle|path|stop|line|ellipse|polygon|text)\b[^>]*>', fix_tag, html)
out = pathlib.Path(__file__).parent / "index.html"
out.write_text(html)
print(out, len(html))
