# Hair Discovery — Prompt Protocol

> Standard prompts for generating hairstyle images via fal.ai Nano Banana Pro.
> Each hairstyle gets **5 shots** from this protocol for grid variety + a **360° angle set** for the detail page scrubber.

---

## Image Settings (All Shots)

```
Model:       fal-ai/nano-banana-pro
Size:        1024×1280 (4:5 ratio)
Cost:        $0.15 per image
Quality:     4K resolution
```

---

## The 5 Cover Shot Types

Every hairstyle gets one image from EACH type. The grid randomly picks different types per card so it looks editorial — not repetitive.

### Type A — Hero Portrait (front-facing, shoulder-up)

```
Ultra-realistic shoulder-up portrait photograph. [SUBJECT] standing 
straight, facing directly at the camera with relaxed confident expression 
and direct eye contact.

HAIR: [HAIR_BLOCK]

FACE: [SKIN] skin with visible pores, natural skin grain, subtle 
imperfections, realistic under-eye texture. No airbrushed look, no 
plastic skin. [EXPRESSION — e.g. soft confident smile, neutral composed 
look, relaxed warm gaze].

CLOTHING: [CLOTHING_BLOCK — fabric type, color, neckline, texture detail]

BACKGROUND: [BG_BLOCK — detailed European scene, blurred]. Strong 
circular bokeh from background lights. Shallow depth of field.

LIGHTING: Soft natural light from the front-left at 45°, creating gentle 
sculpted shadows on the right cheekbone and jawline. Warm golden color 
temperature (5200K). Subtle warm rim light on the crown of the hair from 
behind-right. Soft fill bounce from below neutralizing under-chin shadows. 
Catch lights visible in both eyes at 10 o'clock position.

CAMERA: DSLR, 85mm f/1.4 lens, tight shoulder-up crop (top of head to 
mid-chest), eye-level angle, 1024×1280 pixels. Professional editorial 
portrait photography, 4K, natural retouching only.
```

### Type B — Side Profile (dramatic, slightly from above)

```
Ultra-realistic side profile portrait photograph taken from a slightly 
elevated angle (15° above eye level). [SUBJECT] standing straight, face 
turned 90° to the left showing full side profile — forehead, nose bridge, 
lips, chin, and jawline cleanly visible in silhouette.

HAIR: [HAIR_BLOCK] — emphasize how the cut falls from this side angle, 
layers visible along the ear and neck, texture of the hair against the 
nape of the neck.

FACE: [SKIN] skin with visible pores along the cheekbone and temple, 
natural earlobe detail, subtle peach fuzz along the jawline. Clean side 
profile with sharp nose and chin contour. [EXPRESSION — calm, eyes 
looking straight ahead, not at camera].

CLOTHING: [CLOTHING_BLOCK — shoulder and collar detail visible from side]

BACKGROUND: [BG_BLOCK — dramatic, moody]. Soft gradient bokeh. Deep 
shallow depth of field with only the face plane in focus.

LIGHTING: Dramatic Rembrandt lighting from the front-right (opposite side 
of the face), creating a triangle of light on the far cheek. Strong warm 
key light (5000K) at 45° angle. Dark shadow on the near side of the face 
adding depth and drama. Subtle hair light from directly above highlighting 
individual hair strands and creating a luminous halo effect. No fill light 
— let the shadows stay deep for cinematic contrast. Specular highlights 
on the tip of the nose and lower lip.

CAMERA: DSLR, 85mm f/1.4 lens, tight crop from crown to chin, shot from 
15° above eye level, 1024×1280 pixels. Dramatic editorial photography, 
moody cinematic tones, film-grain texture, 4K.
```

### Type C — Editorial Model Shoot (3/4 angle, environmental)

```
Ultra-realistic editorial fashion portrait of [SUBJECT] in a natural 
candid moment. Body turned 30° to the right with face looking back 
toward camera over the left shoulder. Three-quarter body visible from 
thighs up, natural relaxed pose with weight on one leg.

HAIR: [HAIR_BLOCK] — show how the hair moves with the body turn, natural 
hair swing and bounce, strands catching the light at different angles, 
visible hair texture in motion.

FACE: [SKIN] skin with natural sheen on the forehead and nose, visible 
pores, realistic skin texture. [EXPRESSION — effortless, caught mid-laugh, 
or looking back naturally as if someone called their name]. Genuine 
unposed moment.

CLOTHING: [FULL_OUTFIT — head to thigh visible. Top, jacket/layer, 
bottom, accessories. Fabric textures, wrinkles, draping detail].

BACKGROUND: [WIDE_BG_BLOCK — full environmental scene, recognizable 
European location]. Medium bokeh, background elements identifiable but 
soft. Environmental portrait depth of field.

LIGHTING: Natural golden hour sunlight from behind-left creating 
volumetric warm backlight through the hair and a soft golden rim around 
the shoulders and arms. Warm ambient fill from surrounding surfaces 
(buildings/pavement). Sun flare bleeding slightly into the upper-left 
corner. Hair lit from behind showing translucent individual strand detail. 
Warm skin tones with subtle orange-gold color cast. Natural cloud-diffused 
fill preventing harsh facial shadows.

CAMERA: DSLR, 50mm f/2.0 lens, three-quarter body crop from head to 
upper thigh, eye-level angle, 1024×1280 pixels. Editorial street-style 
fashion photography, warm documentary feel, natural movement, 4K.
```

### Type D — Detail Close-Up (hair focus, cropped tight)

```
Ultra-realistic extreme close-up photograph focused entirely on the 
hairstyle. Cropped tight from forehead to the base of the neck, face 
partially visible (nose to ear). The hair fills 70% of the frame.

HAIR: [HAIR_BLOCK] — this is the hero. Every individual strand is 
razor-sharp. Show the internal layers, the way sections overlap, the 
precise cut line at the ends. Visible highlights and lowlights in the 
hair color. Natural shine and light reflection on the hair surface. 
Individual flyaway hairs along the hairline for realism. Show the 
parting line detail, scalp barely visible at the part.

FACE: Only partial face visible — from the nose tip to behind the ear. 
[SKIN] skin with detailed pore texture on the cheek and temple. Ear 
fully visible showing how the hair falls around it.

CLOTHING: Minimal — only the collar edge or shoulder visible. 
[SIMPLE_TOP — solid neutral color, clean fabric].

BACKGROUND: Smooth clean gradient — soft warm cream fading to light 
taupe. No distracting elements. Studio-like, all attention on the hair.

LIGHTING: Soft wraparound studio lighting from two sides at 45° angles, 
creating even illumination across every strand of hair. Strong overhead 
hair light directly above creating a brilliant shine strip running along 
the hair's surface. Warm color temperature (5500K). Specular highlights 
on individual curls/strands. No harsh shadows — soft diffused light 
revealing every texture detail. Subtle separation light from behind 
distinguishing hair from background.

CAMERA: DSLR, 100mm f/2.8 macro lens, extreme close-up crop of the 
hairstyle, slightly angled 20° from front-right, 1024×1280 pixels. 
Professional hair salon reference photography, razor-sharp focus on 
the hair, 4K resolution, no filters.
```

### Type E — Poster / Campaign Style (stylized, full impact)

```
Ultra-realistic high-impact fashion campaign portrait of [SUBJECT]. 
Centered in frame, direct fearless eye contact with the camera. Head 
slightly tilted 10° to the right. Strong powerful presence. Shot from 
chest-up with generous negative space above the head (hair fully visible 
with air around it).

HAIR: [HAIR_BLOCK] — styled to perfection for a campaign shoot. Volume 
maximized. Every strand intentionally placed. The hairstyle is the 
centerpiece of the image. Hair styled with editorial precision — show 
the shape, the silhouette, the architecture of the cut. Wind-machine 
effect if long hair — subtle movement lifting the ends.

FACE: [SKIN] skin with flawless but realistic texture — visible pores, 
natural skin grain, but perfectly lit to minimize imperfections while 
keeping realism. Strong defined eyebrows. [EXPRESSION — powerful, 
editorial, commanding, slight squint, fashion-intensity].

CLOTHING: [MINIMAL_LUXURY — clean neckline. Off-shoulder black top, or 
turtleneck, or bare shoulders with a statement necklace. One clean 
element that doesn't compete with the hair].

BACKGROUND: Solid deep background — either rich charcoal grey (#2A2A2A) 
or deep warm taupe (#3D3530). Smooth, no texture, no gradient. Pure 
studio backdrop with subtle light falloff at the edges creating a 
vignette effect. All attention on the subject.

LIGHTING: Professional 3-point studio setup. Key light: large softbox 
from front-right at 45°, slightly above eye level, creating sculpted 
cheekbone shadows and a butterfly shadow under the nose. Fill light: 
silver reflector from front-left at half intensity, opening shadows 
without eliminating them. Hair light: focused hot spot from directly 
above-behind, creating a brilliant white shine strip across the crown 
and a luminous halo separating the hair from the dark background. 
Background light: subtle rim defining the shoulder line. Color 
temperature 5600K (daylight balanced). Strong catch lights in both 
eyes — two distinct rectangular softbox reflections.

CAMERA: Medium format digital, 80mm f/2.0 lens, chest-up crop with 
space above the head, eye-level angle, 1024×1280 pixels. High-fashion 
campaign photography, Vogue editorial quality, razor-sharp focus, 
luxurious post-production feel with maintained realism, 4K.
```

---

## 360° Angle Set (Detail Page Scrubber)

For each hairstyle, generate 12 images at these angles. Use the SAME subject, clothing, background, and lighting — only rotate the camera:

| Angle | Camera Position | Prompt Addition |
|---|---|---|
| 0° | Front | `"facing directly at the camera"` |
| 30° | Front-right | `"face turned 30° to the left, camera at 30° from the right"` |
| 60° | Right 3/4 | `"face turned 60° to the left showing three-quarter profile from the right"` |
| 90° | Right side | `"full right side profile, face turned 90° to the left"` |
| 120° | Right-back 3/4 | `"seen from behind-right at 120°, back of head and right ear visible"` |
| 150° | Back-right | `"seen from behind at 150°, mostly back of head with right jawline edge visible"` |
| 180° | Back | `"full back view of the head, nape of neck and back of hairstyle visible"` |
| 210° | Back-left | `"seen from behind at 210°, mostly back of head with left jawline edge visible"` |
| 240° | Left-back 3/4 | `"seen from behind-left at 240°, back of head and left ear visible"` |
| 270° | Left side | `"full left side profile, face turned 90° to the right"` |
| 300° | Left 3/4 | `"face turned 60° to the right showing three-quarter profile from the left"` |
| 330° | Front-left | `"face turned 30° to the right, camera at 30° from the left"` |

**360° template** (use Type A as the base):

```
[Full Type A prompt with all details] — EXCEPT replace the camera 
angle line with:

"Camera positioned at [X]° around the subject. [ANGLE_DESCRIPTION 
from table above]. Same clothing, background, and lighting as the 
0° front-facing shot. Consistent identity and appearance across 
all angles."
```

---

## Variable Blocks (Fill In Per Hairstyle)

### [HAIR_BLOCK] — Example fills:

```
# Curly Bob
Textured curly bob, chin-length, natural tight curls with defined 
ringlets, dark chocolate brown base with warm caramel balayage 
highlights on the front sections. Side-parted with curls falling 
naturally across the forehead. Every individual curl strand is sharp 
with visible hair texture, natural shine and light reflection, 
slight realistic frizz at the crown and temples.

# Wolf Cut
Layered wolf cut, medium length reaching the jawline, straight thick 
dark brown hair with heavy choppy layers throughout, textured curtain 
bangs parted in the center falling to the eyebrows, longer shaggy 
pieces framing the face and feathering at the ends, slight volume 
at the crown with messy lived-in undone texture. Natural matte finish, 
no gel or wet look, individual strands visible.

# Buzz Fade
Clean buzz cut with skin fade, #2 guard on top blending to skin-tight 
at the temples and nape. Dark black hair with subtle blue-black sheen 
in the light. Precision razor line at the hairline, sharp geometric 
edge-up at the temples and forehead. Scalp texture visible through 
the short hair on top, clean gradient transition from skin to stubble.
```

### [BG_BLOCK] — European Scene Options:

```
# Café
Blurred modern European café — warm oak paneling, brass pendant lights 
glowing amber, marble countertop edge, sage velvet booth seating, 
espresso machine chrome gleaming in the background.

# Street
Blurred medieval European cobblestone street — weathered sandstone 
facades in ochre and terracotta, wrought iron balconies with trailing 
ivy, warm-lit boutique window, vintage bicycle against a wall.

# Park
Blurred European botanical garden — trimmed boxwood hedgerows, limestone 
gravel path curving away, weathered stone fountain, white climbing roses 
on a rustic wood trellis, dappled canopy sunlight.

# Tennis Court
Blurred outdoor clay tennis court — terracotta-red clay surface, white 
court lines, green windscreen fence, distant umbrella pines and blue sky.

# River
Blurred European riverside — stone bridge with arches, calm river 
reflections, weeping willows, historic building skyline in warm stone.

# Studio
Solid deep charcoal grey (#2A2A2A) studio backdrop, smooth with no 
texture, subtle light falloff creating a natural vignette at the edges.
```

### [CLOTHING_BLOCK] — Options:

```
# Casual warm
Cream ribbed knit turtleneck sweater, fine-gauge merino wool, slightly oversized

# Casual cool
Black heavyweight cotton crew-neck t-shirt, fitted, visible cotton weave texture

# Smart casual
Sage green linen button-up shirt, top two buttons undone, crisp collar, wrinkles

# Elegant
Off-shoulder black cashmere sweater, clean collarbone visible, draped neckline

# Street
Vintage brown leather jacket over white crew-neck tee, worn leather patina

# Sport
White Nike-style dri-fit polo, clean collar, subtle mesh fabric texture
```

---

## Naming Convention

```
{hairstyle_slug}_{shot_type}_{gender}_{skin}.png

Examples:
curly-bob_hero_f_medium-brown.png
curly-bob_side-profile_f_medium-brown.png
curly-bob_editorial_f_medium-brown.png
curly-bob_closeup_f_medium-brown.png
curly-bob_poster_f_medium-brown.png
curly-bob_360-000_f_medium-brown.png
curly-bob_360-030_f_medium-brown.png
...
```

---

## Cost Per Hairstyle

| Images | Count | Cost |
|---|---|---|
| 5 cover shots (Types A-E) | 5 | $0.75 |
| 12 angle set (360°) | 12 | $1.80 |
| **Total per hairstyle** | **17** | **$2.55** |
| **50 hairstyles at launch** | **850** | **$127.50** |
