/* ============================================================================
   BEST BUY, home. Ported from
   https://mobbin.com/screens/ec2090d6-c6e5-4d53-8038-bc4198bcfe7b
   (captured 2026-08-15, read in _design-system/references/continue-and-recently-viewed--home.md)

   ANATOMY
     A title plus one quiet subtitle name the shelf. Two pills under them switch what the ONE rail
     below holds: viewed or saved. A card is a 112x106 photo tile carrying a name, a category and a
     rating; the photo is the only image. The rail ENDS with a terminal tile, same width, sunken,
     no photo, a clock over a short label, and that tile IS the see-all, so MK.seeAll is
     deliberately not called: this reference has no header arrow at all.
     The rating renders as value and count, because MK owns no star icon and a hand-drawn one is refused.

   TYPE: 4 sizes, 22 / 15 / 14 / 12. 2 weights, 600 / 400.

   DECIDES: saved and viewed are one shelf with a switch, not two sections saying almost the same
   thing. The only direction that removes a whole section from the page, so it returns everything
   in continueEl and null for viewedEl.

   NOT PORTED: the reference's black filled pill. A black or ink filled selected state is refused by
   our locked calm-gray selected rule, so selected is #F4F4F5 + ink + 600 against a white outlined
   unselected.
   ========================================================================== */

window.DIRECTIONS.bestbuy = {
  label: "Best Buy",
  caption: "Saved and viewed become one shelf with a working switch. The last card opens the list.",

  apply: function (doc, MK) {
    var INK = "#0A0A0A", INK2 = "#6B6B6B", SUNKEN = "#F4F4F5", LINE = "#E4E4E7";
    var BODY = "Inter,'Inter Tight',system-ui,sans-serif";
    var W = MK.REF.thumbW, H = MK.REF.thumbH, G = MK.REF.gutter;

    // Both rows are real seeded salons out of MK.SALONS. Nothing here is invented.
    var SETS = {
      viewed: [MK.SALONS[0], MK.SALONS[1], MK.SALONS[2], MK.SALONS[3]],
      saved:  [MK.SALONS[1], MK.SALONS[3], MK.SALONS[4]]
    };
    var PILL_LABEL = { viewed: "Viewed", saved: "Saved" };
    var END_LABEL  = { viewed: "All viewed", saved: "All saved" };

    var current = "viewed";

    /* ---- the pill, calm gray when selected, never filled ink ---- */
    function pillCss(on) {
      return "flex:0 0 auto;height:44px;min-height:44px;padding:0 18px;border-radius:999px;" +
             "cursor:pointer;-webkit-appearance:none;" +
             "font:" + (on ? "600" : "400") + " 15px/1.2 " + BODY + ";" +
             "color:" + (on ? INK : INK2) + ";" +
             "background:" + (on ? SUNKEN : "#fff") + ";" +
             "border:1px solid " + (on ? SUNKEN : LINE);
    }

    /* ---- one rail card ---- */
    function card(s) {
      var a = doc.createElement("a");
      a.href = "#";
      a.style.cssText = "flex:0 0 " + W + "px;width:" + W + "px;display:block;min-width:0;" +
                        "text-decoration:none;color:" + INK;
      a.appendChild(MK.photo(doc, s.photo, "width:" + W + "px;height:" + H + "px;border-radius:16px"));

      var name = MK.el(doc, "span",
        "display:block;margin-top:8px;font:600 14px/1.3 " + BODY + ";color:" + INK +
        ";white-space:nowrap;overflow:hidden;text-overflow:ellipsis");
      name.textContent = s.name;

      var cat = MK.el(doc, "span",
        "display:block;margin-top:2px;font:400 12px/1.35 " + BODY + ";color:" + INK2 +
        ";white-space:nowrap;overflow:hidden;text-overflow:ellipsis");
      cat.textContent = s.cat;

      var rate = MK.el(doc, "span",
        "display:block;margin-top:2px;font:400 12px/1.35 " + BODY + ";color:" + INK2 +
        ";font-variant-numeric:tabular-nums;white-space:nowrap");
      rate.textContent = s.r + " (" + s.c + ")";

      a.appendChild(name);
      a.appendChild(cat);
      a.appendChild(rate);
      return a;
    }

    /* ---- the terminal tile: this is the see-all, not a header control ---- */
    function terminal(key) {
      var a = doc.createElement("a");
      a.href = "#";
      a.setAttribute("aria-label", END_LABEL[key]);
      a.style.cssText = "flex:0 0 " + W + "px;width:" + W + "px;align-self:stretch;min-height:" + H + "px;" +
                        "padding:12px;border-radius:16px;background:" + SUNKEN + ";" +
                        "display:grid;place-items:center;align-content:center;gap:8px;" +
                        "text-decoration:none;color:" + INK;
      a.appendChild(MK.el(doc, "span", "display:grid;place-items:center;color:" + INK, MK.svg("clock", 20)));
      var lb = MK.el(doc, "span", "font:600 15px/1.2 " + BODY + ";color:" + INK + ";text-align:center");
      lb.textContent = END_LABEL[key];
      a.appendChild(lb);
      return a;
    }

    /* ---- head ---- */
    var wrap = MK.el(doc, "section", "padding:20px 0 14px;background:#fff");

    var head = MK.sectionHead(doc, "Pick up where you left off", false);
    head.style.paddingBottom = "4px";
    wrap.appendChild(head);

    var sub = MK.el(doc, "p",
      "margin:0 0 14px;padding:0 " + G + "px;font:400 12px/1.4 " + BODY + ";color:" + INK2);
    sub.textContent = "Salons you viewed or saved";
    wrap.appendChild(sub);

    /* ---- the switch, and it really switches ---- */
    var toggle = MK.el(doc, "div", "display:flex;gap:8px;padding:0 " + G + "px 14px");
    var pills = {};
    var rail = MK.rail(doc);

    function render(key) {
      rail.innerHTML = "";
      SETS[key].forEach(function (s) { rail.appendChild(card(s)); });
      rail.appendChild(terminal(key));
    }

    function paintPills() {
      ["viewed", "saved"].forEach(function (k) {
        pills[k].style.cssText = pillCss(k === current);
        pills[k].setAttribute("aria-pressed", k === current ? "true" : "false");
      });
    }

    ["viewed", "saved"].forEach(function (key) {
      var b = doc.createElement("button");
      b.type = "button";
      b.textContent = PILL_LABEL[key];
      b.onclick = function () {
        if (current === key) return;
        current = key;
        paintPills();
        render(current);
      };
      pills[key] = b;
      toggle.appendChild(b);
    });

    paintPills();
    render(current);

    wrap.appendChild(toggle);
    wrap.appendChild(rail);

    return { continueEl: wrap, viewedEl: null };
  }
};
