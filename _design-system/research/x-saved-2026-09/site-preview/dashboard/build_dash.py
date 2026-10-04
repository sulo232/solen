# Dashboard redo mockups (home, services, clients, settings) from The Fade Factory's real data.
# Owner 2026-10-04: design these from the references only, ignoring past design decisions.
# Anatomy and treatment: the reference study (_design-system/research/x-saved-2026-09/dashboard-study.md).
import os, html
SP = os.path.dirname(os.path.abspath(__file__))
OUT = '/Users/sulo/Documents/solen/public/_research/site-mockup/dashboard-new'
os.makedirs(OUT, exist_ok=True)
I = {}
for f in ('dash-icons.tsv',):
    for line in open(os.path.join(SP, f)):
        n, svg = line.rstrip('\n').split('\t', 1)
        I[n] = svg
def ic(n, cls='ic'):
    return I[n].replace('<svg ', f'<svg class="{cls}" aria-hidden="true" ', 1)
E = html.escape

def chf(v): return f"CHF {v:,}".replace(',', "'")

# ---------- shared chrome ----------
NAV = [('home', 'LayoutGrid', 'Overview', 'home.html'), ('cal', 'Calendar', 'Calendar', '../dash-calendar/index.html'),
       ('services', 'Scissors', 'Services', 'services.html'), ('clients', 'Users', 'Clients', 'clients.html'),
       ('settings', 'Settings', 'Settings', 'settings.html')]
def rail(on):
    items = ''.join(f'<a class="ri{" on" if k == on else ""}" href="{h}" aria-label="{l}"{" aria-current=page" if k == on else ""}>{ic(i)}</a>' for k, i, l, h in NAV)
    return f'<nav class="rail" aria-label="Dashboard"><div class="logo">S</div>{items}<span class="grow"></span><span class="me">TF</span></nav>'
def top():
    return (f'<header class="top"><button class="tb" aria-label="Menu">{ic("Menu")}</button>'
            f'<button class="switch">The Fade Factory{ic("ChevronsUpDown", "ic16")}</button><span class="grow"></span>'
            f'<button class="tb" aria-label="Search">{ic("Search")}</button><button class="tb" aria-label="Notifications">{ic("Bell")}</button></header>')
def page(name, on, body, title):
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>{title}</title><link rel="stylesheet" href="dash.css"></head><body>
<!-- Exists-check: npm run exists dashboard (180 hits). Target surfaces: /dashboard, /dashboard/services, /dashboard/clients, /dashboard/settings. Removed hits honoured: colored left-edge bars (REMOVED.md 2026-07-15). New part: treatment and layout only; every value is The Fade Factory's real data. -->
<div class="app">{rail(on)}<div class="main">{top()}<main class="body" id="{name}">{body}</main></div></div>
<div class="scrim" hidden></div><script src="dash.js"></script></body></html>'''

# ---------- HOME (Sunday 16 Aug 2026: the last full day in the test data). Anatomy from the reference study C1. ----------
STAFF = {'Jonas': 'jonas', 'Mia': 'mia', 'Nina': 'nina'}
def av(n, size=''): return f'<img class="av{size}" src="../assets/{STAFF[n]}.jpg" alt="">'
DAY = [('08:15','Yannick Good','Bart trimmen','Mia',28,'paid'),('09:00','Marco Blaser','Herrenschnitt','Jonas',45,'paid'),
       ('09:00','Ismail Demir','Herrenschnitt','Nina',45,'paid'),('10:15','Timo Herzog','Skin Fade','Nina',55,'paid'),
       ('10:45','Pascal Meier','Maschinenschnitt','Jonas',35,'due'),('11:30','Andrin Lehmann','Coupe & Bart','Mia',68,'paid'),
       ('12:45','Aylin Yildiz','Augenbrauen','Mia',15,'paid'),('13:00','Deniz Kaya','Hot-Towel-Rasur','Jonas',42,'due'),
       ('14:30','Samuel Wyss','Komplettpaket','Nina',85,'paid'),('15:30','Bruno Caruso','Skin Fade','Jonas',55,'due'),
       ('16:00','Nico Brunner','Herrenschnitt','Mia',45,'due'),('16:45','Tobias Frei','Kinderschnitt','Nina',32,'paid'),
       ('17:30','Elia Frei','Bart-Styling & Rasur','Jonas',38,'cancel'),('18:15','Kerem Aslan','Herrenschnitt','Mia',45,'due')]
def dayrow(i, t, c, s, st, p, pay):
    tag = {'due': '<span class="tag due">Unpaid</span>', 'cancel': '<span class="tag">Cancelled</span>'}.get(pay, '')
    price = f'<span class="num pr{" strike" if pay == "cancel" else ""}">{chf(p)}</span>'
    return f'<div class="tr day"{" hidden" if i >= 5 else ""}><span class="t num">{t}</span>{av(st,"24")}<span class="nm">{E(c)}<span class="mu">{E(s)} · {st}</span></span><span class="rcol">{price}{tag}</span></div>'
MONTHS = [('Mar',699),('Apr',689),('May',355),('Jun',113),('Jul',0),('Aug',1106)]
bars = ''.join(f'<button class="bar{" on" if m=="Aug" else ""}" style="--h:{max(v/1106*100,2):.1f}%" aria-label="{m}: {chf(v)}" data-v="{chf(v)}"><span class="tip">{chf(v)}</span><i></i><span class="ax">{m}</span></button>' for m, v in MONTHS)
def rank(name, sub, amt, pct, img=''):
    return f'<div class="tr rk">{img}<span class="nm">{E(name)}<span class="mu">{sub}</span><span class="track"><i style="width:{pct:.0f}%"></i></span></span><span class="num pr">{chf(amt)}</span></div>'
SV30 = [('Herrenschnitt',4,180),('Skin Fade',2,110),('Komplettpaket',1,85),('Coupe & Bart',1,68),('Hot-Towel-Rasur',1,42)]
ST30 = [('Nina',4,217),('Mia',5,201),('Jonas',4,177)]
home = f'''
<div class="hd"><div><h1>Overview</h1><p class="mu sub1">Sunday, 16 August · 13 appointments</p></div>
<div class="acts"><button class="pill ink">{ic("Plus","ic18")}<span>New<span class="dsk"> appointment</span></span></button></div></div>
<section class="card att"><div class="ch"><h2>Needs attention <span class="cnt">3</span></h2></div>
<div class="list">
<a class="tr" href="#"><span class="nm">Finish setup<span class="mu">4 of 7 done · next: salon profile</span></span><span class="seg" aria-hidden="true"><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i></i><i></i><i></i></span>{ic("ChevronRight","chev")}</a>
<a class="tr" href="#"><span class="nm"><span class="dotl"><i class="amber"></i>Payments not connected</span><span class="mu">Clients can only pay at the salon</span></span>{ic("ChevronRight","chev")}</a>
<a class="tr" href="#"><span class="nm">19% of appointments fall through<span class="mu">6 of 32 in 8 weeks · check cancellation rules</span></span>{ic("ChevronRight","chev")}</a>
</div></section>
<section class="card kpis">
<div class="k"><span class="mu">Revenue today</span><b class="num">{chf(595)}</b><span class="mu">13 appointments</span></div>
<div class="k"><span class="mu">Appointments</span><b class="num">13</b><span class="mu">1 cancelled</span></div>
<div class="k"><span class="mu">Unpaid</span><b class="num">{chf(222)}</b><span class="mu">5 appointments</span></div>
<div class="k"><span class="mu">Rating</span><b class="num">4.3 <span class="star" aria-hidden="true">★</span></b><span class="mu">11 reviews</span></div>
</section>
<div class="g2">
<section class="card"><div class="ch"><h2>Today</h2><a class="lnk" href="../dash-calendar/index.html">Open calendar{ic("ChevronRight","ic16")}</a></div>
<div class="list">{''.join(dayrow(i, *r) for i, r in enumerate(DAY))}</div>
<button class="more">Show all 14</button></section>
<div class="side">
<section class="card"><div class="ch"><h2>Revenue</h2><span class="mu">By month</span></div>
<div class="rev"><b class="num">{chf(1106)}</b><span class="mu">August, best month so far</span></div>
<div class="chart">{bars}</div></section>
<section class="card"><div class="ch"><h2>Top services</h2><span class="mu">Last 30 days</span></div>
<div class="list">{''.join(rank(n, f"{c} booking{'s' if c>1 else ''}", a, a/180*100) for n, c, a in SV30)}</div></section>
<section class="card"><div class="ch"><h2>Staff</h2><span class="mu">Last 30 days</span></div>
<div class="list">{''.join(rank(n, f"{c} bookings", a, a/217*100, av(n)) for n, c, a in ST30)}</div></section>
</div></div>'''

# ---------- SERVICES ----------
SVC = [('Coupe & Bart', 'Cut & Beard', 45, 68), ('Bart-Styling & Rasur', 'Beard Styling & Shave', 30, 38), ('Augenbrauen', 'Eyebrows', 10, 15),
       ('Komplettpaket', 'Full Package', 60, 85), ('Hot-Towel-Rasur', 'Hot Towel Shave', 30, 42), ('Kinderschnitt', 'Kids Cut', 25, 32),
       ('Maschinenschnitt', 'Buzz Cut', 20, 35), ('Skin Fade', 'Skin Fade', 40, 55), ('Herrenschnitt', "Men's Haircut", 30, 45),
       ('Bart trimmen', 'Beard Trim', 20, 28), ('Haarwäsche & Styling', 'Wash & Style', 20, 25)]
def svcrow(i, de, en, d, p):
    sub_en = f'<span class="mu en">{E(en)}</span>' if en != de else ''
    return f'''<div class="svc" data-i="{i}" data-de="{E(de)}" data-en="{E(en)}" data-d="{d}" data-p="{p}">
<button class="sv-open" aria-label="Edit {E(de)}"><span class="nm"><span class="sv-de">{E(de)}</span>{sub_en}<span class="mu meta"><span class="sv-d">{d}</span> min · CHF <span class="sv-p">{p}</span></span></span></button>
<span class="c-d num mu"><span class="sv-d">{d}</span> min</span><span class="c-p num">CHF <span class="sv-p">{p}</span></span>
<button class="tgl on" role="switch" aria-checked="true" aria-label="Bookable"><i></i></button></div>'''
services = f'''
<div class="hd"><div><h1>Services <span class="cnt">11</span></h1></div>
<div class="acts"><button class="ib" aria-label="Import CSV">{ic("Upload","ic18")}</button><button class="pill ink">{ic("Plus","ic18")}<span>Add service</span></button></div></div>
<label class="search">{ic("Search","ic18")}<input type="search" placeholder="Search services" data-filter=".svc"></label>
<section class="sec"><div class="sh"><h2>Barbershop <span class="cnt">11</span></h2><button class="lnk">Reorder</button></div>
<div class="card list">
<div class="thead"><span>Service</span><span>Duration</span><span>Price</span><span>Bookable</span></div>
{''.join(svcrow(i, *s) for i, s in enumerate(SVC))}
</div></section>
<button class="pill grey tmpl">{ic("Layers","ic18")}Start from a template</button>
<aside class="sheet" id="svc-sheet" aria-label="Edit service" hidden>
<div class="sheet-hd"><h2 id="sv-title">Edit service</h2><button class="x" aria-label="Close">{ic("X","ic18")}</button></div>
<label class="fld"><span>Name (German)</span><input id="f-de"></label>
<label class="fld"><span>Name (English)</span><input id="f-en"></label>
<div class="two"><label class="fld"><span>Duration (min)</span><input id="f-d" inputmode="numeric"></label><label class="fld"><span>Price (CHF)</span><input id="f-p" inputmode="numeric"></label></div>
<div class="tr flat"><span class="nm">Bookable online<span class="mu">Clients can book it on your page</span></span><button class="tgl on" role="switch" aria-checked="true" aria-label="Bookable online"><i></i></button></div>
<div class="sheet-ft"><button class="pill grey cancel">Cancel</button><button class="pill ink save">Save changes</button></div>
</aside>'''

# ---------- CLIENTS (the 5 registered clients the page lists today, real history) ----------
CL = [('User', 6, '03.06.2026', 316, 1, 0), ('Famug2453', 4, '04.06.2026', 209, 0, 0), ('SULO A1', 4, '26.05.2026', 163, 0, 0),
      ('attacker-test-1780500252', 4, '13.05.2026', 169, 0, 0), ('Muhak Loke', 3, '12.05.2026', 164, 0, 0)]
def ini(n):
    p = [x for x in n.replace('-', ' ').split() if x[0].isalpha()]
    return (p[0][0] + (p[1][0] if len(p) > 1 else '')).upper()
def clrow(n, v, last, spent, canc, ns):
    return f'''<button class="cli" data-n="{E(n)}" data-v="{v}" data-last="{last}" data-s="{spent}" data-c="{canc}" data-ns="{ns}" data-avg="{round(spent / v)}">
<span class="ini">{ini(n)}</span><span class="nm"><span class="cn">{E(n)}</span><span class="mu meta">{v} visits · last {last}</span></span>
<span class="c-v num">{v}</span><span class="c-l num">{last}</span><span class="rcol"><span class="c-s num">{chf(spent)}</span><span class="st"><i class="amber"></i>At risk</span></span></button>'''
clients = f'''
<div class="hd"><div><h1>Clients <span class="cnt">5</span></h1></div></div>
<label class="search">{ic("Search","ic18")}<input type="search" placeholder="Search clients" data-filter=".cli"></label>
<div class="chips" role="tablist"><button class="chip on" role="tab" aria-selected="true">All 5</button><button class="chip" role="tab" aria-selected="false">At risk 5</button></div>
<div class="card list">
<div class="thead cl-h"><span></span><span>Client</span><span>Visits</span><span>Last visit</span><span>Spent</span><span>Status</span></div>
{''.join(clrow(*c) for c in CL)}
</div>
<aside class="sheet" id="cli-sheet" aria-label="Client" hidden>
<div class="sheet-hd"><span class="ini lg" id="c-ini"></span><div class="grow"><h2 id="c-name"></h2><p class="st"><i class="amber"></i>At risk</p></div><button class="x" aria-label="Close">{ic("X","ic18")}</button></div>
<dl class="kv"><div><dt>Visits</dt><dd id="c-v"></dd></div><div><dt>Total spent</dt><dd id="c-s"></dd></div><div><dt>Average per visit</dt><dd id="c-a"></dd></div><div><dt>Last visit</dt><dd id="c-l"></dd></div><div><dt>Cancelled</dt><dd id="c-c"></dd></div><div><dt>No-shows</dt><dd id="c-ns"></dd></div></dl>
</aside>'''

# ---------- SETTINGS ----------
GROUPS = [('Salon', [('Store', 'Profile & opening hours', 'Open 6 days'), ('ShieldCheck', 'Verification', '')]),
          ('Bookings', [('CalendarCheck', 'Scheduling', 'Confirmed instantly'), ('CircleX', 'Cancellation', 'Free until 24 h before'), ('Moon', 'Off-peak', '')]),
          ('Offers', [('Tag', 'Offers', '')]),
          ('Absence', [('Plane', 'Vacation', 'None planned'), ('CalendarX', 'Holidays', '')]),
          ('Finances', [('CreditCard', 'Payments', '!Not connected'), ('Percent', 'Commission', ''), ('Receipt', 'VAT', 'Not registered')]),
          ('Communication', [('MessageSquare', 'Quick replies', ''), ('Smartphone', 'SMS reminders', '24 h and 1 h before')])]
def val(v):
    if v.startswith('!'): return f'<span class="st"><i class="amber"></i>{v[1:]}</span>'
    return f'<span class="mu val">{v}</span>' if v else ''
def setrow(i, t, v):
    d = f'<span class="mu dsub">{v[1:] if v.startswith("!") else v}</span>' if v else ''
    return f'<a class="tr srow" href="#">{ic(i)}<span class="nm">{t}{d}</span>{val(v)}{ic("ChevronRight","chev")}</a>'
setnav = ''.join(f'<button class="sn{" on" if g == "Bookings" else ""}" data-g="{g}">{g}</button>' for g, _ in GROUPS)
setgroups = ''.join(f'<section class="sg{" on" if g == "Bookings" else ""}" data-g="{g}"><h2 class="gl">{g}</h2><div class="card list">{"".join(setrow(*r) for r in rows)}</div></section>' for g, rows in GROUPS)
settings = f'''
<div class="hd"><div><h1>Settings</h1></div></div>
<div class="set2"><nav class="snav" aria-label="Settings sections">{setnav}</nav><div class="spane">{setgroups}</div></div>'''

for name, on, body, title in [('home', 'home', home, 'Dashboard: overview'), ('services', 'services', services, 'Dashboard: services'),
                              ('clients', 'clients', clients, 'Dashboard: clients'), ('settings', 'settings', settings, 'Dashboard: settings')]:
    open(f'{OUT}/{name}.html', 'w').write(page(name, on, body, title))
print('ok')
