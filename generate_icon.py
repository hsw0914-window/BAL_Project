from PIL import Image, ImageDraw

SIZE = 1024
SCALE = SIZE / 50  # viewBox 0 0 50 50 -> 1024x1024

NIGHT_SKY = (27, 45, 79)    # #1B2D4F
CREAM     = (255, 253, 246)  # #FFFDF6

def s(v):
    return int(v * SCALE)

img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# 배경
draw.rectangle([0, 0, SIZE, SIZE], fill=NIGHT_SKY)

# 달 본체 (cream circle cx=22 cy=25 r=15)
cx, cy, r = s(22), s(25), s(15)
draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CREAM)

# navy 원으로 덮어서 초승달 (cx=31 cy=21 r=14)
cx2, cy2, r2 = s(31), s(21), s(14)
draw.ellipse([cx2 - r2, cy2 - r2, cx2 + r2, cy2 + r2], fill=NIGHT_SKY)

# 큰 4점 별 (우상단)
big_star = [
    (s(40), s(11)), (s(41.2), s(14)), (s(44.2), s(15.2)),
    (s(41.2), s(16.4)), (s(40), s(19.4)), (s(38.8), s(16.4)),
    (s(35.8), s(15.2)), (s(38.8), s(14)),
]
draw.polygon(big_star, fill=CREAM)

# 작은 4점 별 (우하단)
small_star = [
    (s(37), s(36)), (s(37.8), s(38)), (s(39.8), s(38.8)),
    (s(37.8), s(39.6)), (s(37), s(41.6)), (s(36.2), s(39.6)),
    (s(34.2), s(38.8)), (s(36.2), s(38)),
]
draw.polygon(small_star, fill=CREAM)

# 반짝임 점 (cx=45 cy=27 r=1)
cx3, cy3, r3 = s(45), s(27), s(1)
draw.ellipse([cx3 - r3, cy3 - r3, cx3 + r3, cy3 + r3], fill=CREAM)

# 미니 점 (cx=33 cy=8 r=0.8)
cx4, cy4, r4 = s(33), s(8), max(1, s(0.8))
draw.ellipse([cx4 - r4, cy4 - r4, cx4 + r4, cy4 + r4], fill=CREAM)

out = 'frontend/assets/icon.png'
img.save(out)
print(f'icon saved -> {out}  ({SIZE}x{SIZE})')
