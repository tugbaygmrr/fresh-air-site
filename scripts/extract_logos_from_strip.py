from pathlib import Path
from PIL import Image


SRC = Path("c:/Users/Tuğba/Desktop/fresh-air/public/cert-strip.png")
OUT = Path("c:/Users/Tuğba/Desktop/fresh-air/public/cert-logos")
OUT.mkdir(parents=True, exist_ok=True)

img = Image.open(SRC).convert("RGBA")
w, h = img.size
px = img.load()

# Find non-white columns (logo content)
content_cols = []
for x in range(w):
    has_content = False
    for y in range(h):
        r, g, b, a = px[x, y]
        if a > 0 and not (r > 245 and g > 245 and b > 245):
            has_content = True
            break
    content_cols.append(has_content)

# Build contiguous regions
regions = []
start = None
for i, v in enumerate(content_cols):
    if v and start is None:
        start = i
    elif not v and start is not None:
        if i - start > 10:
            regions.append((start, i - 1))
        start = None
if start is not None and w - start > 10:
    regions.append((start, w - 1))

saved = 0
for idx, (x1, x2) in enumerate(regions):
    # Find vertical bounds per region
    y_top = h
    y_bot = 0
    for x in range(x1, x2 + 1):
        for y in range(h):
            r, g, b, a = px[x, y]
            if a > 0 and not (r > 245 and g > 245 and b > 245):
                y_top = min(y_top, y)
                y_bot = max(y_bot, y)
    if y_bot <= y_top:
        continue

    crop = img.crop((max(0, x1 - 6), max(0, y_top - 6), min(w, x2 + 7), min(h, y_bot + 7)))
    crop.save(OUT / f"strip-logo-{idx+1}.png", "PNG")
    saved += 1

print(f"saved {saved} logos")
