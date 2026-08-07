#!/usr/bin/env python3
"""
Paint city_vegas.png to match the neon Strip reference mock:
Strat → Welcome sign → Palazzo/Venetian → Bellagio fountains →
Paris (Eiffel + balloon) → Flamingo → High Roller.
Dense painted neon, wet reflections, SF-plate energy.
"""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
BG = ROOT / "public" / "assets" / "backgrounds"
ROADS = ROOT / "public" / "assets" / "roads"
W, H = 1280, 720
ROAD_TOP = 465
GROUND = ROAD_TOP - 48


def glow(size, cx, cy, radius, color, strength=130):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    px = layer.load()
    cr, cg, cb = color[:3]
    r2 = float(radius * radius)
    for y in range(max(0, cy - radius), min(size[1], cy + radius + 1)):
        for x in range(max(0, cx - radius), min(size[0], cx + radius + 1)):
            d2 = (x - cx) ** 2 + (y - cy) ** 2
            if d2 <= r2:
                d = math.sqrt(d2)
                a = int(strength * (1 - d / radius) ** 1.5)
                if a > 2:
                    px[x, y] = (cr, cg, cb, a)
    return layer.filter(ImageFilter.GaussianBlur(max(1, radius // 8)))


def font(size):
    try:
        return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size)
    except Exception:
        return ImageFont.load_default()


def neon_label(d, x, y, text, fill, size=14, glow_c=None):
    f = font(size)
    gc = glow_c or fill
    for ox, oy in ((-1, 0), (1, 0), (0, -1), (0, 1), (-2, 0), (2, 0), (0, -2)):
        d.text((x + ox, y + oy), text, font=f, fill=(*gc[:3], 70))
    d.text((x, y), text, font=f, fill=fill if len(fill) == 4 else (*fill, 255))


def windows(d, x, y, w, h, rng, warm=True):
    for row in range(10, h - 8, 10):
        for col in range(5, w - 5, 8):
            if (row + col + x) % 11 == 0:
                continue
            if warm:
                c = (255, 220, 120, 230) if (x + row) % 6 else (255, 190, 80, 200)
            else:
                c = (140, 230, 255, 230) if (x + row) % 5 else (90, 180, 255, 200)
            if rng.random() < 0.08:
                c = (255, 90, 200, 220)
            d.rectangle([x + col, y + row, x + col + 3, y + row + 5], fill=c)


def tower_block(img, d, x, y, w, h, body, accent, rng, warm=True, outline=True):
    d.rectangle([x, y, x + w, y + h], fill=body)
    if outline:
        d.rectangle([x, y, x + w, y + h], outline=accent, width=2)
    d.rectangle([x, y, x + w, y + 3], fill=accent)
    windows(d, x, y, w, h, rng, warm=warm)
    img.alpha_composite(glow(img.size, x + w // 2, y + 4, max(16, w // 2), accent, 55))


def paint_sky(img, d, rng):
    # Deep indigo → magenta haze (reference)
    for y in range(GROUND + 8):
        t = y / max(1, GROUND)
        r = int(10 + t * 70)
        g = int(6 + t * 20)
        b = int(36 + t * 75)
        if 60 < y < 260:
            r = min(255, r + 35)
            b = min(255, b + 20)
        d.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Wispy purple clouds
    clouds = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(clouds)
    for cx, cy, rw, rh, a in (
        (180, 90, 160, 40, 40),
        (420, 70, 200, 50, 35),
        (720, 100, 180, 45, 38),
        (980, 80, 160, 40, 32),
        (300, 150, 220, 55, 28),
    ):
        cd.ellipse([cx - rw, cy - rh, cx + rw, cy + rh], fill=(180, 70, 200, a))
    clouds = clouds.filter(ImageFilter.GaussianBlur(16))
    img.alpha_composite(clouds)

    for _ in range(280):
        x, y = rng.randint(0, W - 1), rng.randint(0, 280)
        s = rng.choice([1, 1, 1, 2])
        d.ellipse([x, y, x + s, y + s], fill=(255, 245, 230, rng.randint(140, 255)))

    # Bright full moon (reference)
    mx, my, mr = 1145, 78, 52
    img.alpha_composite(glow(img.size, mx, my, 78, (255, 240, 220), 60))
    d.ellipse([mx - mr, my - mr, mx + mr, my + mr], fill=(250, 245, 255, 255))
    for cx, cy, r in ((mx - 14, my - 10, 9), (mx + 12, my + 8, 7), (mx - 2, my + 16, 5), (mx + 18, my - 16, 4)):
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(215, 210, 235, 255))


def paint_waterfront(img, d, rng):
    for y in range(GROUND, ROAD_TOP):
        t = (y - GROUND) / max(1, ROAD_TOP - GROUND)
        d.line([(0, y), (W, y)], fill=(int(6 + t * 10), int(8 + t * 14), int(22 + t * 18), 255))

    # Soft neon puddle reflections under Strip
    refl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(refl)
    for i in range(90):
        x = 8 + i * 14
        col = rng.choice([(255, 80, 180), (80, 200, 255), (255, 200, 70), (255, 120, 40), (160, 80, 255)])
        rd.ellipse([x - 10, GROUND + 6, x + 10, ROAD_TOP - 4], fill=(*col, 40))
    refl = refl.filter(ImageFilter.GaussianBlur(3))
    img.alpha_composite(refl)

    d.rectangle([0, ROAD_TOP - 3, W, ROAD_TOP], fill=(255, 200, 90, 190))
    d.rectangle([0, GROUND - 2, W, GROUND + 1], fill=(0, 230, 255, 100))


def draw_strat(img, d, rng):
    # Far-left tall Stratosphere — red/white glowing top (reference)
    x = 55
    shaft_w = 28
    # tapering shaft
    for i in range(0, 240, 4):
        t = i / 240
        w = int(shaft_w * (1 - t * 0.35))
        y = GROUND - i
        col = (45, 30, 70, 255) if (i // 8) % 2 == 0 else (55, 35, 80, 255)
        d.rectangle([x + (shaft_w - w) // 2, y - 4, x + (shaft_w - w) // 2 + w, y], fill=col)
        if i % 16 == 0:
            d.rectangle(
                [x + (shaft_w - w) // 2, y - 2, x + (shaft_w - w) // 2 + w, y],
                fill=(255, 80, 160, 120),
            )
    # observation pod — red/white
    pod_y = GROUND - 255
    d.ellipse([x - 14, pod_y, x + shaft_w + 14, pod_y + 40], fill=(80, 30, 50, 255), outline=(255, 70, 120, 255), width=2)
    d.ellipse([x - 6, pod_y + 6, x + shaft_w + 6, pod_y + 28], fill=(255, 240, 245, 90))
    # red ring bands
    d.arc([x - 14, pod_y, x + shaft_w + 14, pod_y + 40], 200, 340, fill=(255, 60, 100, 255), width=3)
    img.alpha_composite(glow(img.size, x + shaft_w // 2, pod_y + 16, 48, (255, 70, 120), 95))
    # tip spire
    d.polygon(
        [(x + 10, pod_y), (x + shaft_w // 2, pod_y - 35), (x + shaft_w - 10, pod_y)],
        fill=(255, 220, 220, 255),
    )
    img.alpha_composite(glow(img.size, x + shaft_w // 2, pod_y - 20, 22, (255, 200, 200), 70))


def draw_welcome(img, d):
    # Iconic diamond Welcome sign — left-center like reference
    sx, sy = 130, GROUND - 130
    # pole
    d.rectangle([sx + 34, sy + 100, sx + 46, GROUND], fill=(90, 90, 100, 255))
    # neon circle rings
    for r, col, w in ((52, (255, 60, 100), 4), (44, (255, 220, 60), 3), (36, (255, 60, 100), 3)):
        d.ellipse([sx + 40 - r, sy + 52 - r, sx + 40 + r, sy + 52 + r], outline=(*col, 255), width=w)
    img.alpha_composite(glow(img.size, sx + 40, sy + 52, 58, (255, 80, 120), 55))
    # diamond
    diamond = [(sx + 40, sy + 8), (sx + 78, sy + 52), (sx + 40, sy + 96), (sx + 2, sy + 52)]
    d.polygon(diamond, fill=(30, 10, 40, 255), outline=(255, 220, 70, 255))
    neon_label(d, sx + 8, sy + 28, "WELCOME", (255, 230, 90, 255), 11, (255, 180, 40))
    neon_label(d, sx + 22, sy + 42, "TO", (255, 255, 255, 255), 11)
    neon_label(d, sx + 6, sy + 56, "FABULOUS", (255, 90, 140, 255), 10, (255, 40, 100))
    neon_label(d, sx + 8, sy + 70, "LAS VEGAS", (255, 230, 90, 255), 10, (255, 180, 40))
    # star
    star = [
        (sx + 40, sy - 10), (sx + 45, sy + 4), (sx + 60, sy + 4), (sx + 48, sy + 14),
        (sx + 52, sy + 28), (sx + 40, sy + 18), (sx + 28, sy + 28), (sx + 32, sy + 14),
        (sx + 20, sy + 4), (sx + 35, sy + 4),
    ]
    d.polygon(star, fill=(255, 220, 70, 255))
    img.alpha_composite(glow(img.size, sx + 40, sy + 8, 26, (255, 200, 60), 80))


def draw_palazzo(img, d, rng):
    # Large Venetian/Palazzo block cluster
    x = 230
    tower_block(img, d, x, GROUND - 175, 70, 175, (50, 35, 55, 255), (255, 200, 70, 255), rng, warm=True)
    tower_block(img, d, x + 75, GROUND - 155, 90, 155, (42, 30, 58, 255), (255, 180, 60, 255), rng, warm=True)
    tower_block(img, d, x + 170, GROUND - 165, 55, 165, (55, 38, 48, 255), (255, 220, 90, 255), rng, warm=True)
    # vertical PALAZZO neon
    d.rectangle([x + 78, GROUND - 150, x + 94, GROUND - 40], fill=(20, 10, 30, 255), outline=(255, 200, 70, 255), width=2)
    neon_label(d, x + 80, GROUND - 145, "P\nA\nL\nA\nZ\nZ\nO", (255, 220, 90, 255), 11, (255, 160, 40))
    img.alpha_composite(glow(img.size, x + 86, GROUND - 95, 28, (255, 200, 70), 70))
    # arched facade detail
    d.arc([x + 100, GROUND - 50, x + 150, GROUND + 10], 200, 340, fill=(255, 200, 80, 200), width=3)


def draw_bellagio(img, d, rng):
    # Curved grand hotel + fountain jets (reference centerpiece)
    x, w = 470, 175
    # curved top silhouette via stacked widths
    for i, ww in enumerate([w - 20, w - 10, w, w, w - 8]):
        y = GROUND - 145 + i * 8
        d.rectangle([x + (w - ww) // 2, y, x + (w - ww) // 2 + ww, y + 10], fill=(48, 34, 58, 255))
    d.rectangle([x, GROUND - 105, x + w, GROUND], fill=(48, 34, 58, 255), outline=(255, 210, 90, 255), width=2)
    windows(d, x, GROUND - 145, w, 145, rng, warm=True)
    d.rectangle([x, GROUND - 145, x + w, GROUND - 141], fill=(255, 210, 90, 255))
    img.alpha_composite(glow(img.size, x + w // 2, GROUND - 140, 55, (255, 200, 80), 60))

    # Fountain jets — bright blue-white columns like the reference
    jets = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    jd = ImageDraw.Draw(jets)
    for i in range(22):
        fx = x + 12 + i * 7
        h = 36 + int(30 * abs(math.sin(i / 2.4)))
        jd.line([(fx, GROUND - 2), (fx, GROUND - h)], fill=(190, 250, 255, 245), width=4)
        jd.ellipse([fx - 7, GROUND - h - 10, fx + 7, GROUND - h + 2], fill=(220, 255, 255, 220))
        for k in range(-3, 4):
            jd.line([(fx, GROUND - h), (fx + k * 5, GROUND - h - 14)], fill=(200, 250, 255, 180), width=2)
    # lake glow under jets
    jd.ellipse([x + 10, GROUND - 18, x + w - 10, GROUND + 6], fill=(120, 220, 255, 70))
    jets = jets.filter(ImageFilter.GaussianBlur(0.8))
    img.alpha_composite(jets)
    img.alpha_composite(glow(img.size, x + w // 2, GROUND - 40, 90, (140, 240, 255), 95))
    neon_label(d, x + 40, GROUND - 160, "BELLAGIO", (255, 230, 100, 255), 15, (255, 180, 50))


def draw_paris(img, d):
    # Eiffel tower (gold) + hot air balloon "Paris"
    bx = 680
    top = GROUND - 200
    # legs
    d.line([(bx, GROUND), (bx + 30, top)], fill=(255, 200, 70, 255), width=3)
    d.line([(bx + 70, GROUND), (bx + 40, top)], fill=(255, 200, 70, 255), width=3)
    d.line([(bx + 8, GROUND - 40), (bx + 62, GROUND - 40)], fill=(255, 190, 60, 255), width=2)
    d.line([(bx + 16, GROUND - 90), (bx + 54, GROUND - 90)], fill=(255, 190, 60, 255), width=2)
    d.line([(bx + 22, GROUND - 140), (bx + 48, GROUND - 140)], fill=(255, 190, 60, 255), width=2)
    # lattice cross
    for i in range(0, 8):
        t = i / 8
        y = int(GROUND - t * (GROUND - top))
        half = int(35 * (1 - t))
        d.line([(bx + 35 - half, y), (bx + 35 + half, y)], fill=(255, 180, 50, 160), width=1)
    d.line([(bx + 35, top), (bx + 35, top - 22)], fill=(255, 230, 120, 255), width=2)
    img.alpha_composite(glow(img.size, bx + 35, top, 40, (255, 200, 70), 80))

    # Hot air balloon — blue/red Paris sign (reference)
    ball_x, ball_y = 760, GROUND - 165
    d.ellipse([ball_x, ball_y, ball_x + 70, ball_y + 78], fill=(40, 60, 140, 255), outline=(255, 70, 100, 255), width=3)
    # stripes
    for i in range(0, 70, 10):
        d.arc([ball_x, ball_y, ball_x + 70, ball_y + 78], 200 + i, 210 + i, fill=(255, 70, 100, 200), width=2)
    d.rectangle([ball_x + 22, ball_y + 30, ball_x + 48, ball_y + 48], fill=(20, 20, 50, 255))
    neon_label(d, ball_x + 14, ball_y + 32, "PARIS", (255, 240, 240, 255), 11, (255, 80, 120))
    # basket
    d.rectangle([ball_x + 26, ball_y + 78, ball_x + 44, ball_y + 92], fill=(180, 120, 60, 255))
    d.line([(ball_x + 18, ball_y + 70), (ball_x + 28, ball_y + 78)], fill=(200, 200, 200, 200), width=1)
    d.line([(ball_x + 52, ball_y + 70), (ball_x + 42, ball_y + 78)], fill=(200, 200, 200, 200), width=1)
    img.alpha_composite(glow(img.size, ball_x + 35, ball_y + 40, 45, (255, 70, 120), 70))


def draw_flamingo(img, d, rng):
    # Pink Flamingo hotel + neon flamingo icon
    x = 860
    tower_block(img, d, x, GROUND - 140, 95, 140, (70, 30, 55, 255), (255, 90, 170, 255), rng, warm=True)
    # neon flamingo silhouette
    fx, fy = x + 105, GROUND - 110
    # body
    d.ellipse([fx, fy + 20, fx + 48, fy + 55], fill=(255, 90, 170, 255))
    # neck curve
    for i in range(28):
        t = i / 28
        px = fx + 30 + int(18 * math.sin(t * math.pi))
        py = fy + 25 - i
        d.ellipse([px - 3, py - 3, px + 3, py + 3], fill=(255, 110, 180, 255))
    # head + beak
    d.ellipse([fx + 42, fy - 8, fx + 56, fy + 8], fill=(255, 90, 170, 255))
    d.polygon([(fx + 54, fy), (fx + 72, fy + 4), (fx + 54, fy + 8)], fill=(255, 200, 80, 255))
    # legs
    d.line([(fx + 18, fy + 52), (fx + 12, GROUND)], fill=(255, 180, 80, 255), width=2)
    d.line([(fx + 30, fy + 52), (fx + 34, GROUND)], fill=(255, 180, 80, 255), width=2)
    img.alpha_composite(glow(img.size, fx + 30, fy + 20, 40, (255, 80, 170), 85))
    neon_label(d, x + 8, GROUND - 158, "FLAMINGO", (255, 120, 190, 255), 13, (255, 60, 140))


def draw_high_roller(img, d):
    # Large blue observation wheel — far right (reference)
    cx, cy, r = 1165, GROUND - 100, 95
    # outer rim
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(80, 200, 255, 255), width=5)
    d.ellipse([cx - r + 8, cy - r + 8, cx + r - 8, cy + r - 8], outline=(120, 220, 255, 180), width=2)
    # spokes + cabins
    for a in range(0, 360, 12):
        rad = math.radians(a)
        x2 = cx + int(math.cos(rad) * (r - 6))
        y2 = cy + int(math.sin(rad) * (r - 6))
        d.line([(cx, cy), (x2, y2)], fill=(60, 160, 220, 100), width=1)
        d.rectangle([x2 - 4, y2 - 5, x2 + 4, y2 + 5], fill=(200, 240, 255, 230), outline=(80, 200, 255, 255))
    # hub
    d.ellipse([cx - 10, cy - 10, cx + 10, cy + 10], fill=(40, 80, 120, 255), outline=(120, 230, 255, 255), width=2)
    # support legs
    d.polygon([(cx - 35, GROUND), (cx - 8, cy + 30), (cx + 8, cy + 30), (cx + 35, GROUND)], fill=(35, 40, 60, 255), outline=(80, 200, 255, 255))
    img.alpha_composite(glow(img.size, cx, cy, 85, (80, 200, 255), 80))


def draw_backfill(img, d, rng):
    # Dense filler hotels between landmarks
    for x, h, w, body, accent, warm in (
        (20, 100, 30, (30, 25, 50), (255, 80, 160), True),
        (200, 120, 28, (35, 28, 55), (0, 230, 255), False),
        (420, 110, 40, (40, 30, 50), (255, 180, 60), True),
        (650, 95, 28, (32, 30, 55), (255, 90, 170), True),
        (830, 105, 26, (38, 28, 52), (0, 230, 255), False),
        (970, 115, 40, (42, 32, 58), (255, 200, 70), True),
        (1080, 90, 35, (34, 30, 55), (255, 80, 160), True),
    ):
        tower_block(img, d, x, GROUND - h, w, h, (*body, 255), (*accent, 255), rng, warm=warm)


def draw_palms(img, d):
    for px0 in (115, 310, 500, 640, 850, 1020, 1240):
        d.line([(px0, GROUND), (px0, GROUND - 52)], fill=(25, 60, 40, 255), width=3)
        for ang in (-50, -20, 10, 40):
            rad = math.radians(ang)
            d.line(
                [
                    (px0, GROUND - 52),
                    (px0 + int(math.cos(rad) * 30), GROUND - 52 + int(math.sin(rad) * 12) - 10),
                ],
                fill=(45, 120, 65, 255),
                width=2,
            )


def paste_road(img):
    road_path = ROADS / "road_scroll.png"
    if road_path.exists():
        road = Image.open(road_path).convert("RGBA")
        under = ImageEnhance.Brightness(road).enhance(0.68).filter(ImageFilter.GaussianBlur(1.0))
        img.paste(under, (0, ROAD_TOP))
    else:
        d = ImageDraw.Draw(img)
        d.rectangle([0, ROAD_TOP, W, H], fill=(22, 24, 32, 255))


def enrich_road_reflections(img, rng):
    """Paint soft neon blobs on the static road underlay (like the reference)."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    colors = [(255, 90, 180), (80, 200, 255), (255, 200, 70), (255, 130, 50)]
    for i in range(24):
        x = 40 + i * 52
        y = ROAD_TOP + 35 + (i % 3) * 45
        col = colors[i % len(colors)]
        d.ellipse([x - 40, y - 12, x + 40, y + 12], fill=(*col, 55))
    layer = layer.filter(ImageFilter.GaussianBlur(5))
    img.alpha_composite(layer)


def main():
    rng = random.Random(77)
    img = Image.new("RGBA", (W, H), (8, 6, 22, 255))
    d = ImageDraw.Draw(img)

    paint_sky(img, d, rng)
    d = ImageDraw.Draw(img)

    # distant silhouette row
    for i in range(36):
        x = i * 38 - 8
        h = 35 + (i * 13) % 55
        body = (18 + (i % 4) * 4, 14, 36 + (i % 3) * 6, 255)
        d.rectangle([x, GROUND - h, x + 34, GROUND], fill=body)

    draw_backfill(img, d, rng)
    d = ImageDraw.Draw(img)

    # Reference left→right landmark order
    draw_strat(img, d, rng)
    draw_welcome(img, d)
    draw_palazzo(img, d, rng)
    draw_bellagio(img, d, rng)
    draw_paris(img, d)
    draw_flamingo(img, d, rng)
    draw_high_roller(img, d)
    draw_palms(img, d)

    paint_waterfront(img, d, rng)
    paste_road(img)
    enrich_road_reflections(img, rng)

    # Bloom + punch — match SF neon glow
    bloom = img.filter(ImageFilter.GaussianBlur(3.0))
    img = Image.blend(img, bloom, 0.32)
    img = ImageEnhance.Color(img).enhance(1.22)
    img = ImageEnhance.Contrast(img).enhance(1.1)

    BG.mkdir(parents=True, exist_ok=True)
    out = BG / "city_vegas.png"
    img.save(out, "PNG")
    print(f"wrote {out} ({img.size})")

    prev = Path("/opt/cursor/artifacts/screenshots")
    prev.mkdir(parents=True, exist_ok=True)
    img.save(prev / "city_vegas-preview.png")
    # side-by-side with SF for QA
    sf = Image.open(BG / "city_sf.png").convert("RGBA")
    cmp = Image.new("RGBA", (W * 2, H), (0, 0, 0, 255))
    cmp.paste(sf, (0, 0))
    cmp.paste(img, (W, 0))
    cmp.save(prev / "city-sf-vegas-compare.png")
    print("preview + compare saved")


if __name__ == "__main__":
    main()
