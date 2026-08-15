/* ROW C, wide list. AIRBNB, the saved-list anatomy: photo LEFT, text RIGHT, one per row, stacked
   down the page with no horizontal scroll.
   Source: the owner's own screenshots, ~/.claude/state/owner-images/68d78dad-21dd-46/{1,2}.img,
   plus _design-system/references/continue-and-recently-viewed--home.md, where the same left-photo
   shape is what Marriott and Booking both use for a resume row.

   ANATOMY. A ROW is a 96 wide photo on the left at our 5:4, then a text column: name, category,
   and a line carrying the rating and the price. Rows stack vertically with a hairline between them.
   No rail, no cropping, no scroll promise, because there is nothing hidden to promise.

   Photo is 96 x 77, which is 1.247:1. Nothing here is square.

   TYPE: four sizes 22 / 15 / 13 / 12, two weights 600 / 400.
   DECIDES: the row stops competing with the feed. It reads as a short list you finish, not another
   carousel to swipe, which matters because the page already has five carousels under it.
   NOT PORTED: the heart badge. On a left-photo row there is no photo corner to put it in without
   covering the image, and a heart floating in the text column reads as a separate control. Rows B
   and A carry it; this direction trades it away deliberately rather than by omission.
*/
(function () {
  "use strict";

  var INK = "#0A0A0A";
  var INK2 = "#6B6B6B";
  var HAIRLINE = "#E4E4E7";
  var BODY = "Inter,'Inter Tight',sans-serif";

  var PH_W = 96;
  var PH_H = 77;             /* 96/77 = 1.247, our house ratio */

  function listRow(doc, MK, salon, isLast) {
    var a = doc.createElement("a");
    a.href = "#";
    a.style.cssText =
      "display:flex;align-items:center;gap:14px;padding:12px 0;min-height:44px;" +
      "text-decoration:none;color:" + INK +
      (isLast ? "" : ";border-bottom:1px solid " + HAIRLINE);

    a.appendChild(MK.photo(doc, salon.photo,
      "flex:0 0 " + PH_W + "px;width:" + PH_W + "px;height:" + PH_H + "px;border-radius:12px"));

    var col = MK.el(doc, "div", "min-width:0;flex:1");

    var name = MK.el(doc, "div",
      "font:600 15px/1.3 " + BODY + ";color:" + INK +
      ";overflow:hidden;text-overflow:ellipsis;white-space:nowrap");
    name.textContent = salon.name;

    var cat = MK.el(doc, "div",
      "font:400 13px/1.35 " + BODY + ";color:" + INK2 +
      ";margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap");
    cat.textContent = salon.cat;

    /* Rating and price share the last line. The price is real, off MK.SALONS, and it earns its
       place here because a wide row has the width for it where a 112px thumb does not. */
    var last = MK.el(doc, "div", "display:flex;align-items:center;gap:10px;margin-top:2px");
    var rate = MK.rating(doc, salon);
    rate.style.marginTop = "0";
    var price = MK.el(doc, "div",
      "font:600 13px/1.35 " + BODY + ";color:" + INK + ";font-variant-numeric:tabular-nums");
    price.textContent = "from CHF " + salon.price;
    last.appendChild(rate);
    last.appendChild(price);

    col.appendChild(name);
    col.appendChild(cat);
    col.appendChild(last);
    a.appendChild(col);

    a.appendChild(MK.el(doc, "span",
      "flex:0 0 auto;color:" + INK2 + ";display:flex;align-items:center",
      MK.svg("chevronRight", 18)));
    return a;
  }

  window.DIRECTIONS.rowC = {
    label: "C wide list",
    caption: "C. A short list you finish, not a sixth carousel to swipe. Photo left, price included.",
    apply: function (doc, MK) {
      var viewed = MK.el(doc, "section", "padding:0 0 8px");
      viewed.appendChild(MK.sectionHead(doc, "Recently viewed", true));
      var body = MK.el(doc, "div", "padding:0 " + MK.REF.gutter + "px");
      for (var i = 0; i < MK.SALONS.length; i++) {
        body.appendChild(listRow(doc, MK, MK.SALONS[i], i === MK.SALONS.length - 1));
      }
      viewed.appendChild(body);
      return { continueEl: MK.continueRail(doc), viewedEl: viewed };
    }
  };
})();
