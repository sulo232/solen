/* ROW A, small rail. AIRBNB, Explore home, the "Recently viewed" row itself.
   Source: the owner's own screenshots, ~/.claude/state/owner-images/68d78dad-21dd-46/{1,2}.img,
   measured with PIL. Corroborated by _design-system/references/airbnb--home-mobile.md.

   ANATOMY. A THUMB is photo, then name, then category, then a rating line, stacked on white.
   Photos sit in a horizontal rail with the next one visibly cropped, which is the scroll promise.
   The heart badge sits on the photo, top right, as a sibling of the link rather than inside it.

   THE ONE DELIBERATE DEVIATION FROM THE REFERENCE, and it is the owner's instruction, not taste:
   Airbnb's thumb measures 106.1 x 100.7pt, which is 1.05:1, near enough to square that it reads as
   square. He has rejected square repeatedly and by name. So the photo is OUR 1.25:1 (112 x 90) and
   nothing else about the anatomy moves. That is the ONLY change from the measured reference.

   TYPE: four sizes 22 / 15 / 13 / 12, two weights 600 / 400.
   DECIDES: keep Airbnb's density. Three and a bit visible, so the row reads as a list you scroll.
*/
(function () {
  "use strict";

  var INK = "#0A0A0A";
  var INK2 = "#6B6B6B";
  var BODY = "Inter,'Inter Tight',sans-serif";

  var THUMB_W = 112;
  var THUMB_H = 90;          /* 112/90 = 1.244, our house ratio. NOT the reference's 1.05 square. */

  function thumb(doc, MK, salon) {
    var wrap = MK.el(doc, "div",
      "flex:0 0 " + THUMB_W + "px;width:" + THUMB_W + "px;position:relative");

    var a = doc.createElement("a");
    a.href = "#";
    a.style.cssText = "display:block;width:100%;text-decoration:none;color:" + INK;

    var box = MK.el(doc, "div",
      "position:relative;width:" + THUMB_W + "px;height:" + THUMB_H + "px;margin-bottom:8px");
    box.appendChild(MK.photo(doc, salon.photo, "width:100%;height:100%;border-radius:22px"));

    var name = MK.el(doc, "div",
      "font:600 13px/1.3 " + BODY + ";color:" + INK +
      ";overflow:hidden;text-overflow:ellipsis;white-space:nowrap");
    name.textContent = salon.name;

    var cat = MK.el(doc, "div",
      "font:400 12px/1.35 " + BODY + ";color:" + INK2 +
      ";margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap");
    cat.textContent = salon.cat;

    a.appendChild(box);
    a.appendChild(name);
    a.appendChild(cat);
    a.appendChild(MK.rating(doc, salon));

    wrap.appendChild(a);
    wrap.appendChild(MK.heart(doc));
    return wrap;
  }

  window.DIRECTIONS.rowA = {
    label: "A small rail",
    caption: "A. Airbnb's own density, at our 5:4 instead of their near square. Three and a bit fit.",
    apply: function (doc, MK) {
      var viewed = MK.el(doc, "section", "padding:0 0 8px");
      viewed.appendChild(MK.sectionHead(doc, "Recently viewed", true));
      var r = MK.rail(doc);
      for (var i = 0; i < MK.SALONS.length; i++) {
        r.appendChild(thumb(doc, MK, MK.SALONS[i]));
      }
      viewed.appendChild(r);
      return { continueEl: MK.continueRail(doc), viewedEl: viewed };
    }
  };
})();
