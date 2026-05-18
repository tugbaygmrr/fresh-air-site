from pathlib import Path
from PIL import Image


src = Path("c:/Users/Tuğba/Desktop/fresh-air/public/cert-strip.png")
out = Path("c:/Users/Tuğba/Desktop/fresh-air/public/cert-logos")
out.mkdir(parents=True, exist_ok=True)

im = Image.open(src).convert("RGBA")

# Hand-tuned boxes from the provided strip image
boxes = [
    (24, 14, 88, 92),   # CE blue
    (144, 10, 232, 96), # ISO 9001
    (248, 16, 376, 92), # Efectis
    (402, 10, 492, 96), # circular black logo
    (520, 12, 594, 94), # EK
    (620, 12, 700, 94), # unicorn mark
]

for i, box in enumerate(boxes, start=1):
    logo = im.crop(box)
    logo.save(out / f"cert-logo-{i}.png", "PNG")

print("saved", len(boxes))
