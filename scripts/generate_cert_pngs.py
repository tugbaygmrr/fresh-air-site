from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


OUT_DIR = Path("c:/Users/Tuğba/Desktop/fresh-air/public/cert-logos")
OUT_DIR.mkdir(parents=True, exist_ok=True)

W, H = 220, 86

items = [
    ("ISO", "9001", "iso-9001.png"),
    ("ISO", "10002", "iso-10002.png"),
    ("ISO", "14001", "iso-14001.png"),
    ("ISO", "45001", "iso-45001.png"),
    ("CE", "F400", "ce-f400.png"),
    ("TSE", "HYB", "tse-hyb.png"),
    ("TRM", "24-2884", "trm-24-2884.png"),
]

try:
    font_small = ImageFont.truetype("arial.ttf", 13)
    font_main = ImageFont.truetype("arialbd.ttf", 18)
    font_badge = ImageFont.truetype("arialbd.ttf", 13)
except OSError:
    font_small = ImageFont.load_default()
    font_main = ImageFont.load_default()
    font_badge = ImageFont.load_default()

for title, code, filename in items:
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # pill bg
    draw.rounded_rectangle((1, 1, W - 2, H - 2), radius=42, fill=(255, 255, 255, 24), outline=(255, 255, 255, 84), width=1)

    # badge circle
    draw.ellipse((18, 19, 66, 67), fill=(22, 170, 226, 255))

    tw, th = draw.textbbox((0, 0), title, font=font_badge)[2:]
    draw.text((42 - tw / 2, 43 - th / 2), title, fill=(5, 36, 53, 255), font=font_badge)

    draw.text((80, 25), "CERTIFIED", fill=(220, 241, 255, 255), font=font_small)
    draw.text((80, 42), code, fill=(255, 255, 255, 255), font=font_main)

    img.save(OUT_DIR / filename, format="PNG")
