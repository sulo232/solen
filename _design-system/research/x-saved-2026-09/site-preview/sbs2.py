import sys
from PIL import Image, ImageDraw, ImageFont
F=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',30)
for n in sys.argv[1:]:
    A=Image.open(f'site/{n}-a.png').convert('RGB'); B=Image.open(f'site/{n}-b.png').convert('RGB')
    H=max(A.height,B.height); g=30; top=64
    im=Image.new('RGB',(A.width+B.width+g*3,H+top+g),(228,228,231)); d=ImageDraw.Draw(im)
    im.paste(A,(g,top)); im.paste(B,(g*2+A.width,top))
    d.text((g,18),'Today',fill=(10,10,10),font=F); d.text((g*2+A.width,18),'New (the 6 rules)',fill=(10,10,10),font=F)
    im.save(f'site/{n}.jpg',quality=82)
