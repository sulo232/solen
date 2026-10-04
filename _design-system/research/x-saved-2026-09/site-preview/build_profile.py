# Profile options page: two structures built from the real /en/profile data (QA Test account).
import os
SP = os.path.dirname(os.path.abspath(__file__))
I = {}
for line in open(os.path.join(SP, 'icons.tsv')):
    n, svg = line.rstrip('\n').split('\t', 1)
    I[n] = svg
def ic(n, cls='ic'): return I[n].replace('<svg ', f'<svg class="{cls}" ', 1)
CH = ic('ChevronRight', 'chev')

def row(icon, label, sub='', right='', href='#'):
    s = f'<span class="sub">{sub}</span>' if sub else ''
    r = f'<span class="rv">{right}</span>' if right else ''
    return f'<a class="row" href="{href}">{ic(icon)}<span class="rt"><span class="lb">{label}</span>{s}</span>{r}{CH}</a>'

status_bar = '<span class="bar"><i style="width:33%"></i></span>'
# A: directory with grouped boxes (Fresha structure, the round-3 A group headings he liked)
A = f'''<div class="scr">
<h1 class="pt">Profile</h1>
<a class="id" href="#"><span class="av">QT</span><span class="rt"><span class="nm">QA Test</span><span class="sub">Edit profile</span></span>{CH}</a>
<a class="box st" href="../rewards/index.html"><span class="rt"><span class="ey">Solen status</span><span class="tier">Base</span>{status_bar}<span class="sub">2 visits to Gold</span></span>{CH}</a>
<h2 class="gh">Bookings</h2>
<div class="box">{row('Calendar', 'Bookings')}{row('Stamp', 'Stamps', '6 more to your reward', '4/10')}</div>
<h2 class="gh">Wallet</h2>
<div class="box">{row('Wallet', 'Payment methods', 'Add a card')}{row('TicketPercent', 'Vouchers', '1 active')}</div>
<h2 class="gh">Personal details</h2>
<div class="box">{row('Scissors', 'Hair profile')}{row('Heart', 'Saved', '2 stores')}{row('Settings', 'Settings')}</div>
<button class="out" type="button">{ic('LogOut')}Sign out</button>
</div>'''

# B: overview first: centred identity, live numbers as tiles, then the rest as one list
def tile(icon, big, label):
    return f'<a class="tile" href="#">{ic(icon)}<span class="big">{big}</span><span class="sub">{label}</span></a>'
B = f'''<div class="scr">
<div class="idc"><span class="av lg">QT</span><span class="nm lg">QA Test</span><a class="edit" href="#">Edit profile</a></div>
<a class="box st" href="../rewards/index.html"><span class="rt"><span class="ey">Solen status</span><span class="tier">Base</span>{status_bar}<span class="sub">2 visits to Gold</span></span>{CH}</a>
<div class="tiles">{tile('Stamp', '4/10', 'Stamps')}{tile('TicketPercent', '1', 'Voucher')}{tile('Heart', '2', 'Saved')}</div>
<div class="box">{row('Calendar', 'Bookings')}{row('Wallet', 'Payment methods', 'Add a card')}{row('Scissors', 'Hair profile')}{row('Settings', 'Settings')}</div>
<button class="out" type="button">{ic('LogOut')}Sign out</button>
</div>'''

CSS = '''
@font-face{font-family:'Inter Tight';src:url(../assets/intertight.woff2) format('woff2');font-weight:100 900}
@font-face{font-family:Inter;src:url(../assets/inter.woff2) format('woff2');font-weight:100 900}
:root{--ink:#0A0A0A;--grey:#F4F4F5;--muted:#71717A;--line:#E4E4E7;--box:rgba(0,0,0,.04) 0 0 0 1px,rgba(0,0,0,.06) 0 2px 10px}
*{box-sizing:border-box}body{margin:0;background:#fff;color:var(--ink);font-family:Inter,system-ui,sans-serif}
main{max-width:1300px;margin:0 auto;padding:24px 16px 64px}
h1.page{font:600 30px/1.15 'Inter Tight',sans-serif;margin:0 0 8px}.lead,.why{margin:0;color:var(--muted);font-size:15px;line-height:1.5}.why{font-size:13px;margin-top:8px;max-width:402px}
.cols{display:flex;flex-wrap:wrap;gap:24px;margin-top:24px}.col{flex:0 0 402px;max-width:100%}
.lbl{font-size:13px;font-weight:600;margin:0 0 8px}
.back{display:inline-flex;align-items:center;min-height:44px;color:var(--ink);font-size:15px;font-weight:500;text-decoration:none}
.shot{display:block;width:100%;border:1px solid var(--line);border-radius:12px}
a{color:inherit;text-decoration:none}a:focus-visible,button:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
a:active,button:active{transform:scale(.98);transition:transform 80ms ease}
.scr{border:1px solid var(--line);border-radius:12px;padding:24px 16px 32px;background:#fff}
@media (max-width:440px){.col{flex-basis:100%}.scr,.shot{margin:0 -16px;border-radius:0;border-left:0;border-right:0}}
.pt{font:600 30px/1.15 'Inter Tight',sans-serif;margin:0 0 20px}
.ic{width:22px;height:22px;flex:none}.chev{width:18px;height:18px;flex:none;color:var(--muted)}
.id{display:flex;align-items:center;gap:14px;min-height:64px;margin-bottom:20px}
.av{width:56px;height:56px;border-radius:50%;background:var(--grey);display:grid;place-items:center;font:600 18px 'Inter Tight',sans-serif;flex:none}.av.lg{width:80px;height:80px;font-size:26px}
.rt{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.nm{font:600 22px/1.2 'Inter Tight',sans-serif}.nm.lg{margin-top:12px}
.sub{font-size:13px;color:var(--muted);line-height:1.35}
.box{display:block;border-radius:20px;box-shadow:var(--box);overflow:hidden;margin-bottom:8px}
.st{display:flex;align-items:center;gap:12px;padding:16px;margin-bottom:24px}
.ey{font-size:13px;color:var(--muted)}.tier{font:600 22px/1.2 'Inter Tight',sans-serif}
.bar{display:block;height:6px;border-radius:9999px;background:var(--grey);margin:8px 0 6px;overflow:hidden}.bar i{display:block;height:100%;background:var(--ink);border-radius:9999px}
.gh{font:600 18px/1.3 'Inter Tight',sans-serif;margin:24px 0 10px}
.row{display:flex;align-items:center;gap:14px;min-height:56px;padding:12px 16px}.row+.row{border-top:1px solid var(--line);}
.lb{font-size:15px;font-weight:500}.rv{font-size:15px;font-weight:600}
.out{margin-top:24px;width:100%;height:48px;border:0;border-radius:9999px;background:var(--grey);color:var(--ink);font:500 15px Inter,sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}.out .ic{width:18px;height:18px}
.idc{display:flex;flex-direction:column;align-items:center;margin:8px 0 24px}.edit{margin-top:6px;font-size:13px;color:var(--muted);min-height:32px;display:flex;align-items:center;padding:0 14px;border-radius:9999px;background:var(--grey);font-weight:500;color:var(--ink)}
.tiles{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px}
.tile{border-radius:20px;box-shadow:var(--box);padding:16px;display:flex;flex-direction:column;gap:4px;min-height:112px}.tile .ic{margin-bottom:auto}.big{font:600 22px/1.2 'Inter Tight',sans-serif;margin-top:12px}
'''
html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Profile options</title><style>{CSS}</style></head><body><main>
<a class="back" href="../index.html">All pages</a>
<h1 class="page">Profile: 2 structures</h1>
<p class="lead">Real data from the test account. Both drop what you rejected before: the bell and the menu on the profile page, and labels that repeat the row under them ("Bookings" above "Bookings"). Both follow the 6 rules: rows sit in soft boxes with lines only inside.</p>
<div class="cols">
<div class="col"><p class="lbl">Today</p><img class="shot" src="img/today.png" alt="Today's profile page"></div>
<div class="col"><p class="lbl">A. Grouped list</p>{A}<p class="why">Fresha's order: who you are, then where to go. Your status sits on top as one card. The group titles are the ones you liked in round 3 (Wallet, Personal details).</p></div>
<div class="col"><p class="lbl">B. Numbers first</p>{B}<p class="why">Centred identity like the profile screen you saved on X (post 278), then your live numbers as three tiles, then the rest as one list.</p></div>
</div>
<p class="why" style="margin-top:24px">The hair-profile row uses the Lucide scissors icon here; today it uses a hand-drawn squiggle, which breaks the Lucide-only rule. "Bookings" shows no next visit because the test account has none.</p>
<p class="why"><b>My pick: A.</b> It reads in one pass and every row is a destination; B's tiles repeat what the rows already say. My judgment, not measured.</p>
</main><script>for(const a of document.querySelectorAll('a[href="#"]'))a.addEventListener('click',e=>e.preventDefault())</script></body></html>'''
open('/Users/sulo/Documents/solen/public/_research/site-mockup/profile-options/index.html', 'w').write(html)
print('ok')
