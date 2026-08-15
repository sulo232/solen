/* Vrbo home, ported. Source: https://mobbin.com/screens/a2150d39-9dd0-4282-aad3-a0a44e8953fe
 *
 * ANATOMY
 *   A LINE is the section head: title plus, on the viewed row only, the shared arrow control.
 *   A SEARCH is a sunken chip-card, 232 x 84, radius 16, fill #F4F4F5, no border and no shadow,
 *     carrying a Lucide search glyph at the left and the query over one quiet category line.
 *   A VIEWED ITEM is a card, and the card is the only thing here that CARRIES A PHOTO:
 *     112 x 106 thumb, radius 16, with a heart badge pinned top-right.
 *
 * TYPE: four sizes 22 / 15 / 13 / 12, two weights 600 / 400.
 * DECIDES: photography is earned by a place, not spent on a query. This is the only direction
 *   whose resume block carries zero imagery, so the two objects never read as one shelf.
 * NOT PORTED: Vrbo's dates-and-travellers meta line under each search chip. Dates and head counts
 *   were killed by name on 2026-08-15, and our searches are services, which have no date until the
 *   booking step, so the line would carry nothing true. The chip keeps the category instead.
 */
(function () {

  /* Real service and look names people search on Solen, paired to a seeded salon so the
     category line below each query comes from MK.SALONS and never from an invented value. */
  var SEARCHES = [
    { q: "Skin fade",      salon: 0 },
    { q: "Balayage",       salon: 1 },
    { q: "Gel manicure",   salon: 4 },
    { q: "Bridal make-up", salon: 3 }
  ];

  /* Saved state is a constant, never a random, so the mockup renders the same every reload. */
  var SAVED = [true, false, false, false, false];

  var CHIP_W = 232;
  var CHIP_H = 84;
  var RADIUS = 16;
  var BADGE = 28;

  var INK = "#0A0A0A";
  var INK2 = "#6B6B6B";
  var SUNKEN = "#F4F4F5";
  var HEART = "#FF3366";

  function heartBadge(doc, MK, saved) {
    /* 28px of visible circle inside a 44px tap target, the same way the see-all control
       reconciles the reference look with the touch floor. */
    var hit = doc.createElement("span");
    hit.setAttribute("role", "button");
    hit.setAttribute("aria-label", saved ? "Saved" : "Save");
    hit.style.cssText =
      "position:absolute;top:0;right:0;width:" + MK.REF.arrowTap + "px;height:" + MK.REF.arrowTap +
      "px;display:grid;place-items:center;cursor:pointer";

    var dot = MK.el(doc, "span",
      "width:" + BADGE + "px;height:" + BADGE + "px;border-radius:999px;background:#fff;" +
      "display:grid;place-items:center;color:" + (saved ? HEART : INK),
      MK.svg("heart", 15));

    var glyph = dot.firstChild;
    if (glyph && glyph.setAttribute) glyph.setAttribute("fill", saved ? HEART : "none");

    hit.appendChild(dot);
    return hit;
  }

  function searchChip(doc, MK, entry) {
    var salon = MK.SALONS[entry.salon];

    var chip = doc.createElement("a");
    chip.href = "#";
    chip.style.cssText =
      "flex:0 0 " + CHIP_W + "px;width:" + CHIP_W + "px;height:" + CHIP_H + "px;box-sizing:border-box;" +
      "background:" + SUNKEN + ";border-radius:" + RADIUS + "px;border:0;box-shadow:none;" +
      "display:flex;align-items:center;gap:12px;padding:0 16px;text-decoration:none";

    chip.appendChild(MK.el(doc, "span",
      "flex:0 0 18px;height:18px;color:" + INK2 + ";display:grid;place-items:center",
      MK.svg("search", 18)));

    var col = MK.el(doc, "span", "min-width:0;display:block");

    var query = MK.el(doc, "span",
      "display:block;font:600 15px/1.3 Inter,sans-serif;color:" + INK + ";" +
      "white-space:nowrap;overflow:hidden;text-overflow:ellipsis");
    query.textContent = entry.q;

    var meta = MK.el(doc, "span",
      "display:block;font:400 13px/1.4 Inter,sans-serif;color:" + INK2 + ";" +
      "white-space:nowrap;overflow:hidden;text-overflow:ellipsis");
    meta.textContent = salon.cat;

    col.appendChild(query);
    col.appendChild(meta);
    chip.appendChild(col);
    return chip;
  }

  function viewedTile(doc, MK, salon, saved) {
    var tile = doc.createElement("a");
    tile.href = "#";
    tile.style.cssText =
      "flex:0 0 " + MK.REF.thumbW + "px;width:" + MK.REF.thumbW + "px;display:block;text-decoration:none";

    var frame = MK.el(doc, "span", "position:relative;display:block");
    frame.appendChild(MK.photo(doc, salon.photo,
      "width:" + MK.REF.thumbW + "px;height:" + MK.REF.thumbH + "px;border-radius:" + RADIUS + "px"));
    frame.appendChild(heartBadge(doc, MK, saved));
    tile.appendChild(frame);

    var name = MK.el(doc, "span",
      "display:block;margin-top:8px;font:600 13px/1.3 'Inter Tight',Inter,sans-serif;color:" + INK + ";" +
      "white-space:nowrap;overflow:hidden;text-overflow:ellipsis");
    name.textContent = salon.name;

    var price = MK.el(doc, "span",
      "display:block;font:400 12px/1.4 Inter,sans-serif;color:" + INK2 + ";font-variant-numeric:tabular-nums;" +
      "white-space:nowrap;overflow:hidden;text-overflow:ellipsis");
    price.textContent = "from CHF " + salon.price;

    tile.appendChild(name);
    tile.appendChild(price);
    return tile;
  }

  window.DIRECTIONS.vrbo = {
    label: "Vrbo chips",
    caption: "Searches wear grey chips with no photo. Photography is reserved for places you viewed.",

    apply: function (doc, MK) {
      /* ---- resume block: sunken chips, zero imagery ----
         No arrow on this head. There is no all-searches destination to send anyone to, and an
         arrow that goes nowhere is a dead affordance. The viewed row below keeps the arrow. */
      var searches = MK.el(doc, "section", "padding:4px 0 0");
      searches.appendChild(MK.sectionHead(doc, "Recent searches", false));

      var chips = MK.rail(doc);
      for (var i = 0; i < SEARCHES.length; i++) {
        chips.appendChild(searchChip(doc, MK, SEARCHES[i]));
      }
      searches.appendChild(chips);

      /* ---- viewed row: this is where the photographs live ---- */
      var viewed = MK.el(doc, "section", "padding:28px 0 4px");
      viewed.appendChild(MK.sectionHead(doc, "Recently viewed", true));

      var rail = MK.rail(doc);
      for (var j = 0; j < MK.SALONS.length; j++) {
        rail.appendChild(viewedTile(doc, MK, MK.SALONS[j], SAVED[j] === true));
      }
      viewed.appendChild(rail);

      return { continueEl: searches, viewedEl: viewed };
    }
  };

})();
