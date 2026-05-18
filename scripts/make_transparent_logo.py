from pathlib import Path
from PIL import Image


input_path = Path("c:/Users/Tuğba/Desktop/fresh-air/public/logo.png")
output_path = Path("c:/Users/Tuğba/Desktop/fresh-air/public/logo-transparent.png")

image = Image.open(input_path).convert("RGBA")
pixels = image.getdata()
new_pixels = []

for r, g, b, a in pixels:
    if r > 235 and g > 235 and b > 235:
        new_pixels.append((r, g, b, 0))
    else:
        new_pixels.append((r, g, b, a))

image.putdata(new_pixels)
image.save(output_path)
