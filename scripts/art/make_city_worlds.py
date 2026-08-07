#!/usr/bin/env python3
"""
Build static city plates + a seamless scrolling road strip.

- city_sf.png   : static neon San Francisco plate (from existing art)
- city_vegas.png: static neon Las Vegas Strip plate (same composition)
- road_scroll.png: tileable wet road band that scrolls under a static skyline
"""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

ROOT = Path(__file__).resolve().parents[2]
BG = ROOT / "public" / "assets" / "backgrounds"
ROADS = ROOT / "public" / "assets" / "roads"
ROAD_TOP = 465
W, H = 1280, 720
ROAD_H = H - ROAD_TOP


def clamp(v, a=0, b=255):
    return max(a, min(b, int(v)))


def make_road_scroll() -> Image.Image:
    """Seamless wet neon road band matching gameplay lanes."""
    img = Image.new("RGBA", (W, ROAD_H), (18, 20, 28, 255))
    px = img.load()
    rng = random.Random(7)

    # Asphalt grain + wet darker bands
    for y in range(ROAD_H):
        for x in range(W):
            n = rng.randint(-8, 8)
            shade = 18 + n + int(6 * math.sin(x / 40 + y / 18))
            # subtle vertical neon reflections
            if (x + y * 3) % 97 < 3:
                shade += 10
            px[x, y] = (clamp(shade), clamp(shade + 2), clamp(shade + 8), 255)

    draw = ImageDraw.Draw(img)

    # Neon curb lines
    draw.rectangle([0, 2, W, 5], fill=(0, 240, 255, 200))
    draw.rectangle([0, ROAD_H - 6, W, ROAD_H - 3], fill=(255, 43, 214, 180))

    # Soft reflection blobs (tile-safe spacing)
    glow = Image.new("RGBA", (W, ROAD_H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i, (col, y) in enumerate(
        [
            ((255, 140, 40, 55), 38),
            ((0, 220, 255, 50), 98),
            ((255, 60, 180, 45), 158),
            ((255, 200, 80, 40), 58),
            ((80, 120, 255, 40), 118),
        ]
    ):
        for k in range(4):
            cx = 80 + k * 320 + (i % 2) * 40
            gd.ellipse([cx - 50, y - 12, cx + 50, y + 12], fill=col)
    glow = glow.filter(ImageFilter.GaussianBlur(6))
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # Dashed lane lines — period divides width evenly for seamless tiling
    dash = 36
    gap = 28
    period = dash + gap
    assert W % period == 0 or True
    # Adjust period to divide 1280: 40+24=64, 1280/64=20
    dash, gap = 40, 24
    period = dash + gap
    for ly in (50, 110, 170):
        y = ly
        x = 0
        while x < W:
            draw.rectangle([x, y, min(x + dash - 1, W - 1), y + 3], fill=(235, 240, 255, 230))
            x += period

    # Edge blend for seamless loop (left/right average)
    arr = img.load()
    blend = 24
    for x in range(blend):
        t = x / blend
        xr = W - blend + x
        for y in range(ROAD_H):
            a = arr[x, y]
            b = arr[xr, y]
            # pull edges toward each other
            arr[x, y] = tuple(int(a[i] * (1 - t * 0.5) + b[i] * (t * 0.5)) for i in range(4))
            arr[xr, y] = tuple(int(b[i] * (1 - (1 - t) * 0.5) + a[i] * ((1 - t) * 0.5)) for i in range(4))

    return img


def prep_sf_city() -> Image.Image:
    """Static SF plate; road band replaced with base that matches scroll strip."""
    src = BG / "game_world_plate.png"
    if not src.exists():
        src = BG / "game_world.png"
    plate = Image.open(src).convert("RGBA")
    if plate.size != (W, H):
        plate = plate.resize((W, H), Image.Resampling.LANCZOS)

    # Soften baked dashes on the static road so scrolling dashes read cleanly.
    road = plate.crop((0, ROAD_TOP, W, H))
    # Darken / blur road slightly then paste back
    road = ImageEnhance.Brightness(road).enhance(0.85)
    road = road.filter(ImageFilter.GaussianBlur(1.2))
    plate.paste(road, (0, ROAD_TOP))
    return plate


def _rect(d, xy, fill):
    d.rectangle(xy, fill=fill)


def _building(d, x, y, w, h, body, windows=True, accent=None):
    _rect(d, [x, y, x + w, y + h], body)
    if accent:
        _rect(d, [x, y, x + w, y + 4], accent)
    if windows:
        for row in range(3, h - 8, 12):
            for col in range(4, w - 6, 10):
                if (row + col + x) % 17 == 0:
                    continue
                colr = (255, 220, 120, 220) if (row * col + x) % 5 else (120, 220, 255, 200)
                _rect(d, [x + col, y + row, x + col + 4, y + row + 6], colr)


def make_vegas_city() -> Image.Image:
    """Neon Las Vegas Strip night plate — same road composition as SF."""
    img = Image.new("RGBA", (W, H), (8, 6, 22, 255))
    d = ImageDraw.Draw(img)
    rng = random.Random(21)

    # Desert night sky — warmer violet, sparse stars
    for y in range(ROAD_TOP - 40):
        t = y / (ROAD_TOP - 40)
        r = int(12 + t * 28)
        g = int(8 + t * 10)
        b = int(28 + t * 40)
        d.line([(0, y), (W, y)], fill=(r, g, b, 255))

    for _ in range(180):
        x, y = rng.randint(0, W - 1), rng.randint(0, 280)
        s = rng.choice([1, 1, 1, 2])
        a = rng.randint(140, 255)
        d.ellipse([x, y, x + s, y + s], fill=(255, 245, 220, a))

    # Moon
    d.ellipse([1080, 48, 1160, 128], fill=(255, 236, 190, 255))
    d.ellipse([1095, 55, 1165, 125], fill=(18, 10, 36, 255))  # crescent bite

    ground = ROAD_TOP - 55  # waterfront / strip base

    # Water / desert wash under Strip
    for y in range(ground, ROAD_TOP):
        t = (y - ground) / max(1, ROAD_TOP - ground)
        d.line([(0, y), (W, y)], fill=(int(10 + t * 8), int(14 + t * 10), int(28 + t * 12), 255))

    # Reflection streaks into water
    for i in range(40):
        x = 40 + i * 30
        col = rng.choice([(255, 80, 180), (255, 200, 60), (80, 220, 255), (255, 120, 40)])
        d.line([(x, ground + 4), (x, ROAD_TOP - 2)], fill=(*col, 70), width=2)

    # --- Strip skyline (left → right) ---
    # Stratosphere-like tower
    _building(d, 70, ground - 210, 36, 210, (40, 30, 70, 255), accent=(255, 60, 160, 255))
    d.polygon([(70, ground - 210), (88, ground - 250), (106, ground - 210)], fill=(255, 80, 180, 255))
    d.ellipse([78, ground - 262, 98, ground - 242], fill=(255, 220, 120, 255))

    # High-rise cluster
    _building(d, 130, ground - 160, 50, 160, (35, 28, 60, 255), accent=(0, 240, 255, 255))
    _building(d, 190, ground - 190, 42, 190, (50, 24, 55, 255), accent=(255, 200, 60, 255))
    _building(d, 240, ground - 140, 60, 140, (30, 35, 65, 255), accent=(255, 80, 180, 255))

    # Bellagio-ish wide resort
    _building(d, 330, ground - 120, 150, 120, (45, 35, 55, 255), accent=(255, 215, 90, 255))
    # Fountain dots
    for i in range(12):
        fx = 350 + i * 10
        d.ellipse([fx, ground - 20, fx + 4, ground - 8], fill=(140, 220, 255, 180))

    # Caesars / palace block
    _building(d, 500, ground - 150, 70, 150, (55, 40, 30, 255), accent=(255, 180, 60, 255))
    _building(d, 580, ground - 175, 48, 175, (40, 30, 50, 255), accent=(255, 60, 120, 255))

    # Luxor pyramid + beam
    pyramid = [(700, ground), (780, ground - 170), (860, ground)]
    d.polygon(pyramid, fill=(30, 50, 70, 255))
    d.line([(780, ground - 170), (780, 40)], fill=(255, 240, 180, 90), width=3)
    d.polygon([(760, ground - 40), (780, ground - 170), (800, ground - 40)], fill=(0, 220, 255, 60))

    # Sphere / orb venue
    d.ellipse([880, ground - 130, 1010, ground], fill=(25, 35, 55, 255))
    d.ellipse([895, ground - 115, 995, ground - 15], outline=(0, 240, 255, 200), width=2)
    for a in range(0, 180, 18):
        d.arc([895, ground - 115, 995, ground - 15], a, a + 8, fill=(255, 80, 200, 160))

    # High roller / arch cue
    d.arc([1040, ground - 160, 1220, ground + 20], 200, 340, fill=(255, 60, 160, 220), width=4)
    _building(d, 1100, ground - 90, 40, 90, (40, 30, 60, 255), accent=(255, 220, 80, 255))
    _building(d, 1155, ground - 130, 55, 130, (35, 40, 70, 255), accent=(0, 240, 255, 255))

    # Welcome to Fabulous Las Vegas sign (left foreground of strip)
    sign_x, sign_y = 40, ground - 95
    d.ellipse([sign_x, sign_y, sign_x + 70, sign_y + 78], outline=(255, 60, 120, 255), width=3)
    d.rectangle([sign_x + 18, sign_y + 70, sign_x + 52, ground], fill=(80, 80, 90, 255))
    d.rectangle([sign_x + 10, sign_y + 18, sign_x + 60, sign_y + 58], fill=(20, 10, 40, 255))
    # Star top
    d.polygon(
        [
            (sign_x + 35, sign_y - 12),
            (sign_x + 39, sign_y),
            (sign_x + 52, sign_y),
            (sign_x + 41, sign_y + 8),
            (sign_x + 45, sign_y + 20),
            (sign_x + 35, sign_y + 12),
            (sign_x + 25, sign_y + 20),
            (sign_x + 29, sign_y + 8),
            (sign_x + 18, sign_y),
            (sign_x + 31, sign_y),
        ],
        fill=(255, 220, 80, 255),
    )

    # Neon signage text blocks (pixel-ish bars standing in for logos)
    labels = [
        (150, ground - 200, (0, 240, 255), 40),
        (360, ground - 145, (255, 200, 60), 70),
        (520, ground - 175, (255, 80, 180), 50),
        (900, ground - 150, (0, 240, 255), 35),
        (1120, ground - 150, (255, 120, 40), 45),
    ]
    for x, y, col, wlen in labels:
        d.rectangle([x, y, x + wlen, y + 8], fill=(*col, 230))
        d.rectangle([x + 4, y + 12, x + wlen - 4, y + 16], fill=(255, 255, 255, 120))

    # Palm silhouettes
    for px0 in (280, 640, 980, 1240):
        d.line([(px0, ground), (px0, ground - 50)], fill=(20, 40, 30, 255), width=3)
        for ang in (-40, -10, 20, 45):
            rad = math.radians(ang)
            d.line(
                [
                    (px0, ground - 50),
                    (px0 + int(math.cos(rad) * 28), ground - 50 + int(math.sin(rad) * 10) - 8),
                ],
                fill=(30, 70, 45, 255),
                width=2,
            )

    # Soft bloom on neon accents
    bloom = img.filter(ImageFilter.GaussianBlur(3))
    img = Image.blend(img, bloom, 0.22)

    # Road band — match scroll strip base
    road = make_road_scroll()
    # Darker static underlay (scrolling strip covers motion)
    under = ImageEnhance.Brightness(road).enhance(0.75).filter(ImageFilter.GaussianBlur(1.5))
    img.paste(under, (0, ROAD_TOP))

    # Water/road separator curb
    d = ImageDraw.Draw(img)
    d.rectangle([0, ROAD_TOP - 3, W, ROAD_TOP + 1], fill=(255, 200, 80, 160))

    return img


def main() -> None:
    BG.mkdir(parents=True, exist_ok=True)
    ROADS.mkdir(parents=True, exist_ok=True)

    road = make_road_scroll()
    road.save(ROADS / "road_scroll.png")
    print("wrote", ROADS / "road_scroll.png")

    sf = prep_sf_city()
    # Paste matching road underlay under SF too
    under = ImageEnhance.Brightness(road).enhance(0.7).filter(ImageFilter.GaussianBlur(1.2))
    sf.paste(under, (0, ROAD_TOP))
    sf.save(BG / "city_sf.png")
    print("wrote", BG / "city_sf.png")

    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from make_vegas_neon import main as paint_vegas

    paint_vegas()  # richer neon Strip plate


if __name__ == "__main__":
    main()
