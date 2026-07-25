#!/usr/bin/env python3
"""
Reference-matched pixel pack for ZOOX FUTURE SF.

Targets the uploaded cabinet screenshot composition:
- dense neon shopfront row (mid band)
- landmark skyline behind shops
- wet dark road in lower third
- soft bloom glows / lamp pools
- detailed Zoox with light spill
"""

from __future__ import annotations

from pathlib import Path
from PIL import Image
import math
import random

ROOT = Path(__file__).resolve().parents[2] / "public" / "assets"
UPSCALE = 3

C = {
    "void": (6, 8, 22, 255),
    "navy": (10, 14, 36, 255),
    "deep": (18, 24, 56, 255),
    "mid": (34, 42, 80, 255),
    "slate": (56, 64, 98, 255),
    "steel": (82, 92, 124, 255),
    "brick": (118, 56, 86, 255),
    "brick2": (90, 42, 66, 255),
    "teal": (26, 100, 120, 255),
    "teal2": (18, 72, 94, 255),
    "road": (40, 44, 58, 255),
    "road2": (30, 34, 48, 255),
    "sidewalk": (62, 66, 82, 255),
    "lane": (240, 244, 255, 255),
    "cyan": (0, 245, 255, 255),
    "cyan2": (0, 185, 215, 255),
    "magenta": (255, 45, 210, 255),
    "pink": (255, 125, 195, 255),
    "purple": (135, 75, 255, 255),
    "blue": (55, 140, 255, 255),
    "blue2": (35, 90, 195, 255),
    "yellow": (255, 225, 80, 255),
    "amber": (255, 175, 60, 255),
    "orange": (255, 125, 40, 255),
    "red": (255, 70, 100, 255),
    "green": (75, 230, 135, 255),
    "lime": (175, 255, 80, 255),
    "white": (250, 252, 255, 255),
    "glass": (14, 20, 38, 255),
    "glass2": (24, 36, 62, 255),
    "zoox": (236, 240, 245, 255),
    "zoox2": (210, 216, 224, 255),
    "zoox3": (18, 20, 28, 255),
    "cabin": (10, 16, 28, 230),
    "moon": (240, 242, 255, 255),
    "cloud": (150, 130, 200, 170),
    "cloud2": (115, 100, 165, 125),
    "skin": (255, 214, 175, 255),
    "skin2": (220, 170, 130, 255),
    "black": (0, 0, 0, 255),
    "tree": (40, 155, 85, 255),
    "tree2": (28, 120, 65, 255),
    "wood": (95, 55, 32, 255),
    "trans": (0, 0, 0, 0),
}

GLYPHS = {
    "A": ["010", "101", "111", "101", "101"],
    "B": ["110", "101", "110", "101", "110"],
    "C": ["011", "100", "100", "100", "011"],
    "D": ["110", "101", "101", "101", "110"],
    "E": ["111", "100", "110", "100", "111"],
    "F": ["111", "100", "110", "100", "100"],
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
    "3": ["111", "001", "111", "001", "111"],
    "9": ["111", "101", "111", "001", "111"],
    "-": ["000", "000", "111", "000", "000"],
    "&": ["010", "101", "010", "101", "011"],
    ".": ["000", "000", "000", "000", "010"],
}


def new(w, h, color=None):
    return Image.new("RGBA", (w, h), color or C["trans"])


def put(img, x, y, color):
    x, y = int(x), int(y)
    if not (0 <= x < img.width and 0 <= y < img.height):
        return
    if color[3] >= 250:
        img.putpixel((x, y), color)
        return
    r0, g0, b0, a0 = img.getpixel((x, y))
    a = color[3] / 255.0
    r = int(r0 * (1 - a) + color[0] * a)
    g = int(g0 * (1 - a) + color[1] * a)
    b = int(b0 * (1 - a) + color[2] * a)
    img.putpixel((x, y), (r, g, b, min(255, a0 + color[3])))


def rect(img, x, y, w, h, color):
    for yy in range(int(h)):
        for xx in range(int(w)):
            put(img, x + xx, y + yy, color)


def hline(img, x, y, w, color):
    for i in range(int(w)):
        put(img, x + i, y, color)


def vline(img, x, y, h, color):
    for i in range(int(h)):
        put(img, x, y + i, color)


def glow(img, cx, cy, radius, color, strength=110):
    cr, cg, cb, _ = color
    for y in range(-radius, radius + 1):
        for x in range(-radius, radius + 1):
            d = math.sqrt(x * x + y * y)
            if d <= radius:
                a = int(strength * (1 - d / radius) ** 1.55)
                if a > 3:
                    put(img, cx + x, cy + y, (cr, cg, cb, a))


def save(img, rel):
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    big = img.resize((img.width * UPSCALE, img.height * UPSCALE), Image.NEAREST)
    big.save(path, "PNG")
    print(f"wrote {rel} {big.size[0]}x{big.size[1]}")


def text(img, x, y, s, color, tracking=4):
    cx = x
    for ch in s.upper():
        g = GLYPHS.get(ch, GLYPHS[" "])
        for row, line in enumerate(g):
            for col, bit in enumerate(line):
                if bit == "1":
                    put(img, cx + col, y + row, color)
        cx += tracking


def text_vert(img, x, y, s, color):
    cy = y
    for ch in s.upper():
        g = GLYPHS.get(ch, GLYPHS[" "])
        for row, line in enumerate(g):
            for col, bit in enumerate(line):
                if bit == "1":
                    put(img, x + col, cy + row, color)
        cy += 6


def brick_fill(img, x, y, w, h, c1, c2):
    for yy in range(h):
        for xx in range(w):
            row = yy // 3
            offset = (row % 2) * 2
            mortar = ((xx + offset) % 5 == 4) or (yy % 3 == 2)
            put(img, x + xx, y + yy, c2 if mortar else c1)


def windows(img, x, y, w, h, cols, rows, rng, chance=0.7):
    cw = max(3, w // cols)
    rh = max(3, h // rows)
    for r in range(rows):
        for c in range(cols):
            wx, wy = x + c * cw + 1, y + r * rh + 1
            ww, wh = max(1, cw - 2), max(1, rh - 2)
            if rng.random() < chance:
                col = rng.choice([C["yellow"], C["amber"], C["cyan2"], C["white"], C["pink"]])
                rect(img, wx, wy, ww, wh, col)
                if ww > 3:
                    vline(img, wx + ww // 2, wy, wh, (*C["glass"][:3], 90))
            else:
                rect(img, wx, wy, ww, wh, C["glass"])


# ---------------- SKY / CLOUDS ----------------

def make_sky():
    img = new(400, 220)
    # purple-navy night like reference
    for y in range(220):
        t = y / 219
        r = int(12 + 28 * t)
        g = int(10 + 12 * t)
        b = int(40 + 55 * t)
        hline(img, 0, y, 400, (r, g, b, 255))
    rng = random.Random(42)
    for _ in range(180):
        put(img, rng.randint(0, 399), rng.randint(0, 130), (255, 255, 255, rng.choice([130, 190, 255])))
    glow(img, 335, 48, 30, (200, 205, 255, 255), 60)
    for y in range(-20, 21):
        for x in range(-20, 21):
            if x * x + y * y <= 20 * 20:
                put(img, 335 + x, 48 + y, C["moon"])
    put(img, 328, 42, (215, 218, 235, 255))
    put(img, 340, 54, (215, 218, 235, 255))
    save(img, "backgrounds/sky.png")


def make_clouds():
    img = new(400, 90)

    def puff(cx, cy, w, h, col):
        for y in range(-h, h + 1):
            for x in range(-w, w + 1):
                if (x * x) / (w * w + 0.01) + (y * y) / (h * h + 0.01) <= 1:
                    put(img, cx + x, cy + y, col)

    rng = random.Random(7)
    for i in range(9):
        cx = 16 + i * 44 + rng.randint(-4, 4)
        cy = 30 + rng.randint(-8, 10)
        puff(cx, cy, 24, 9, C["cloud"])
        puff(cx + 14, cy + 2, 16, 7, C["cloud"])
        puff(cx - 12, cy + 2, 14, 6, C["cloud2"])
    save(img, "backgrounds/clouds.png")


# ---------------- SKYLINE ----------------

def make_skyline():
    img = new(640, 150)
    rng = random.Random(99)
    base = 130

    for y in range(110, 150):
        hline(img, 0, y, 640, (70, 50, 120, 10 + (y - 110)))

    def tower(x, h, w):
        body = rng.choice([C["deep"], C["mid"], C["navy"]])
        rect(img, x, base - h, w, h, body)
        windows(img, x + 1, base - h + 2, w - 2, h - 6, max(1, w // 4), max(2, h // 8), rng, 0.55)
        if rng.random() < 0.3:
            hline(img, x, base - h - 1, w, rng.choice([C["magenta"], C["cyan"], C["amber"]]))

    for i in range(32):
        tower(i * 20 + rng.randint(0, 2), rng.randint(20, 55), rng.randint(8, 15))

    # Salesforce
    sx = 80
    for i, w in enumerate([20, 19, 18, 16, 15, 14, 12, 10, 8, 6, 4]):
        y = base - 118 + i * 9
        rect(img, sx + (20 - w) // 2, y, w, 9, C["slate"] if i % 2 == 0 else C["steel"])
        if i % 2 == 0:
            hline(img, sx + (20 - w) // 2 + 1, y + 3, max(1, w - 2), C["cyan2"])
    rect(img, sx + 7, base - 124, 6, 6, C["cyan"])
    glow(img, sx + 10, base - 124, 12, C["cyan"], 100)

    # Transamerica
    tx = 180
    for i in range(62):
        half = max(1, 20 - i // 3)
        hline(img, tx + 20 - half, base - 4 - i, half * 2, C["mid"] if i % 3 else C["slate"])
    put(img, tx + 20, base - 66, C["yellow"])
    glow(img, tx + 20, base - 64, 7, C["amber"], 70)

    # Coit Tower
    rect(img, 270, base - 72, 8, 50, C["steel"])
    rect(img, 268, base - 78, 12, 8, C["slate"])
    for i in range(6):
        hline(img, 271, base - 78 - i, max(2, 6 - i), C["white"])

    # Ferry Building
    fx = 300
    rect(img, fx, base - 36, 58, 36, C["slate"])
    windows(img, fx + 2, base - 32, 54, 14, 10, 2, rng, 0.85)
    for i in range(7):
        rect(img, fx + 5 + i * 7, base - 14, 5, 10, C["glass"])
    rect(img, fx + 25, base - 70, 10, 34, C["mid"])
    for i in range(12):
        hline(img, fx + 27 - i // 2, base - 70 - i, max(2, 6 - i // 2), C["orange"])
    rect(img, fx + 26, base - 60, 8, 8, C["yellow"])
    glow(img, fx + 30, base - 56, 8, C["amber"], 75)

    # Golden Gate Bridge silhouette (reference energy, SF-correct)
    gx = 400
    for tower_x in (gx + 14, gx + 58):
        rect(img, tower_x, base - 70, 5, 70, C["orange"])
        rect(img, tower_x - 2, base - 70, 9, 4, C["amber"])
        # cross braces
        for by in range(base - 60, base - 10, 10):
            hline(img, tower_x, by, 5, C["amber"])
    hline(img, gx, base - 28, 95, C["orange"])
    hline(img, gx, base - 27, 95, C["amber"])
    for i in range(0, 95, 2):
        y = base - 28 - int(18 * abs(math.sin(i / 20)))
        put(img, gx + i, y, (255, 140, 50, 230))
    for i in range(0, 95, 5):
        put(img, gx + i, base - 29, C["yellow"])

    # Pier 39 / Ferris-ish wheel cue
    px = 530
    rect(img, px, base - 28, 50, 28, C["teal"])
    # wheel
    cx, cy, rad = px + 22, base - 42, 16
    for a in range(0, 360, 12):
        ang = math.radians(a)
        put(img, cx + int(math.cos(ang) * rad), cy + int(math.sin(ang) * rad), C["magenta"])
    glow(img, cx, cy, 10, C["magenta"], 60)
    text(img, px + 8, base - 20, "PIER39", C["white"], 4)

    # Painted Ladies
    for i, col in enumerate([C["purple"], C["pink"], C["blue"], C["orange"], C["cyan2"]]):
        x = 12 + i * 11
        rect(img, x, base - 34, 10, 34, col)
        rect(img, x + 2, base - 24, 6, 8, C["glass2"])
        put(img, x + 3, base - 22, C["yellow"])
        put(img, x + 6, base - 22, C["yellow"])
        for k in range(5):
            hline(img, x + 5 - k, base - 35 - k, k * 2 + 1, C["white"])

    # Vertical neon blade signs (JP / Chinatown vibe)
    rect(img, 58, base - 95, 7, 52, C["black"])
    rect(img, 59, base - 94, 5, 50, C["green"])
    text_vert(img, 60, base - 90, "SF", C["white"])
    glow(img, 61, base - 70, 8, C["green"], 70)

    rect(img, 510, base - 88, 7, 48, C["black"])
    rect(img, 511, base - 87, 5, 46, C["red"])
    text_vert(img, 512, base - 84, "CHINA", C["yellow"])
    glow(img, 513, base - 64, 8, C["red"], 65)

    # Lombard zigzag cue
    rect(img, 560, base - 55, 36, 12, C["black"])
    text(img, 562, base - 52, "LOMBARD", C["green"], 3)
    for i, dy in enumerate([0, 2, 0, 2, 0, 2]):
        hline(img, 562 + i * 5, base - 40 + dy, 5, C["green"])
    glow(img, 578, base - 48, 8, C["green"], 45)

    # Cable car
    rect(img, 350, base - 22, 28, 12, C["red"])
    rect(img, 352, base - 19, 8, 6, C["yellow"])
    rect(img, 362, base - 19, 10, 6, C["yellow"])
    rect(img, 352, base - 10, 5, 5, C["black"])
    rect(img, 370, base - 10, 5, 5, C["black"])
    hline(img, 340, base - 8, 55, C["steel"])

    # Bay Bridge spans (right)
    for i in range(0, 90, 2):
        y = base - 55 - int(10 * math.sin(i / 18))
        put(img, 545 + i, y, C["magenta"])
        put(img, 545 + i, y + 8, (255, 90, 180, 180))
    for bx in (555, 595, 625):
        rect(img, bx, base - 70, 3, 40, C["pink"])

    save(img, "skyline/distant.png")


# ---------------- MIDGROUND SHOPS (reference style) ----------------

def lamp(img, x, ground):
    vline(img, x, ground - 46, 46, C["steel"])
    vline(img, x + 1, ground - 46, 46, C["slate"])
    hline(img, x - 9, ground - 46, 12, C["steel"])
    rect(img, x - 11, ground - 50, 7, 5, C["yellow"])
    glow(img, x - 8, ground - 42, 16, C["amber"], 70)
    glow(img, x - 4, ground - 2, 12, C["amber"], 35)


def tree(img, x, ground):
    # rounded canopy like reference
    rect(img, x, ground - 16, 3, 16, C["wood"])
    for r, col in ((11, C["tree2"]), (8, C["tree"])):
        for y in range(-r, r + 1):
            for xx in range(-r, r + 1):
                if xx * xx + y * y <= r * r:
                    put(img, x + 1 + xx, ground - 24 + y, col)
    # shadow
    rect(img, x - 4, ground - 1, 12, 2, (0, 0, 0, 55))


def ped(img, x, ground, rng, wave=False):
    skin = rng.choice([C["skin"], C["skin2"]])
    hair = rng.choice([C["black"], C["orange"], C["yellow"], C["purple"], C["red"], C["white"]])
    shirt = rng.choice([C["magenta"], C["cyan"], C["yellow"], C["green"], C["white"], C["orange"], C["pink"], C["blue"]])
    pants = rng.choice([C["deep"], C["slate"], C["navy"]])
    rect(img, x - 3, ground - 1, 10, 2, (0, 0, 0, 50))  # shadow
    rect(img, x + 1, ground - 17, 4, 4, skin)
    rect(img, x + 1, ground - 18, 4, 2, hair)
    put(img, x + 2, ground - 15, C["black"])
    put(img, x + 4, ground - 15, C["black"])
    rect(img, x, ground - 13, 6, 7, shirt)
    if wave:
        rect(img, x + 6, ground - 12, 3, 2, shirt)
        put(img, x + 8, ground - 13, skin)
    rect(img, x + 1, ground - 6, 2, 5, pants)
    rect(img, x + 3, ground - 6, 2, 5, pants)
    put(img, x + 1, ground - 1, C["black"])
    put(img, x + 3, ground - 1, C["black"])


def shop(img, x, ground, w, h, body, accent, title, sub, rng, kind="std"):
    # building body
    if kind == "brick":
        brick_fill(img, x, ground - h, w, h, body, C["brick2"])
    else:
        rect(img, x, ground - h, w, h, body)
        for px in range(x + 5, x + w - 4, 7):
            vline(img, px, ground - h + 10, h - 36, (*C["black"][:3], 22))

    # roof lip + glow
    hline(img, x - 1, ground - h, w + 2, accent)
    hline(img, x, ground - h + 1, w, C["white"])
    glow(img, x + w // 2, ground - h, 10, accent, 45)

    # roof clutter
    rect(img, x + w - 14, ground - h - 7, 7, 7, C["slate"])
    put(img, x + w - 11, ground - h - 8, accent)

    # upper floors
    windows(img, x + 4, ground - h + 14, w - 8, max(16, h - 48), 3, max(2, (h - 48) // 11), rng, 0.75)

    # main neon sign board
    rect(img, x + 4, ground - h + 3, w - 8, 10, C["black"])
    rect(img, x + 5, ground - h + 4, w - 10, 8, accent)
    for i in range(0, 8, 2):
        hline(img, x + 5, ground - h + 4 + i, w - 10, (255, 255, 255, 28))
    text(img, x + 7, ground - h + 5, title[:10], C["white"], 4)

    # subtitle strip (ARCADE 8-BIT style)
    if sub:
        rect(img, x + 6, ground - 40, w - 12, 7, C["black"])
        text(img, x + 8, ground - 39, sub[:12], accent, 4)

    # striped awning
    for i in range(6):
        col = accent if i % 2 == 0 else C["white"]
        hline(img, x + 2, ground - 30 + i, w - 4, col)
    for sx in range(x + 3, x + w - 3, 3):
        vline(img, sx, ground - 30, 4, (*C["black"][:3], 35))

    # glass storefront
    rect(img, x + 3, ground - 24, w - 6, 16, C["glass"])
    for i in range(4):
        vline(img, x + 7 + i * 6, ground - 22, 12, (0, 245, 255, 40))
    # door
    dw = 9
    dx = x + w // 2 - dw // 2
    rect(img, dx, ground - 20, dw, 20, C["glass2"])
    vline(img, dx + dw // 2, ground - 20, 20, C["steel"])
    put(img, dx + dw - 2, ground - 11, accent)

    # sidewalk neon spill
    glow(img, x + w // 2, ground - 3, 14, accent, 30)

    # blade sign
    if kind in ("blade", "brick") and w > 55:
        bx = x + w + 1
        rect(img, bx, ground - h + 10, 8, 40, C["black"])
        rect(img, bx + 1, ground - h + 11, 6, 38, accent)
        text_vert(img, bx + 2, ground - h + 14, title[:6], C["white"])
        glow(img, bx + 4, ground - h + 28, 9, accent, 55)


def make_midground():
    img = new(960, 180)
    rng = random.Random(21)
    ground = 154

    # sidewalk
    rect(img, 0, ground, 960, 26, C["sidewalk"])
    for x in range(0, 960, 5):
        put(img, x, ground + 2, (78, 82, 98, 255))
        put(img, x + 2, ground + 12, (50, 54, 70, 255))
    hline(img, 0, ground - 1, 960, C["cyan2"])
    hline(img, 0, ground, 960, (18, 20, 30, 255))

    # Reference-inspired SF shop row (taller, denser)
    shops = [
        (4, 118, 96, C["blue2"], C["cyan"], "ZOOX", "STATION", "std"),
        (108, 104, 82, C["brick"], C["magenta"], "ARCADE", "8-BIT", "brick"),
        (200, 112, 78, C["purple"], C["pink"], "NEON", "DRAGON", "blade"),
        (288, 106, 88, C["teal"], C["amber"], "HONGKONG", "RAMEN", "std"),
        (386, 120, 72, C["red"], C["orange"], "TECHNO", "CITY", "blade"),
        (468, 108, 84, C["mid"], C["cyan"], "MARKET", "ST", "std"),
        (562, 110, 76, C["orange"], C["yellow"], "CABLE", "CAR", "std"),
        (648, 102, 80, C["green"], C["lime"], "WHARF", "PIER", "blade"),
        (738, 114, 78, C["slate"], C["purple"], "LOMBARD", "HILL", "std"),
        (826, 108, 86, C["brick2"], C["pink"], "CHINA", "TOWN", "brick"),
    ]

    for x, h, w, body, accent, title, sub, kind in shops:
        shop(img, x, ground, w, h, body, accent, title, sub, rng, kind)

        if title == "ZOOX":
            # garage bay like reference
            rect(img, x + 12, ground - 24, w - 24, 20, C["glass2"])
            for gy in range(ground - 22, ground - 4, 3):
                hline(img, x + 14, gy, w - 28, C["cyan2"])
            text(img, x + 22, ground - 16, "OPEN", C["cyan"], 4)

        if title == "ARCADE":
            for i in range(0, w - 6, 3):
                put(img, x + 3 + i, ground - h - 2, rng.choice([C["cyan"], C["magenta"], C["yellow"], C["lime"]]))

        lamp(img, x + w + 5, ground)
        tree(img, x + max(10, w // 3), ground)
        ped(img, x + 12, ground, rng, wave=rng.random() < 0.45)
        ped(img, x + w - 16, ground, rng, wave=False)
        if rng.random() < 0.5:
            ped(img, x + w // 2 - 2, ground, rng, wave=rng.random() < 0.4)

    # Chinatown lanterns
    for i in range(18):
        lx = 210 + i * 7
        vline(img, lx + 1, ground - 122, 10, C["steel"])
        rect(img, lx, ground - 112, 4, 5, C["red"])
        put(img, lx + 1, ground - 111, C["orange"])
        glow(img, lx + 2, ground - 110, 4, C["orange"], 45)

    # Cable car
    rect(img, 575, ground - 22, 34, 16, C["red"])
    rect(img, 579, ground - 30, 14, 9, C["yellow"])
    rect(img, 583, ground - 28, 10, 5, C["glass"])
    put(img, 582, ground - 6, C["black"])
    put(img, 600, ground - 6, C["black"])
    hline(img, 560, ground - 2, 70, (195, 195, 205, 255))
    vline(img, 590, ground - 44, 16, C["steel"])
    hline(img, 590, ground - 44, 12, C["steel"])

    # Lombard zigzag
    for i in range(20):
        hline(img, 755 + (i % 2) * 3, ground - 60 - i * 2, 7, C["white"])
        put(img, 757 + (i % 2) * 3, ground - 59 - i * 2, C["green"])

    save(img, "skyline/midground.png")


# ---------------- ROAD ----------------

def make_road():
    img = new(400, 120)
    for y in range(120):
        t = y / 119
        shade = int(32 + 10 * t + (y % 3))
        hline(img, 0, y, 400, (shade, shade + 2, shade + 12, 255))

    # wet reflective bands
    for y in (8, 22, 36, 50, 64, 78, 92, 106):
        hline(img, 0, y, 400, (95, 115, 155, 32))
        hline(img, 30, y + 1, 110, (0, 245, 255, 16))
        hline(img, 180, y + 2, 90, (255, 45, 210, 12))
        hline(img, 300, y + 1, 70, (255, 225, 80, 10))

    # 3-lane dashes
    for y in (40, 80):
        x = 0
        while x < 400:
            hline(img, x, y, 16, C["lane"])
            hline(img, x, y + 1, 16, (180, 190, 220, 150))
            x += 24

    # neon curbs
    hline(img, 0, 0, 400, C["cyan"])
    hline(img, 0, 1, 400, C["cyan2"])
    hline(img, 0, 118, 400, C["magenta"])
    hline(img, 0, 119, 400, C["pink"])

    # lamp pools
    for x in (50, 140, 230, 320):
        glow(img, x, 16, 18, C["amber"], 45)
        glow(img, x + 20, 55, 14, C["cyan"], 22)

    save(img, "roads/road.png")


def make_road_reflection():
    img = new(400, 120)
    for y in range(120):
        if y % 4 == 0:
            hline(img, 0, y, 400, (0, 245, 255, 15))
        if y % 6 == 0:
            hline(img, 40, y, 110, (255, 45, 210, 12))
        if y % 8 == 0:
            hline(img, 200, y, 90, (255, 225, 80, 10))
    save(img, "roads/reflections.png")


# ---------------- ZOOX ----------------

def draw_zoox(frame=0):
    """White/black robotaxi with cyan neon underglow (menu reference)."""
    img = new(96, 56)
    # soft headlight / underglow spills
    glow(img, 78, 30, 16, C["cyan"], 70)
    glow(img, 78, 32, 10, C["white"], 40)
    glow(img, 48, 48, 26, C["cyan"], 100)
    glow(img, 20, 30, 10, C["red"], 40)

    # ground shadow
    rect(img, 20, 48, 58, 4, (0, 0, 0, 70))

    # white boxy body + black lower trim (reference)
    rect(img, 16, 14, 62, 26, C["zoox"])
    rect(img, 18, 11, 58, 6, C["zoox2"])
    hline(img, 20, 10, 54, C["zoox3"])
    vline(img, 16, 14, 26, C["zoox3"])
    vline(img, 77, 14, 26, C["zoox3"])
    rect(img, 17, 30, 60, 10, C["zoox3"])  # black lower panel
    hline(img, 20, 28, 54, C["cyan"])       # cyan belt line

    # glass
    rect(img, 20, 16, 52, 12, C["glass"])
    rect(img, 22, 18, 18, 8, C["cabin"])
    rect(img, 50, 18, 20, 8, C["cabin"])
    hline(img, 22, 17, 16, (0, 245, 255, 90))
    hline(img, 50, 17, 18, (0, 245, 255, 90))
    vline(img, 46, 15, 18, C["zoox3"])

    # roof lidar / sensors — cyan neon
    rect(img, 40, 5, 16, 6, C["zoox3"])
    rect(img, 42, 4, 12, 3, C["steel"])
    put(img, 44, 3, C["cyan"])
    put(img, 52, 3, C["cyan"])
    glow(img, 48, 4, 6, C["cyan"], 110)
    rect(img, 12, 20, 4, 9, C["zoox3"])
    rect(img, 80, 20, 4, 9, C["zoox3"])
    put(img, 13, 22, C["cyan"])
    put(img, 81, 22, C["cyan"])

    # lights
    rect(img, 76, 32, 6, 4, C["white"])
    rect(img, 76, 36, 6, 3, C["yellow"])
    rect(img, 14, 32, 3, 6, C["red"])
    put(img, 14, 33, C["pink"])
    if frame % 2:
        put(img, 75, 22, C["amber"])
        put(img, 16, 22, C["amber"])

    text(img, 30, 34, "ZOOX", C["cyan"], 4)

    # wheels
    wy = 42 + (frame % 2)
    for wx in (24, 62):
        rect(img, wx - 1, 40, 11, 2, C["zoox3"])
        rect(img, wx, wy, 10, 10, C["black"])
        rect(img, wx + 1, wy + 1, 8, 8, C["slate"])
        if frame % 2 == 0:
            hline(img, wx + 2, wy + 5, 6, C["cyan"])
            put(img, wx + 4, wy + 3, C["white"])
        else:
            vline(img, wx + 5, wy + 2, 6, C["cyan"])
            put(img, wx + 3, wy + 5, C["white"])
        put(img, wx + 1, wy + 1, C["steel"])
    return img


def make_zoox():
    for i in range(2):
        save(draw_zoox(i), f"zoox/zoox_{i}.png")
    save(draw_zoox(0), "zoox/zoox.png")

    # soft headlight cone spill
    cone = new(72, 32)
    for x in range(72):
        spread = int(1 + (x / 71) * 14)
        for y in range(32):
            if abs(y - 16) <= spread:
                a = int((1 - x / 71) * 100)
                if abs(y - 16) < spread * 0.35:
                    put(cone, x, y, (220, 255, 230, a))  # cyan-green like reference
                else:
                    put(cone, x, y, (120, 230, 255, a // 2))
    save(cone, "effects/headlight_cone.png")

    # soft oval ground shadow sprite
    sh = new(48, 12)
    for y in range(12):
        for x in range(48):
            nx = (x - 24) / 24
            ny = (y - 6) / 6
            if nx * nx + ny * ny <= 1:
                a = int(90 * (1 - (nx * nx + ny * ny)))
                put(sh, x, y, (0, 0, 0, a))
    save(sh, "effects/shadow.png")

    # rear red light spill
    red = new(28, 18)
    glow(red, 14, 9, 12, C["red"], 100)
    save(red, "effects/taillight_glow.png")


# ---------------- TRAFFIC / RIDERS / FX / UI ----------------

def vehicle(body, accent, w=54, h=24, kind="car"):
    img = new(w + 14, h + 18)
    rect(img, 8, h + 10, w, 3, (0, 0, 0, 55))
    rect(img, 7, 8, w, h - 2, body)
    if kind == "bus":
        rect(img, 9, 4, w - 6, 8, accent)
        for i in range(6):
            rect(img, 11 + i * 9, 10, 7, 6, C["glass"])
    elif kind == "truck":
        rect(img, 9, 5, 18, 12, accent)
        rect(img, 29, 9, w - 24, 12, body)
        rect(img, 11, 8, 12, 7, C["glass"])
    elif kind == "taxi":
        rect(img, 15, 4, w - 20, 8, accent)
        rect(img, 17, 9, w - 24, 7, C["glass"])
        rect(img, w // 2 + 2, 2, 9, 3, C["yellow"])
        text(img, 18, h, "TAXI", C["black"], 4)
    else:
        rect(img, 15, 4, w - 20, 8, accent)
        rect(img, 17, 9, w - 24, 7, C["glass"])
        hline(img, 19, 10, 10, (200, 230, 255, 70))
    rect(img, 3, 14, 5, 3, C["yellow"])
    glow(img, 5, 15, 5, C["yellow"], 55)
    rect(img, w + 6, 14, 3, 4, C["red"])
    glow(img, w + 7, 16, 4, C["red"], 40)
    for wx in (16, w - 2):
        rect(img, wx, h + 5, 8, 8, C["black"])
        rect(img, wx + 1, h + 6, 6, 6, C["slate"])
    return img


def make_traffic():
    for name, body, accent, w, h, kind in [
        ("sedan", C["orange"], C["amber"], 52, 22, "car"),
        ("suv", C["purple"], C["magenta"], 54, 26, "car"),
        ("van", C["blue"], C["cyan"], 58, 24, "car"),
        ("taxi", C["yellow"], C["black"], 52, 22, "taxi"),
        ("ev", C["green"], C["cyan"], 52, 22, "car"),
        ("bus", C["red"], C["white"], 72, 28, "bus"),
        ("truck", C["slate"], C["orange"], 66, 28, "truck"),
    ]:
        save(vehicle(body, accent, w, h, kind), f"traffic/{name}.png")


def person(shirt, hair):
    img = new(20, 34)
    rect(img, 4, 31, 12, 2, (0, 0, 0, 55))
    rect(img, 7, 2, 6, 6, C["skin"])
    rect(img, 7, 1, 6, 2, hair)
    put(img, 8, 4, C["black"])
    put(img, 11, 4, C["black"])
    rect(img, 6, 9, 8, 11, shirt)
    rect(img, 14, 10, 4, 2, shirt)
    put(img, 17, 9, C["skin"])
    rect(img, 7, 20, 2, 10, C["deep"])
    rect(img, 11, 20, 2, 10, C["deep"])
    put(img, 7, 30, C["black"])
    put(img, 11, 30, C["black"])
    return img


def make_riders():
    for name, shirt, hair in [
        ("rider_a", C["magenta"], C["black"]),
        ("rider_b", C["cyan"], C["purple"]),
        ("rider_c", C["yellow"], C["orange"]),
        ("rider_d", C["green"], C["blue"]),
        ("rider_e", C["white"], C["red"]),
    ]:
        save(person(shirt, hair), f"riders/{name}.png")

    k = new(36, 50)
    glow(k, 18, 12, 14, C["cyan"], 100)
    rect(k, 16, 20, 4, 26, C["steel"])
    rect(k, 8, 12, 20, 14, C["slate"])
    rect(k, 10, 14, 16, 10, C["cyan"])
    text(k, 14, 16, "Z", C["white"], 4)
    for i in range(8):
        hline(k, 18 - i, 2 + i, i * 2 + 1, (0, 245, 255, 210))
    for i in range(8):
        hline(k, 11 + i, 10 + i, 15 - i * 2, (0, 245, 255, 120))
    rect(k, 10, 44, 16, 4, C["mid"])
    rect(k, 8, 47, 20, 2, (0, 0, 0, 60))
    save(k, "riders/kiosk.png")


def make_effects():
    spark = new(18, 18)
    glow(spark, 9, 9, 8, C["cyan"], 220)
    put(spark, 9, 9, C["white"])
    save(spark, "effects/pickup_spark.png")

    burst = new(32, 32)
    for i in range(18):
        ang = i / 18 * math.tau
        for d in range(2, 15):
            put(burst, 16 + int(math.cos(ang) * d), 16 + int(math.sin(ang) * d),
                C["magenta"] if i % 2 == 0 else C["cyan"])
    save(burst, "effects/neon_burst.png")

    rain = new(3, 12)
    vline(rain, 1, 0, 12, (200, 220, 255, 160))
    vline(rain, 0, 2, 8, (200, 220, 255, 70))
    save(rain, "effects/raindrop.png")

    frag = new(7, 7)
    rect(frag, 1, 1, 5, 5, C["orange"])
    put(frag, 0, 0, C["yellow"])
    save(frag, "effects/collision_fragment.png")


def make_ui():
    # Solid arcade top bar like reference
    bar = new(320, 22)
    rect(bar, 0, 0, 320, 22, (12, 20, 48, 245))
    hline(bar, 0, 0, 320, C["cyan"])
    hline(bar, 0, 21, 320, C["magenta"])
    save(bar, "ui/hud_bar.png")

    panel = new(108, 20)
    rect(panel, 0, 0, 108, 20, (8, 14, 34, 230))
    hline(panel, 0, 0, 108, C["cyan"])
    hline(panel, 0, 19, 108, C["cyan"])
    vline(panel, 0, 0, 20, C["cyan"])
    vline(panel, 107, 0, 20, C["cyan"])
    save(panel, "ui/hud_panel.png")

    heart = new(11, 10)
    for x, y in [(2, 2), (3, 1), (4, 2), (6, 2), (7, 1), (8, 2)]:
        put(heart, x, y, C["red"])
    for y in range(2, 8):
        for x in range(1 + max(0, y - 4), 10 - max(0, y - 4)):
            put(heart, x, y, C["red"])
    put(heart, 3, 3, C["pink"])
    save(heart, "ui/heart.png")

    btn = new(84, 28)
    rect(btn, 0, 0, 84, 28, C["cyan"])
    rect(btn, 2, 2, 80, 24, C["blue"])
    hline(btn, 0, 0, 84, C["white"])
    save(btn, "ui/button.png")

    # Minimap like reference
    radar = new(64, 64)
    rect(radar, 0, 0, 64, 64, (8, 14, 30, 220))
    for i in range(64):
        put(radar, i, 0, C["green"])
        put(radar, i, 63, C["green"])
        put(radar, 0, i, C["green"])
        put(radar, 63, i, C["green"])
    for i in range(8, 64, 8):
        hline(radar, 2, i, 60, (70, 255, 160, 40))
        vline(radar, i, 2, 60, (70, 255, 160, 28))
    # three lanes
    hline(radar, 6, 20, 52, (70, 255, 160, 90))
    hline(radar, 6, 32, 52, (70, 255, 160, 90))
    hline(radar, 6, 44, 52, (70, 255, 160, 90))
    save(radar, "ui/radar.png")


def make_menu_banner():
    """Full-bleed neon SF night plate used under the start menu UI."""
    # Native 426x240 then upscaled x3 → 1278x720 (near 1280x720)
    W, H = 426, 240
    img = new(W, H)
    sky = Image.open(ROOT / "backgrounds" / "sky.png").resize((W, H), Image.NEAREST)
    img.alpha_composite(sky, (0, 0))
    clouds = Image.open(ROOT / "backgrounds" / "clouds.png").resize((W, 70), Image.NEAREST)
    img.alpha_composite(clouds, (0, 12))
    distant = Image.open(ROOT / "skyline" / "distant.png").resize((W, 110), Image.NEAREST)
    img.alpha_composite(distant, (0, 36))
    mid = Image.open(ROOT / "skyline" / "midground.png").resize((W, 100), Image.NEAREST)
    img.alpha_composite(mid, (0, 82))
    road = Image.open(ROOT / "roads" / "road.png").resize((W, 70), Image.NEAREST)
    img.alpha_composite(road, (0, 170))
    refl = Image.open(ROOT / "roads" / "reflections.png").resize((W, 70), Image.NEAREST)
    img.alpha_composite(refl, (0, 170))

    # Soft center readability veil (keeps title/buttons legible)
    for x in range(W):
        t = abs(x - W / 2) / (W * 0.42)
        if t < 1:
            a = int((1 - t) * 70)
            vline(img, x, 0, H, (5, 8, 22, a))
    for y in range(28):
        a = int((1 - y / 28) * 90)
        hline(img, 0, y, W, (5, 8, 22, a))
        hline(img, 0, H - 1 - y, W, (5, 8, 22, a))

    # Extra neon bloom accents + landmark signs matching the mock
    glow(img, 70, 100, 18, C["green"], 55)
    glow(img, 300, 90, 16, C["red"], 50)
    glow(img, 360, 70, 22, C["magenta"], 40)
    glow(img, 390, 40, 20, C["moon"], 35)

    # Vertical green "SF" blade (left) — stands in for JP neon
    rect(img, 18, 70, 10, 70, C["black"])
    rect(img, 19, 71, 8, 68, C["green"])
    text_vert(img, 21, 78, "SF", C["white"])
    glow(img, 23, 105, 12, C["green"], 80)

    # Pier 39 sign
    rect(img, 250, 95, 52, 16, C["black"])
    rect(img, 251, 96, 50, 14, C["red"])
    text(img, 255, 99, "PIER39", C["white"], 4)
    glow(img, 276, 103, 12, C["red"], 70)

    # Chinatown blade
    rect(img, 320, 78, 10, 62, C["black"])
    rect(img, 321, 79, 8, 60, C["red"])
    text_vert(img, 323, 84, "CHINA", C["yellow"])
    glow(img, 325, 108, 12, C["red"], 70)

    # Lombard sign
    rect(img, 350, 118, 48, 14, C["black"])
    rect(img, 351, 119, 46, 12, C["green"])
    text(img, 354, 122, "LOMBARD", C["white"], 3)
    for i, dy in enumerate([0, 2, 0, 2, 0, 2]):
        hline(img, 354 + i * 6, 136 + dy, 5, C["green"])
    glow(img, 374, 125, 10, C["green"], 55)

    save(img, "ui/menu_bg.png")
    # Convenience alias for tooling / Expo preview (already upscaled by save)
    (ROOT / "backgrounds").mkdir(parents=True, exist_ok=True)
    Image.open(ROOT / "ui" / "menu_bg.png").save(ROOT / "backgrounds" / "sf_night_bg.png", "PNG")
    Image.open(ROOT / "skyline" / "distant.png").save(ROOT / "backgrounds" / "sf_skyline.png", "PNG")
    print("wrote backgrounds/sf_night_bg.png (alias)")
    print("wrote backgrounds/sf_skyline.png (alias)")


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
    print("Reference-matched pixel pack complete.")


if __name__ == "__main__":
    main()
