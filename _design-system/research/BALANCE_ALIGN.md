# BALANCE_ALIGN: can "it isn't aligned" be measured?

<!-- exists-check: net-new vs _design-system/research/AXIS_ALIGNMENT.md and AXIS_GRID.md (both read
     first, they are the exists-guard's closest flags), plus GEOMETRY_PRINCIPLES_2026-07-17.md,
     TASTE_HIERARCHY.md, TASTE_GROUPING.md, TASTE_RANGE.md, WHY_DENSITY.md.
     AXIS_ALIGNMENT owns the VERTICAL axis WITHIN one row (icon / label / chevron cap-height
     centring) and left-edge COLUMNS of a settings row, measured from downscaled Mobbin
     screenshots. This file defers to it entirely on row anatomy and adds nothing there.
     AXIS_GRID owns container width, gutter and column ladders.
     What neither contains, and what this file adds: (1) a WHOLE-SCREEN measure computed from the
     rendered DOM rather than from screenshots, (2) a test of whether any such measure SEPARATES a
     screen the owner rejected from screens he and we accept, which is the actual question, and
     (3) a pass/fail threshold. Neither file proposes a gate; grep for "gate|threshold" in
     AXIS_ALIGNMENT returns only the word "perceptual threshold".
     Two corroborations rather than duplications: AXIS_GRID section 5 item 2 documents the peek
     card crop as a DELIBERATE grid break ("the crop is the scroll promise"), which is the
     independent justification for this file's carousel exclusion; AXIS_GRID section 7e found the
     same CLASS of defect this file's rail scan finds (a small unexplained left-edge split) by
     reading Tailwind classes, where this file finds one by measuring the render. Complementary
     methods, same family, neither supersedes the other.
     `npm run exists overflow` run 2026-07-31: 2 matches, both inline page sections in dev routes
     (search-model-b, card-ratio), neither a measure. `npm run exists alignment`: 0 matches, no
     graveyard hit. No repo-wide occurrence of `scrollWidth` in any doc, script or hook. -->

Lens: ALIGN (edge alignment and rhythm). Run 2026-07-31.

Question from the owner, verbatim: *"I believe it's all math or not. You said sixty percent. But you
can actually measure, like, logo looks weird or the balance and stuff. Balance is the most easiest
measure or not. Can you actually research? because we already done so many research rounds but you
keep missing the point."*

He is right that alignment is measurable. He is right that I never tried, I hedged instead. This file
reports what happened when I did, including the part where my most obvious idea failed.

**Headline: two measures were built. One failed, one worked.**

- **Rail near-miss rate** (the obvious idea, the one this lens was told to test hardest): **FAILS.**
  It does not separate the screen he rejected from the screens he and we accept. On every
  formulation, the rejected mockup scored *better* than our own approved PDP and better than
  Fresha's PDP.
- **Frame overflow** (content wider than the box that clips it): **WORKS** on this sample. The
  rejected screen shows 32px. All four comparison screens show 0px. It is also the exact mechanism
  behind three of his four complaints on that screen.

---

## 1. What the measures are, in plain English

**Rail near-miss.** A tidy screen lines things up on a few invisible vertical lines, called rails.
The title, the paragraph under it, and the card below it all start at the same distance from the left
edge. A sloppy screen has lots of *almost* the same line: one thing starts 16 pixels in, the next
starts 18, the next 20. Nobody consciously sees "18 versus 16", but the eye reads the whole thing as
untidy. So: list every left edge on the screen, group the ones that are effectively identical, and
count how often two groups sit annoyingly close (1 to 4 pixels apart) without being the same. A high
number should mean "isn't aligned".

**Frame overflow.** Separately, and much more bluntly: is anything on the screen physically too wide
for the box it lives in, so the box slices it off? A search bar whose right end is cut, a button
sheared in half, a row of chips that runs off the edge and stops mid-chip. This is not a taste
judgment at all. It is a container 358 pixels wide holding content 390 pixels wide. The measure walks
every box that hides its overflow and asks whether its content is wider than itself. Carousels are
excluded on purpose, because a carousel is *supposed* to run off the edge: our own density floor
requires a visibly cropped next item, and AXIS_GRID section 5 measured the same deliberate crop
across Airbnb, GetYourGuide and Fresha.

---

## 2. The exact JavaScript

Both scripts run as-is in `javascript_tool` against a rendered page. Working copies are at
`public/_align.js` and `public/_fo.js`, so any page served from `public` can load them with
`fetch('/_align.js').then(r=>r.text()).then(t=>(0,eval)(t))`. For a cross-origin reference site,
paste the body directly.

### 2a. Frame overflow (the one that works)

```js
window.FRAMEOVERFLOW=function(){
var VW=innerWidth,VH=innerHeight,hits=[],checked=0;
document.querySelectorAll('*').forEach(function(el){
var cs=getComputedStyle(el);
if(cs.display==='none'||cs.visibility==='hidden')return;
var ox=cs.overflowX;
if(!/hidden|clip/.test(ox))return;                  // only non-scrolling frames
var r=el.getBoundingClientRect();
if(r.width<40||r.height<20)return;                  // ignore chips/icon masks
if(r.top>=VH||r.bottom<=0)return;                   // first viewport only
checked++;
var over=el.scrollWidth-el.clientWidth;
if(over>1){
hits.push({el:el.tagName+'.'+String(el.className&&el.className.baseVal!==undefined?el.className.baseVal:el.className).slice(0,34),
frameW:el.clientWidth,contentW:el.scrollWidth,overflowPx:over,
pctOfFrame:+(100*over/el.clientWidth).toFixed(1)});}});
hits.sort(function(a,b){return b.overflowPx-a.overflowPx;});
return{viewport:VW,framesChecked:checked,overflowingFrames:hits.length,
worstPx:hits.length?hits[0].overflowPx:0,hits:hits.slice(0,6)};};
```

Why `overflowX: hidden|clip` and not `auto|scroll`: a scrollable strip is a carousel and its content
is meant to exceed it. A `hidden` frame gives the user no way to reach what is outside, so anything
outside is destroyed, not deferred. That distinction is the whole measure.

Why `scrollWidth - clientWidth` on the container rather than testing each child: a Mapbox canvas
sizes itself to its container and pans by transform, so per-child testing flags every off-screen map
pin as clipped. Measured on `/de`: the per-element form produced 9 hits, 7 map pins and 2 from a
closed search modal, so 9 false positives and 0 real ones. The container form produced 1 hit,
correctly, and gave the map 0. This was the single largest accuracy fix in the run.

### 2b. Rails, near-miss and gaps (the one that fails, kept so the negative result is reproducible)

```js
window.ALIGN=function(bandBottom,nmBand,rootSel){
var ROOT=rootSel?document.querySelector(rootSel):document.body;if(!ROOT)return{err:'no root '+rootSel};
scrollTo(0,0);
var VW=innerWidth,VH=innerHeight,BOT=bandBottom||VH,NM=nmBand||4,TOL=1.0;
var L=[],R=[],recs=[],seenL={},seenR={},clipped=0,hard=0,ovf=0,rng=document.createRange();
function opq(c){var m=String(c).match(/rgba?\(([^)]+)\)/);if(!m)return false;
var p=m[1].split(',').map(parseFloat);return p.length<4?true:p[3]>0.03;}
function OV(s){return /hidden|clip|auto|scroll/.test(s);}
function clipOf(el){var cl=0,ct=0,cr=VW,cb=BOT,p=el.parentElement,hardL=0,hardR=VW;
while(p&&p!==document.documentElement){var pc=getComputedStyle(p);
if(OV(pc.overflowX)||OV(pc.overflowY)){var pr=p.getBoundingClientRect();
if(OV(pc.overflowX)){cl=Math.max(cl,pr.left);cr=Math.min(cr,pr.right);
var scrolls=/auto|scroll/.test(pc.overflowX)&&p.scrollWidth-p.clientWidth>2;
if(!scrolls){hardL=Math.max(hardL,pr.left);hardR=Math.min(hardR,pr.right);}}
if(OV(pc.overflowY)){ct=Math.max(ct,pr.top);cb=Math.min(cb,pr.bottom);}}
p=p.parentElement;}return[cl,ct,cr,cb,hardL,hardR];}
function add(raw,el,kind){
var c=clipOf(el);
var vl=Math.max(raw.left,c[0]),vt=Math.max(raw.top,c[1]),vr=Math.min(raw.right,c[2]),vb=Math.min(raw.bottom,c[3]);
if(vr-vl<3||vb-vt<3)return;                 // not visibly present
if(vt>=BOT||vb<=0)return;                   // outside measured band
if(raw.right>VW+0.5)ovf++;                  // overflows viewport
if(raw.left<c[0]-0.5||raw.right>c[2]+0.5)clipped++;
if(raw.left<c[4]-0.5||raw.right>c[5]+0.5)hard++;
recs.push({l:raw.left,r:raw.right,t:raw.top,b:raw.bottom,k:kind});
var kl=kind+Math.round(raw.left*2)+'_'+Math.round(vt*2)+'_'+Math.round(vb*2);
var kr=kind+Math.round(raw.right*2)+'_'+Math.round(vt*2)+'_'+Math.round(vb*2);
if(raw.left>=c[0]-0.5&&raw.left>=-0.5&&!seenL[kl]){seenL[kl]=1;L.push({x:raw.left,w:raw.right-raw.left,t:vt,b:vb,k:kind});}
if(raw.right<=c[2]+0.5&&raw.right<=VW+0.5&&!seenR[kr]){seenR[kr]=1;R.push({x:raw.right,w:raw.right-raw.left,t:vt,b:vb,k:kind});}}
var els=ROOT.querySelectorAll('*');
for(var i=0;i<els.length;i++){var el=els[i],cs=getComputedStyle(el);
if(cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity)<0.05)continue;
var rc=el.getBoundingClientRect();if(rc.width<3||rc.height<3)continue;
var tag=el.tagName.toLowerCase();
if(tag==='img'||tag==='svg'||tag==='video'||tag==='canvas'||tag==='picture'){add(rc,el,'INK');continue;}
var bord=false,S=['Top','Right','Bottom','Left'];
for(var s=0;s<4;s++)if(parseFloat(cs['border'+S[s]+'Width'])>0&&cs['border'+S[s]+'Style']!=='none'&&opq(cs['border'+S[s]+'Color'])){bord=true;break;}
var shad=cs.boxShadow&&cs.boxShadow!=='none';
var bg=(cs.backgroundImage!=='none')||opq(cs.backgroundColor);
if(bg&&!bord&&!shad&&cs.backgroundImage==='none'){   // same-colour box paints no edge
var q=el.parentElement,pbg=null;
while(q&&q!==document.documentElement){var qc=getComputedStyle(q);
if(qc.backgroundImage!=='none'){pbg='IMG';break;}
if(opq(qc.backgroundColor)){pbg=qc.backgroundColor;break;}q=q.parentElement;}
if(pbg===cs.backgroundColor)bg=false;}
if(bg||bord||shad)add(rc,el,'BOX');
var ht=false;for(var n=0;n<el.childNodes.length;n++){var cn=el.childNodes[n];
if(cn.nodeType===3&&cn.textContent.trim()){ht=true;break;}}
if(ht){var blk=false;for(var c2=0;c2<el.children.length;c2++)
if(/block|flex|grid|table|list-item/.test(getComputedStyle(el.children[c2]).display)){blk=true;break;}
if(!blk){rng.selectNodeContents(el);var rr=rng.getBoundingClientRect();
if(rr.width>=3&&rr.height>=3)add(rr,el,'INK');}}}
function rails(v){var s=v.slice().sort(function(a,b){return a-b;}),o=[];
for(var i=0;i<s.length;i++){var Z=o[o.length-1];
if(Z&&s[i]-Z.max<=TOL){Z.max=s[i];Z.n++;Z.sum+=s[i];}else o.push({max:s[i],n:1,sum:s[i]});}
return o.map(function(c){return{x:+(c.sum/c.n).toFixed(2),n:c.n};});}
function estat(v){if(!v.length)return{n:0};var Rl=rails(v.map(function(o){return o.x;})),tot=v.length;
var inv={},pairs=0,ex=[];
for(var i=0;i<v.length;i++)for(var j=i+1;j<v.length;j++){
if(Math.min(v[i].b,v[j].b)-Math.max(v[i].t,v[j].t)>0)continue;   // same row: not a rail relation
var d=Math.abs(v[i].x-v[j].x);
if(d>TOL&&d<=NM){pairs++;inv[i]=1;inv[j]=1;
if(ex.length<8)ex.push(v[i].x.toFixed(2)+'~'+v[j].x.toFixed(2)+' d'+d.toFixed(2));}}
var nmE=Object.keys(inv).length;
var maj=Rl.filter(function(r){return r.n>=3;});
var solo=Rl.filter(function(r){return r.n===1;});
return{n:tot,rails:Rl.length,railsPer10el:+(10*Rl.length/tot).toFixed(2),
nearMissPairs:pairs,nearMissPct:+(100*nmE/tot).toFixed(1),
majorCovPct:+(100*maj.reduce(function(a,b){return a+b.n;},0)/tot).toFixed(1),
soloRailPct:+(100*solo.length/Rl.length).toFixed(1),
nearMissEx:ex,
top:Rl.slice().sort(function(a,b){return b.n-a.n;}).slice(0,6).map(function(r){return r.x+'/'+r.n;})};}
var nonCtr=L.filter(function(o){return Math.abs(o.x-(VW-o.w)/2)>1.5;});
var ogR=rails(nonCtr.map(function(o){return o.x;}));
var off=ogR.filter(function(r){var m=((r.x%4)+4)%4;return Math.min(m,4-m)>0.75;});
var gaps=[],zero=0,all=ROOT.querySelectorAll('*');
for(var i=0;i<all.length;i++){var kids=[],ch=all[i].children;
for(var c=0;c<ch.length;c++){var k=ch[c],kc=getComputedStyle(k);
if(kc.display==='none'||kc.visibility==='hidden'||kc.position==='absolute'||kc.position==='fixed')continue;
var kr=k.getBoundingClientRect();if(kr.height<3||kr.width<3)continue;
var cp=clipOf(k);
if(Math.min(kr.bottom,cp[3])-Math.max(kr.top,cp[1])<3)continue;
if(Math.min(kr.right,cp[2])-Math.max(kr.left,cp[0])<3)continue;
if(kr.top<BOT&&kr.bottom>0)kids.push(kr);}
if(kids.length<2)continue;kids.sort(function(a,b){return a.top-b.top;});
for(var j=0;j+1<kids.length;j++){var g=kids[j+1].top-kids[j].bottom;
if(g>=0&&g<=160){if(g<0.5)zero++;else gaps.push(Math.round(g*2)/2);}}}
var uq={},go=0;for(var i=0;i<gaps.length;i++){uq[gaps[i]]=(uq[gaps[i]]||0)+1;
var m=((gaps[i]%4)+4)%4;if(Math.min(m,4-m)>0.75)go++;}
var gk=Object.keys(uq).map(Number).sort(function(a,b){return uq[b]-uq[a];});
var H=0;for(var i=0;i<gk.length;i++){var p=uq[gk[i]]/gaps.length;H-=p*Math.log2(p);}
return{vw:VW,band:BOT,root:rootSel||'body',boxes:recs.length,
clippedEdges:clipped,hardClipped:hard,hardClipPct:recs.length?+(100*hard/recs.length).toFixed(1):null,overflowViewport:ovf,
LEFT:estat(L),LEFT_BOX:estat(L.filter(function(o){return o.k==='BOX';})),LEFT_INK:estat(L.filter(function(o){return o.k==='INK';})),
RIGHT:estat(R.filter(function(o){return o.k==='BOX';})),RIGHT_ALL:estat(R),
offGridLeftPct:ogR.length?+(100*off.length/ogR.length).toFixed(1):null,
offGridLeftVals:off.slice(0,8).map(function(r){return r.x;}),
GAPS:{n:gaps.length,zeroFlush:zero,distinct:gk.length,
offGrid4Pct:gaps.length?+(100*go/gaps.length).toFixed(1):null,
entropyBits:+H.toFixed(2),top:gk.slice(0,8).map(function(k){return k+'x'+uq[k];})}};};
```

Call `ALIGN()` for the first viewport, `ALIGN(document.body.scrollHeight)` for the whole page,
`ALIGN(h, 4, '#some-root')` to scope to a subtree.

### Method notes that materially changed the numbers

Three bugs were found and fixed during the run. Recorded because each silently corrupts results and
each will recur if someone rebuilds this from scratch.

1. **Invisible clipped content counted as visible.** Fresha's home page renders its "354.197 booked
   today" counter as an odometer: each digit is a column of ten stacked spans, nine scrolled out of a
   clipping ancestor. The first version counted all of them, reporting 106 boxes and rails at
   x=72.76, 82.9, 93.04 corresponding to nothing a human sees. After adding ancestor-clip
   intersection the same page reports 35 boxes. Any DOM measure that does not walk ancestor
   `overflow` will be wrong on real sites.
2. **Only perceivable edges may count.** An element contributes a left edge only if it paints one:
   media, text ink (measured with a Range, not the padded box), or a box with a border, a shadow, or
   a background that actually differs from the background behind it. Counting bare layout wrappers
   invents rails nobody can see.
3. **A rail is a vertical relationship.** The first version compared every left edge to every other
   and flagged two chips sitting side by side in one row as a "near-miss rail". They are adjacent,
   not misaligned. Near-miss is now counted only between elements whose vertical ranges do not
   overlap. That is the correct definition, and it still did not rescue the measure.

Also: `n1.html`, `n2.html`, `n3.html` are fragments with no viewport meta tag, so they lay out at
980px standalone and cannot be measured alone. The variants were measured scoped inside `index.html`,
which does carry the meta tag.

---

## 3. The numbers

Sample: 6 screens, all rendered at 390x844, all measured with the same script, Chrome via the
Browser pane, 2026-07-31.

| # | screen | label |
|---|---|---|
| A | `public/_mockups/home-v3/index.html` | **rejected by the owner, 2026-07-31** |
| B | live `/de` home | shipped, header currently being redesigned |
| C | live `/de/salon/cuts-and-culture` (PDP) | shipped, internally treated as passing floors |
| D | `fresha.com/de/a/joliz-aeschen-...` (Fresha PDP) | reference, our locked structural source |
| E | `fresha.com/de` home | reference |
| F | `airbnb.ch/a/discover` landing | reference |

### 3a. Frame overflow (the measure that works)

| screen | frames checked | overflowing | worst overflow |
|---|---|---|---|
| **A rejected mockup** | 3 | **1** | **32px** |
| B Solen /de | 14 | 1 | 9px |
| C Solen PDP | 13 | 0 | 0px |
| D Fresha PDP | 9 | 0 | 0px |
| F Airbnb | 5 | 0 | 0px |

The single hit on A is `div.screen`: frame 358px, content 390px, overflow exactly 32px. The single
hit on B is a closed search modal at 9px, not visible in the rendered screen.

Per-element version of the same idea, for completeness (share of visible boxes with an edge destroyed
by a non-scrolling ancestor): A 22.7% first viewport and 34.6% full page, B 3.8%, C 0%, D 3.0%, F 0%.
Same ordering, but it carries the map false-positive problem above, so the container-level number is
the one to use.

### 3b. What is actually being sliced on the rejected screen

Measured directly with `getBoundingClientRect`, not inferred:

```
viewport           390
.wrap              0    .. 390
.cell / .screen    16   .. 374   (358 wide)
#dn1-root          16   .. 406   (390 wide)   overhang +32
#dn2-root                                     overhang +32
#dn3-root                                     overhang +32
#dn1-pill          32   .. 390   right edge cut by 16px
#dn1-burger        332  .. 376   right edge cut by 2px
```

All three header variants were authored for a 390px viewport and dropped into a 358px frame with
`overflow:hidden`. The screenshot confirms it: the search pill, the hamburger circle, the "Nails"
category chip and every feed slot are visibly sheared off at the right edge.

This maps onto his words nearly line for line. *"the sizes doesn't match between a search bar, logo,
icons, everything"*: they do not match because the frame cuts each of them at a different point.
*"And it isn't aligned"*: nothing can share a right rail when the right rail is a slice.

### 3c. The one near-miss that is real and visible

Independently of the aggregate score failing, the rail scan did locate a genuine defect on A:

```
h1     text ink left = 16.00
.lede  text ink left = 16.00
.nm    text ink left = 20.00      <- section label
.bt    text ink left = 20.00      <- section sub-line
```

`.meta { padding: 0 4px }` pushes every section label 4px right of the page title above it, for no
reason. It is visible in the screenshot as a small unexplained indent. So the *detector* works as a
defect locator even though the *score* does not work as a grade. That distinction is the main finding
of this file. It is the render-measured twin of AXIS_GRID section 7e, which found the same class of
defect (16px heading against a 12px grid on the live search page) by reading Tailwind classes.

### 3d. Rail near-miss rate (the measure that fails)

Left edges, near-miss counted between vertically disjoint elements 1px to 4px apart.

| screen | left edges | rails | near-miss pairs | **near-miss %** | solo rails % | major-rail coverage % |
|---|---|---|---|---|---|---|
| **A rejected (viewport)** | 22 | 13 | 7 | **31.8** | 61.5 | 36.4 |
| **A rejected (full page)** | 107 | 39 | 84 | **43.9** | 71.8 | 64.5 |
| B Solen /de | 49 | 25 | 13 | **38.8** | 48.0 | 46.9 |
| C Solen PDP | 64 | 36 | 36 | **57.8** | 69.4 | 39.1 |
| D Fresha PDP | 33 | 22 | 22 | **39.4** | 81.8 | 39.4 |
| F Airbnb landing | 19 | 6 | 0 | **0.0** | 33.3 | 68.4 |

(E Fresha home was measured on an earlier, neighbour-based near-miss definition and scored 26.9. That
number is **not** comparable to this column and is excluded from the comparison rather than quietly
mixed in.)

Read the column. The screen he rejected scores **31.8**. Our own PDP scores **57.8**. Fresha's PDP,
the product we lock our structure to, scores **39.4**. The rejected screen is the second best of the
five comparable numbers. Wired to a gate, this metric would pass the mockup he threw out and fail the
PDP we consider finished.

Two refinements were tried and both made it worse:

- **Structural boxes only, excluding text ink.** A rejected: 0.0% (n=9). C Solen PDP: 35.7% (n=28).
  The rejected screen becomes literally perfect, and the per-screen sample collapses below usable
  size.
- **Text ink only.** A rejected: 46.2%. C Solen PDP: 44.4%. Indistinguishable.

The reason is visible in the raw pair list. Fresha's PDP has the *identical* defect shape as ours,
"16.00~20.00 d4.00" repeated, because a 4px inset on a label is an extremely common way to build a
page and is not what makes a screen look bad. Meanwhile near-miss counts rise with element count
(Airbnb's landing scores 0 largely because there is almost nothing on it), so the metric partly
measures density rather than tidiness.

### 3e. Gap rhythm, a weak third result

Vertical gaps between stacked siblings.

| screen | gaps | distinct values | off the 4px grid | entropy (bits) |
|---|---|---|---|---|
| A rejected (viewport) | 5 | 4 | 40.0% | 1.92 |
| A rejected (full page) | 47 | 9 | 38.3% | 2.63 |
| B Solen /de | 10 | 5 | 30.0% | 2.17 |
| C Solen PDP | 13 | 8 | 15.4% | 2.87 |
| D Fresha PDP | 3 | 2 | 0.0% | 0.92 |
| E Fresha home | 7 | 4 | 0.0% | 1.84 |
| F Airbnb landing | 7 | 3 | 85.7% | 1.15 |

Inside Solen the ordering matches quality: rejected mockup worst at 38 to 40% off-grid, /de 30%, PDP
15.4%, both Fresha screens a clean 0%. Suggestive, and consistent with our own LOCKED "4-pt scale
only" rule, which Fresha evidently follows and we evidently do not.

Not proposed as a gate, for three honest reasons. Airbnb sits at 85.7% because Airbnb is not on a 4px
grid at all (its gaps are 2, 14, 16), so this measures conformance to *our house rule*, not quality.
The samples are tiny, 3 to 13 gaps per screen. And the within-Solen ordering is three data points,
as consistent with chance as with signal. Worth re-running across 15 screens before anything is built
on it.

---

## 4. VERDICT

**Near-miss alignment: no. It does not work.** This lens was told to test it hardest because it was
the strongest candidate for "isn't aligned". It failed. The rejected screen scores better than our
approved PDP and better than the Fresha reference on every version built, including the two
refinements meant to rescue it. A gate on it would fire on the wrong screens. It should not be wired,
and the number must not be quoted as evidence of anything.

It has one legitimate use: as a **locator**, not a grade. Pointed at a screen already known to be
wrong, it names coordinates ("`.nm` sits at 20.00, the title above it sits at 16.00"), which beats
eyeballing. That is a debugging aid, not a quality bar.

**Frame overflow: yes, on this sample.** The rejected screen shows a 32px overflow. All four
comparison screens show 0. It is not a taste judgment, it is arithmetic on a container, it has an
obvious fix, and it accounts for the visible mechanism behind three of his four complaints.

**The honest limits of that "yes":**

- **n=1 on the label that matters.** One screen carries an explicit owner rejection. A measure that
  separates one rejected screen from five accepted ones is a promising hypothesis, not a validated
  instrument. Re-run it the next few times he rejects something, and abandon it if it stays silent.
- **It would have caught this artifact, not these designs.** The 32px overflow is a defect of the
  comparison shell that delivered the three headers, not of the headers themselves. Standalone at
  390px none of them would overflow. So the gate would have stopped a broken *delivery*, which is
  real value and is exactly what happened here, but it says nothing about whether the headers are any
  good.
- **It is a bug detector, not a taste measure.** It answers "is something sliced", a correctness
  question. It does not answer "is this balanced". His broader claim, that balance is measurable, is
  not settled by this lens. What this lens does show is narrower and still useful: a meaningful part
  of what read as "not aligned" was not subtle at all, it was content that did not fit its box, and
  nothing in the pipeline was checking.
- **The other two complaints are outside this lens.** "So much clutter" has a plausible measure (7
  search-looking elements on one screen is countable) and belongs to another lens. "I don't know what
  the fuck this logo is" does not have one that this lens found, and no sophisticated-sounding number
  is being invented for it.

---

## 5. Proposed threshold

For the frame-overflow measure only.

**Gate: on any customer screen or mockup rendered at 390x844, no `overflow: hidden|clip` container
may have `scrollWidth - clientWidth` greater than 10px. Fail on any hit. Report the element, its
frame width, its content width, and the overflow.**

How the threshold was chosen, and why it is a count and not a percentage:

- **Why a count.** Every reference and both shipped Solen screens sit at 0px overflow. The rejected
  screen sits at 32px. There is no middle of the distribution to calibrate a percentage against, and
  a percentage of frames would let a screen with many frames hide one broken one. A container that
  cannot fit its own content is a bug at any rate.
- **Why 10px and not 2px.** 2px is the pure sub-pixel and border-rounding tolerance, and on a clean
  sample it would work. But `/de` shows a real false positive at 9px: a closed search modal built
  with `overflow:hidden` reports overflow while invisible. Any bar between 10px and 30px separates
  the rejected screen from everything measured, so 10px is the safer first setting and still catches
  the 32px case with 3x margin. The alternative fix, excluding containers whose visible area is zero,
  is more precise and can replace the magnitude bar later.
- **Why the carousel exclusion is load-bearing.** Without it the gate contradicts our own density
  floor, which requires a visibly cropped next item. Scrollable strips are excluded by construction
  (`overflowX: auto|scroll`), so the scroll promise never trips it.
- **Where it belongs.** It needs a render, so it sits with the design-verifier render pass alongside
  NEVER-AGAIN floors 2, 3, 3b and 4, not as a PreToolUse hook. It costs one `querySelectorAll` and
  uses no heuristics.

Suggested wording if it is added to the floors: *a container that hides its overflow must be at least
as wide as its content. A sliced control is not a style choice, and no screen carrying one is
shippable.*
