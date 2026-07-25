#!/usr/bin/env python3
"""
Premium-leaning 16-bit neon San Francisco pixel pack for ZOOX FUTURE SF.
Sprites are drawn at native pixel size and saved with NEAREST 4x upscale.
Layer images pack artwork at the TOP so Phaser tileSprites show the city, not empty sky.
"""

from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw
import math
import random

ROOT = Path(__file__).resolve().parents[2] / "public" / "assets"
UPSCALE = 4

P = {
    "navy": (5, 8, 22, 255),
    "deep": (12, 18, 44, 255),
    "mid": (28, 34, 68, 255),
    "slate": (48, 56, 88, 255),
    "brick": (92, 48, 78, 255),
    "teal": (28, 92, 120, 255),
    "road": (34, 38, 54, 255),
    "lane": (230, 235, 255, 255),
    "cyan": (0, 240, 255, 255),
    "cyan_dim": (0, 170, 200, 255),
    "magenta": (255, 43, 214, 255),
    "purple": (122, 60, 255, 255),
    "blue": (55, 120, 255, 255),
    "yellow": (255, 216, 77, 255),
    "orange": (255, 138, 31, 255),
    "red": (255, 70, 100, 255),
    "green": (70, 220, 130, 255),
    "lime": (180, 255, 80, 255),
    "white": (245, 250, 255, 255),
    "glass": (14, 20, 36, 255),
    "zoox": (60, 150, 255, 255),
    "zoox_dk": (30, 85, 180, 255),
    "moon": (235, 240, 255, 255),
    "cloud": (150, 130, 200, 170),
    "black": (0, 0, 0, 255),
    "pink": (255, 120, 190, 255),
    "amber": (255, 180, 70, 255),
    "trans": (0, 0, 0, 0),
}


def new(w, h, color=None):
    return Image.new("RGBA", (w, h), color or P["trans"])


def put(img, x, y, color):
    if 0 <= x < img.width and 0 <= y < img.height:
        img.putpixel((int(x), int(y)), color)


def rect(img, x, y, w, h, color):
    ImageDraw.Draw(img).rectangle([x, y, x + w - 1, y + h - 1], fill=color)


def hline(img, x, y, w, color):
    for i in range(int(w)):
        put(img, x + i, y, color)


def vline(img, x, y, h, color):
    for i in range(int(h)):
        put(img, x, y + i, color)


def save(img: Image.Image, rel: str):
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    big = img.resize((img.width * UPSCALE, img.height * UPSCALE), Image.NEAREST)
    big.save(path, "PNG")
    print(f"wrote {rel} ({big.size[0]}x{big.size[1]})")


def dither_glow(img, cx, cy, radius, color, strength=90):
    cr, cg, cb, _ = color
    for y in range(-radius, radius + 1):
        for x in range(-radius, radius + 1):
            dist = math.sqrt(x * x + y * y)
            if dist <= radius:
                a = int(strength * (1 - dist / radius))
                if a > 0:
                    put(img, cx + x, cy + y, (cr, cg, cb, a))


def windows(img, x, y, w, h, cols, rows, rng, lit=None):
    lit = lit or P["yellow"]
    cw = max(2, w // cols)
    rh = max(2, h // rows)
    for r in range(rows):
        for c in range(cols):
            if rng.random() < 0.62:
                color = lit if rng.random() < 0.7 else P["cyan_dim"]
                wx, wy = x + c * cw + 1, y + r * rh + 1
                rect(img, wx, wy, max(1, cw - 2), max(1, rh - 2), color)


def pixel_text(img, x, y, text, color):
    # ultra-tiny 3x5 glyphs for neon signs
    glyphs = {
        "A": ["010", "101", "111", "101", "101"],
        "B": ["110", "101", "110", "101", "110"],
        "C": ["011", "100", "100", "100", "011"],
        "D": ["110", "101", "101", "101", "110"],
        "E": ["111", "100", "110", "100", "111"],
        "G": ["011", "100", "101", "101", "011"],
        "H": ["101", "101", "111", "101", "101"],
        "I": ["111", "010", "010", "010", "111"],
        "K": ["101", "101", "110", "101", "101"],
        "L": ["100", "100", "100", "100", "111"],
        "M": ["101", "111", "111", "101", "101"],
        "N": ["101", "111", "111", "111", "101"],
        "O": ["010", "101", "101", "101", "010"],
        "P": ["110", "101", "110", "100", "100"],
        "R": ["110", "101", "110", "101", "101"],
        "S": ["011", "100", "010", "001", "110"],
        "T": ["111", "010", "010", "010", "010"],
        "U": ["101", "101", "101", "101", "011"],
        "W": ["101", "101", "111", "111", "101"],
        "X": ["101", "101", "010", "101", "101"],
        "Y": ["101", "101", "010", "010", "010"],
        "Z": ["111", "001", "010", "100", "111"],
        " ": ["000", "000", "000", "000", "000"],
        "8": ["111", "101", "111", "101", "111"],
        "-": ["000", "000", "111", "000", "000"],
    }
    cx = x
    for ch in text.upper():
        g = glyphs.get(ch, glyphs[" "])
        for row, line in enumerate(g):
            for col, bit in enumerate(line):
                if bit == "1":
                    put(img, cx + col, y + row, color)
        cx += 4


def make_sky():
    img = new(320, 180)
    for y in range(180):
        t = y / 179
        hline(img, 0, y, 320, (6 + int(14 * t), 8 + int(6 * t), 26 + int(50 * t), 255))
    rng = random.Random(42)
    for _ in range(120):
        put(img, rng.randint(0, 319), rng.randint(0, 100), (255, 255, 255, rng.choice([140, 200, 255])))
    # moon + glow
    dither_glow(img, 270, 36, 22, (200, 210, 255, 255), 50)
    for y in range(-16, 17):
        for x in range(-16, 17):
            if x * x + y * y <= 16 * 16:
                put(img, 270 + x, 36 + y, P["moon"])
    put(img, 266, 32, (210, 215, 235, 255))
    put(img, 274, 40, (210, 215, 235, 255))
    save(img, "backgrounds/sky.png")


def make_clouds():
    img = new(320, 70)

    def puff(cx, cy, w, h):
        for y in range(-h, h + 1):
            for x in range(-w, w + 1):
                if (x * x) / (w * w + 0.01) + (y * y) / (h * h + 0.01) <= 1:
                    put(img, cx + x, cy + y, P["cloud"])

    rng = random.Random(7)
    for i in range(7):
        cx = 18 + i * 46 + rng.randint(-4, 4)
        cy = 22 + rng.randint(-6, 8)
        puff(cx, cy, 20, 7)
        puff(cx + 12, cy + 2, 14, 6)
        puff(cx - 10, cy + 1, 12, 5)
    save(img, "backgrounds/clouds.png")


def make_skyline():
    # Content packed to TOP. Canvas tall enough for fog under buildings.
    img = new(480, 120)
    rng = random.Random(99)
    base = 100

    # atmospheric haze at bottom of this layer
    for y in range(90, 120):
        hline(img, 0, y, 480, (60, 50, 110, 20 + (y - 90)))

    def tower(x, h, w, body, accent=None):
        rect(img, x, base - h, w, h, body)
        windows(img, x + 1, base - h + 2, w - 2, h - 8, max(1, w // 4), max(2, h // 7), rng, accent or P["yellow"])
        if rng.random() < 0.4:
            hline(img, x, base - h - 1, w, P["magenta"] if rng.random() < 0.5 else P["cyan"])

    for i in range(22):
        tower(i * 21 + rng.randint(0, 3), rng.randint(24, 62), rng.randint(8, 15), P["deep"] if i % 2 else P["mid"])

    # Salesforce Tower (tall tapered)
    sx = 55
    for i, w in enumerate([16, 15, 14, 13, 12, 11, 10, 8, 6, 4]):
        y = base - 95 + i * 8
        rect(img, sx + (16 - w) // 2, y, w, 8, P["slate"])
        if i % 2 == 0:
            hline(img, sx + (16 - w) // 2 + 1, y + 3, w - 2, P["cyan_dim"])
    rect(img, sx + 5, base - 100, 6, 5, P["cyan"])
    dither_glow(img, sx + 8, base - 100, 8, P["cyan"], 70)

    # Transamerica Pyramid
    tx = 140
    for i in range(48):
        half = max(1, 16 - i // 3)
        hline(img, tx + 16 - half, base - 6 - i, half * 2, P["mid"] if i % 2 else P["slate"])
    put(img, tx + 16, base - 55, P["yellow"])

    # Ferry Building + clock tower
    fx = 220
    rect(img, fx, base - 30, 48, 30, P["slate"])
    windows(img, fx + 2, base - 26, 44, 16, 8, 2, rng, P["amber"])
    rect(img, fx + 20, base - 58, 8, 28, P["mid"])
    for i in range(10):
        hline(img, fx + 22 - i // 2, base - 58 - i, max(2, 4 - i // 2), P["orange"])
    rect(img, fx + 21, base - 50, 6, 6, P["yellow"])

    # Bay Bridge
    bx = 300
    rect(img, bx + 10, base - 50, 3, 50, P["orange"])
    rect(img, bx + 46, base - 50, 3, 50, P["orange"])
    hline(img, bx, base - 20, 70, P["orange"])
    for i in range(0, 70, 2):
        y = base - 20 - int(14 * abs(math.sin(i / 16)))
        put(img, bx + i, y, (255, 190, 90, 220))

    # Pier 39
    px = 390
    rect(img, px, base - 26, 50, 26, P["teal"])
    for i in range(6):
        rect(img, px + 4 + i * 7, base - 20, 4, 10, P["yellow"])
    rect(img, px + 14, base - 40, 20, 14, P["magenta"])
    pixel_text(img, px + 16, base - 36, "PIER", P["white"])
    hline(img, px, base - 27, 50, P["cyan"])

    # Painted Ladies
    colors = [P["purple"], P["pink"], P["blue"], P["orange"], P["cyan_dim"]]
    for i, c in enumerate(colors):
        x = 8 + i * 9
        rect(img, x, base - 28, 8, 28, c)
        rect(img, x + 2, base - 20, 2, 3, P["yellow"])
        hline(img, x, base - 29, 8, P["white"])

    save(img, "skyline/distant.png")


def streetlight(img, x, ground):
    vline(img, x, ground - 34, 34, P["slate"])
    hline(img, x - 6, ground - 34, 8, P["slate"])
    rect(img, x - 8, ground - 36, 5, 3, P["yellow"])
    dither_glow(img, x - 6, ground - 30, 10, P["amber"], 40)


def tree(img, x, ground):
    rect(img, x, ground - 12, 2, 12, (70, 45, 25, 255))
    rect(img, x - 4, ground - 20, 10, 10, (36, 150, 80, 255))
    put(img, x - 2, ground - 18, (60, 190, 100, 255))


def pedestrian(img, x, ground, rng):
    shirt = rng.choice([P["magenta"], P["cyan"], P["yellow"], P["green"], P["white"], P["orange"]])
    hair = rng.choice([P["black"], P["orange"], P["yellow"], P["purple"]])
    rect(img, x + 1, ground - 14, 3, 3, (255, 214, 170, 255))
    rect(img, x + 1, ground - 15, 3, 1, hair)
    rect(img, x, ground - 11, 5, 6, shirt)
    rect(img, x + 1, ground - 5, 1, 5, P["slate"])
    rect(img, x + 3, ground - 5, 1, 5, P["slate"])


def building(img, x, ground, w, h, body, neon, sign, rng):
    rect(img, x, ground - h, w, h, body)
    # cornice
    hline(img, x - 1, ground - h, w + 2, neon)
    windows(img, x + 3, ground - h + 10, w - 6, h - 34, 3, max(2, (h - 34) // 9), rng)
    # storefront glass
    rect(img, x + 3, ground - 20, w - 6, 12, P["glass"])
    for gx in range(x + 5, x + w - 5, 6):
        vline(img, gx, ground - 18, 8, (40, 60, 90, 180))
    # neon awning
    rect(img, x + 2, ground - 24, w - 4, 4, neon)
    # sign plaque
    rect(img, x + 4, ground - h + 3, w - 8, 7, (10, 10, 20, 230))
    pixel_text(img, x + 6, ground - h + 4, sign[:8], neon)
    # door
    rect(img, x + w // 2 - 3, ground - 14, 6, 14, (20, 24, 40, 255))
    put(img, x + w // 2 + 1, ground - 8, neon)
    # roof props
    rect(img, x + w - 9, ground - h - 5, 4, 5, P["slate"])
    put(img, x + w - 7, ground - h - 6, neon)


def make_midground():
    img = new(720, 140)
    rng = random.Random(21)
    ground = 124

    # sidewalk
    rect(img, 0, ground, 720, 16, (52, 56, 72, 255))
    for x in range(0, 720, 8):
        put(img, x, ground + 2, (70, 74, 90, 255))

    districts = [
        (8, 88, 72, P["blue"], P["cyan"], "ZOOX"),
        (88, 74, 64, P["brick"], P["magenta"], "ARCADE"),
        (160, 86, 58, P["purple"], P["pink"], "DRAGON"),
        (228, 78, 70, P["teal"], P["amber"], "RAMEN"),
        (308, 92, 54, P["red"], P["orange"], "TECH"),
        (372, 80, 68, P["mid"], P["cyan"], "MARKET"),
        (450, 84, 60, P["orange"], P["yellow"], "CABLE"),
        (520, 76, 66, P["green"], P["lime"], "WHARF"),
        (596, 82, 70, P["slate"], P["purple"], "LOMBARD"),
    ]

    for x, h, w, body, neon, sign in districts:
        building(img, x, ground, w, h, body, neon, sign, rng)
        streetlight(img, x + w + 3, ground)
        tree(img, x + w // 2, ground)
        if rng.random() < 0.8:
            pedestrian(img, x + 8, ground, rng)
        if rng.random() < 0.7:
            pedestrian(img, x + w - 12, ground, rng)

    # Chinatown lantern string
    for i in range(10):
        lx = 168 + i * 6
        rect(img, lx, ground - 96, 3, 4, P["red"])
        put(img, lx + 1, ground - 95, P["orange"])

    # Cable car
    rect(img, 460, ground - 18, 26, 12, P["red"])
    rect(img, 464, ground - 24, 10, 6, P["yellow"])
    rect(img, 470, ground - 22, 8, 4, P["glass"])
    put(img, 466, ground - 6, P["black"])
    put(img, 480, ground - 6, P["black"])
    hline(img, 450, ground - 1, 50, (180, 180, 190, 255))

    # Lombard zigzag rail
    for i in range(14):
        hline(img, 610 + (i % 2) * 2, ground - 50 - i * 2, 5, P["white"])

    save(img, "skyline/midground.png")


def make_road():
    img = new(320, 100)
    for y in range(100):
        shade = 30 + (y % 4)
        hline(img, 0, y, 320, (shade, shade + 3, shade + 12, 255))

    # wet sheen
    for y in (8, 28, 48, 68, 88):
        hline(img, 0, y, 320, (80, 100, 140, 40))

    # lane dashes for 3 lanes
    for y in (33, 66):
        x = 0
        while x < 320:
            hline(img, x, y, 12, P["lane"])
            x += 20

    # neon curb
    hline(img, 0, 0, 320, P["cyan"])
    hline(img, 0, 1, 320, P["cyan_dim"])
    hline(img, 0, 98, 320, P["magenta"])
    hline(img, 0, 99, 320, (120, 20, 90, 255))

    # streetlight reflection pools
    for x in (50, 140, 230, 300):
        dither_glow(img, x, 12, 14, P["amber"], 35)

    save(img, "roads/road.png")


def make_road_reflection():
    img = new(320, 100)
    for y in range(100):
        if y % 5 == 0:
            hline(img, 0, y, 320, (0, 240, 255, 16))
        if y % 7 == 0:
            hline(img, 40, y, 90, (255, 43, 214, 12))
        if y % 9 == 0:
            hline(img, 180, y, 70, (255, 216, 77, 10))
    save(img, "roads/reflections.png")


def draw_zoox(frame=0):
    img = new(72, 44)
    # underglow bloom
    dither_glow(img, 36, 36, 18, P["cyan"], 70)
    # body rounded-cube
    rect(img, 12, 12, 48, 20, P["zoox"])
    rect(img, 14, 10, 44, 5, P["zoox_dk"])
    # rounded corners illusion
    put(img, 12, 12, P["zoox_dk"])
    put(img, 59, 12, P["zoox_dk"])
    # glass
    rect(img, 16, 15, 40, 12, P["glass"])
    rect(img, 18, 17, 12, 8, (150, 90, 255, 140))
    rect(img, 42, 17, 12, 8, (150, 90, 255, 140))
    vline(img, 36, 14, 14, (25, 50, 90, 220))
    # sensors
    rect(img, 32, 5, 10, 5, P["slate"])
    put(img, 34, 4, P["cyan"])
    put(img, 39, 4, P["magenta"])
    rect(img, 9, 18, 3, 7, P["slate"])
    rect(img, 60, 18, 3, 7, P["slate"])
    put(img, 10, 20, P["cyan"])
    put(img, 61, 20, P["cyan"])
    # lights
    rect(img, 58, 22, 5, 3, P["white"])
    rect(img, 58, 26, 5, 3, P["yellow"])
    rect(img, 10, 22, 3, 5, P["red"])
    pixel_text(img, 22, 28, "ZOOX", P["white"])
    # wheels
    wy = 32 + (frame % 2)
    for wx in (18, 48):
        rect(img, wx, wy, 8, 8, P["black"])
        put(img, wx + 2, wy + 2, P["cyan"] if frame % 2 == 0 else P["white"])
        put(img, wx + 5, wy + 5, P["white"] if frame % 2 == 0 else P["cyan"])
    return img


def make_zoox():
    for i in range(2):
        save(draw_zoox(i), f"zoox/zoox_{i}.png")
    save(draw_zoox(0), "zoox/zoox.png")
    cone = new(56, 26)
    for x in range(56):
        spread = int(1 + (x / 55) * 11)
        for y in range(26):
            if abs(y - 13) <= spread:
                a = int((1 - x / 55) * 85)
                put(cone, x, y, (255, 255, 220, a))
    save(cone, "effects/headlight_cone.png")


def vehicle(body, accent, w=50, h=22, kind="car"):
    img = new(w + 10, h + 14)
    rect(img, 5, 7, w, h - 2, body)
    if kind == "bus":
        rect(img, 8, 4, w - 10, 8, accent)
        for i in range(5):
            rect(img, 10 + i * 9, 10, 6, 5, P["glass"])
    elif kind == "truck":
        rect(img, 8, 5, 16, 10, accent)
        rect(img, 26, 8, w - 24, 12, body)
        rect(img, 10, 8, 10, 6, P["glass"])
    else:
        rect(img, 12, 4, w - 18, 8, accent)
        rect(img, 14, 8, w - 22, 6, P["glass"])
    # facing left (oncoming)
    rect(img, 2, 13, 4, 3, P["yellow"])
    rect(img, w + 3, 13, 3, 4, P["red"])
    if kind == "taxi":
        rect(img, w // 2, 2, 8, 3, P["yellow"])
        put(img, w // 2 + 3, 1, P["white"])
    for wx in (12, w - 6):
        rect(img, wx, h + 3, 7, 7, P["black"])
        put(img, wx + 2, h + 5, P["slate"])
    return img


def make_traffic():
    specs = [
        ("sedan", P["orange"], P["yellow"], 48, 22, "car"),
        ("suv", P["purple"], P["magenta"], 50, 26, "car"),
        ("van", P["blue"], P["cyan"], 54, 24, "car"),
        ("taxi", P["yellow"], P["black"], 48, 22, "taxi"),
        ("ev", P["green"], P["cyan"], 48, 22, "car"),
        ("bus", P["red"], P["white"], 66, 28, "bus"),
        ("truck", P["slate"], P["orange"], 60, 28, "truck"),
    ]
    for name, body, accent, w, h, kind in specs:
        save(vehicle(body, accent, w, h, kind), f"traffic/{name}.png")


def person(shirt, hair):
    img = new(18, 30)
    rect(img, 6, 2, 6, 6, (255, 214, 170, 255))
    rect(img, 6, 1, 6, 2, hair)
    rect(img, 5, 9, 8, 10, shirt)
    rect(img, 13, 10, 3, 2, shirt)  # wave arm
    rect(img, 6, 19, 2, 8, P["slate"])
    rect(img, 10, 19, 2, 8, P["slate"])
    put(img, 6, 27, P["black"])
    put(img, 10, 27, P["black"])
    return img


def make_riders():
    for name, shirt, hair in [
        ("rider_a", P["magenta"], P["black"]),
        ("rider_b", P["cyan"], P["purple"]),
        ("rider_c", P["yellow"], P["orange"]),
        ("rider_d", P["green"], P["blue"]),
        ("rider_e", P["white"], P["red"]),
    ]:
        save(person(shirt, hair), f"riders/{name}.png")

    k = new(32, 44)
    dither_glow(k, 16, 8, 10, P["cyan"], 80)
    rect(k, 10, 12, 12, 28, P["slate"])
    rect(k, 8, 8, 16, 10, P["cyan"])
    # hologram diamond
    for i in range(7):
        hline(k, 16 - i, 1 + i, i * 2 + 1, (0, 240, 255, 200))
    for i in range(7):
        hline(k, 10 + i, 8 + i, 13 - i * 2, (0, 240, 255, 140))
    rect(k, 12, 20, 8, 7, P["blue"])
    put(k, 15, 23, P["white"])
    hline(k, 6, 40, 20, (0, 240, 255, 90))
    save(k, "riders/kiosk.png")


def make_effects():
    spark = new(16, 16)
    dither_glow(spark, 8, 8, 7, P["cyan"], 200)
    put(spark, 8, 8, P["white"])
    save(spark, "effects/pickup_spark.png")

    burst = new(28, 28)
    for i in range(16):
        ang = i / 16 * math.tau
        for d in range(2, 13):
            put(burst, 14 + int(math.cos(ang) * d), 14 + int(math.sin(ang) * d),
                P["magenta"] if i % 2 == 0 else P["cyan"])
    save(burst, "effects/neon_burst.png")

    rain = new(2, 10)
    vline(rain, 0, 0, 10, (190, 210, 255, 150))
    vline(rain, 1, 2, 7, (190, 210, 255, 80))
    save(rain, "effects/raindrop.png")

    frag = new(6, 6)
    rect(frag, 1, 1, 4, 4, P["orange"])
    put(frag, 0, 0, P["yellow"])
    save(frag, "effects/collision_fragment.png")


def make_ui():
    panel = new(100, 18)
    rect(panel, 0, 0, 100, 18, (8, 12, 28, 220))
    hline(panel, 0, 0, 100, P["cyan"])
    hline(panel, 0, 17, 100, P["cyan"])
    vline(panel, 0, 0, 18, P["cyan"])
    vline(panel, 99, 0, 18, P["cyan"])
    for x, y in [(1, 1), (98, 1), (1, 16), (98, 16)]:
        put(panel, x, y, P["magenta"])
    save(panel, "ui/hud_panel.png")

    heart = new(9, 8)
    for x, y in [(2, 1), (3, 1), (5, 1), (6, 1)]:
        put(heart, x, y, P["red"])
    for y in range(2, 7):
        for x in range(1 + max(0, y - 4), 8 - max(0, y - 4)):
            put(heart, x, y, P["red"])
    save(heart, "ui/heart.png")

    btn = new(80, 26)
    rect(btn, 0, 0, 80, 26, P["cyan"])
    rect(btn, 2, 2, 76, 22, P["blue"])
    hline(btn, 0, 0, 80, P["white"])
    save(btn, "ui/button.png")

    radar = new(52, 52)
    rect(radar, 0, 0, 52, 52, (5, 8, 22, 210))
    for i in range(52):
        put(radar, i, 0, P["green"])
        put(radar, i, 51, P["green"])
        put(radar, 0, i, P["green"])
        put(radar, 51, i, P["green"])
    hline(radar, 4, 17, 44, (64, 255, 160, 70))
    hline(radar, 4, 34, 44, (64, 255, 160, 70))
    save(radar, "ui/radar.png")


def make_menu_banner():
    img = new(320, 180)
    sky = Image.open(ROOT / "backgrounds" / "sky.png").resize((320, 180), Image.NEAREST)
    img.alpha_composite(sky, (0, 0))
    clouds = Image.open(ROOT / "backgrounds" / "clouds.png").resize((320, 70), Image.NEAREST)
    img.alpha_composite(clouds, (0, 20))
    distant = Image.open(ROOT / "skyline" / "distant.png").resize((320, 90), Image.NEAREST)
    img.alpha_composite(distant, (0, 55))
    mid = Image.open(ROOT / "skyline" / "midground.png").resize((320, 90), Image.NEAREST)
    img.alpha_composite(mid, (0, 78))
    road = Image.open(ROOT / "roads" / "road.png").resize((320, 50), Image.NEAREST)
    img.alpha_composite(road, (0, 130))
    save(img, "ui/menu_bg.png")


def main():
    random.seed(1994)
    make_sky()
    make_clouds()
    make_skyline()
    make_midground()
    make_road()
    make_road_reflection()
    make_zoox()
    make_traffic()
    make_riders()
    make_effects()
    make_ui()
    make_menu_banner()
    print("Pixel asset pack complete.")


if __name__ == "__main__":
    main()
