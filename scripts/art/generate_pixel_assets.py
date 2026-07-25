#!/usr/bin/env python3
"""
High-fidelity 16-bit neon San Francisco pixel pack for ZOOX FUTURE SF.

Design goals (cabinet remaster):
- Dense readable storefronts (reference-inspired composition)
- Recognizable SF landmarks (not generic blocks)
- Detailed Zoox robotaxi + traffic + riders
- Shared palette, glow, wet-road lighting language
"""

from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw
import math
import random

ROOT = Path(__file__).resolve().parents[2] / "public" / "assets"
UPSCALE = 3

# Cabinet palette — cyan / magenta / navy / amber
C = {
    "void": (4, 6, 18, 255),
    "navy": (8, 12, 32, 255),
    "deep": (16, 22, 52, 255),
    "mid": (32, 40, 78, 255),
    "slate": (54, 62, 96, 255),
    "steel": (78, 88, 120, 255),
    "brick": (110, 52, 82, 255),
    "brick2": (86, 40, 64, 255),
    "teal": (24, 96, 118, 255),
    "teal2": (18, 70, 92, 255),
    "road": (36, 40, 56, 255),
    "road2": (28, 32, 46, 255),
    "lane": (235, 240, 255, 255),
    "cyan": (0, 245, 255, 255),
    "cyan2": (0, 180, 210, 255),
    "magenta": (255, 40, 210, 255),
    "pink": (255, 120, 190, 255),
    "purple": (130, 70, 255, 255),
    "blue": (50, 130, 255, 255),
    "blue2": (30, 80, 190, 255),
    "yellow": (255, 220, 70, 255),
    "amber": (255, 170, 55, 255),
    "orange": (255, 120, 35, 255),
    "red": (255, 64, 96, 255),
    "green": (70, 230, 130, 255),
    "lime": (170, 255, 70, 255),
    "white": (248, 252, 255, 255),
    "glass": (12, 18, 34, 255),
    "glass2": (22, 34, 58, 255),
    "zoox": (55, 155, 255, 255),
    "zoox2": (35, 100, 200, 255),
    "zoox3": (20, 60, 140, 255),
    "cabin": (160, 90, 255, 160),
    "moon": (236, 240, 255, 255),
    "cloud": (145, 125, 195, 165),
    "cloud2": (110, 95, 160, 120),
    "skin": (255, 214, 175, 255),
    "skin2": (220, 170, 130, 255),
    "black": (0, 0, 0, 255),
    "trans": (0, 0, 0, 0),
}


def new(w, h, color=None):
    return Image.new("RGBA", (w, h), color or C["trans"])


def put(img, x, y, color):
    if 0 <= x < img.width and 0 <= y < img.height and color[3] > 0:
        if color[3] >= 250:
            img.putpixel((int(x), int(y)), color)
        else:
            # alpha blend
            r0, g0, b0, a0 = img.getpixel((int(x), int(y)))
            a = color[3] / 255
            r = int(r0 * (1 - a) + color[0] * a)
            g = int(g0 * (1 - a) + color[1] * a)
            b = int(b0 * (1 - a) + color[2] * a)
            oa = min(255, a0 + color[3])
            img.putpixel((int(x), int(y)), (r, g, b, oa))


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


def save(img: Image.Image, rel: str):
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    big = img.resize((img.width * UPSCALE, img.height * UPSCALE), Image.NEAREST)
    big.save(path, "PNG")
    print(f"wrote {rel}  {big.size[0]}x{big.size[1]}")


def glow(img, cx, cy, radius, color, strength=100):
    cr, cg, cb, _ = color
    for y in range(-radius, radius + 1):
        for x in range(-radius, radius + 1):
            d = math.sqrt(x * x + y * y)
            if d <= radius:
                a = int(strength * (1 - d / radius) ** 1.4)
                if a > 4:
                    put(img, cx + x, cy + y, (cr, cg, cb, a))


# 3x5 pixel font for neon signs
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
}


def text(img, x, y, s, color, tracking=4):
    cx = x
    for ch in s.upper():
        g = GLYPHS.get(ch, GLYPHS[" "])
        for row, line in enumerate(g):
            for col, bit in enumerate(line):
                if bit == "1":
                    put(img, cx + col, y + row, color)
                    # neon halo
                    put(img, cx + col, y + row - 1, (*color[:3], 50))
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
            mortar = (xx + offset) % 5 == 4 or yy % 3 == 2
            put(img, x + xx, y + yy, c2 if mortar else c1)


def window_grid(img, x, y, w, h, cols, rows, rng, lit_chance=0.65):
    cw = max(3, w // cols)
    rh = max(3, h // rows)
    for r in range(rows):
        for c in range(cols):
            wx, wy = x + c * cw + 1, y + r * rh + 1
            ww, wh = max(1, cw - 2), max(1, rh - 2)
            if rng.random() < lit_chance:
                col = rng.choice([C["yellow"], C["amber"], C["cyan2"], C["white"], C["pink"]])
                rect(img, wx, wy, ww, wh, col)
                # pane split
                if ww > 3:
                    vline(img, wx + ww // 2, wy, wh, (*C["glass"][:3], 100))
            else:
                rect(img, wx, wy, ww, wh, C["glass"])


# ---------------------------------------------------------------------------
# SKY / CLOUDS
# ---------------------------------------------------------------------------

def make_sky():
    img = new(384, 216)
    for y in range(216):
        t = y / 215
        r = int(5 + 12 * t)
        g = int(7 + 8 * t)
        b = int(22 + 55 * t)
        hline(img, 0, y, 384, (r, g, b, 255))
    rng = random.Random(42)
    for _ in range(160):
        put(img, rng.randint(0, 383), rng.randint(0, 120), (255, 255, 255, rng.choice([120, 180, 255])))
    # moon
    glow(img, 320, 42, 28, (190, 200, 255, 255), 55)
    for y in range(-18, 19):
        for x in range(-18, 19):
            if x * x + y * y <= 18 * 18:
                put(img, 320 + x, 42 + y, C["moon"])
            elif x * x + y * y <= 20 * 20:
                put(img, 320 + x, 42 + y, (200, 210, 240, 80))
    # craters
    put(img, 314, 38, (210, 215, 235, 255))
    put(img, 324, 46, (210, 215, 235, 255))
    put(img, 318, 48, (205, 210, 230, 255))
    save(img, "backgrounds/sky.png")


def make_clouds():
    img = new(384, 80)

    def puff(cx, cy, w, h, col):
        for y in range(-h, h + 1):
            for x in range(-w, w + 1):
                if (x * x) / (w * w + 0.01) + (y * y) / (h * h + 0.01) <= 1:
                    put(img, cx + x, cy + y, col)

    rng = random.Random(7)
    for i in range(8):
        cx = 20 + i * 48 + rng.randint(-5, 5)
        cy = 28 + rng.randint(-8, 10)
        puff(cx, cy, 22, 8, C["cloud"])
        puff(cx + 14, cy + 2, 16, 7, C["cloud"])
        puff(cx - 12, cy + 3, 14, 6, C["cloud2"])
        puff(cx + 4, cy - 3, 12, 5, C["cloud2"])
    save(img, "backgrounds/clouds.png")


# ---------------------------------------------------------------------------
# SKYLINE LANDMARKS
# ---------------------------------------------------------------------------

def make_skyline():
    img = new(560, 140)
    rng = random.Random(99)
    base = 118

    for y in range(100, 140):
        hline(img, 0, y, 560, (55, 45, 100, 12 + (y - 100)))

    def filler(x, h, w):
        body = rng.choice([C["deep"], C["mid"], C["navy"]])
        rect(img, x, base - h, w, h, body)
        window_grid(img, x + 1, base - h + 2, w - 2, h - 6, max(1, w // 4), max(2, h // 8), rng, 0.55)
        if rng.random() < 0.35:
            hline(img, x, base - h - 1, w, rng.choice([C["magenta"], C["cyan"], C["amber"]]))
        # antenna
        if rng.random() < 0.25:
            vline(img, x + w // 2, base - h - 6, 6, C["steel"])
            put(img, x + w // 2, base - h - 7, C["red"])

    for i in range(28):
        filler(i * 20 + rng.randint(0, 2), rng.randint(22, 58), rng.randint(8, 16))

    # --- Salesforce Tower ---
    sx = 70
    for i, w in enumerate([18, 17, 16, 15, 14, 13, 12, 11, 9, 7, 5, 3]):
        y = base - 110 + i * 8
        rect(img, sx + (18 - w) // 2, y, w, 8, C["slate"] if i % 2 == 0 else C["steel"])
        if i % 2 == 0:
            hline(img, sx + (18 - w) // 2 + 1, y + 3, max(1, w - 2), C["cyan2"])
    rect(img, sx + 6, base - 116, 6, 6, C["cyan"])
    glow(img, sx + 9, base - 116, 10, C["cyan"], 90)

    # --- Transamerica Pyramid ---
    tx = 160
    for i in range(56):
        half = max(1, 18 - i // 3)
        col = C["mid"] if i % 3 else C["slate"]
        hline(img, tx + 18 - half, base - 4 - i, half * 2, col)
        if i % 5 == 0:
            put(img, tx + 18, base - 4 - i, C["amber"])
    put(img, tx + 18, base - 60, C["yellow"])
    glow(img, tx + 18, base - 58, 6, C["amber"], 60)

    # --- Ferry Building ---
    fx = 250
    rect(img, fx, base - 34, 56, 34, C["slate"])
    # arched arcade suggestion
    for i in range(7):
        ax = fx + 4 + i * 7
        rect(img, ax, base - 14, 5, 10, C["glass"])
        put(img, ax + 2, base - 15, C["amber"])
    window_grid(img, fx + 2, base - 30, 52, 12, 10, 2, rng, 0.8)
    # clock tower
    rect(img, fx + 24, base - 68, 10, 34, C["mid"])
    for i in range(12):
        hline(img, fx + 26 - i // 2, base - 68 - i, max(2, 6 - i // 2), C["orange"])
    rect(img, fx + 25, base - 58, 8, 8, C["yellow"])
    put(img, fx + 28, base - 55, C["black"])  # clock hand cue
    glow(img, fx + 29, base - 54, 7, C["amber"], 70)

    # --- Bay Bridge ---
    bx = 340
    for tower_x in (bx + 12, bx + 52):
        rect(img, tower_x, base - 58, 4, 58, C["orange"])
        rect(img, tower_x - 2, base - 58, 8, 3, C["amber"])
    hline(img, bx, base - 22, 80, C["orange"])
    hline(img, bx, base - 21, 80, C["amber"])
    for i in range(0, 80, 2):
        y = base - 22 - int(16 * abs(math.sin(i / 18)))
        put(img, bx + i, y, (255, 190, 90, 230))
        put(img, bx + i, y + 1, (255, 140, 40, 120))
    # deck lights
    for i in range(0, 80, 6):
        put(img, bx + i, base - 23, C["yellow"])

    # --- Pier 39 ---
    px = 445
    rect(img, px, base - 30, 55, 30, C["teal"])
    rect(img, px + 2, base - 28, 51, 8, C["teal2"])
    for i in range(7):
        rect(img, px + 4 + i * 7, base - 18, 5, 12, C["yellow"])
        put(img, px + 6 + i * 7, base - 16, C["amber"])
    # carousel
    rect(img, px + 16, base - 48, 22, 18, C["magenta"])
    glow(img, px + 27, base - 40, 10, C["magenta"], 70)
    text(img, px + 18, base - 42, "PIER", C["white"], 4)
    hline(img, px, base - 31, 55, C["cyan"])
    # flags
    for i in range(4):
        put(img, px + 8 + i * 12, base - 32, C["red"])

    # --- Painted Ladies ---
    colors = [C["purple"], C["pink"], C["blue"], C["orange"], C["cyan2"]]
    for i, col in enumerate(colors):
        x = 10 + i * 10
        rect(img, x, base - 32, 9, 32, col)
        # bay window
        rect(img, x + 2, base - 22, 5, 8, C["glass2"])
        put(img, x + 3, base - 20, C["yellow"])
        put(img, x + 5, base - 20, C["yellow"])
        # Victorian roof peak
        for k in range(5):
            hline(img, x + 4 - k, base - 33 - k, k * 2 + 1, C["white"])
        put(img, x + 4, base - 38, C["amber"])

    # Coit-ish tower hint near left
    rect(img, 50, base - 70, 5, 40, C["steel"])
    rect(img, 48, base - 74, 9, 6, C["slate"])

    save(img, "skyline/distant.png")


# ---------------------------------------------------------------------------
# MIDGROUND STREET — dense neon districts
# ---------------------------------------------------------------------------

def streetlight(img, x, ground):
    vline(img, x, ground - 40, 40, C["steel"])
    vline(img, x + 1, ground - 40, 40, C["slate"])
    hline(img, x - 8, ground - 40, 10, C["steel"])
    rect(img, x - 10, ground - 43, 6, 4, C["yellow"])
    glow(img, x - 7, ground - 36, 14, C["amber"], 55)
    # pool on sidewalk
    glow(img, x - 4, ground - 2, 10, C["amber"], 30)


def tree(img, x, ground):
    rect(img, x, ground - 14, 3, 14, (72, 48, 28, 255))
    for dy, w in ((-22, 12), (-18, 14), (-14, 10)):
        rect(img, x - w // 2 + 1, ground + dy, w, 6, (34, 150, 78, 255))
    put(img, x, ground - 20, (60, 200, 100, 255))


def ped(img, x, ground, rng, wave=False):
    skin = rng.choice([C["skin"], C["skin2"]])
    hair = rng.choice([C["black"], C["orange"], C["yellow"], C["purple"], C["red"], C["white"]])
    shirt = rng.choice([C["magenta"], C["cyan"], C["yellow"], C["green"], C["white"], C["orange"], C["pink"], C["blue"]])
    pants = rng.choice([C["deep"], C["slate"], C["navy"], C["black"]])
    # head
    rect(img, x + 1, ground - 16, 4, 4, skin)
    rect(img, x + 1, ground - 17, 4, 2, hair)
    # body
    rect(img, x, ground - 12, 6, 7, shirt)
    if wave:
        rect(img, x + 6, ground - 11, 3, 2, shirt)
        put(img, x + 8, ground - 12, skin)
    else:
        rect(img, x - 2, ground - 10, 2, 3, shirt)
    # legs
    rect(img, x + 1, ground - 5, 2, 5, pants)
    rect(img, x + 3, ground - 5, 2, 5, pants)
    put(img, x + 1, ground - 1, C["black"])
    put(img, x + 3, ground - 1, C["black"])


def neon_sign_box(img, x, y, w, h, fill, border, label):
    rect(img, x - 1, y - 1, w + 2, h + 2, border)
    rect(img, x, y, w, h, fill)
    # scanlines
    for i in range(0, h, 2):
        hline(img, x, y + i, w, (255, 255, 255, 28))
    text(img, x + 2, y + max(1, (h - 5) // 2), label, C["white"], 4)
    glow(img, x + w // 2, y + h // 2, max(w, h) // 2 + 2, fill, 40)


def storefront(img, x, ground, w, h, body, accent, name, rng, style="standard"):
    # main mass
    if style == "brick":
        brick_fill(img, x, ground - h, w, h, body, C["brick2"])
    else:
        rect(img, x, ground - h, w, h, body)
        # subtle vertical panels
        for px in range(x + 6, x + w - 4, 8):
            vline(img, px, ground - h + 8, h - 28, (*C["black"][:3], 25))

    # cornice / roof lip
    hline(img, x - 1, ground - h, w + 2, accent)
    hline(img, x, ground - h + 1, w, C["white"])
    # roof units
    rect(img, x + w - 12, ground - h - 6, 6, 6, C["slate"])
    put(img, x + w - 9, ground - h - 7, accent)
    if rng.random() < 0.5:
        rect(img, x + 4, ground - h - 4, 8, 4, C["steel"])

    # upper windows
    window_grid(img, x + 4, ground - h + 12, w - 8, max(12, h - 40), 3, max(2, (h - 40) // 10), rng, 0.7)

    # neon marquee
    neon_sign_box(img, x + 5, ground - h + 3, w - 10, 9, accent, C["black"], name[:7])

    # awning
    for i in range(5):
        col = accent if i % 2 == 0 else C["white"]
        hline(img, x + 2, ground - 26 + i, w - 4, col if i < 3 else accent)
    # stripes on awning
    for sx in range(x + 3, x + w - 3, 4):
        vline(img, sx, ground - 26, 3, (*C["black"][:3], 40))

    # storefront glass
    rect(img, x + 3, ground - 22, w - 6, 14, C["glass"])
    # reflections
    for i in range(3):
        vline(img, x + 6 + i * 5, ground - 20, 10, (0, 245, 255, 35))
    # door
    dw = 8
    dx = x + w // 2 - dw // 2
    rect(img, dx, ground - 18, dw, 18, C["glass2"])
    vline(img, dx + dw // 2, ground - 18, 18, C["steel"])
    put(img, dx + dw - 2, ground - 10, accent)

    # sidewalk spill glow
    glow(img, x + w // 2, ground - 4, 12, accent, 25)

    # vertical blade sign for some shops
    if style in ("blade", "brick") and w >= 50:
        bx = x + w + 1
        rect(img, bx, ground - h + 8, 7, 34, C["black"])
        rect(img, bx + 1, ground - h + 9, 5, 32, accent)
        text_vert(img, bx + 2, ground - h + 12, name[:6], C["white"])
        glow(img, bx + 3, ground - h + 24, 8, accent, 50)


def make_midground():
    img = new(900, 160)
    rng = random.Random(21)
    ground = 138

    # sidewalk band
    rect(img, 0, ground, 900, 22, (58, 62, 78, 255))
    for x in range(0, 900, 6):
        put(img, x, ground + 1, (74, 78, 94, 255))
        put(img, x + 3, ground + 8, (48, 52, 66, 255))
    # curb
    hline(img, 0, ground - 1, 900, C["cyan2"])
    hline(img, 0, ground, 900, (20, 24, 36, 255))

    districts = [
        # x, h, w, body, accent, name, style
        (6, 100, 84, C["blue2"], C["cyan"], "ZOOX", "standard"),
        (98, 86, 70, C["brick"], C["magenta"], "ARCADE", "brick"),
        (178, 94, 64, C["purple"], C["pink"], "DRAGON", "blade"),
        (252, 88, 74, C["teal"], C["amber"], "RAMEN", "standard"),
        (336, 102, 60, C["red"], C["orange"], "TECH", "blade"),
        (406, 90, 72, C["mid"], C["cyan"], "MARKET", "standard"),
        (488, 92, 66, C["orange"], C["yellow"], "CABLE", "standard"),
        (564, 84, 70, C["green"], C["lime"], "WHARF", "blade"),
        (644, 96, 68, C["slate"], C["purple"], "LOMBARD", "standard"),
        (722, 88, 76, C["brick2"], C["pink"], "CHINA", "brick"),
        (808, 94, 72, C["teal2"], C["cyan"], "PIER39", "standard"),
    ]

    for x, h, w, body, accent, name, style in districts:
        storefront(img, x, ground, w, h, body, accent, name, rng, style)

        # Zoox Station garage door detail
        if name == "ZOOX":
            rect(img, x + 10, ground - 22, w - 20, 18, C["glass2"])
            for gy in range(ground - 20, ground - 4, 3):
                hline(img, x + 12, gy, w - 24, C["cyan2"])
            text(img, x + 18, ground - 16, "STATION", C["cyan"], 4)

        # Arcade LED trim
        if name == "ARCADE":
            for i in range(0, w - 4, 3):
                put(img, x + 2 + i, ground - h - 2, rng.choice([C["cyan"], C["magenta"], C["yellow"]]))
            text(img, x + 14, ground - 40, "8-BIT", C["yellow"], 4)

        streetlight(img, x + w + 4, ground)
        if rng.random() < 0.85:
            tree(img, x + w // 3, ground)
        ped(img, x + 10, ground, rng, wave=rng.random() < 0.4)
        ped(img, x + w - 14, ground, rng, wave=False)
        if rng.random() < 0.45:
            ped(img, x + w // 2, ground, rng, wave=rng.random() < 0.5)

    # Chinatown lantern string over Dragon/China
    for i in range(16):
        lx = 190 + i * 8
        vline(img, lx + 1, ground - 108, 8, C["steel"])
        rect(img, lx, ground - 100, 4, 5, C["red"])
        put(img, lx + 1, ground - 99, C["orange"])
        glow(img, lx + 2, ground - 98, 4, C["orange"], 40)

    # Cable car on tracks
    rect(img, 500, ground - 20, 30, 14, C["red"])
    rect(img, 504, ground - 28, 12, 8, C["yellow"])
    rect(img, 508, ground - 26, 10, 5, C["glass"])
    rect(img, 520, ground - 18, 6, 6, C["wood"] if False else (90, 50, 30, 255))
    put(img, 506, ground - 6, C["black"])
    put(img, 524, ground - 6, C["black"])
    hline(img, 490, ground - 2, 60, (190, 190, 200, 255))
    hline(img, 490, ground - 1, 60, (140, 140, 150, 255))
    # trolley pole
    vline(img, 514, ground - 40, 14, C["steel"])
    hline(img, 514, ground - 40, 10, C["steel"])

    # Lombard zigzag hedge/rail
    for i in range(18):
        hx = 660 + (i % 2) * 3
        hy = ground - 55 - i * 2
        hline(img, hx, hy, 6, C["white"])
        put(img, hx + 2, hy + 1, C["green"])

    # Market street banner
    hline(img, 410, ground - 110, 60, C["magenta"])
    text(img, 420, ground - 116, "MARKET", C["white"], 4)

    save(img, "skyline/midground.png")


# ---------------------------------------------------------------------------
# ROAD
# ---------------------------------------------------------------------------

def make_road():
    img = new(384, 110)
    for y in range(110):
        # subtle perspective darkening toward bottom
        t = y / 109
        shade = int(34 + 8 * t + (y % 3))
        hline(img, 0, y, 384, (shade, shade + 2, shade + 14, 255))

    # wet reflective bands
    for y in (10, 26, 42, 58, 74, 90):
        hline(img, 0, y, 384, (90, 110, 150, 35))
        hline(img, 20, y + 1, 120, (0, 245, 255, 18))
        hline(img, 200, y + 2, 100, (255, 40, 210, 14))

    # lane dashes
    for y in (36, 72):
        x = 0
        while x < 384:
            hline(img, x, y, 14, C["lane"])
            hline(img, x, y + 1, 14, (180, 190, 220, 160))
            x += 22

    # neon curbs
    hline(img, 0, 0, 384, C["cyan"])
    hline(img, 0, 1, 384, C["cyan2"])
    hline(img, 0, 108, 384, C["magenta"])
    hline(img, 0, 109, 384, C["pink"])

    # streetlight reflection pools
    for x in (48, 140, 240, 330):
        glow(img, x, 14, 16, C["amber"], 40)
        glow(img, x + 10, 50, 12, C["cyan"], 20)

    save(img, "roads/road.png")


def make_road_reflection():
    img = new(384, 110)
    for y in range(110):
        if y % 4 == 0:
            hline(img, 0, y, 384, (0, 245, 255, 14))
        if y % 6 == 0:
            hline(img, 30, y, 100, (255, 40, 210, 12))
        if y % 8 == 0:
            hline(img, 180, y, 90, (255, 220, 70, 10))
        if y % 10 == 0:
            hline(img, 280, y, 70, (130, 70, 255, 10))
    save(img, "roads/reflections.png")


# ---------------------------------------------------------------------------
# ZOOX
# ---------------------------------------------------------------------------

def draw_zoox(frame=0):
    img = new(80, 48)
    # underglow
    glow(img, 40, 40, 22, C["cyan"], 85)
    glow(img, 40, 42, 14, C["blue"], 50)

    # shadow
    rect(img, 16, 40, 50, 3, (0, 0, 0, 60))

    # main body (rounded cube)
    rect(img, 14, 14, 52, 22, C["zoox"])
    # top bevel
    rect(img, 16, 11, 48, 5, C["zoox2"])
    hline(img, 18, 10, 44, C["zoox3"])
    # side bevels
    vline(img, 14, 14, 22, C["zoox2"])
    vline(img, 65, 14, 22, C["zoox2"])
    # bottom skirt
    rect(img, 15, 34, 50, 3, C["zoox3"])

    # panoramic glass band
    rect(img, 18, 16, 44, 13, C["glass"])
    # cabin purple glow
    rect(img, 20, 18, 14, 9, C["cabin"])
    rect(img, 46, 18, 14, 9, C["cabin"])
    # glass highlight
    hline(img, 20, 17, 12, (180, 220, 255, 70))
    # door seam
    vline(img, 40, 15, 18, (15, 35, 70, 220))
    vline(img, 41, 16, 16, (80, 160, 255, 60))

    # roof sensor bar
    rect(img, 34, 6, 12, 5, C["slate"])
    rect(img, 36, 5, 8, 2, C["steel"])
    put(img, 37, 4, C["cyan"])
    put(img, 42, 4, C["magenta"])
    glow(img, 37, 4, 3, C["cyan"], 80)
    glow(img, 42, 4, 3, C["magenta"], 80)

    # side sensor pods
    rect(img, 10, 19, 4, 8, C["slate"])
    rect(img, 66, 19, 4, 8, C["slate"])
    put(img, 11, 21, C["cyan"])
    put(img, 67, 21, C["cyan"])
    put(img, 11, 24, C["magenta"])
    put(img, 67, 24, C["magenta"])

    # headlights (front = right for side view driving right-facing feel; game scrolls left so front is right)
    rect(img, 64, 23, 5, 3, C["white"])
    rect(img, 64, 27, 5, 3, C["yellow"])
    glow(img, 68, 25, 5, C["white"], 60)
    # brake / rear
    rect(img, 12, 23, 3, 5, C["red"])
    put(img, 12, 24, C["pink"])

    # ZOOX badge
    text(img, 24, 31, "ZOOX", C["white"], 4)

    # wheel modules (4 visible as 2 pairs in side view — show detailed modules)
    wy = 36 + (frame % 2)
    for wx in (20, 52):
        # suspension arm
        rect(img, wx - 1, 34, 10, 2, C["zoox3"])
        # wheel
        rect(img, wx, wy, 9, 9, C["black"])
        rect(img, wx + 1, wy + 1, 7, 7, C["slate"])
        # hub rotation
        if frame % 2 == 0:
            put(img, wx + 3, wy + 2, C["cyan"])
            put(img, wx + 5, wy + 5, C["white"])
            hline(img, wx + 2, wy + 4, 5, C["cyan2"])
        else:
            put(img, wx + 5, wy + 2, C["cyan"])
            put(img, wx + 3, wy + 5, C["white"])
            vline(img, wx + 4, wy + 2, 5, C["cyan2"])
        # rim highlight
        put(img, wx + 1, wy + 1, C["steel"])

    # turn signal blink on frame
    if frame % 2:
        put(img, 63, 21, C["amber"])
        put(img, 14, 21, C["amber"])

    return img


def make_zoox():
    for i in range(2):
        save(draw_zoox(i), f"zoox/zoox_{i}.png")
    save(draw_zoox(0), "zoox/zoox.png")

    cone = new(64, 28)
    for x in range(64):
        spread = int(1 + (x / 63) * 12)
        for y in range(28):
            if abs(y - 14) <= spread:
                a = int((1 - x / 63) * 95)
                # warmer core
                if abs(y - 14) < spread * 0.4:
                    put(cone, x, y, (255, 255, 240, a))
                else:
                    put(cone, x, y, (200, 230, 255, a // 2))
    save(cone, "effects/headlight_cone.png")


# ---------------------------------------------------------------------------
# TRAFFIC
# ---------------------------------------------------------------------------

def vehicle(body, accent, w=52, h=24, kind="car"):
    img = new(w + 12, h + 16)
    # shadow
    rect(img, 6, h + 8, w, 3, (0, 0, 0, 50))
    # body
    rect(img, 6, 8, w, h - 2, body)
    # roof
    if kind == "bus":
        rect(img, 8, 4, w - 6, 8, accent)
        for i in range(6):
            rect(img, 10 + i * 9, 10, 7, 6, C["glass"])
            put(img, 12 + i * 9, 11, C["yellow"])
    elif kind == "truck":
        rect(img, 8, 5, 18, 12, accent)
        rect(img, 28, 9, w - 24, 12, body)
        rect(img, 10, 8, 12, 7, C["glass"])
        # cargo ribs
        for i in range(3):
            vline(img, 34 + i * 8, 10, 10, (*C["black"][:3], 40))
    elif kind == "taxi":
        rect(img, 14, 4, w - 20, 8, accent)
        rect(img, 16, 9, w - 24, 7, C["glass"])
        rect(img, w // 2 + 2, 2, 9, 3, C["yellow"])
        put(img, w // 2 + 5, 1, C["white"])
        text(img, 18, h - 2, "TAXI", C["black"], 4)
    else:
        rect(img, 14, 4, w - 20, 8, accent)
        rect(img, 16, 9, w - 24, 7, C["glass"])
        hline(img, 18, 10, 8, (200, 230, 255, 60))

    # lights — oncoming so front faces left
    rect(img, 3, 14, 4, 3, C["yellow"])
    glow(img, 4, 15, 4, C["yellow"], 50)
    rect(img, w + 5, 14, 3, 4, C["red"])
    # chrome line
    hline(img, 8, 8 + h - 4, w - 4, (255, 255, 255, 40))
    # wheels
    for wx in (14, w - 4):
        rect(img, wx, h + 4, 8, 8, C["black"])
        rect(img, wx + 1, h + 5, 6, 6, C["slate"])
        put(img, wx + 3, h + 7, C["steel"])
    return img


def make_traffic():
    specs = [
        ("sedan", C["orange"], C["amber"], 50, 22, "car"),
        ("suv", C["purple"], C["magenta"], 52, 26, "car"),
        ("van", C["blue"], C["cyan"], 56, 24, "car"),
        ("taxi", C["yellow"], C["black"], 50, 22, "taxi"),
        ("ev", C["green"], C["cyan"], 50, 22, "car"),
        ("bus", C["red"], C["white"], 70, 28, "bus"),
        ("truck", C["slate"], C["orange"], 64, 28, "truck"),
    ]
    for name, body, accent, w, h, kind in specs:
        save(vehicle(body, accent, w, h, kind), f"traffic/{name}.png")


# ---------------------------------------------------------------------------
# RIDERS / KIOSK
# ---------------------------------------------------------------------------

def person(shirt, hair, wave=True):
    img = new(20, 32)
    rect(img, 7, 2, 6, 6, C["skin"])
    rect(img, 7, 1, 6, 2, hair)
    # eyes
    put(img, 8, 4, C["black"])
    put(img, 11, 4, C["black"])
    rect(img, 6, 9, 8, 10, shirt)
    if wave:
        rect(img, 14, 10, 4, 2, shirt)
        put(img, 17, 9, C["skin"])
    rect(img, 7, 19, 2, 9, C["deep"])
    rect(img, 11, 19, 2, 9, C["deep"])
    put(img, 7, 28, C["black"])
    put(img, 11, 28, C["black"])
    return img


def make_riders():
    outfits = [
        ("rider_a", C["magenta"], C["black"]),
        ("rider_b", C["cyan"], C["purple"]),
        ("rider_c", C["yellow"], C["orange"]),
        ("rider_d", C["green"], C["blue"]),
        ("rider_e", C["white"], C["red"]),
    ]
    for name, shirt, hair in outfits:
        save(person(shirt, hair), f"riders/{name}.png")

    k = new(36, 48)
    glow(k, 18, 10, 12, C["cyan"], 90)
    # pole
    rect(k, 16, 18, 4, 26, C["steel"])
    # kiosk head
    rect(k, 8, 10, 20, 14, C["slate"])
    rect(k, 10, 12, 16, 10, C["cyan"])
    for i in range(0, 10, 2):
        hline(k, 10, 12 + i, 16, (255, 255, 255, 30))
    text(k, 12, 14, "Z", C["white"], 4)
    # hologram diamond
    for i in range(8):
        hline(k, 18 - i, 1 + i, i * 2 + 1, (0, 245, 255, 210))
    for i in range(8):
        hline(k, 11 + i, 9 + i, 15 - i * 2, (0, 245, 255, 130))
    put(k, 18, 8, C["white"])
    # base
    rect(k, 10, 42, 16, 4, C["mid"])
    glow(k, 18, 44, 10, C["cyan"], 50)
    save(k, "riders/kiosk.png")


# ---------------------------------------------------------------------------
# FX / UI
# ---------------------------------------------------------------------------

def make_effects():
    spark = new(18, 18)
    glow(spark, 9, 9, 8, C["cyan"], 220)
    put(spark, 9, 9, C["white"])
    for a, d in [(0, 7), (1, 6), (2, 7), (3, 6)]:
        ang = a * math.pi / 2
        put(spark, 9 + int(math.cos(ang) * d), 9 + int(math.sin(ang) * d), C["white"])
    save(spark, "effects/pickup_spark.png")

    burst = new(32, 32)
    for i in range(18):
        ang = i / 18 * math.tau
        for d in range(2, 15):
            col = C["magenta"] if i % 2 == 0 else C["cyan"]
            put(burst, 16 + int(math.cos(ang) * d), 16 + int(math.sin(ang) * d), col)
    glow(burst, 16, 16, 6, C["white"], 100)
    save(burst, "effects/neon_burst.png")

    rain = new(3, 12)
    vline(rain, 1, 0, 12, (200, 220, 255, 160))
    vline(rain, 0, 2, 8, (200, 220, 255, 70))
    vline(rain, 2, 3, 7, (200, 220, 255, 50))
    save(rain, "effects/raindrop.png")

    frag = new(7, 7)
    rect(frag, 1, 1, 5, 5, C["orange"])
    put(frag, 0, 0, C["yellow"])
    put(frag, 6, 2, C["red"])
    save(frag, "effects/collision_fragment.png")


def make_ui():
    panel = new(108, 20)
    rect(panel, 0, 0, 108, 20, (6, 10, 26, 230))
    # double border
    hline(panel, 0, 0, 108, C["cyan"])
    hline(panel, 0, 19, 108, C["cyan"])
    vline(panel, 0, 0, 20, C["cyan"])
    vline(panel, 107, 0, 20, C["cyan"])
    hline(panel, 2, 2, 104, C["magenta"])
    hline(panel, 2, 17, 104, C["magenta"])
    for x, y in [(2, 2), (105, 2), (2, 17), (105, 17)]:
        put(panel, x, y, C["yellow"])
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
    hline(btn, 0, 27, 84, C["cyan2"])
    # pixel corners
    put(btn, 0, 0, C["yellow"])
    put(btn, 83, 0, C["yellow"])
    save(btn, "ui/button.png")

    radar = new(56, 56)
    rect(radar, 0, 0, 56, 56, (5, 8, 22, 220))
    for i in range(56):
        put(radar, i, 0, C["green"])
        put(radar, i, 55, C["green"])
        put(radar, 0, i, C["green"])
        put(radar, 55, i, C["green"])
    # grid
    for i in range(8, 56, 8):
        hline(radar, 2, i, 52, (70, 255, 160, 35))
        vline(radar, i, 2, 52, (70, 255, 160, 25))
    hline(radar, 4, 18, 48, (70, 255, 160, 80))
    hline(radar, 4, 36, 48, (70, 255, 160, 80))
    save(radar, "ui/radar.png")


def make_menu_banner():
    img = new(384, 216)
    sky = Image.open(ROOT / "backgrounds" / "sky.png").resize((384, 216), Image.NEAREST)
    img.alpha_composite(sky, (0, 0))
    clouds = Image.open(ROOT / "backgrounds" / "clouds.png").resize((384, 80), Image.NEAREST)
    img.alpha_composite(clouds, (0, 24))
    distant = Image.open(ROOT / "skyline" / "distant.png").resize((384, 110), Image.NEAREST)
    img.alpha_composite(distant, (0, 50))
    mid = Image.open(ROOT / "skyline" / "midground.png").resize((384, 100), Image.NEAREST)
    img.alpha_composite(mid, (0, 85))
    road = Image.open(ROOT / "roads" / "road.png").resize((384, 55), Image.NEAREST)
    img.alpha_composite(road, (0, 161))
    # vignette edges
    for x in range(40):
        a = int((1 - x / 40) * 90)
        vline(img, x, 0, 216, (4, 6, 18, a))
        vline(img, 383 - x, 0, 216, (4, 6, 18, a))
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
    print("High-fidelity pixel pack complete.")


if __name__ == "__main__":
    main()
