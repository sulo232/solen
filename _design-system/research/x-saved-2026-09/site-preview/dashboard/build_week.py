# Calendar week view mockup: the approved day view (public/_research/calendar/index.html) with its week strip and
# staff grid replaced by a 7-day grid (HelloDottaa layout, public/_research/calendar/ref.jpg, left phone).
# Data: The Fade Factory's real active bookings for 10-16 and 17-23 August 2026 (cancelled ones left out).
import json, os, shutil
SRC = '/Users/sulo/Documents/solen/public/_research/calendar/index.html'
OUT = '/Users/sulo/Documents/solen/public/_research/site-mockup/calendar-week'
os.makedirs(OUT, exist_ok=True)
for f in ('jonas.jpg', 'mia.jpg', 'nina.jpg', 'inter.woff2', 'intertight.woff2'):
    shutil.copy(os.path.join(os.path.dirname(SRC), f), OUT)
h = open(SRC).read()
import re
def span(h, start):
    # end index of the <div> element that starts at `start` (balanced div matching)
    depth = 0
    for m in re.finditer(r'<div\b|</div>', h[start:]):
        depth += 1 if m.group(0) == '<div' else -1
        if depth == 0: return start + m.end()
def cut(h, start, repl):
    w_end = span(h, start)                       # the week strip
    g = h.index('<div class="grid"', w_end)      # the staff grid right after it
    return h[:start] + repl + h[span(h, g):]
d0 = h.index('<div class="week"', h.index('<div class="desk"'))
h = cut(h, d0, '<div class="wk" data-size="d"></div>')
h = cut(h, h.index('<div class="week"'), '<div class="wk" data-size="m"></div>')
# phone and desktop each have a revenue line; desktop title row is kept as is
h = h.replace('<title>Calendar mockup</title>', '<title>Calendar week view</title>')
h = h.replace('>Day <svg', '>Week <svg').replace('aria-label="View">Day', 'aria-label="View">Week')
h = h.replace('CHF 373</div><div class="rl">13 appointments', 'CHF 595</div><div class="rl">13 appointments this week')
B = {  # week -> list of [dayIndex 0=Mon, start, minutes, staff, client, service, CHF list price]
 '10': [[6,'08:15',20,'Mia','Yannick Good','Beard Trim',28],[6,'09:00',30,'Jonas','Marco Blaser',"Men's Haircut",45],[6,'09:00',30,'Nina','Ismail Demir',"Men's Haircut",45],
        [6,'10:15',40,'Nina','Timo Herzog','Skin Fade',55],[6,'10:45',20,'Jonas','Pascal Meier','Buzz Cut',35],[6,'11:30',45,'Mia','Andrin Lehmann','Cut & Beard',68],
        [6,'12:45',10,'Mia','Aylin Yildiz','Eyebrows',15],[6,'13:00',30,'Jonas','Deniz Kaya','Hot Towel Shave',42],[6,'14:30',60,'Nina','Samuel Wyss','Full Package',85],
        [6,'15:30',40,'Jonas','Bruno Caruso','Skin Fade',55],[6,'16:00',30,'Mia','Nico Brunner',"Men's Haircut",45],[6,'16:45',25,'Nina','Tobias Frei','Kids Cut',32],
        [6,'18:15',30,'Mia','Kerem Aslan',"Men's Haircut",45]],
 '17': [[0,'20:24',30,'Jonas','Andrea Vogt','Beard Styling & Shave',38],[0,'21:34',20,'Mia','Samuel Keller','Beard Trim',28],[0,'22:39',30,'Mia','Beatrice Meyer',"Men's Haircut",45],
        [0,'22:59',20,'Nina','Nadine Huber','Buzz Cut',35],[1,'12:48',20,'Mia','Andrea Vogt','Beard Trim',28],[1,'13:43',20,'Nina','Samuel Keller','Buzz Cut',35],
        [1,'14:38',45,'Jonas','Nadine Huber','Cut & Beard',68],[1,'15:43',10,'Mia','Marco Bianchi','Eyebrows',15],[1,'16:33',60,'Nina','Lea Schmid','Full Package',85],
        [1,'17:28',30,'Jonas','Fabio Rossi','Hot Towel Shave',42],[1,'18:28',25,'Mia','Sarah Widmer','Kids Cut',32],[1,'19:23',30,'Nina','Ben Graf',"Men's Haircut",45],
        [2,'10:30',10,'Nina','Reto Baumann','Eyebrows',15]]}
inject = '''<link rel="stylesheet" href="week.css"><script>window.WEEKS=''' + json.dumps(B) + '''</script><script src="week.js" defer></script></head>'''
h = h.replace('</head>', inject, 1)
open(f'{OUT}/index.html', 'w').write(h)
print('ok', {k: (len(v), sum(x[6] for x in v)) for k, v in B.items()})
