from PIL import Image
img = Image.open('public/sleeping-egg.png')
pixels = img.load()
width, height = img.size
bg_ref = pixels[10, 10]
def is_different(p):
    return abs(p[0]-bg_ref[0]) + abs(p[1]-bg_ref[1]) + abs(p[2]-bg_ref[2]) > 30

rows_with_content = []
for y in range(height):
    has_content = False
    for x in range(width):
        if is_different(pixels[x, y]):
            has_content = True
            break
    if has_content:
        rows_with_content.append(y)

groups = []
if rows_with_content:
    start = rows_with_content[0]
    prev = start
    for y in rows_with_content[1:]:
        if y - prev > 20: # gap of 20 pixels means new group
            groups.append((start, prev))
            start = y
        prev = y
    groups.append((start, prev))

print(f"Content groups (Y-ranges): {groups}")
