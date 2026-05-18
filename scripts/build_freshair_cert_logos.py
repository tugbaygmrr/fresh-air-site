from io import BytesIO
from pathlib import Path

import requests
from PIL import Image


OUT_DIR = Path("c:/Users/Tuğba/Desktop/fresh-air/public/cert-logos")
OUT_DIR.mkdir(parents=True, exist_ok=True)

CERT_URLS = [
    ("iso-9001", "https://freshairhvac.com.tr/wp-content/uploads/2025/04/FRESH-AIR-ISO-9001-1.png"),
    ("iso-10002", "https://freshairhvac.com.tr/wp-content/uploads/2025/04/FRESH-AIR-ISO-10002-1.png"),
    ("iso-14001", "https://freshairhvac.com.tr/wp-content/uploads/2025/04/FRESH-AIR-ISO-14001-1.png"),
    ("iso-45001", "https://freshairhvac.com.tr/wp-content/uploads/2025/04/FRESH-AIR-ISO-45001-1.png"),
    ("sanayi-sicil", "https://freshairhvac.com.tr/wp-content/uploads/2025/04/FRESH-AIR-sanayi-sicil-belgesi_250430_091635-1.png"),
    ("trm-24-2884", "https://freshairhvac.com.tr/wp-content/uploads/2025/04/TRM-24-2884-01-Egzoz-Fani-1.png"),
]


def make_logo_slice(image: Image.Image) -> Image.Image:
    w, h = image.size
    # Use top area where logo marks are located.
    crop = image.crop((int(w * 0.08), int(h * 0.03), int(w * 0.92), int(h * 0.22)))
    rgba = crop.convert("RGBA")
    pixels = rgba.getdata()
    out = []
    for r, g, b, a in pixels:
        # Remove bright paper background but keep colored logo marks.
        if r > 245 and g > 245 and b > 245:
            out.append((r, g, b, 0))
        else:
            out.append((r, g, b, a))
    rgba.putdata(out)
    return rgba


for name, url in CERT_URLS:
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    img = Image.open(BytesIO(r.content)).convert("RGB")
    logo = make_logo_slice(img)
    logo.save(OUT_DIR / f"{name}.png", "PNG")
