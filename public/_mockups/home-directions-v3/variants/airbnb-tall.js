/* ============================================================================
   AIRBNB, Explore home. Ported at the MEASURED sizes, with Airbnb's PORTRAIT photo.
   Source: the owner's own two phone screenshots of the Airbnb iOS Explore home,
   ~/.claude/state/owner-images/68d78dad-21dd-46/{1,2}.img, measured with PIL this
   session and written up in _design-system/references/continue-and-recently-viewed--home.md.
   The 1.05 thumb ratio is corroborated by the live-DOM pass in
   _design-system/references/airbnb--home-mobile.md (https://www.airbnb.ch/, mobile).

   ANATOMY
     A CARD is the resume: 306 x 105, radius 18, white, soft shadow, in a rail that
       lets the next card peek. Text on the LEFT (title, then one meta line), photo
       pinned to the RIGHT at 70 x 80, radius 14, insets top 19 / right 17.
     A LINE does not exist here: everything is a card or a thumb, nothing is a bare row.
     THE PHOTO CARRIES the resume on the card and the whole tile in the viewed row,
       where a thumb is 112 x 106, radius 16, with name, category and rating beneath it
       and a heart badge sitting on the photo.

   TYPE: four sizes, 22 (section title, drawn by MK.sectionHead) / 15 (card title) /
     13 (card meta, thumb name) / 12 (thumb category, thumb rating). Two weights, 600 and 400.

   DECIDES: match the reference exactly, including a photo shape that appears nowhere
     else on our page.

   NOT PORTED: Airbnb's 27pt see-all circle, which is under the 44px touch floor, so
     MK.seeAll draws 28px of circle inside a 44px target. The cost of the portrait photo,
     named: it is the only photo on the page that is not 1.25:1.
   ========================================================================== */

window.DIRECTIONS.airbnbTall = {
  label: "Airbnb tall",
  caption: "Airbnb at its measured sizes, with Airbnb's portrait 0.87:1 card photo.",

  apply: function (doc, MK) {
    /* What the person searched for. Service and look names, not salon data, so
       nothing here pretends to be a row from the database. */
    var SEARCHES = ["Skin fade", "Balayage", "Gel manicure"];
    /* Which seeded salon each search resolves to, so the meta line and the photo
       come from MK.SALONS and never from an invented value. */
    var SEARCH_SALON = [0, 1, 4];

    var INK = "#0A0A0A", INK2 = "#6B6B6B", STAR = "#FFC32B";
    var DISPLAY = "'Inter Tight',Inter,sans-serif";
    var BODY = "Inter,'Inter Tight',sans-serif";
    var SOFT = "0 1px 3px rgba(10,10,10,.10),0 6px 16px rgba(10,10,10,.06)";

    /* ---- the resume rail -------------------------------------------------- */
    var continueEl = MK.el(doc, "div", "margin:8px 0 28px");
    var cRail = MK.rail(doc);
    cRail.style.paddingBottom = "10px";

    for (var i = 0; i < SEARCHES.length; i++) {
      var s = MK.SALONS[SEARCH_SALON[i]];

      var card = MK.el(doc, "a",
        "flex:0 0 " + MK.REF.cardW + "px;width:" + MK.REF.cardW + "px;height:" + MK.REF.cardH + "px;" +
        "position:relative;display:block;background:#fff;border-radius:18px;box-shadow:" + SOFT + ";" +
        "text-decoration:none;color:" + INK);
      card.href = "#";

      var col = MK.el(doc, "span",
        "position:absolute;left:16px;top:0;bottom:0;width:191px;display:flex;" +
        "flex-direction:column;justify-content:center");

      var title = MK.el(doc, "span",
        "font:600 15px/1.3 " + DISPLAY + ";letter-spacing:-.01em;color:" + INK + ";display:block;" +
        "white-space:nowrap;overflow:hidden;text-overflow:ellipsis");
      title.textContent = SEARCHES[i];

      var meta = MK.el(doc, "span",
        "font:400 13px/1.4 " + BODY + ";color:" + INK2 + ";display:block;margin-top:4px;" +
        "white-space:nowrap;overflow:hidden;text-overflow:ellipsis");
      meta.textContent = s.cat;

      col.appendChild(title);
      col.appendChild(meta);
      card.appendChild(col);

      /* 70 x 80 is MK.REF, ratio 0.875, the portrait shape this direction exists to test.
         Insets are the measured 19 top and 17 right; the measured 10pt bottom inset belongs
         to the reference's 76pt photo, so here it lands at 6. */
      card.appendChild(MK.photo(doc, s.photo,
        "position:absolute;top:19px;right:17px;width:" + MK.REF.photoW + "px;height:" +
        MK.REF.photoH + "px;border-radius:14px"));

      cRail.appendChild(card);
    }
    continueEl.appendChild(cRail);

    /* ---- recently viewed --------------------------------------------------- */
    var viewedEl = MK.el(doc, "div", "margin:0 0 8px");
    viewedEl.appendChild(MK.sectionHead(doc, "Recently viewed", true));

    var vRail = MK.rail(doc);
    vRail.style.paddingBottom = "8px";

    for (var j = 0; j < MK.SALONS.length; j++) {
      var v = MK.SALONS[j];

      var item = MK.el(doc, "div",
        "flex:0 0 " + MK.REF.thumbW + "px;width:" + MK.REF.thumbW + "px;position:relative");

      var link = MK.el(doc, "a", "display:block;text-decoration:none;color:" + INK);
      link.href = "#";

      link.appendChild(MK.photo(doc, v.photo,
        "width:" + MK.REF.thumbW + "px;height:" + MK.REF.thumbH + "px;border-radius:16px"));

      var name = MK.el(doc, "span",
        "font:600 13px/1.35 " + DISPLAY + ";letter-spacing:-.01em;color:" + INK + ";display:block;" +
        "margin-top:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis");
      name.textContent = v.name;

      var cat = MK.el(doc, "span",
        "font:400 12px/1.35 " + BODY + ";color:" + INK2 + ";display:block;margin-top:2px;" +
        "white-space:nowrap;overflow:hidden;text-overflow:ellipsis");
      cat.textContent = v.cat;

      var rate = MK.el(doc, "span",
        "font:400 12px/1.35 " + BODY + ";color:" + INK + ";display:block;margin-top:2px;" +
        "font-variant-numeric:tabular-nums;white-space:nowrap",
        '<span style="color:' + STAR + '">★</span> ' + v.r +
        ' <span style="color:' + INK2 + '">(' + v.c + ')</span>');

      link.appendChild(name);
      link.appendChild(cat);
      link.appendChild(rate);
      item.appendChild(link);

      /* 26px of white circle on the photo, inside a 44px target. */
      var heart = MK.el(doc, "button",
        "position:absolute;top:-3px;right:-3px;width:" + MK.REF.arrowTap + "px;height:" +
        MK.REF.arrowTap + "px;border:0;padding:0;background:transparent;display:grid;" +
        "place-items:center;cursor:pointer;z-index:2;color:" + INK);
      heart.type = "button";
      heart.setAttribute("aria-label", "Save");
      heart.appendChild(MK.el(doc, "span",
        "width:26px;height:26px;border-radius:999px;background:#fff;display:grid;" +
        "place-items:center;box-shadow:0 1px 3px rgba(10,10,10,.18)",
        MK.svg("heart", 14)));
      item.appendChild(heart);

      vRail.appendChild(item);
    }
    viewedEl.appendChild(vRail);

    return { continueEl: continueEl, viewedEl: viewedEl };
  }
};
