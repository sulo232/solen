# Every gate we have, evaluated

You asked me to go through every automatic check ("gate") running in Claude Code and say which ones we need. Here it is.

## The four-line answer

**207 gates are switched on today.** **172 stay as they are**, they are doing real work and catching real things. **29 need a fix**, not because the rule behind them is wrong, but because something in how they run is broken, doubled up with another gate, or interrupts you at the wrong moment for what it's actually checking. **6 should be switched off for good**, they either never fire, are broken and can't fire, or say the exact same thing as a gate you already have.

Switching off the 6 dead ones costs nothing, they are not doing anything today anyway. The real payoff is in the 29 fixes: most of them are checks that only look at Claude's own closing message (the reply you read), which means they always arrive AFTER you've already read the thing they're complaining about, as a second, repeat message. Your own setup already proved what happens when a check like that gets moved earlier instead: one specific rule got moved from "stop and re-scold you" to "remind Claude before it even starts typing," and the interruptions from that one rule alone dropped from 2.4 per message down to 0.44. That is the kind of payoff the 29 fixes are chasing, fewer duplicate messages, not fewer real catches.

## What a gate is

A gate is a rule that runs by itself, every single time Claude is about to do something (or just finished doing something), without you having to ask. Some gates just quietly remind Claude of a rule before it acts; others actually stop Claude in its tracks and make it fix something before it's allowed to continue.

## The three lists

Each line: plain name, what it stops, why it earns its keep, file name in brackets at the end. Ordered inside each group by roughly how often it would actually fire, most-firing first: the ones that watch every message or every session come first, then the ones that watch every file edit, then the ones that only speak up when a turn ends in a specific kind of claim.

### KEEP (172) - these are doing real work, leave them on

**Fires on every message or every session start:**

- **Premortem reminder** - stops Claude from planning only the happy path before sending helpers off to build something; makes it name what could go wrong first, once per session. (`devils-advocate.py`)
- **Dictation fixer** - when your voice message comes through garbled ("entropic" for Anthropic), hands Claude the real project vocabulary and asks for a one-line readback instead of a guess. (`dictation-decode.py`)
- **Don't-reinvent-it reminder** - when your message touches something Claude has rebuilt from scratch before, reminds it of that exact past mistake before it starts again. (`drift-ledger-inject.py`)
- **Right-playbook reminder** - attaches a note saying which methodology fits the kind of work you just asked for (frontend, backend, debugging), so Claude doesn't wing it. (`fable-skill-trigger.py`)
- **Fix-it-now reminder** - the instant you point out a repeated mistake, reminds Claude to decide the actual fix right then, not just apologize and carry on. (`harden-now-not-later.py`)
- **Build-a-hook reminder** - when you call something a repeating pattern ("again", "you keep"), reminds Claude to make a permanent fix instead of promising to be more careful. (`harden-when-flagged.py`)
- **Daily health check** - once a day, quietly runs a script checking the whole hook and memory setup for rot, and only speaks up if something is actually broken. (`invariants-nudge.py`)
- **Use-the-team reminder** - at the start of every session, reminds Claude that real coding work should go through a builder-plus-reviewer pair, not Claude alone. (`loop-default.py`)
- **Tidy-the-notes reminder** - once a week at most, if your memory notes have grown too big, reminds Claude to clean them up. (`memory-maintenance-nudge.py`)
- **Build-several reminder** - when you ask for a few different mockup directions, reminds Claude up front to actually build distinct options, not quietly merge them into one. (`mockup-variations.py`)
- **Don't-drop-half-the-list reminder** - when your message bundles several separate asks, reminds Claude to track every one so none gets silently forgotten. (`multi-ask-decompose.py`)
- **Stop-narrating reminder** - reminds Claude to stop describing every small step out loud and save the words for the finished summary you actually read. (`no-loop-narration-nudge.py`)
- **Catch-every-correction ledger** - listens for your own words when you're correcting a repeat mistake ("you keep", "again") and logs it, since the older tracker was missing most of your real corrections. (`owner-correction-ledger.py`)
- **Run-the-right-skill trigger** - when you type an exact phrase like "test it" or "design suggestions", reminds Claude to run that skill first instead of winging it. (`owner-phrase-trigger.py`)
- **Remember-what's-in-progress** - at session start, reprints the active workstream plan, trimmed to only the still-open rows, so nothing in flight gets forgotten. (`plan-active-sessionstart.py`)
- **Plumbing: message timestamp** - silently records when your message arrived so a separate gate can check whether the plan file was actually touched this turn. (`plan-first-stamp.py`)
- **Memory-is-a-summary-now reminder** - right after a compaction or resume, reminds Claude that what it remembers is a summary, not verified fact, and to re-check the real files. (`post-compact-reverify.py`)
- **Go-check-don't-guess reminder** - when your message asks about something that goes stale or names a specific file, reminds Claude to verify it live instead of guessing from memory. (`reality-check-gate.py`)
- **Stop-guessing-measure-it escalator** - after you reject the same visual work twice running, tells Claude to measure the real page instead of iterating blind a third time. (`rejection-streak-escalator.py`)
- **How-to-write-the-reply reminder** - the moment your message lands, reminds Claude of the reply rules you complain about most (no em-dashes, plain words) before it writes a word, and lists any question you've already answered so it's never asked twice. (`reply-shape-preflight.py`)
- **Save-the-picture-first** - writes any screenshot you just attached out to a real file, so the "measure the reference image" instruction has an actual file to point at. (`save-owner-images.py`)
- **Housekeeping sweep** - at session start, quietly deletes old marker files once they're over 48 hours old so thousands don't pile up. (`session-marker-sweep.py`)
- **Auto-pick-the-skill** - recognizes safe, read-only requests (a link, "analyze this site") and quietly points Claude to the right skill, no slash command needed from you. (`skill-autopilot.py`)
- **Which-screenshot resolver** - when you mention the screenshot folder or a pasted picture without naming the file, hands back the newest real images so Claude never has to guess. (`ss-folder-resolver.py`)
- **Whole-setup health check** - at session start, silently checks the entire hook, memory, and skill setup for rot, prints one line only if it finds something broken. (`system-health-check.py`)
- **Is-the-phone-link-actually-alive check** - before a visual turn, checks the dev server and tunnel are really running, and warns loudly before a dead link gets sent to you. (`tunnel-health-preflight.py`)
- **The binary-trigger table, enforced** - reads your message and, if it matches one of five known shapes (a reference image, "this looks off," a Fresha mention), reminds Claude exactly which tool to reach for first. (`user-prompt-binary-triggers.sh`)

**Fires on file edits (checks the code as it's written):**

- **Untrusted-input fence** - when code sends customer text into an AI prompt without fencing it first, reminds Claude a customer could hide instructions inside their own text. Real prompt-injection protection. (`ai-prompt-untrusted-guard.py`)
- **Don't-quietly-redesign-the-approved-page** - stops a big rewrite of a page you already approved; measures the actual size of the change before allowing it. (`approved-surface-guard.py`)
- **Ask-before-the-big-run** - before an autonomous multi-agent loop starts, checks a clarifying question was actually asked, or you already released it. (`ask-before-loop-gate.py`)
- **Prove-the-backend-is-real** - stops a mockup from drawing a clickable action (change date, add a tip) without saying which real backend it connects to, or admitting there isn't one yet. (`backend-check-gate.py`)
- **Where's-the-backend-map** - once per session, points Claude to the doc explaining how the backend works, before it touches Supabase, auth, or payments. (`backend-doc-pointer.py`)
- **Don't-trust-a-blind-search** - stops a search under the hooks folder from silently missing almost everything because of an allowlist, so "found nothing" isn't a false all-clear. (`blind-grep-gate.py`)
- **Keep-the-design-docs-tidy** - a stray new top-level design doc gets forced into archive/reports/research instead of cluttering the top level. (`canon-archive-gate.py`)
- **One-card-radius** - stops a new grouped card from using any corner radius but the locked 24px. (`card-radius-gate.py`)
- **Same-chrome-every-mockup** - checks a new mockup's category row and search pill match the order used on its sibling mockups, so one screen doesn't contradict another. (`chrome-consistency-gate.py`)
- **Did-you-actually-look-first** - catches Claude saying something is missing or undecided when nothing this turn actually searched for it. (`claim-missing-without-looking-gate.py`)
- **Don't-let-a-builder-wipe-someone-else's-work** - stops a coder helper from running a destructive git command that could delete another helper's uncommitted work. (`coder-git-guard.py`)
- **Register-new-components** - stops a brand-new shared component from being saved unless the master component list gets updated the same turn. (`component-registry-sync-gate.py`)
- **No-shouty-caps-no-em-dashes** - blocks tracked-uppercase labels, em-dashes, decorative dots, and vague copy from landing in real UI text. (`copy-lint-gate.py`)
- **Hand-bulk-image-reading-to-a-helper** - when Claude is about to look at a big pile of screenshots or video frames itself, redirects that to a helper; a normal one-off screenshot passes through untouched. (`delegate-media-read-gate.py`)
- **No-fake-demo-data-on-real-pages** - stops turning on a still-demo homepage section or adding a fake/seed data array into a real customer page. (`demo-data-not-live-gate.py`)
- **No-duplicate-or-contradicting-design-rules** - before a new rule is added to the locked design files, checks it isn't a near-duplicate or contradiction of one already there. (`design-law-integrity-gate.py`)
- **Heads-up-before-something-destructive** - a one-line warning, never a block, right before a command would wipe something with no copy kept anywhere. (`destructive-warn.py`)
- **Don't-bold-everything** - blocks an edit that makes more than half a screen's new text bold at once, so bold stops meaning anything. (`emphasis-budget-gate.py`)
- **Stylists-are-individuals-not-a-group** - stops a list of staff from being coded as one merged card the way a category of services is. (`entity-card-gate.py`)
- **Check-it-doesn't-already-exist** - before a new page, component, migration, or design doc, checks whether something with the same name already exists. (`exists-guard.py`)
- **No-fake-ratings-prices-or-counts** - blocks a hardcoded fake star rating, review count, distance, or price on a real salon card instead of the real database number. (`fabricated-value-gate.py`)
- **Split-big-research-jobs-across-agents** - stops one huge research job from going to a single agent working step by step instead of several agents at once. (`fan-out-not-one-agent-gate.py`)
- **Don't-disarm-everything-at-once** - blocks a command that tries to set three or more gate-skip flags at once, exactly how the whole gate system got silently switched off before. (`flag-spam-gate.py`)
- **No-German-only-text-on-real-pages** - blocks new hardcoded German text on a customer page, and blocks the turn ending if a translation key is added in one language but forgotten in the other three. (`i18n-write-gate.py`)
- **One-error-field-look** - stops hand-painting a red error border yourself; makes you use the shared input component so every error field looks the same. (`input-error-consistency-gate.sh`)
- **Swiss-price-law** - stops an illegal "ab CHF 45" from-price on a customer offer, pushes toward the legal tiered pricing instead. Real legal exposure. (`legal-price-gate.py`)
- **Don't-silently-undo-an-approved-value** - blocks an edit that quietly changes a value the file itself marks as locked or owner-approved. (`locked-value-gate.py`)
- **No-dropping-the-live-database-from-the-terminal** - stops a raw psql or supabase command from dropping a table or wiping a column on the live database. (`mcp-prod-write-guard-bash.py`)
- **No-dropping-the-live-database-via-the-tool** - same protection through the database tool itself: blocks any call that would drop, disable security, or delete without a real filter. (`mcp-prod-write-guard.py`)
- **Don't-grade-a-broken-page-as-passing** - stops a new measurement script from printing PASS on a page that never actually loaded. (`measure-guard-gate.py`)
- **No-fake-accessibility-facts** - blocks a database migration from setting wheelchair-access or LGBTQ+-friendly from a random hash instead of a real reported fact. (`migration-fabricated-data-gate.py`)
- **Mockups-must-render-right-on-a-real-phone** - blocks a mockup with wrong zoom, remote fonts or images, or grey placeholder boxes instead of real photos. (`mockup-base-gate.py`)
- **Use-the-real-card-don't-redraw-it** - stops a mockup from hand-drawing its own store card instead of naming the real component it copied. (`mockup-compose-registered-card-gate.py`)
- **Say-where-each-feature-really-lives** - blocks a new mockup unless it lists every feature it draws and where that exists in real code, and blocks copy quoting something already killed. (`mockup-depicts-gate.py`)
- **Mockups-are-always-English** - blocks German, French, or Italian text from landing in a mockup meant for your review. (`mockup-english-gate.py`)
- **Motion-goes-in-a-mockup-first** - blocks adding animation code straight into a real page instead of trying it in a mockup first. (`mockup-first-gate.py`)
- **A-mockup-must-be-a-real-copy** - blocks a new mockup file unless it names the real page or component it was copied from. (`mockup-grounding-gate.sh`)
- **Don't-re-flatten-what-was-rejected** - blocks a mockup edit that proposes removing card shadows or going borderless, a direction already tried and rejected. (`mockup-no-flat-gate.py`)
- **The-combined-mockup-checklist** - bundles about ten mockup rules into one pass so a mockup gets one clear list instead of ten separate stop-and-retry rounds. (`mockup-preflight-manifest.py`)
- **Show-the-real-base-it's-copied-from** - blocks saving a new mockup unless it actually shows the real screenshot or live route it's based on. (`mockup-real-base-gate.py`)
- **Show-cards-at-their-real-size** - blocks squeezing a real feed card into a two-column phone grid when the real feed shows it full width. (`mockup-realsize-gate.py`)
- **Don't-bring-back-what-was-rejected** - stops a mockup from re-adding a treatment you already rejected, even if it's still sitting in old source code. (`mockup-resurrection-gate.py`)
- **No-more-than-4-sizes-2-weights** - blocks a mockup with too many different text sizes or weights on one screen. (`mockup-type-budget-gate.py`)
- **No-visual-change-without-an-approved-mockup-first** - blocks changing an actual color, radius, shadow, or size on a real shipped component unless an approved mockup already showed it. (`mockup-visual-gate.py`)
- **Sizes-measured-not-eyeballed** - blocks a reference-copy mockup with multiple font sizes unless they were matched by word-width to the reference, not glyph height guessed by eye. (`mockup-width-calibration-gate.py`)
- **Prove-the-money-write-actually-landed** - blocks a database update touching a money or booking-status column unless it also confirms the write actually hit a row. (`money-update-cas-gate.py`)
- **Use-the-approved-entrance-animation** - blocks a new screen entrance that only fades in without also scaling and blurring, per the one approved motion recipe. (`motion-recipe-gate.py`)
- **No-invisible-styled-search-box** - blocks a search box styled with a class that actually loses the border/background fight, the exact bug that shipped a box-inside-a-box search bar once. (`nested-input-chrome-gate.py`)
- **Don't-flatten-the-whole-page's-type-at-once** - blocks a CSS rule that changes bold-ness or size for every element on a page at once, erasing headings vs body text. (`no-blanket-type-override-gate.py`)
- **One-file-at-a-time** - blocks a script or loop that would write to three or more files at once without opening any of them first. (`no-blind-sweep-gate.py`)
- **Don't-run-two-builders-in-one-repo-at-once** - stops a second coder helper from entering a repo while a first is still working there and could sweep up its files. (`no-concurrent-coders-same-repo-gate.py`)
- **Photos-must-come-from-real-data** - blocks a photo whose source is hardcoded into a component instead of real salon data, and blocks a lazy grey-box fallback instead of the real icon-or-initial. (`no-decorative-image-gate.py`)
- **No-fake-phone-frame** - blocks a mockup from drawing a fake phone bezel or fake status bar, since it's meant to be viewed full-bleed on your real phone. (`no-fake-phone-gate.py`)
- **No-glowing-focus-ring-anywhere** - blocks adding a focus halo or colored outline to any button, input, or card. (`no-focus-ring-gate.py`)
- **Don't-leak-the-AI-key-into-a-URL** - stops the Gemini API key from being put in a URL, where it would leak into logs. (`no-gemini-key-in-url.py`)
- **Don't-trust-an-unverified-cookie** - blocks new server code that trusts a raw session cookie instead of verifying it, which could let someone forge being any user. (`no-getsession-authz-gate.py`)
- **No-walls-of-curly-braces-on-your-screen** - stops a terminal command from dumping raw JSON onto your screen, since a wall of brackets tells you nothing. (`no-inline-json-command-gate.py`)
- **Use-the-real-card-shape-don't-invent-one** - blocks a new mockup that draws something shaped like a salon card unless it copies the real card's structure. (`no-invented-ui-gate.py`)
- **No-italics** - blocks adding italic text to any customer screen, since you never approved it and it kept spreading by copy-paste. (`no-italic-ui-gate.py`)
- **Don't-burn-the-expensive-model-on-ordinary-work** - stops a helper from using the priciest model on routine build/fix work; reserves it for real judgment calls. (`no-opus-subagent-gate.py`)
- **Don't-restart-a-paused-workstream-by-accident** - stops Claude from launching a big multi-agent run to resume paused work you didn't clearly ask to restart. (`no-overstep-launch-gate.py`)
- **Don't-retry-a-refused-tool-call-blindly** - stops Claude from calling the same tool again right after it was refused, since the refusal is usually just your next message arriving mid-call. (`no-retry-rejected-tool-gate.py`)
- **Don't-pull-sensitive-columns-wholesale** - blocks a server query that grabs every column (including Stripe or moderation fields) from a table carrying sensitive data. (`no-select-star-sensitive.py`)
- **Don't-self-DoS-the-phone-link-tunnel** - refuses to save a tunnel command wrapped in a retry loop, the exact shape that got the account rate-limited once. (`no-tunnel-retry-loop-gate.py`)
- **No-money-route-without-a-real-login-check** - blocks a new route that mutates data (especially vouchers, gift cards, payouts) with no real auth check, or one guarded only by a comment. (`no-unauth-money-route.py`)
- **Don't-skip-the-commit-safety-checks** - blocks a git commit that carries --no-verify, so the pre-commit checks can't be quietly skipped. (`no-verify-commit-gate.py`)
- **A-real-overhaul-changes-the-structure** - when you ask for a full overhaul, blocks a mockup that keeps nearly all the same rows in the same order, a treatment pass dressed up as a rebuild. (`overhaul-means-structure-gate.py`)
- **Painting-over-our-own-page-isn't-a-reference-match** - stops trying to match a reference screenshot by CSS-painting our own page in an iframe, which can never remove our own chrome. (`overlay-is-not-a-match-gate.py`)
- **No-solid-black-button-in-a-row-of-peers** - blocks an all-black commit button inside a repeated list (a stylist picker), which destroys the one-primary-action hierarchy. (`peer-list-ink-cta-gate.py`)
- **The-database-column-must-actually-exist** - blocks a query selecting a column that doesn't really exist in the live database, a typo that silently returns nothing. (`phantom-column-gate.py`)
- **Never-save-a-raw-access-token** - blocks saving a raw booking or access token straight into the database instead of only its scrambled hash. (`plaintext-token-at-rest-gate.py`)
- **Write-the-plan-before-the-code** - blocks editing a real code file until your current asks are actually written into the plans folder. (`plan-first-gate.py`)
- **No-raw-input-in-a-database-filter-string** - blocks an edit that interpolates unsanitized request input straight into a search-filter string, a real injection hole. (`postgrest-filter-injection-gate.py`)
- **Check-it-doesn't-already-exist-before-you-build** - the project's #1 rule enforced: blocks a brand-new page, route, migration, or component until you've actually searched for an existing one this turn. (`pre-build-exists-check.sh`)
- **Deletions-must-say-why** - blocks committing the deletion of a real page or component unless the same commit explains why in the graveyard doc. (`pre-commit-graveyard.sh`)
- **No-raw-hex-no-retired-token** - blocks a new raw hex color, a retired design token, or a non-standard animation duration from landing in a real page. (`pre-edit-drift-gate.sh`)
- **The-search-panel-must-grow-with-the-finger** - on the search-morph screen, blocks code where a swipe snaps the panel open instead of growing with the drag, a look rejected four times. (`pre-edit-gesture-expand-gate.py`)
- **No-star-rating-without-a-review-count** - blocks new code showing a star rating with no count next to it, or a hardcoded fake "14 Salons" count. (`pre-edit-psychology-gate.py`)
- **Use-the-one-real-city-category-list** - blocks a file from re-declaring its own list of Swiss cities or beauty categories instead of importing the one real constant. (`pre-edit-reinvent-data-gate.py`)
- **Don't-rebuild-what-you-already-killed** - blocks editing a page or component you already de-linked and logged as removed, until it's confirmed you actually still want it. (`pre-edit-removed-check.sh`)
- **Better-choice-reminder** - when a tool call matches a known worse pattern, injects a short "do X instead of Y, because Z" note, once per lesson per session. (`preference-inject.py`)
- **Actually-try-the-preview-before-saying-it's-impossible** - the first time a UI file is edited in a sandbox that can't open a network port, reminds Claude to actually try the real preview tool first. (`preview-capability-warn.py`)
- **Skip-the-click-on-your-own-trusted-folders** - quietly skips the "yes, edit this file" click for your own config, hooks, and skills folders, while still requiring it for anything genuinely risky. (`prompt-suppressor-gate.py`)
- **A-reference-is-measured-never-eyeballed** - blocks a mockup that claims to be built from a screenshot unless it cites real measured numbers for both the reference and our own screen. (`reference-measure-gate.py`)
- **Validate-what-comes-in** - blocks a new API route that reads the request body without validating it against a real schema. (`require-body-schema-gate.py`)
- **Flags-three-known-security-mistakes** - flags, never blocks, the wrong session check, a suggestion to turn off row-level security, or leaking the admin database key to the browser. (`security-antipattern-gate.py`)
- **Prove-you-own-the-record-first** - blocks a new backend route that uses the all-access database connection with no check that the caller actually owns the record. (`service-role-ownership-gate.py`)
- **Log-every-gate-exception-used** - logs every command that creates a gate-skip flag and tells you it happened, so a sanctioned exception never goes unnoticed. (`skip-flag-ledger.py`)
- **No-stock-photo-URLs-no-false-photo-claims** - blocks a stock-photo URL hardcoded into a component, and blocks a reply claiming real salon photography exists while the database shows zero rows. (`stock-photo-gate.py`)
- **No-open-file-storage-without-an-owner-check** - blocks a new route writing to file storage with the admin connection and no login check, the exact shape that once let one customer's files be seen by anyone. (`storage-rls-bypass-gate.py`)
- **Remind-Claude-of-a-settled-call** - when your message or an edit touches an area where you already made a dated taste decision, quietly reminds Claude of it before it acts. (`taste-log-inject.py`)
- **No-secret-token-in-a-web-address** - blocks putting an access token into a URL's query string, where it leaks into logs and browser history. (`token-in-url-query-gate.py`)
- **Compose-the-real-card-don't-draw-a-new-one** - blocks a page from hand-building its own salon card, or drawing three-plus of its own card-shaped boxes, instead of using the real component. (`use-the-registered-component-gate.py`)
- **Is-the-dev-environment-actually-set-up** - the first time a preview tool is used in a session, checks node_modules, .env, and the tunnel are actually there, hands back the exact fix if not. (`verify-tooling-preflight.py`)
- **Render-it-before-asking-which-one-you-like** - blocks asking you to choose between visual options in plain text unless Claude actually rendered and looked at something first. (`visual-question-needs-render-gate.py`)
- **No-dark-mode-on-the-website** - blocks any dark-mode CSS from being added to the site, since the web app is single light theme and dark mode renders it solid black. (`white-only-web-gate.py`)
- **Don't-overwrite-the-whole-plan-index** - blocks a save to the workstream file that's missing its real index marker, or an edit that strips that marker out. (`workstreams-index-guard.py`)
- **Warn-before-two-copies-of-the-repo-collide** - warns once when an edit is about to land on a file a different parallel working copy touched in the last 6 hours. (`worktree-collision-guard.py`)

**Fires after an edit, as a follow-up:**

- **Nudge-the-to-do-list-mid-session** - every 15th tool call in a long session, checks how many unticked boxes remain in the active plan and reminds Claude if any are still open. (`open-boxes-midturn.py`)
- **Auto-screenshot-the-simulator** - after editing an iOS screen, automatically screenshots the running simulator and hands it to Claude to look at, instead of making it reload manually each time. (`sim-auto.py`)

**Fires only when a reply is about to end (checks the claim just made):**

- **Check-the-whole-clip-not-a-few-frames** - stops Claude from saying an animation is fixed when only a handful of frames were actually checked. (`animation-full-clip-verify-gate.py`)
- **Don't-measure-a-frozen-background-tab** - stops Claude calling an animation "stuck" when it was only checked in a background browser tab, which freezes frames and gives a false reading. (`animation-measured-in-background-tab-gate.py`)
- **One-combined-not-really-finished-message** - merges several end-of-turn "this isn't done" checks into one message instead of three near-identical refusals in a row. (`batch-family-aggregator.py`)
- **Actually-open-the-browser-and-click-it** - won't let a turn end after a visual change unless a browser was actually opened and clicked through, including checking a dispatched helper's real transcript. (`browser-verify-gate.sh`)
- **Auto-checkpoint-the-work** - at the end of every turn, auto-commits uncommitted work and, only if safe, fast-forwards local main, but never pushes to the internet. (`checkpoint-merge-main.py`)
- **Don't-call-it-finished-if-no-file-landed** - blocks a closing message describing a mockup as finished when no mockup file was actually saved this turn. (`composed-not-written-gate.py`)
- **Run-the-reviewer-panel-on-real-backend-changes** - after a real chunk of backend or security code changes, reminds Claude to run the automatic reviewer panel before calling it done; note only, never blocks. (`council-trigger.py`)
- **Review-counts-always-in-a-pill** - makes sure a count like "(16)" always shows inside a pill, never as bare text floating next to something else. (`count-consistency-gate.py`)
- **Verify-the-design-before-saying-done** - makes Claude actually check a built screen against the locked design system before it's allowed to say it's finished. (`design-verify-gate.py`)
- **Confirm-the-exact-value-you-were-told-to-fix** - when you're correcting Claude for forgetting an exact color or value, checks the reply actually confirms that value was delivered or verified. (`dropped-directive-gate.py`)
- **One-combined-prove-it-message** - instead of four or five separate "you claimed this without proof" pop-ups on one reply, runs them all at once into one list. (`evidence-family-aggregator.py`)
- **A-gate-telling-you-how-to-proceed-isn't-a-dead-end** - blocks Claude from reporting work as blocked when a gate this turn actually told it how to proceed and it never tried. (`gate-block-is-not-a-stop-gate.py`)
- **Prove-a-fixed-hook-was-actually-stress-tested** - warns, no longer blocks, when Claude claims a check is now armed and passing without a second reviewer trying to break it first. (`harden-needs-council-gate.py`)
- **Get-a-second-opinion-on-ideas** - when you ask for ideas or options, makes sure Claude actually sent the question to another agent instead of just answering alone. (`ideas-need-the-council-gate.py`)
- **After-3-rejections-show-the-real-comparison** - once you've rejected the same animation three times, stops Claude re-reporting a passing measurement and makes it show a real side-by-side instead. (`instrument-must-agree-gate.py`)
- **Prove-the-hover-or-press-actually-works** - blocks handing over an interactive mockup as working unless Claude actually clicked it and read back a real before/after change. (`interaction-proof-gate.py`)
- **One-combined-link-quality-correction** - runs every remaining check on whether a preview link is actually good and gives one combined correction instead of five separate refusals. (`link-family-aggregator.py`)
- **Full-recap-after-working-alone** - after Claude works through a long stretch while you're away, the first reply back must include everything that happened, not just the last small thing. (`loop-summary-gate.py`)
- **One-map-style-everywhere** - catches a map style hand-defined somewhere other than the one shared file, since the app used to have three different, inconsistent maps. (`map-style-gate.py`)
- **Measured-every-state-not-just-the-first-one** - blocks a claim like "nothing under 44px anywhere" unless the other states (expanded rows, sheets, tabs) were actually clicked into and measured too. (`measure-every-state-gate.py`)
- **Check-the-mockup-before-asking-the-question** - stops Claude from asking a design question an approved mockup already answers. (`mockup-already-answered-gate.py`)
- **A-promised-mockup-must-actually-arrive** - blocks a closing reply that promises a mockup "next" without building it, or answers a direct mockup request with something else entirely. (`mockup-defer-stop-gate.py`)
- **Catch-German-even-from-a-script-generated-mockup** - catches a mockup that ended up in German when it was generated by a shell script rather than a normal edit, invisible to the write-time check. (`mockup-lang-stop-gate.py`)
- **A-mockup-is-one-real-phone-screen** - refuses to call something a mockup if it's actually a desktop comparison page or two phones side by side instead of one real screen. (`mockup-must-be-a-screen-gate.py`)
- **The-reviewer-must-actually-compare-build-vs-mockup** - checks a design reviewer was told to render both the real build and the approved mockup and diff every state, not just grade a checklist; warns only. (`mockup-parity-gate.py`)
- **Was-it-actually-measured-before-you-saw-it** - checks a mockup link was measured with a real tool before being handed to you, not just glanced at. (`mockup-verify-before-show-gate.py`)
- **Don't-hand-you-a-command-without-trying-first** - stops Claude saying "you'll need to run this yourself" unless it actually tried two different tools first. (`no-bash-handoff-gate.py`)
- **Fix-it-don't-hide-it-because-we're-pre-launch** - blocks a reply recommending hiding or deleting a broken feature just because the product isn't live yet, instead of wiring it to real seeded data. (`no-easy-hide-gate.py`)
- **Don't-delete-what-you-were-told-to-improve** - stops Claude saying it removed something when you never actually asked for a removal. (`no-unrequested-removal-gate.py`)
- **Do-it-don't-hand-it-back-to-you** - blocks a closing message handing you a setup chore that could actually be done with the tools already available. (`owner-punt-gate.py`)
- **Quote-what-he-actually-said-on-a-mixed-signal-message** - when your message mixes an approval word and a rejection word in one breath, blocks a design-log entry unless the reply quotes exactly what you said. (`pick-reading-gate.py`)
- **A-parked-decision-must-actually-get-written-down** - if a reply says a decision is being parked for later, checks it was actually written into the plan file this turn. (`plan-park-gate.py`)
- **No-agreeing-without-naming-a-real-downside** - blocks a closing reply that just agrees with your idea or builds it without naming one real cost. (`pushback-gate.py`)
- **Don't-call-a-throwaway-page-a-finished-component** - blocks ending a turn with only a standalone mockup page presented as finished when the real component was never touched. (`real-component-gate.py`)
- **A-recurring-mistake-needs-a-real-fix-not-a-promise** - if you call something a recurring problem, blocks the reply until an actual hook or gate file was changed this turn. (`recurrence-harden-gate.py`)
- **Actually-go-look-at-the-named-app-first** - when you name a real product as a design reference, blocks visual work unless Claude actually opened Mobbin or the real site this turn. (`reference-captured-gate.py`)
- **Send-the-short-correction-not-the-whole-reply-again** - checks whether a closing message repeats something you already read unchanged, and if so sends only the new part. (`reply-family-aggregator.py`)
- **Don't-describe-a-script-you-didn't-actually-run** - stops Claude describing what a script or CI check does or costs unless it actually ran it or read it this turn. (`runnable-claim-gate.py`)
- **Seeding-real-test-data-isn't-fabrication** - blocks a reply using "no fake data" as the excuse for leaving a real product section empty instead of just seeding real test rows. (`seed-not-fabrication-gate.py`)
- **Prove-the-fix-was-self-tested** - blocks Claude saying a hook is "fixed" in the same turn it edited that file unless it actually ran that file's own self-test. (`selftest-before-done-gate.py`)
- **Don't-forget-verification-just-because-a-helper-did-the-work** - after a coder helper finishes editing a screen, reminds Claude the design-verification steps are still owed. (`subagent-uiwork-reminder.py`)
- **Prove-it-before-saying-done-or-fixed** - if code was edited and the reply says "done" without a test run or a page actually opened, blocks it. (`verify-before-done-gate.py`)
- **A-design-report-needs-an-actual-link** - blocks ending a turn with a written design plan or an offer to build a mockup unless you actually got a clickable link or image this turn. (`visual-deliverable-gate.py`)
- **A-promised-preview-needs-a-link-right-now** - blocks a closing message saying a screenshot or recording is "coming" unless that same message hands over a real clickable link right now. (`visual-promised-needs-link-gate.py`)

**Fires only right before a context compaction:**

- **Save-state-before-compaction** - right before the conversation gets compacted, saves a snapshot of git status and each workstream's live notes so nothing in-flight is lost. (`pre-compact-context-snapshot.py`)

### FIX (29) - the rule is right, the check is broken or doubled up

Same ordering: message/session gates first, then file-edit gates, then reply-ending gates.

- **Full-rebuild reminder** - reminds Claude a full rebuild is on the table, not just a paint job, when your wording sounds like you're rejecting a whole screen's structure. **Broken:** its own notes admit it also fires on plain backend talk like "restructure the SQL join" with no design context, a known false-fire nobody fixed yet. (`structure-liberty-injector.py`)
- **What-got-done recap** - prints the latest plain-English work log at the start of a session. **Broken:** only the read-only half is actually wired in; the half that would catch the log going stale after real commits land is registered nowhere. (`worklog.py`)
- **Show-the-taste-rules-once-per-session** - meant to show the locked design values the first time a screen file is edited. **Broken:** the file it reads only exists on one separate, unmerged branch, so on every other branch, including this one, it silently shows nothing. (`design-law-inject.py`)
- **No-"so-I-never-forget"-comments-in-real-code** - blocks a code comment that justifies itself as being for Claude's own memory rather than the customer. **Broken:** it only catches the confessional sentence, not the actual unwanted feature, so it's dodged just by not writing that sentence. (`enforcement-in-product-gate.py`)
- **No-fake-accessibility-facts-in-a-migration (older copy)** - same protection as the version we're keeping. **Broken:** its own comment still claims it isn't armed when it actually is, and it's a near-duplicate of the gate already kept above, two files doing one job. (`migration-fabrication-gate.py`)
- **The-five-in-one-mockup-content-check** - checks colors, muted focal colors, hand-drawn icons, German text, and oversized bold type in one pass. **Broken:** its German-text check duplicates the separately-armed mockup-english-gate.py over the same files, so one violation can trip two interrupts. (`mockup-content-gate.py`)
- **The-finished-screen-note** - blocks a mockup from shipping without a note confirming a photo, one biggest element, a real number, a color moment, and no dead space. **Broken:** the check for whether the note is any good was never tested; any sentence hitting 4 of 5 keywords passes, whether or not the mockup is actually finished. (`mockup-floors-gate.py`)
- **English-only-Claude-written-labels** - blocks German captions Claude itself writes on a comparison or file caption. **Broken:** it's a live, near-total duplicate of the separately-armed mockup-english-gate.py, scanning the same paths with a different word list. (`mockup-labels-english-gate.py`)
- **No-AI-generated-images** - blocks a terminal command that would generate an AI image. **Broken:** it only watches the terminal; this session's own image-generation tools, called directly, sail past it completely untouched. (`no-ai-assets.py`)
- **Selected-state-is-gray-never-black-or-blue** - blocks a solid black or blue fill on a selected pill or tab. **Broken:** its own test file records it wrongly blocking an edit to a plain code comment that just describes the rule, a known unfixed bug. (`no-black-selected-gate.py`)
- **No-localhost-link-handed-to-you** - meant to catch a closing reply handing you a link you can't open. **Broken:** it's wired to the wrong moment entirely, so the check it's supposed to run on the real reply never actually happens; a different gate already covers this job correctly. (`no-localhost-handoff-gate.py`)
- **Claude-dispatches-a-builder-doesn't-hand-edit-code-itself** - blocks the main agent from editing real source code directly. **Broken:** its own test proves a real, working escape hatch, a multi-file edit of any size sails through completely unchecked. (`orchestration-gate.py`)
- **Look-at-the-measured-proof-before-editing** - meant to block editing a component against a screenshot measurement until the proof image was actually opened. **Broken:** confirmed dead on this machine, a timezone bug makes every fresh measurement look 2 hours old, so it never actually blocks anything. (`pre-component-edit-pixel-spec.sh`)
- **Fresh-measurement-before-a-mockup-edit** - blocks a mockup edit unless a dated measurement was written down this session. **Broken:** it's a second, separately-built copy of the exact rule the project already names a different gate for; the two don't talk to each other. (`pre-edit-measure-first-gate.py`)
- **A-named-brand-reference-must-be-proven-captured** - blocks a mockup citing Apple or Airbnb unless it points to a captured file. **Broken:** only fires on a brand-new file; editing an existing mockup to add an unproven brand claim slips right past it. (`reference-check-gate.sh`)
- **No-bordered-box-bell-icon-or-hamburger-on-account/profile** - blocks three specific elements you named as wrong ten times running. **Broken:** its scope is hardcoded to an old file format; the newer mockup format sibling gates already moved to was never added here, so it may be watching an empty room. (`rejected-elements-still-present-gate.py`)
- **Don't-describe-a-competitor-from-memory** - blocks a closing message describing what Airbnb or Fresha actually does unless this turn genuinely looked it up. **Broken:** only judges the wording of the finished reply, something Claude already knows before it writes the sentence; belongs earlier, as a reminder, not a second message after. (`brand-claim-needs-capture-gate.py`)
- **Don't-leave-the-boring-bulk-work-for-later** - stops a closing reply from deferring remaining work to "later" or a "background sweep." **Broken:** same wording-only shape already moved out of this spot for three sibling checks; also overlaps a second gate scanning the same excuse with a different word list. (`defer-bulk-gate.py`)
- **Fix-the-violation-don't-just-flag-it** - stops Claude from finding a real design-rule break and just recommending you leave it broken. **Broken:** pure wording match on the closing message with no check on what actually happened; belongs as a reminder before writing, not a block after. (`flag-instead-of-fix-gate.py`)
- **Found-it-means-fix-it** - refuses a closing reply that says "I found the problem" without also saying something got fixed. **Broken:** only ever reads the wording of the reply, never any real tool call; the reply-writing rules Claude already reads cover this ground. (`found-it-then-fix-it-gate.py`)
- **Don't-ship-a-mockup-straight-to-the-live-page** - blocks a closing message claiming it shipped a design change live when you asked for a mockup. **Broken:** only matches the wording of the confession, never the actual files touched; your own harness audit already flagged this exact gate as fragile for that reason. (`mockup-not-live-gate.py`)
- **No-budget-or-session-limit-excuse-for-doable-work** - stops a reply from parking doable work as "out of budget" when you never asked for a real blocker. **Broken:** purely wording-based, the exact class of check already moved earlier for other gates; likely double-fires with a sibling check covering the same excuse. (`no-defer-excuse-gate.py`)
- **Don't-put-words-in-your-mouth** - blocks a closing message claiming "you asked for X" when you never said X. **Broken:** by its own admission it only catches the crude version, and explicitly misses the subtler failure, Claude inventing its own answer to your real topic, that was the actual repeat problem. (`no-invented-attribution-gate.py`)
- **A-visual-detail-needs-a-captured-reference** - stops a closing message claiming a decorative motif was built without a captured reference this turn. **Broken:** judges only wording; two near-identical sibling checks already got moved out of this exact position for the same reason. (`no-invented-visual-motif-gate.py`)
- **We-have-no-real-customers-yet-don't-say-we-do** - stops a closing message claiming real customers were harmed right now. **Broken:** has genuinely blocked correct, honest replies on at least three separate dates, each needing an emergency patch. (`prelaunch-reality-gate.py`)
- **Sample-the-real-color-don't-guess-the-word** - checks a color change on an approved icon was actually sampled from the real file. **Broken:** satisfiable just by writing the right-shaped sentence, not by actually running the sampling tool. (`sample-dont-pick-colour-gate.py`)
- **Small-business-doesn't-excuse-a-real-defect** - meant to block a reply that waves off a genuinely broken thing because the business is still small. **Broken:** confirmed dead, it reads the reply from fields that don't exist in a real payload, so it has never actually fired in a real session. (`scale-excuse-gate.py`)
- **Try-a-second-tool-before-saying-it's-blocked** - stops a closing message saying something can't be seen or run unless a genuinely different tool was actually tried first. **Broken:** same shape as the entry above it, wording Claude knows before writing it; belongs in the same pre-write note as its two already-moved siblings. (`second-instrument-before-blocked-gate.py`)
- **Don't-blame-the-owner-for-a-refusal-that-wasn't-one** - stops Claude telling you that you refused a tool call when it was actually your next message arriving mid-call. **Broken:** its evidence check only looks for the right keyword anywhere in the transcript, not real proof the check happened, so it can be satisfied by name-dropping rather than actually investigating. (`tool-rejection-blame-gate.py`)

### RETIRE (6) - switch these off, nothing is lost

- **Point-to-the-frontend-map** - reminded Claude of the frontend documentation whenever it touched customer-facing code. **What covers it instead:** nothing needs to. Measured at zero firings across 49 real sessions, and it misses most real customer files anyway. It was never actually doing anything. (`frontend-doc-pointer.py`)
- **Don't-build-a-duplicate-hook** - nudged Claude to check for an existing hook before writing a new one. **What covers it instead:** you already asked for this exact rarely-firing category to be stood down (4 firings in 49 sessions), and it has a known bug, it never checks this project's own local hooks folder, that was never fixed. The real anti-duplication check for new code (kept above) already covers the ground that matters. (`gate-dedup-guard.py`)
- **Remind-Claude-of-a-past-bug-in-this-file** - reminded Claude of a real past bug when editing a file that bug once lived in. **What covers it instead:** same rarely-firing pattern, plus about half its list of lessons points at files that no longer exist, so those can never fire regardless. Two gates kept above already carry the live version of "remember what happened here." (`lessons-ledger-inject.py`)
- **Cite-a-measured-diagnosis-before-a-new-mockup** - meant to block a new mockup unless it cited a real current value and a numeric target. **What covers it instead:** its own test fails, it wrongly blocks a legitimate case, and it fired zero times in 49 sessions. Two gates kept above already require real measured numbers before any mockup ships. (`mockup-diagnosis-gate.py`)
- **Reminds-you-filters-must-discriminate** - reminded Claude, after an API-route edit, that a filter must actually narrow results, not just render. **What covers it instead:** this exact instruction already sits in the project's own rulebook, loaded every session, and in the backend playbook Claude loads for this kind of work. The gate repeats something already in front of Claude. (`api-route-discriminate-reminder.py`)
- **Deletes-any-mention-of-git-push** - scrubbed any mention of pushing or deploying out of a closing message. **What covers it instead:** it's a pure wording scrub with nothing behind it, and the same class of check already moved to a before-write reminder for three sibling rules. This one never got the same move, and scrubbing a second message can't un-send the first anyway. (`no-push-mention-gate.py`)

## The pattern behind the retirements

Every single one of the 6 gates being retired was checking something that was knowable **before** it ever acted, not something that only became clear after the fact. Four of them (the frontend-doc pointer, the duplicate-hook check, the past-bug reminder, the diagnosis-note check) could tell from looking at the file being touched, before touching it, whether they had anything real to say. The other two (the API-filter reminder, the git-push scrub) were repeating something already sitting right in front of Claude in plain text. None of the six ever needed to catch Claude in the act of a mistake, because none of them were ever measuring a real mistake in the first place.

That is the number that matters: **0 of the 6 retired gates were catching something only visible after the fact.** A check like that, one that never had a real "after" to catch, was never actually a check. It was a line of code pretending to be one.

## What this means for moving to Codex

Of the 201 gates staying on (172 KEEP + 29 FIX):

- **46 carry over largely unchanged.** These check the product itself, real security holes, real fabricated data, real legal price rules, real database and money correctness. They don't care which AI wrote the code; they'd work the same way pointed at Codex.
- **155 need real rewriting**, because they're written specifically around how Claude Code behaves: they read Claude's own closing message, check which Claude tool got called, watch for a Claude subagent's transcript, or enforce something about how Claude specifically talks to you (no em-dashes, no narration, quote what you said). Codex has its own way of running, its own tool names, and its own conversation shape, so the RULE behind each of these (no fake ratings, mockup-first, measure before you claim) still holds, but the CODE that enforces it would need to be rebuilt for however Codex actually works.
- **6 should not be carried over at all.** These are the ones being retired here for being dead weight on Claude Code already; moving dead weight to a new system just gives it a second home to do nothing in.

## Decisions needing your word

- One of the fixes (`design-law-inject.py`) points at a design-rules file that currently only exists on one separate, unmerged branch. Fixing it for real means merging or cherry-picking that file onto main, say the word and I'll do it.
- Two pairs of gates are checking the exact same thing twice (the two migration-fabrication checks, and the two mockup-must-be-English checks). Merging each pair into one file means deleting the other, confirm you're fine with that before I remove either file.
- The AI-image-block fix would extend that ban to this session's own image-generation tools, not just terminal commands. That's a real behavior change (Claude could never use those tools at all, even for something you might actually want AI-made), confirm that's the intent.
- One gate (`rejected-elements-still-present-gate.py`) only watches old-style HTML mockup files. I don't know off-hand whether account/profile mockups still get built that way or have moved to the newer format like their sibling gates, tell me which and I'll fix the scope to match.
