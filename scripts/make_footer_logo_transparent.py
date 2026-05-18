from PIL import Image


path = r"c:\Users\Tuğba\Desktop\fresh-air\public\footer-logo.png"
img = Image.open(path).convert("RGBA")
pixels = img.load()
w, h = img.size

# Remove dark/navy background and keep white logo marks.
for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if a == 0:
            continue
        if r < 70 and g < 90 and b < 120:
            pixels[x, y] = (r, g, b, 0)

img.save(path)
