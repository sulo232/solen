
## 2026-07-31 , owner rejection of full-a, rebuild

- [x] Kill the invented two-column grid. Never asked for. Replaced by four horizontal rails (measured: gridCount 0, railCount 4).
- [x] Compose the registered card instead of drawing one. SalonCard anatomy copied by line: width (100vw-44px)/1.5, photo 5:4 radius 22, name 14/500 + star right with no count, category label, address + from-price, heart top-right. verified: bf19c5896, public/_mockups/home-v3/full-a.html:.fa-card-store + .fa-photowrap; source app/[locale]/_components/homepage/SalonCard.tsx:403,427
- [x] Selected pill must not go bold. Airbnb's own selected tab measures weight 400; ours now does too. Proven by dispatching a click: all five pills read 400 before and after. verified: bf19c5896; dispatched a click on the live mockup at 390x844, all five .fa-cat read fontWeight 400 before and after
- [x] Pill row matched to Airbnb pixel by pixel, measured live at vw=390: h40, radius 40, pad 14, icon gap 4, row gap 8, label 14, icon 31. One stated deviation: their 24px gutter vs our locked 16px. verified: bf19c5896, full-a.html:.fa-cat; source measured live on airbnb.ch at vw=390 this session
- [x] Continuation card bigger: photo 64 to 80, padding 16, radius 20, title 16. NOT a claimed pixel match, the owner's screenshot is inline in chat and not a file on disk. verified: bf19c5896, full-a.html:.fa-card + .fa-cardimg (80x80)
- [x] Harden: ~/.claude/hooks/mockup-compose-registered-card-gate.py, 7/7, blocks a mockup that draws a card-shaped unit while naming no registry card. Built because FLOORS LAW 9 existed as prose and the only compose gate watched .tsx, never public/_mockups/. verified: /Users/sulo/.claude/hooks/mockup-compose-registered-card-gate.py, --selftest 7/7, live stdin block confirmed; NOT ARMED, settings.json is unwritable here
- [ ] BLOCKED, owner call: the German word that replaces "Salon". "Salon" is itself a normal German noun, so this is a copy decision, not a translation. Mockup stays English until answered.
- [ ] BLOCKED, seed data: the Cities row renders one tile because all 20 seeded stores are in Basel. Needs a second city seeded before that row can be designed properly.
