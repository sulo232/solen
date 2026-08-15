#!/usr/bin/env python3
"""
scripts/build-email-assets.py , make the images the emails use, from what we already own.

OWNER, 2026-08-15: *"i want, like, more pictures and, like, maybe, like, GIF or, like, you
know, like, something that looks like actually clean. Like, not, like, just random GIF from
fucking... but, like, our own made everything."*

So NOTHING here is downloaded, stock, or generated fresh. Two sources, both already in the
repo and both his:

  1. public/icons/categories/v2/*.png , the 3D category objects (hairdryer, clippers, nail
     polish, spa stone). Already the small, cleaned-up set. This script only resizes them to
     the sizes an email needs and writes them where the mail can reach them.
  2. The locked confirmation mark , a #16A34A disc with a white check. That exact recipe is
     frozen in the design contract ("success/confirmation = normal green #16A34A disc + white
     check, NOT deep #15803D"). The animation draws that same mark on; it invents no shape and
     no colour.

Why a GIF and not a video or modern animation: mail clients play GIF and nothing else. Apple
Mail, Gmail and Yahoo animate it; Outlook on Windows shows frame one and stops, which is why
frame one is the finished mark rather than an empty circle. A recipient on Outlook sees a
correct still, never a blank hole.

Run: python3 scripts/build-email-assets.py
Out: public/_email-assets/
"""
import math
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC_ICONS = os.path.join(ROOT, "public", "icons", "categories", "v2")
OUT = os.path.join(ROOT, "public", "_email-assets")

# From the design contract. Not picked here.
GREEN = (22, 163, 74)      # #16A34A success
WHITE = (255, 255, 255)
SUNKEN = (244, 244, 245)   # #F4F4F5

os.makedirs(OUT, exist_ok=True)


# --------------------------------------------------------------------------- category icons
def build_category_icons():
    """Resize his 3D objects to the two sizes an email uses. 2x for retina, no cropping."""
    sizes = {"sm": 96, "lg": 168}   # displayed at 48 and 84
    made = []
    for name in sorted(os.listdir(SRC_ICONS)):
        if not name.endswith(".png"):
            continue
        src = Image.open(os.path.join(SRC_ICONS, name)).convert("RGBA")
        for key, px in sizes.items():
            img = src.copy()
            img.thumbnail((px, px), Image.LANCZOS)
            # Centre on a transparent square so every icon shares one box.
            canvas = Image.new("RGBA", (px, px), (0, 0, 0, 0))
            canvas.paste(img, ((px - img.width) // 2, (px - img.height) // 2), img)
            out = os.path.join(OUT, f"cat-{os.path.splitext(name)[0]}-{key}.png")
            canvas.save(out, optimize=True)
            made.append((out, os.path.getsize(out)))
    return made


# --------------------------------------------------------------------------- the confirm mark
def draw_mark(size, disc_scale, check_progress, ss=4):
    """One frame: the green disc, then the white check drawn on to `check_progress` (0..1)."""
    S = size * ss
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    r = (S * 0.42) * disc_scale
    cx = cy = S / 2
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GREEN)

    if check_progress <= 0:
        return img.resize((size, size), Image.LANCZOS)

    # A two-segment check inside the disc, proportional to it so it scales with the disc.
    p0 = (cx - r * 0.42, cy + r * 0.02)
    p1 = (cx - r * 0.12, cy + r * 0.32)
    p2 = (cx + r * 0.44, cy - r * 0.30)
    seg1 = math.dist(p0, p1)
    seg2 = math.dist(p1, p2)
    total = seg1 + seg2
    drawn = total * check_progress
    w = max(2, int(r * 0.20))

    def lerp(a, b, t):
        return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)

    if drawn <= seg1:
        d.line([p0, lerp(p0, p1, drawn / seg1)], fill=WHITE, width=w, joint="curve")
    else:
        d.line([p0, p1], fill=WHITE, width=w, joint="curve")
        d.line([p1, lerp(p1, p2, (drawn - seg1) / seg2)], fill=WHITE, width=w, joint="curve")
        # Round the elbow so the corner does not read as a notch.
        d.ellipse([p1[0] - w / 2, p1[1] - w / 2, p1[0] + w / 2, p1[1] + w / 2], fill=WHITE)
    # Round both ends.
    d.ellipse([p0[0] - w / 2, p0[1] - w / 2, p0[0] + w / 2, p0[1] + w / 2], fill=WHITE)
    return img.resize((size, size), Image.LANCZOS)


def build_confirm_mark(size=140):
    """
    Frame ONE is the finished mark, on purpose: Outlook on Windows shows only the first frame,
    so a recipient there must still see a correct confirmation, not an empty circle. Animating
    clients loop past it into the draw-on and land back on the same finished mark.
    """
    frames = [draw_mark(size, 1.0, 1.0)]          # the still Outlook keeps
    for i in range(9):                             # disc springs in
        t = (i + 1) / 9
        eased = 1 - pow(1 - t, 3)
        frames.append(draw_mark(size, 0.2 + 0.85 * eased, 0))
    frames.append(draw_mark(size, 1.0, 0))
    for i in range(10):                            # check draws on
        frames.append(draw_mark(size, 1.0, (i + 1) / 10))
    frames += [draw_mark(size, 1.0, 1.0)] * 12     # rest on the finished mark

    # GIF has no alpha blending, so flatten onto the card white the mark sits on.
    flat = []
    for f in frames:
        bg = Image.new("RGB", f.size, WHITE)
        bg.paste(f, (0, 0), f)
        flat.append(bg.convert("P", palette=Image.ADAPTIVE, colors=64))

    out = os.path.join(OUT, "confirm-mark.gif")
    flat[0].save(out, save_all=True, append_images=flat[1:], duration=[900] + [45] * 20 + [70] * 12,
                 loop=0, optimize=True, disposal=2)

    still = Image.new("RGB", (size, size), WHITE)
    m = draw_mark(size, 1.0, 1.0)
    still.paste(m, (0, 0), m)
    still_out = os.path.join(OUT, "confirm-mark.png")
    still.save(still_out, optimize=True)
    return [(out, os.path.getsize(out)), (still_out, os.path.getsize(still_out))]


if __name__ == "__main__":
    made = build_category_icons() + build_confirm_mark()
    for path, size in made:
        print(f"  {size / 1024:6.1f} KB  {os.path.relpath(path, ROOT)}")
    biggest = max(s for _, s in made)
    print(f"\n{len(made)} files, biggest {biggest / 1024:.1f} KB")
    # An email that carries hundreds of KB of images gets clipped by Gmail and is slow on data.
    if biggest > 120 * 1024:
        raise SystemExit(f"asset too heavy for email: {biggest / 1024:.1f} KB")
