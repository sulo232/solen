/* ROW B, big rail. AIRBNB, Explore home, but borrowing the anatomy of the "Based on your Kranj
   search" row that sits LOWER on the very same screenshot, applied to the recently-viewed row.
   Source: the owner's own screenshots, ~/.claude/state/owner-images/68d78dad-21dd-46/{1,2}.img.

   ANATOMY. Airbnb uses two card sizes on one screen: small thumbs for what you already know
   (recently viewed) and big cards for what it wants you to click (the suggestion row). This
   direction gives the viewed row the BIG treatment: a 240 wide photo at our 5:4, a heart on the
   photo, then the name with the rating on the same line and the category under it. About 1.6 cards
   fit across 402, so the next one is always visibly cut.

   Photo is 240 x 192, which is 1.25:1, our house ratio. Nothing here is square.

   TYPE: four sizes 22 / 15 / 13 / 12, two weights 600 / 400.
   DECIDES: the things you already looked at are the strongest thing on the screen, not a footnote.
   NOT PORTED: the "Guest favorite" badge on the reference's big cards, because it is a claim we
   have no data for, and a fabricated badge is the one thing this project never ships.
*/
(function () {
  "use strict";

  var INK = "#0A0A0A";
  var INK2 = "#6B6B6B";
  var BODY = "Inter,'Inter Tight',sans-serif";

  var CARD_W = 240;
  var CARD_H = 192;          /* 240/192 = 1.25 exactly */

  function bigCard(doc, MK, salon) {
    var wrap = MK.el(doc, "div",
      "flex:0 0 " + CARD_W + "px;width:" + CARD_W + "px;position:relative");

    var a = doc.createElement("a");
    a.href = "#";
    a.style.cssText = "display:block;width:100%;text-decoration:none;color:" + INK;

    var box = MK.el(doc, "div",
      "position:relative;width:" + CARD_W + "px;height:" + CARD_H + "px;margin-bottom:10px");
    box.appendChild(MK.photo(doc, salon.photo, "width:100%;height:100%;border-radius:16px"));

    /* Name and rating share one line: the name takes the room it needs and the rating is pinned
       right, which is how the reference's big cards read. */
    var line = MK.el(doc, "div", "display:flex;align-items:baseline;gap:8px");
    var name = MK.el(doc, "div",
      "font:600 15px/1.3 " + BODY + ";color:" + INK +
      ";flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap");
    name.textContent = salon.name;
    var rate = MK.rating(doc, salon);
    rate.style.marginTop = "0";
    rate.style.flex = "0 0 auto";
    line.appendChild(name);
    line.appendChild(rate);

    var cat = MK.el(doc, "div",
      "font:400 13px/1.35 " + BODY + ";color:" + INK2 +
      ";margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap");
    cat.textContent = salon.cat;

    a.appendChild(box);
    a.appendChild(line);
    a.appendChild(cat);

    wrap.appendChild(a);
    wrap.appendChild(MK.heart(doc));
    return wrap;
  }

  window.DIRECTIONS.rowB = {
    label: "B big rail",
    caption: "B. The big-card treatment Airbnb saves for suggestions, given to what you viewed.",
    apply: function (doc, MK) {
      var viewed = MK.el(doc, "section", "padding:0 0 8px");
      viewed.appendChild(MK.sectionHead(doc, "Recently viewed", true));
      var r = MK.rail(doc);
      for (var i = 0; i < MK.SALONS.length; i++) {
        r.appendChild(bigCard(doc, MK, MK.SALONS[i]));
      }
      viewed.appendChild(r);
      return { continueEl: MK.continueRail(doc), viewedEl: viewed };
    }
  };
})();
