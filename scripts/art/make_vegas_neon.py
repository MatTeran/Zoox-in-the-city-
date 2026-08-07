#!/usr/bin/env python3
"""
Paint a neon Las Vegas Strip plate that matches the SF city_sf energy:
dense landmarks, neon outlines, glow blooms, wet waterfront, same road band.
"""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageFont

ROOT = Path(__file__).resolve().parents[2]
BG = ROOT / "public" / "assets" / "backgrounds"
ROADS = ROOT / "public" / "assets" / "roads"
W, H = 1280, 720
ROAD_TOP = 465
GROUND = ROAD_TOP - 52


def clamp(v, a=0, b=255):
    return max(a, min(b, int(v)))


def glow_layer(size, cx, cy, radius, color, strength=140):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    px = layer.load()
    cr, cg, cb = color[:3]
    r2 = radius * radius
    for y in range(max(0, cy - radius), min(size[1], cy + radius + 1)):
        for x in range(max(0, cx - radius), min(size[0], cx + radius + 1)):
            d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy)
            if d2 <= r2:
                d = math.sqrt(d2)
                a = int(strength * (1 - d / radius) ** 1.45)
                if a > 2:
                    px[x, y] = (cr, cg, cb, a)
    return layer.filter(ImageFilter.GaussianBlur(max(1, radius // 7)))


def neon_rect(d, xy, fill, outline, width=2):
    d.rectangle(xy, fill=fill, outline=outline, width=width)


def windows(d, x, y, w, h, rng, cool=False):
    for row in range(8, h - 10, 11):
        for col in range(5, w - 6, 9):
            if (row + col + x) % 13 == 0:
                continue
            if cool:
                c = (120, 230, 255, 230) if (x + row) % 5 else (180, 240, 255, 200)
            else:
                c = (255, 220, 110, 230) if (x + row) % 7 else (255, 180, 80, 210)
            if rng.random() < 0.12:
                c = (255, 80, 200, 220)
            d.rectangle([x + col, y + row, x + col + 4, y + row + 6], fill=c)


def building(img, d, x, y, w, h, body, accent, rng, cool=False, roof_neon=True):
    neon_rect(d, [x, y, x + w, y + h], body, accent, 2)
    if roof_neon:
        d.rectangle([x, y, x + w, y + 4], fill=accent)
        # roof glow
        g = glow_layer(img.size, x + w // 2, y + 2, max(18, w // 2), accent, 70)
        img.alpha_composite(g)
    windows(d, x, y, w, h, rng, cool=cool)
    # side neon edge
    d.line([(x, y), (x, y + h)], fill=accent, width=2)
    d.line([(x + w, y), (x + w, y + h)], fill=(*accent[:3], 160), width=1)


def neon_text(d, x, y, text, fill, glow_col=None, size=18):
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size)
    except Exception:
        font = ImageFont.load_default()
    # fake glow via offsets
    if glow_col:
        for ox, oy in ((-1, 0), (1, 0), (0, -1), (0, 1), (-2, 0), (2, 0)):
            d.text((x + ox, y + oy), text, font=font, fill=(*glow_col[:3], 90))
    d.text((x, y), text, font=font, fill=fill)
    return font


def make_sky(img, d, rng):
    # Match SF: deep indigo → magenta haze near horizon
    for y in range(GROUND + 10):
        t = y / max(1, GROUND)
        r = int(12 + t * 55)
        g = int(8 + t * 18)
        b = int(40 + t * 70)
        # magenta lift mid-sky
        if 80 < y < 280:
            r = min(255, r + 25)
            b = min(255, b + 15)
        d.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Nebula / cloud washes like SF
    haze = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    hd = ImageDraw.Draw(haze)
    for cx, cy, col, rad in (
        (220, 120, (255, 60, 180), 120),
        (640, 90, (160, 60, 255), 140),
        (980, 130, (255, 80, 160), 110),
        (400, 200, (80, 40, 160), 160),
    ):
        hd.ellipse([cx - rad, cy - rad // 2, cx + rad, cy + rad // 2], fill=(*col, 28))
    haze = haze.filter(ImageFilter.GaussianBlur(28))
    img.alpha_composite(haze)

    for _ in range(320):
        x, y = rng.randint(0, W - 1), rng.randint(0, 300)
        s = rng.choice([1, 1, 1, 2])
        a = rng.randint(140, 255)
        d.ellipse([x, y, x + s, y + s], fill=(255, 245, 230, a))

    # Full moon with crater detail (SF energy)
    mx, my, mr = 1120, 88, 48
    img.alpha_composite(glow_layer(img.size, mx, my, 70, (255, 240, 210), 55))
    d.ellipse([mx - mr, my - mr, mx + mr, my + mr], fill=(245, 240, 255, 255))
    for cx, cy, r in ((mx - 12, my - 8, 8), (mx + 10, my + 6, 6), (mx - 4, my + 14, 5), (mx + 16, my - 14, 4)):
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(210, 205, 230, 255))


def make_water(img, d, rng):
    for y in range(GROUND, ROAD_TOP):
        t = (y - GROUND) / max(1, ROAD_TOP - GROUND)
        d.line([(0, y), (W, y)], fill=(int(8 + t * 12), int(10 + t * 16), int(28 + t * 20), 255))

    # Neon reflection streaks
    refl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(refl)
    for i in range(70):
        x = 10 + i * 18
        col = rng.choice([(255, 80, 180), (0, 240, 255), (255, 200, 60), (255, 120, 40), (180, 80, 255)])
        rd.line([(x, GROUND + 2), (x + rng.randint(-4, 4), ROAD_TOP - 2)], fill=(*col, 85), width=2)
    refl = refl.filter(ImageFilter.GaussianBlur(1.2))
    img.alpha_composite(refl)

    # Curb neon
    d.rectangle([0, ROAD_TOP - 4, W, ROAD_TOP], fill=(255, 200, 80, 200))
    d.rectangle([0, GROUND - 2, W, GROUND + 1], fill=(0, 240, 255, 120))


def draw_welcome_sign(img, d):
    sx, sy = 36, GROUND - 125
    # pole
    d.rectangle([sx + 30, sy + 95, sx + 42, GROUND], fill=(70, 70, 85, 255))
    # outer neon rings
    for r, col in ((48, (255, 60, 140)), (40, (0, 230, 255)), (32, (255, 60, 140))):
        d.ellipse([sx + 36 - r, sy + 48 - r, sx + 36 + r, sy + 48 + r], outline=(*col, 255), width=3)
        img.alpha_composite(glow_layer(img.size, sx + 36, sy + 48, r + 8, col, 45))
    # diamond panel
    d.polygon(
        [(sx + 36, sy + 10), (sx + 70, sy + 48), (sx + 36, sy + 86), (sx + 2, sy + 48)],
        fill=(25, 8, 40, 255),
        outline=(255, 220, 80, 255),
    )
    neon_text(d, sx + 10, sy + 30, "WELCOME", (255, 220, 80, 255), (255, 180, 40), 11)
    neon_text(d, sx + 18, sy + 44, "TO", (255, 255, 255, 255), (255, 255, 255), 10)
    neon_text(d, sx + 8, sy + 56, "LAS VEGAS", (255, 80, 160, 255), (255, 40, 120), 11)
    # star
    star = [(sx + 36, sy - 8), (sx + 41, sy + 6), (sx + 56, sy + 6), (sx + 44, sy + 16),
            (sx + 48, sy + 30), (sx + 36, sy + 20), (sx + 24, sy + 30), (sx + 28, sy + 16),
            (sx + 16, sy + 6), (sx + 31, sy + 6)]
    d.polygon(star, fill=(255, 220, 80, 255))
    img.alpha_composite(glow_layer(img.size, sx + 36, sy + 10, 28, (255, 200, 60), 80))


def draw_stratosphere(img, d, rng):
    x = 150
    # shaft
    building(img, d, x, GROUND - 230, 34, 230, (40, 28, 70, 255), (255, 60, 170, 255), rng, cool=True)
    # pod
    d.ellipse([x - 10, GROUND - 255, x + 44, GROUND - 215], fill=(50, 30, 70, 255), outline=(255, 80, 180, 255), width=2)
    d.ellipse([x - 2, GROUND - 248, x + 36, GROUND - 222], fill=(255, 60, 160, 60))
    img.alpha_composite(glow_layer(img.size, x + 17, GROUND - 235, 40, (255, 60, 180), 90))
    neon_text(d, x - 6, GROUND - 268, "STRAT", (255, 80, 180, 255), (255, 40, 140), 14)


def draw_bellagio(img, d, rng):
    x, w = 320, 170
    building(img, d, x, GROUND - 135, w, 135, (48, 32, 55, 255), (255, 210, 80, 255), rng)
    # fountain jets
    for i in range(16):
        fx = x + 15 + i * 9
        h = 18 + (i % 4) * 6
        d.line([(fx, GROUND), (fx, GROUND - h)], fill=(140, 230, 255, 200), width=2)
        d.ellipse([fx - 3, GROUND - h - 4, fx + 3, GROUND - h + 2], fill=(180, 240, 255, 180))
    img.alpha_composite(glow_layer(img.size, x + w // 2, GROUND - 20, 50, (120, 220, 255), 55))
    neon_text(d, x + 30, GROUND - 150, "BELLAGIO", (255, 220, 90, 255), (255, 180, 40), 16)


def draw_caesars(img, d, rng):
    x = 510
    building(img, d, x, GROUND - 160, 80, 160, (60, 40, 28, 255), (255, 180, 60, 255), rng)
    # columns
    for i in range(5):
        cx = x + 10 + i * 14
        d.rectangle([cx, GROUND - 70, cx + 6, GROUND], fill=(220, 190, 140, 255))
        d.ellipse([cx - 2, GROUND - 78, cx + 8, GROUND - 68], fill=(255, 210, 120, 255))
    neon_text(d, x + 4, GROUND - 178, "CAESARS", (255, 200, 80, 255), (255, 150, 40), 14)


def draw_eiffel(img, d):
    # Paris LV Eiffel tower
    bx = 620
    top = GROUND - 210
    d.polygon([(bx, GROUND), (bx + 28, top), (bx + 56, GROUND)], outline=(255, 200, 80, 255))
    # lattice
    for i in range(0, 10):
        t = i / 10
        y = int(GROUND - t * (GROUND - top))
        half = int(28 * (1 - t))
        d.line([(bx + 28 - half, y), (bx + 28 + half, y)], fill=(255, 180, 60, 200), width=1)
    d.line([(bx + 28, top), (bx + 28, top - 18)], fill=(255, 220, 100, 255), width=2)
    img.alpha_composite(glow_layer(img.size, bx + 28, top - 5, 36, (255, 200, 80), 75))
    neon_text(d, bx - 4, top - 36, "PARIS", (255, 220, 100, 255), (255, 160, 40), 13)


def draw_luxor(img, d):
    left, right, apex = 720, 900, 810
    top = GROUND - 195
    d.polygon([(left, GROUND), (apex, top), (right, GROUND)], fill=(25, 45, 65, 255), outline=(0, 240, 255, 255))
    # face highlight
    d.polygon([(apex - 30, GROUND - 40), (apex, top), (apex + 10, GROUND - 40)], fill=(0, 220, 255, 40))
    # sky beam
    beam = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(beam)
    bd.polygon([(apex - 6, top), (apex + 6, top), (apex + 18, 20), (apex - 18, 20)], fill=(255, 240, 180, 55))
    beam = beam.filter(ImageFilter.GaussianBlur(2))
    img.alpha_composite(beam)
    img.alpha_composite(glow_layer(img.size, apex, top, 50, (0, 240, 255), 90))
    neon_text(d, apex - 28, top - 28, "LUXOR", (0, 245, 255, 255), (0, 180, 220), 15)


def draw_sphere(img, d):
    cx, cy, r = 980, GROUND - 70, 72
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(18, 28, 48, 255), outline=(0, 240, 255, 255), width=3)
    # LED bands
    for i in range(-4, 5):
        yy = cy + i * 12
        # chord width
        dy = abs(yy - cy)
        if dy >= r:
            continue
        half = int(math.sqrt(r * r - dy * dy) - 4)
        col = (255, 80, 200, 180) if i % 2 == 0 else (0, 240, 255, 160)
        d.arc([cx - half, yy - 3, cx + half, yy + 3], 0, 180, fill=col, width=2)
    img.alpha_composite(glow_layer(img.size, cx, cy, 90, (0, 240, 255), 70))
    img.alpha_composite(glow_layer(img.size, cx, cy - 10, 60, (255, 60, 180), 40))
    neon_text(d, cx - 34, cy - r - 22, "SPHERE", (0, 245, 255, 255), (0, 180, 220), 14)


def draw_high_roller(img, d):
    cx, cy, r = 1160, GROUND - 95, 85
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 60, 160, 255), width=4)
    for a in range(0, 360, 15):
        rad = math.radians(a)
        x2 = cx + int(math.cos(rad) * (r - 4))
        y2 = cy + int(math.sin(rad) * (r - 4))
        d.line([(cx, cy), (x2, y2)], fill=(255, 80, 180, 90), width=1)
        d.ellipse([x2 - 3, y2 - 3, x2 + 3, y2 + 3], fill=(255, 220, 100, 230))
    # support
    d.polygon([(cx - 20, GROUND), (cx, cy + 20), (cx + 20, GROUND)], fill=(40, 30, 55, 255), outline=(255, 80, 180, 255))
    img.alpha_composite(glow_layer(img.size, cx, cy, 70, (255, 60, 160), 75))
    neon_text(d, cx - 50, cy - r - 18, "HIGH ROLLER", (255, 100, 180, 255), (255, 40, 140), 12)


def draw_filler_towers(img, d, rng):
    specs = [
        (110, 150, 40, (35, 28, 60), (0, 240, 255), True),
        (195, 175, 48, (48, 24, 55), (255, 200, 60), False),
        (250, 130, 55, (30, 36, 65), (255, 80, 180), True),
        (600, 120, 36, (40, 30, 58), (0, 240, 255), True),
        (680, 145, 30, (50, 28, 50), (255, 120, 40), False),
        (910, 155, 42, (34, 40, 70), (255, 80, 180), True),
        (1055, 125, 38, (42, 30, 60), (255, 220, 80), False),
        (1225, 140, 45, (36, 32, 62), (0, 240, 255), True),
    ]
    for x, h, w, body, accent, cool in specs:
        building(img, d, x, GROUND - h, w, h, (*body, 255), (*accent, 255), rng, cool=cool)


def draw_neon_signs(img, d):
    signs = [
        (200, GROUND - 195, "CASINO", (255, 60, 160), 14),
        (260, GROUND - 155, "STRIP", (0, 245, 255), 13),
        (450, GROUND - 165, "VEGAS", (255, 220, 80), 18),
        (760, GROUND - 215, "NEON", (255, 80, 180), 14),
        (1040, GROUND - 175, "NIGHT", (0, 245, 255), 13),
    ]
    for x, y, label, col, sz in signs:
        # blade / marquee plate
        d.rectangle([x - 4, y - 4, x + len(label) * (sz // 2) + 10, y + sz + 6], fill=(10, 6, 24, 220), outline=(*col, 255), width=2)
        neon_text(d, x, y, label, (*col, 255), col, sz)
        img.alpha_composite(glow_layer(img.size, x + 30, y + 8, 28, col, 55))

    # Vertical blade
    d.rectangle([290, GROUND - 210, 304, GROUND - 90], fill=(8, 6, 20, 255), outline=(255, 60, 160, 255), width=2)
    neon_text(d, 292, GROUND - 200, "V\nI\nP", (255, 220, 100, 255), (255, 180, 40), 12)
    img.alpha_composite(glow_layer(img.size, 297, GROUND - 150, 22, (255, 60, 160), 70))


def draw_palms(img, d):
    for px0 in (125, 305, 490, 700, 880, 1120, 1260):
        d.line([(px0, GROUND), (px0, GROUND - 58)], fill=(20, 55, 38, 255), width=3)
        for ang in (-55, -25, 5, 35, 55):
            rad = math.radians(ang)
            d.line(
                [
                    (px0, GROUND - 58),
                    (px0 + int(math.cos(rad) * 34), GROUND - 58 + int(math.sin(rad) * 14) - 12),
                ],
                fill=(40, 110, 60, 255),
                width=2,
            )
        # neon ring at trunk
        d.ellipse([px0 - 5, GROUND - 20, px0 + 5, GROUND - 10], outline=(255, 80, 180, 180), width=1)


def paste_road(img):
    road = Image.open(ROADS / "road_scroll.png").convert("RGBA")
    under = ImageEnhance.Brightness(road).enhance(0.7).filter(ImageFilter.GaussianBlur(1.1))
    img.paste(under, (0, ROAD_TOP))


def main():
    rng = random.Random(2026)
    img = Image.new("RGBA", (W, H), (10, 6, 24, 255))
    d = ImageDraw.Draw(img)

    make_sky(img, d, rng)
    # redraw draw after sky composites
    d = ImageDraw.Draw(img)

    # Dense back-row silhouettes
    for i in range(28):
        x = i * 46 - 10
        h = 40 + (i * 17) % 70
        body = (22 + (i % 5) * 3, 18, 40 + (i % 4) * 4, 255)
        accent = [(255, 60, 160), (0, 240, 255), (255, 200, 60), (180, 80, 255)][i % 4]
        neon_rect(d, [x, GROUND - h, x + 40, GROUND], body, (*accent, 180), 1)
        if i % 3 == 0:
            d.rectangle([x, GROUND - h, x + 40, GROUND - h + 3], fill=(*accent, 220))

    draw_filler_towers(img, d, rng)
    d = ImageDraw.Draw(img)

    draw_welcome_sign(img, d)
    draw_stratosphere(img, d, rng)
    draw_bellagio(img, d, rng)
    draw_caesars(img, d, rng)
    draw_eiffel(img, d)
    draw_luxor(img, d)
    draw_sphere(img, d)
    draw_high_roller(img, d)
    draw_neon_signs(img, d)
    draw_palms(img, d)

    make_water(img, d, rng)
    paste_road(img)

    # Global bloom pass — key to matching SF neon glow
    bloom = img.filter(ImageFilter.GaussianBlur(2.8))
    img = Image.blend(img, bloom, 0.28)
    # Extra saturation punch on highlights
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(1.18)
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.08)

    BG.mkdir(parents=True, exist_ok=True)
    out = BG / "city_vegas.png"
    img.save(out, "PNG")
    print(f"wrote {out} {img.size}")

    # preview
    prev = Path("/opt/cursor/artifacts/screenshots")
    prev.mkdir(parents=True, exist_ok=True)
    img.save(prev / "city_vegas-preview.png")
    print("preview saved")


if __name__ == "__main__":
    main()
