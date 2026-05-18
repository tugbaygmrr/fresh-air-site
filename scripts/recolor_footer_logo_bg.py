from PIL import Image


path = r"c:\Users\Tuğba\Desktop\fresh-air\public\footer-logo.png"
img = Image.open(path).convert("RGBA")
pixels = img.load()
w, h = img.size

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if a > 0 and r < 55 and g < 55 and b < 55:
            pixels[x, y] = (10, 40, 71, a)

img.save(path)
