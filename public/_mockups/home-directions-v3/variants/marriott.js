/* Marriott Bonvoy, Book tab home.
   Source: https://mobbin.com/screens/87550d69-834b-45ea-8c84-5b172b304433

   ANATOMY
     resume : NOT a card. a small label, then ONE LINE sitting on the bare page. salon name in
              ink, one quiet meta line under it, a chevron pinned to the right gutter. no border,
              no shadow, no background fill, no photo.
     viewed : a second small label (with the arrow) over a rail of WIDE cards.
     card   : 260 x 96, radius 16, 1px #E4E4E7, no shadow. the photo is a block flush to the
              card's LEFT edge and carries the card's whole height; name + meta on white beside it.

   TYPE: sizes 17 / 15 / 13. three of the four allowed, the fourth left unspent because nothing
   here earns it. weights 600 / 400. every step is a real step, no two sizes sit within 1px.

   DECIDES: resuming is a LINK, not a poster. this is the only direction whose resume block holds
   no photograph at all, so the row underneath owns every image on the screen.

   COST, both numbers read off the CSS in this file, not estimated:
     Airbnb direction, continue block = 105 card + 4 rail padding      = 109px
     this direction,   continue block = 23 label + 44 line             =  67px  (61% of it)
   The brief asked for roughly a third. It is not reachable: the line's 44px tap floor
   (WCAG 2.5.5, and the locked h-11 icon-button) is 66% of my 67px on its own.

   NOT PORTED: the reference's tracked eyebrow, which sets both section labels in capital letters
   with wide letter-spacing. That treatment is on this repo's mockup banned list, so both labels
   ship in sentence case at 13px/600 in #6B6B6B instead.
*/
window.DIRECTIONS.marriott = {
  label: "Marriott",
  caption: "Resuming is a link, not a poster: a label, one line, a chevron. No card, no photo.",

  apply: function (doc, MK) {
    var S = MK.SALONS;
    var G = MK.REF.gutter;                 // 24, the measured row gutter

    var LABEL = "font:600 13px/1.3 'Inter Tight',Inter,sans-serif;color:#6B6B6B;display:block";
    var NAME  = "font:600 17px/1.3 'Inter Tight',Inter,sans-serif;letter-spacing:-.01em;color:#0A0A0A;" +
                "display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
    var CARD  = "font:600 15px/1.3 'Inter Tight',Inter,sans-serif;letter-spacing:-.01em;color:#0A0A0A;" +
                "display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
    var META  = "font:400 13px/1.3 Inter,'Inter Tight',sans-serif;color:#6B6B6B;font-variant-numeric:tabular-nums;" +
                "display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";

    function metaOf(s) { return s.cat + ", from CHF " + s.price; }

    /* ---------- 1. the resume. a label and one line. no card. ---------- */
    var top = S[0];

    var cont = MK.el(doc, "section", "padding:8px 0 0");

    var lab1 = MK.el(doc, "div", LABEL + ";padding:0 " + G + "px;margin-bottom:6px");
    lab1.textContent = "Continue your booking";
    cont.appendChild(lab1);

    // the whole line is the tap target, so the chevron stays a passive glyph inside it
    var line = doc.createElement("a");
    line.href = "#";
    line.setAttribute("aria-label", "Continue with " + top.name);
    line.style.cssText = "display:flex;align-items:center;gap:12px;min-height:44px;" +
      "padding:0 " + G + "px;text-decoration:none;color:#0A0A0A";

    var lineTxt = MK.el(doc, "span", "flex:1 1 auto;min-width:0;display:block");
    var lineName = MK.el(doc, "span", NAME);
    lineName.textContent = top.name;
    var lineMeta = MK.el(doc, "span", META + ";margin-top:2px");
    lineMeta.textContent = metaOf(top);
    lineTxt.appendChild(lineName);
    lineTxt.appendChild(lineMeta);

    // -13px pulls the 18px glyph's right edge onto the same 24px gutter MK.seeAll's circle lands on
    var chev = MK.el(doc, "span",
      "flex:0 0 44px;width:44px;height:44px;margin-right:-13px;display:grid;place-items:center;color:#6B6B6B",
      MK.svg("chevronRight", 18));

    line.appendChild(lineTxt);
    line.appendChild(chev);
    cont.appendChild(line);

    /* ---------- 2. recently viewed. a label with the arrow, then wide cards. ---------- */
    var viewed = MK.el(doc, "section", "padding:24px 0 0");

    var head = MK.el(doc, "div",
      "display:flex;align-items:center;justify-content:space-between;padding:0 " + G + "px 4px");
    var lab2 = MK.el(doc, "div", LABEL);
    lab2.textContent = "Recently viewed";
    head.appendChild(lab2);
    head.appendChild(MK.seeAll(doc, "See all recently viewed"));
    viewed.appendChild(head);

    var rail = MK.rail(doc);
    for (var i = 0; i < S.length; i++) {
      var s = S[i];

      var card = doc.createElement("a");
      card.href = "#";
      card.style.cssText = "flex:0 0 260px;width:260px;height:96px;box-sizing:border-box;display:flex;" +
        "align-items:stretch;border:1px solid #E4E4E7;border-radius:16px;overflow:hidden;" +
        "background:#fff;text-decoration:none;color:#0A0A0A";

      // 94 = the 96 card minus its 1px border top and bottom, so the photo is flush on three edges
      card.appendChild(MK.photo(doc, s.photo, "flex:0 0 84px;width:84px;height:94px"));

      var body = MK.el(doc, "span",
        "flex:1 1 auto;min-width:0;display:flex;flex-direction:column;justify-content:center;" +
        "gap:2px;padding:0 12px");
      var cn = MK.el(doc, "span", CARD);
      cn.textContent = s.name;
      var cm = MK.el(doc, "span", META);
      cm.textContent = metaOf(s);
      body.appendChild(cn);
      body.appendChild(cm);

      card.appendChild(body);
      rail.appendChild(card);
    }
    viewed.appendChild(rail);

    return { continueEl: cont, viewedEl: viewed };
  }
};
