<!-- exists-check: net-new vs lib/category-photos.ts, lib/search-filter-pills.ts and the
     app/[locale]/**/page.tsx files the guard listed, because every one of those is a Solen SURFACE
     or its data, and this is a captured record of what TWO OUTSIDE PRODUCTS do. `_design-system/
     references/` did not exist before this file; the reference-lock rule says a named brand
     reference is captured to `_design-system/references/<brand>--<surface>.md` and never built from
     memory, so this is that folder's first entry and covers both brands on one axis. -->

# How Airbnb and Uber Eats decide what sits in the top bar

Captured live 2026-08-09, both at 390x844, logged out, by opening the real sites. Nothing here is
from memory, which matters because the answer contradicts what both of us assumed.

Owner's question, verbatim: *"go analyze how Airbnb Uber Eats, like, any auto pages does it. They
don't have hamburger menu and education bar everywhere ... probably only in the home page ... like,
when they're searching page."*

## Airbnb, page by page

| page | what is in the top bar |
|---|---|
| home | a search field and a row of category tabs. That is all. |
| search results | back arrow, a small summary of the search, a filter icon. Tabs gone. |
| a listing | **nothing.** Photo to the top edge, a back arrow floating on it, share and heart. |
| wishlists, login | **nothing.** The title is simply the first line of the page. |

Three bottom tabs (Explore, Wishlists, Log in) are the constant, and even those are replaced on a
listing by a sticky price and Reserve button.

## Uber Eats, page by page

| page | what is in the top bar |
|---|---|
| home | hamburger, wordmark, account icon, Sign up |
| browse feed | the same, plus an address row and a search field |
| **search results** | **the same, hamburger included** |
| a restaurant | the same at rest. Scrolled, it becomes the restaurant's OWN name plus its own search |
| a dish | **nothing but a white X.** Bottom becomes "Add 1 to order, CHF 28.00" |
| address picker | **nothing but an X and the field** |

## The rule, and the two do it differently

**Airbnb thins by DEPTH.** Each level keeps only the control you need there and drops the rest. A
listing is a dead end you arrived at, so it gets one thing: a way out.

**Uber Eats splits by BROWSE versus TASK.** Every page you can browse from keeps the identical bar,
two levels deep included. The moment a page is one job in progress (pick an address, configure a
dish) the entire bar is replaced by a single X and the screen becomes the task.

**What they agree on, and it is the part that binds us:** a screen where the user is DOING one
thing carries no chrome at all. Not a smaller bar. None.

## Where the owner's read was wrong, said plainly

- Uber Eats **does** show the hamburger on its search page, identical to home. Chrome does not thin
  out on search.
- **Neither site has a notification bell anywhere** on the logged-out phone site. So the thing he
  wanted removed from deeper pages was never on any page to begin with.

## What this says about Solen, measured on our own reviews page the same day

Our salon reviews page carries a back arrow, a notification bell with a blue count badge, and a
hamburger. By Airbnb's rule it should carry a back arrow and nothing else. By Uber Eats' rule it is
a browse page, so it may keep the bar, but neither reference puts a BELL on it, and Uber Eats swaps
the bar's contents for the thing you are looking at rather than showing global chrome.

The cheap change both references support: a detail page shows what you are looking at and a way
back, never a notification count. The bell belongs where you are choosing what to do next, not where
you are reading one salon's reviews.

## Not yet decided by him

Which of the two models Solen follows. They give different answers for our booking step, which is a
task by Uber Eats' rule (no chrome) and merely deep by Airbnb's (a back arrow). Both beat what we
ship today, which is the full global bar with a bell on every screen.
