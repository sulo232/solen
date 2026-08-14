<!-- exists-check: net-new vs SOLEN_NEXT.md (roadmap), SYSTEM_AUDIT.md (hook/system audit), SOLEN_DESIGN.md (design), SOLEN_LIVE_TRUTH.md (archived) because none is a plain product overview of what Solen does/offers -->

# What Solen.ch is and what it offers

A Swiss beauty and wellness booking marketplace. Think "book a coiffeur, barber, nail studio, or spa appointment online, in Switzerland." Available in German, French, Italian, English. Web app plus an iOS app.

---

## Part 1: What a customer can do

### Search and find a salon
You search by service type (haircut, color, nails, massage, waxing, makeup, etc.), city, and a date/time you want. It's not just a directory, the search only returns salons that actually have a real open slot matching what you asked for, it checks live staff schedules, not just "salon is open today." You filter one thing at a time (not a pile of checkboxes), which keeps it fast and simple on mobile.

### Browse for inspiration ("Inspo")
A visual, swipe-through feed of styles and looks, similar to Pinterest or TikTok's discovery page. It's not a generic trending feed, it's personalized: the more you like, save, or book, the more it learns your taste (hair length, color preference, style category) and the whole feed reshapes around that, there's no separate "for you" tab, the main feed IS the personalized one. You can save looks to boards to come back to later.

### Book an appointment
The flow is one fixed sequence so it's predictable every time: pick your service(s) -> pick which staff member you want (or "any available") -> pick a time slot -> pay. For hair services there's an extra step to specify what you want done (length, color, etc.) before confirming. Once you pay, the booking is instantly confirmed, there's no waiting for the salon to "accept" it like some competitors do.

### Pay for it
Payment runs through Stripe, so credit/debit cards work everywhere. You can also pay using store credit you've earned or purchased vouchers/gift credit. Two things are intentionally not live: TWINT (Switzerland's popular mobile payment app) is fully built into the code but switched off while it goes through a Stripe compliance review, and gift cards were built, then deliberately killed and hidden, that was a product decision, not a bug, so they won't reappear.

### Walk in without booking ahead
If you just show up to a salon without an appointment, Solen has a "walk-in" flow: you pay for your spot in line upfront through your phone, get a queue number, and then watch your position update live on a tracker page, so you know roughly when you'll be seen instead of sitting in a waiting room watching the door. There's no QR code scanning involved, it's just a link.

### Build up loyalty status
Every booking you make anywhere on Solen (not just at one salon) counts toward your account-wide loyalty tier: Base, then Gold, then Platinum, based on how often you've booked in the last 6 months. Higher tiers unlock perks. This is different from typical salon loyalty cards that only track visits to one specific business, yours follows you across the whole platform.

### Manage your account
Your account area covers:
- **Termine** (appointments): everything you've booked, split into upcoming, past, and cancelled
- **Favoriten** (favorites): salons you've saved to come back to
- **Treue** (loyalty): your current tier and progress
- **Haarprofil** (hair profile): a profile built from your booking/style data, not a photo you upload, more like a data fingerprint of your hair type and preferences that salons and the Inspo feed can use
- **Looks**: style boards you've saved from Inspo
- **Konsultationsformulare** (consultation forms): intake forms you've filled out for salons (allergies, preferences, patch tests, etc.)
- **Freunde einladen** (invite friends): refer a friend, both of you get a credit (CHF 10 shown in the current design)
- **Profil & Einstellungen**: your personal details, notification preferences, language
- **Hilfe & Support**: help articles and support contact

### Leave reviews
After a visit you can leave a written review (and photos) for the salon and the specific staff member who served you. Salons can reply to reviews, and there's a moderation process behind the scenes to catch abuse or fake reviews before they go public.

---

## Part 2: What a salon or business gets

### A daily-operations dashboard
The moment an owner logs in they see: today's date, total revenue today plus a 7-day trend chart, number of appointments, number of new clients, and their current star rating, all at a glance. Below that, a live rundown of today's actual appointments, and quick views of top-performing services and top-performing staff. New salons also get a setup checklist (profile, working hours, payment details, etc.) that tracks how much of onboarding is done, so they know exactly what's left before they're fully live.

### A real calendar, not just a list
Day, week, or month view of every booking. From here staff can create a new appointment manually (for phone bookings), open up an ad-hoc time slot, log a walk-in customer, or plan out a staff member's shifts for the week.

### A client book (CRM), not just a contact list
Every customer who's booked with the salon shows up here with their history: past visits, notes staff have written about them, and for hair specifically, saved colour/cut formulas so a colourist doesn't have to re-ask "what did we mix last time." The system automatically tags clients into segments: VIP (your best repeat spenders), "at risk" (used to come regularly but has gone quiet, a signal to reach out), new, and regular, so a salon can prioritize who to follow up with instead of guessing.

### Catalog and pricing management
Owners manage their menu of services, staff who are trained/allowed to perform each one, prices, and can bundle multiple services together into packages (e.g. a "cut + colour + blow-dry" combo) sold as one purchase.

### Sales and retail
Beyond appointments, salons can log retail product sales (shampoo, styling products, etc.) and general point-of-sale-style transactions through the same system, so revenue reporting includes more than just bookings.

### Marketing tools
Tools to run promotions, discount codes, and reach existing clients, aimed at getting people to rebook rather than only acquiring new customers.

### Team management
Add staff, assign what services each person can perform, set individual schedules and time off, and control what each staff member is allowed to see or do in the dashboard (a junior stylist doesn't need access to the salon's financial reports, for example).

### Reporting
Revenue breakdowns, booking trends, and performance reporting to understand how the business is actually doing over time, not just today.

### Money operations
Handling refunds when something goes wrong, applying upcharges (e.g. a service ran longer or needed extra product), and payouts, how and when the salon actually gets paid out from what customers paid through Solen.

### Trade-specific tools, not one-size-fits-all
A barbershop, a nail studio, a spa, and a makeup artist don't need the same tools, so each vertical gets its own extras layered on top of the shared booking system:
- **Barbershops**: cut history per client, fade style references, their own loyalty card system separate from the marketplace-wide one
- **Nail studios**: saved nail design history per client, retail product catalog for nail products, dynamic pricing rules (e.g. surcharge for intricate designs), station/chair management
- **Spas**: treatment room management, tracking treatment outcomes over time
- **Makeup artists**: face charts (a standard tool in the makeup industry for mapping what products go where on a client's face), kit/product inventory
- **Waxing**: sensitivity logs and zone-based service packages

### Platform-level admin (Solen's own internal team, not salons)
Behind all of this, Solen's own team has tools to see every salon and every user on the platform, platform-wide analytics, control which cities are active, manage commission rates, badges/verification for salons, and moderate reported content.

---

## The bigger picture

Solen is trying to be the one place Swiss customers go to book any beauty or wellness service, and at the same time the one system a salon runs its entire business on, calendar, clients, money, marketing, all in one tool instead of juggling five different apps.
