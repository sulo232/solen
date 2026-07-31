import os
from PIL import Image, ImageDraw
os.makedirs("sheets", exist_ok=True)
CHECK = (250,250,250,255)
for name in sorted(os.listdir("frames")):
    d = os.path.join("frames", name)
    if not os.path.isdir(d): continue
    fs = sorted(f for f in os.listdir(d) if f.endswith(".png"))
    step = 2 if len(fs) > 26 else 1
    sel = fs[::step]
    cell_w, cell_h = 90, 81   # half of 180x162
    cols = 13
    rows = (len(sel)+cols-1)//cols
    sheet = Image.new("RGB", (cols*cell_w, rows*(cell_h+14)), (255,255,255))
    dr = ImageDraw.Draw(sheet)
    for i, f in enumerate(sel):
        im = Image.open(os.path.join(d,f)).convert("RGBA").resize((cell_w, cell_h), Image.LANCZOS)
        bg = Image.new("RGBA", im.size, CHECK)
        bg.alpha_composite(im)
        cx, cy = (i%cols)*cell_w, (i//cols)*(cell_h+14)
        sheet.paste(bg.convert("RGB"), (cx, cy))
        fr = fs.index(f)
        dr.text((cx+3, cy+cell_h+2), f"f{fr} {round(fr/30*1000)}ms", fill=(20,20,20))
        dr.rectangle([cx, cy, cx+cell_w-1, cy+cell_h-1], outline=(225,225,225))
    sheet.save(f"sheets/{name}.png")
    print(f"sheets/{name}.png  {len(sel)} of {len(fs)} frames (every {step})  {sheet.size}")
