/* AIRBNB, Explore home (iOS app), ported at the measured sizes, WITH THEIR PORTRAIT PHOTO.

   GENERATED FROM airbnb.js. Byte-identical to its twin except the two photo constants below, the
   registration key, the label and the caption. That is deliberate: the owner asked on 2026-08-15 to
   see both photo shapes, so the two must differ in the photo and in nothing else, or looking at
   them cannot answer the question he asked. Edit airbnb.js, then re-derive this file.

   Source: the owner's own two phone screenshots, ~/.claude/state/owner-images/68d78dad-21dd-46/{1,2}.img,
   920x2000, measured with PIL this session. No public URL: the capture is his screenshots, not a page.
   Corroborated by the live-DOM pass in _design-system/references/airbnb--home-mobile.md (2026-08-12),
   which independently returned the same thumb ratio, and by _design-system/references/continue-and-recently-viewed--home.md.

   ANATOMY
     A CARD is the resume: 306 x 105, radius 18, white, soft shadow, sitting on a sunken band.
     Inside the card, LEFT is text (a title, then one meta line) and RIGHT is ONE photo, 70 x 80,
       radius 14, inset 17 from the right edge and vertically centred.
     Cards live in a horizontal rail so a second card peeks, which is what makes the row scrollable.
     A THUMB is the recently-viewed unit: one photo 112 x 106 radius 16 carrying a heart badge,
       then name, category and a rating line beneath it on white.

   TYPE: four sizes 22 / 15 / 13 / 12, two weights 600 / 400. Nothing else.
   DECIDES: the resume is the loudest thing under the search bar and costs a full card, and every
     photo on the page keeps one shape.
   NOT PORTED: their 27pt see-all circle (below the 44px touch floor, so MK.seeAll draws 28px of
     circle inside a 44px target). The photo IS theirs here, and the cost is worth naming: 0.87:1 is
     the only photo shape on the page that is not 1.25:1, which is what the twin airbnb.js avoids.
*/
(function () {
  "use strict";

  /* THE ONLY THING THAT DIFFERS FROM THE TWIN. Airbnb measured, 0.87:1 PORTRAIT (70/80 = 0.875). */
  var PHOTO_W = 70;
  var PHOTO_H = 80;

  /* What the person searched for. Service names, not salon rows, so they carry no salon data.
     Every name, photo, rating, count and price still comes from MK.SALONS. */
  var SEARCHES = ["Skin fade", "Balayage"];

  var INK = "#0A0A0A";
  var INK2 = "#6B6B6B";
  var SUNKEN = "#F4F4F5";
  var DISPLAY = "'Inter Tight',Inter,sans-serif";
  var BODY = "Inter,'Inter Tight',sans-serif";

  function resumeCard(doc, MK, title, salon) {
    var R = MK.REF;
    var a = doc.createElement("a");
    a.href = "#";
    a.style.cssText =
      "flex:0 0 " + R.cardW + "px;width:" + R.cardW + "px;height:" + R.cardH + "px;" +
      "position:relative;display:block;background:#fff;border-radius:18px;text-decoration:none;" +
      "box-shadow:0 1px 2px rgba(10,10,10,.06),0 6px 16px rgba(10,10,10,.08)";

    var textW = R.cardW - 18 - 17 - PHOTO_W - 14;
    var col = MK.el(doc, "div",
      "position:absolute;left:18px;top:0;bottom:0;width:" + textW + "px;" +
      "display:flex;flex-direction:column;justify-content:center");

    var h = MK.el(doc, "div",
      "font:600 15px/1.3 " + DISPLAY + ";letter-spacing:-.01em;color:" + INK + ";" +
      "overflow:hidden;text-overflow:ellipsis;white-space:nowrap");
    h.textContent = title;

    var meta = MK.el(doc, "div",
      "font:400 13px/1.35 " + BODY + ";color:" + INK2 + ";margin-top:4px;" +
      "overflow:hidden;text-overflow:ellipsis;white-space:nowrap");
    meta.textContent = salon.cat;

    col.appendChild(h);
    col.appendChild(meta);

    var ph = MK.photo(doc, salon.photo,
      "position:absolute;right:17px;top:" + ((R.cardH - PHOTO_H) / 2) + "px;" +
      "width:" + PHOTO_W + "px;height:" + PHOTO_H + "px;border-radius:14px");

    a.appendChild(col);
    a.appendChild(ph);
    return a;
  }

  /* 26px of white circle inside a 44px target, so the badge reads small and still passes the
     touch floor. Same trick MK.seeAll uses for the arrow. */
  function heartBadge(doc, MK) {
    var b = doc.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", "Save");
    b.style.cssText =
      "position:absolute;top:-1px;right:-1px;width:" + MK.REF.arrowTap + "px;height:" + MK.REF.arrowTap + "px;" +
      "border:0;padding:0;background:transparent;display:grid;place-items:center;cursor:pointer;color:" + INK;
    var dot = MK.el(doc, "span",
      "width:26px;height:26px;border-radius:999px;background:#fff;color:" + INK + ";" +
      "display:grid;place-items:center;box-shadow:0 1px 3px rgba(10,10,10,.20)",
      MK.svg("heart", 14));
    b.appendChild(dot);
    return b;
  }

  function viewedThumb(doc, MK, salon) {
    var R = MK.REF;
    /* The heart is a SIBLING of the link, not a child of it. A button inside an anchor is invalid
       HTML: the parser hoists it out of the link, so the card silently loses part of its tap area
       and the heart ends up outside the thing it belongs to. Our real SalonCard already overlays
       HeartButton this way, so this also keeps the two implementations the same shape. */
    var wrap = MK.el(doc, "div",
      "flex:0 0 " + R.thumbW + "px;width:" + R.thumbW + "px;position:relative");

    var a = doc.createElement("a");
    a.href = "#";
    a.style.cssText = "display:block;width:100%;text-decoration:none;color:" + INK;

    var box = MK.el(doc, "div",
      "position:relative;width:" + R.thumbW + "px;height:" + R.thumbH + "px;margin-bottom:8px");
    box.appendChild(MK.photo(doc, salon.photo, "width:100%;height:100%;border-radius:16px"));

    var name = MK.el(doc, "div",
      "font:600 13px/1.3 " + BODY + ";color:" + INK + ";" +
      "overflow:hidden;text-overflow:ellipsis;white-space:nowrap");
    name.textContent = salon.name;

    var cat = MK.el(doc, "div",
      "font:400 12px/1.35 " + BODY + ";color:" + INK2 + ";margin-top:2px;" +
      "overflow:hidden;text-overflow:ellipsis;white-space:nowrap");
    cat.textContent = salon.cat;

    var rating = MK.rating(doc, salon);

    a.appendChild(box);
    a.appendChild(name);
    a.appendChild(cat);
    a.appendChild(rating);

    wrap.appendChild(a);
    wrap.appendChild(heartBadge(doc, MK));
    return wrap;
  }

  window.DIRECTIONS.airbnbTall = {
    label: "Airbnb tall",
    caption: "Same card, but the photo is Airbnb's measured portrait 0.87:1 instead of our 5:4.",
    apply: function (doc, MK) {
      /* CONTINUE. The sunken band is a port, not a liberty: the reference page is grey around the
         card rows, and a white card on white would fail our edge-visibility floor anyway. */
      var band = MK.el(doc, "section",
        "background:" + SUNKEN + ";padding:16px 0 18px;margin:8px 0 24px");
      var cards = MK.rail(doc);
      cards.style.paddingBottom = "12px";
      for (var i = 0; i < SEARCHES.length; i++) {
        cards.appendChild(resumeCard(doc, MK, SEARCHES[i], MK.SALONS[i]));
      }
      band.appendChild(cards);

      /* RECENTLY VIEWED. Header arrow comes from MK.seeAll, never a text control. */
      var viewed = MK.el(doc, "section", "padding:0 0 8px");
      viewed.appendChild(MK.sectionHead(doc, "Recently viewed", true));
      var thumbs = MK.rail(doc);
      for (var j = 0; j < MK.SALONS.length; j++) {
        thumbs.appendChild(viewedThumb(doc, MK, MK.SALONS[j]));
      }
      viewed.appendChild(thumbs);

      return { continueEl: band, viewedEl: viewed };
    }
  };
})();
