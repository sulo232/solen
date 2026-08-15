/* ROW A: the recently-viewed row rendered as THE PAGE'S OWN CARD.

   Owner, 2026-08-15, round ten, selecting the Top Coiffeur card and my row together: "I told you to
   make it like this." He was pointing at the page's card every time and I kept drawing a smaller
   one next to it.

   MEASURED on the live Top Coiffeur rail this turn with getBoundingClientRect, and every number
   below is copied from it, not from Airbnb and not chosen:
     card            242 x 258
     photo           242 x 194, ratio 1.25, radius 22, flush at the top of the card
     heart           44 x 44 tap at top 2 / right 2, with a 28px circle inside it
     text block      starts at top 202, margin-top 8
     name            14px / 600 ink, left 2, width 196 (the rating sits in the remaining 46)
     rating          12px / 400 ink-2, right aligned, star plus value
     category        12px / 400 ink-2, top 224
     city and price  12px / 400 ink-2, top 242, city left and price right
     rail gap        12

   WHY THIS IS THE FIX AND NOT ANOTHER DIRECTION: FLOORS LAW 9 says a screen is composed from the
   components we already own, and hand-drawn UI is a defect however good it looks. I hand-drew a
   112 x 90 thumb for nine rounds. Its photo was 1/7.7 the AREA of the card sitting directly below
   it on the same screen, which is why the row never read as part of this page.

   TYPE: three sizes 18 (the section h2, drawn by MK.sectionHead) / 14 / 12, two weights 600 / 400.
   DECIDES: nothing new. This row stops being its own invention and becomes the same card as every
     other rail, which is what he asked for and what the live RecentlyViewed.tsx already does.
   NOT PORTED: Airbnb's 106pt near-square thumb, which is the whole reason the row was too small.
*/
(function () {
  "use strict";

  var INK = "#0A0A0A";
  var INK2 = "#6B6B6B";
  var BODY = "Inter,'Inter Tight',sans-serif";

  var CARD_W = 242;
  var PHOTO_H = 194;   /* 242/194 = 1.247, the page's own card ratio */

  function card(doc, MK, salon) {
    var wrap = MK.el(doc, "div",
      "flex:0 0 " + CARD_W + "px;width:" + CARD_W + "px;position:relative");

    var a = doc.createElement("a");
    a.href = "#";
    a.style.cssText = "display:block;width:100%;text-decoration:none;color:" + INK;

    var box = MK.el(doc, "div",
      "position:relative;width:" + CARD_W + "px;height:" + PHOTO_H + "px");
    box.appendChild(MK.photo(doc, salon.photo, "width:100%;height:100%;border-radius:22px"));
    a.appendChild(box);

    var meta = MK.el(doc, "div", "margin-top:8px");

    /* name and rating share one line: name flexible, rating pinned right */
    var line1 = MK.el(doc, "div", "display:flex;align-items:baseline;gap:8px");
    var name = MK.el(doc, "div",
      "font:600 14px/1.3 " + BODY + ";color:" + INK +
      ";flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap");
    name.textContent = salon.name;
    var rate = MK.el(doc, "div",
      "flex:0 0 auto;display:flex;align-items:center;gap:3px;font:400 12px/1.35 " + BODY +
      ";color:" + INK2 + ";font-variant-numeric:tabular-nums;white-space:nowrap");
    rate.appendChild(MK.el(doc, "span", "color:#FFC32B;display:flex;align-items:center",
      MK.svg("star", 12, 1.5, "currentColor")));
    var rv = doc.createElement("span");
    rv.textContent = salon.r;
    rate.appendChild(rv);
    line1.appendChild(name);
    line1.appendChild(rate);

    var cat = MK.el(doc, "div",
      "font:400 12px/1.35 " + BODY + ";color:" + INK2 +
      ";margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap");
    cat.textContent = salon.cat;

    /* city left, price right, exactly as the live card lays them out */
    var line3 = MK.el(doc, "div",
      "display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-top:2px;" +
      "font:400 12px/1.35 " + BODY + ";color:" + INK2 + ";font-variant-numeric:tabular-nums");
    var city = doc.createElement("span");
    city.textContent = salon.city;
    var price = doc.createElement("span");
    price.textContent = salon.price + " CHF";
    line3.appendChild(city);
    line3.appendChild(price);

    meta.appendChild(line1);
    meta.appendChild(cat);
    meta.appendChild(line3);
    a.appendChild(meta);

    wrap.appendChild(a);
    wrap.appendChild(MK.heart(doc));
    return wrap;
  }

  window.DIRECTIONS.rowA = {
    label: "A",
    caption: "Recently viewed uses the page's own card, the same one every other rail uses.",
    apply: function (doc, MK) {
      var viewed = MK.el(doc, "section", "padding:0 0 8px");
      viewed.appendChild(MK.sectionHead(doc, "Recently viewed", true));
      var r = MK.rail(doc);
      for (var i = 0; i < MK.SALONS.length; i++) {
        r.appendChild(card(doc, MK, MK.SALONS[i]));
      }
      viewed.appendChild(r);
      return { continueEl: MK.continueRail(doc), viewedEl: viewed };
    }
  };
})();
