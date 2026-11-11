# Harvest Tide — image prompts

The game already draws every fish, the cannon and the sea in code. You can replace any of them with your own pictures. Make the image with an AI image tool, save it as a PNG with the exact file name below, and put it in the folder shown. Reload the game and it is used automatically. If a file is missing, the game uses its own drawing instead, so you can add images one at a time.

## How to use these prompts

1. Paste the **style prompt** first, then the **asset prompt**.
2. If your tool has a "negative prompt" box, paste the **negative prompt** there. If not, add "Avoid: …" with the same words at the end.
3. Ask for a **transparent background** for everything except `background.png`. If your tool can't do that, ask for a plain flat white background, then remove it with a free background remover (for example remove.bg or the "Remove background" button in PowerPoint or Canva).
4. Make **one** image you like first (the clownfish is a good test). Then reuse that image as a style reference for the rest, so they all match.
5. Size doesn't matter much. The game trims empty edges and scales each picture to fit. Square 1024 × 1024 is fine for creatures and icons.

### The rules the game needs

- **Fish face right.** The game flips them when they swim left.
- **Side view**, the whole creature visible, nothing cut off at the edges.
- **One creature per image**, centered, no shadow on the ground, no text.
- **Cannon barrel points straight up.** The pivot (where it turns) is about a quarter of the way up from the bottom.
- The jellyfish, octopus and power pearl are never flipped, so they can face the viewer.

## Style prompt (paste before every asset)

```
Bright, glossy 2D cartoon game art for a mobile arcade fishing game. Thick dark navy outlines, bold cel shading with soft highlights, saturated tropical colors, friendly cute expressions with big eyes, smooth vector-like finish, slight glow on edges. Consistent lighting from top left. Clean shapes that read clearly at small size. Isolated on a transparent background.
```

## Negative prompt

```
text, letters, watermark, logo, signature, frame, border, background scenery, ground shadow, photorealistic, 3D render, blurry, grainy, cropped, cut off, multiple creatures, extra fins, extra eyes, gore, scary
```

## Background

| File | Folder | Shape |
|---|---|---|
| `background.png` | `assets/` | Landscape 16:9, at least 1920 × 1080 |

```
Wide landscape underwater coral reef scene for a 2D cartoon game, side view. Sunlit turquoise water at the top fading to deep blue at the bottom, soft god rays from the surface, sandy sea floor along the bottom edge with pink and purple branching corals, kelp and rocks at the left and right edges, a small treasure chest in the bottom right corner. Keep the middle of the picture open and empty water (fish will swim there) and keep the bottom center clear (a cannon sits there). No fish, no creatures, no text. Bright glossy cartoon style matching the game characters.
```
(For the background, leave out "Isolated on a transparent background" from the style prompt.)

## Fish and creatures (folder `assets/fish/`)

| File | What it is | Shape |
|---|---|---|
| `sardine.png` | small silver fish (swims in schools) | long and thin, about 2.5 : 1 |
| `clownfish.png` | orange and white striped fish | about 1.5 : 1 |
| `snapper.png` | red fish | about 2 : 1 |
| `puffer.png` | yellow round pufferfish | about 1 : 1 |
| `lionfish.png` | striped lionfish with long fan fins | about 1.7 : 1 |
| `turtle.png` | sea turtle | about 1.35 : 1 |
| `manta.png` | manta ray | about 1.5 : 1 |
| `golden-koi.png` | golden koi (the special prize fish) | about 2 : 1 |
| `octopus-king.png` | giant octopus boss wearing a crown | about 1 : 1 |
| `jellyfish.png` | pink jellyfish (the one to avoid) | taller than wide, about 3 : 4 |
| `power-pearl.png` | glowing pearl that gives a power-up | 1 : 1 |

**sardine.png**
```
A single small silver sardine fish, side view facing right, sleek streamlined body, blue-green back fading to shiny silver belly, small forked tail, round friendly eye.
```

**clownfish.png**
```
A single clownfish, side view facing right, bright orange body with three thick white stripes edged in black, rounded fins with black tips, big cheerful eye.
```

**snapper.png**
```
A single red snapper fish, side view facing right, coral-red body with a lighter pink belly, spiky dorsal fin, forked tail, confident expression.
```

**puffer.png**
```
A single cute pufferfish, side view facing right, round lemon-yellow body with small brown spots and short soft spikes, tiny fins, big surprised eyes, small pursed mouth.
```

**lionfish.png**
```
A single lionfish, side view facing right, red and cream zebra stripes, long feathery fan-like pectoral fins and tall spiny dorsal fins spreading out, elegant and showy.
```

**turtle.png**
```
A single green sea turtle swimming, side view facing right, rounded brown and gold patterned shell, green flippers spread, friendly smiling face.
```

**manta.png**
```
A single manta ray gliding, seen from slightly above and to the side, facing right, deep purple back with white spots, wide wing-like fins, long thin tail, gentle face.
```

**golden-koi.png**
```
A single golden koi fish, side view facing right, shining metallic gold scales with orange highlights, long flowing silky fins and tail, sparkles around it, magical and valuable looking.
```

**octopus-king.png**
```
A giant cartoon octopus boss facing the viewer, bright red-pink body, big expressive eyes with a mischievous grin, eight curling tentacles spread out below, a small golden crown with jewels on its head. Imposing but friendly.
```

**jellyfish.png**
```
A single pink jellyfish facing the viewer, translucent glowing bell, long wavy tentacles hanging down, slightly grumpy face, soft inner glow.
```

**power-pearl.png**
```
A single glowing pearl inside a soft cyan bubble, a small golden star shining in the center, sparkles around it, magical power-up item.
```

## Cannons (folder `assets/cannon/`)

All four: **barrel pointing straight up**, seen from above at a slight angle, no base or platform (the game draws the base). Taller than wide.

| File | Used for |
|---|---|
| `cannon-1.png` | Treasure Reef, cannon levels 1–2 |
| `cannon-2.png` | Treasure Reef, cannon levels 3–5 |
| `cannon-3.png` | Treasure Reef, cannon levels 6–7 |
| `cannon-arcade.png` | Arcade mode (if missing, `cannon-2.png` is used) |

**cannon-1.png**
```
A cartoon net-launcher cannon turret for an underwater game, top-down view with the single barrel pointing straight up, bronze metal with rivets, round hub at the bottom, simple and sturdy.
```

**cannon-2.png**
```
A cartoon net-launcher cannon turret for an underwater game, top-down view with two side-by-side barrels pointing straight up, polished silver and blue metal, glowing cyan lights, round hub at the bottom.
```

**cannon-3.png**
```
A cartoon net-launcher cannon turret for an underwater game, top-down view with three barrels side by side pointing straight up, shiny gold metal with gem inlays, glowing gold lights, round ornate hub at the bottom, powerful and luxurious.
```

**cannon-arcade.png**
```
A cartoon net-launcher cannon turret for an underwater game, top-down view with two barrels pointing straight up, violet and lilac metal with glowing pink lights, round hub at the bottom, sporty and fun.
```

## Icons (folder `assets/ui/`)

Square, simple, readable at 40 pixels.

| File | What it is |
|---|---|
| `coin.png` | the game coin |
| `power-freeze.png` | Freeze power-up |
| `power-lockon.png` | Lock-on power-up |
| `power-zap.png` | Zap power-up |

**coin.png**
```
A single shiny gold game coin seen straight on, thick rim, a small star embossed in the center, bright highlight on the top left. Simple game icon.
```

**power-freeze.png**
```
A simple game icon of a glowing ice-blue snowflake crystal, bold shape, frosty sparkle. No background circle.
```

**power-lockon.png**
```
A simple game icon of a red target crosshair, bold ring with four tick marks, glowing red. No background circle.
```

**power-zap.png**
```
A simple game icon of a bright yellow lightning bolt, bold shape, electric glow. No background circle.
```

## Checking your images

- Open `design/creatures.html` in the game folder to see every creature at game size side by side.
- If a fish swims backwards, flip the picture horizontally (it must face right).
- If a cannon aims sideways, rotate the picture so the barrel points up.
- To go back to the built-in drawing, delete or rename the PNG.
