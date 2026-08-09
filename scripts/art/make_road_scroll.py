#!/usr/bin/env python3
"""
Wet neon scrolling road band for ZOOX FUTURE SF.

Lane geometry matches gameplay:
  ROAD_TOP = 465, LANE_Y = [515, 575, 635]
  → local lane centers = [50, 110, 170]
  → dashed dividers BETWEEN lanes at local Y ≈ 80, 140
"""

from __future__ import annotations

import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "assets" / "roads"
W, ROAD_H = 1280, 255  # GAME_HEIGHT - ROAD_TOP


def clamp(v, a=0, b=255):
    return max(a, min(b, int(v)))


def make_road_scroll() -> Image.Image:
    rng = random.Random(11)
    img = Image.new("RGBA", (W, ROAD_H), (14, 16, 24, 255))
    px = img.load()

    # Dark wet asphalt with subtle grain + horizontal sheen bands
    for y in range(ROAD_H):
        band = 1.0 + 0.08 * math.sin(y / 22.0)
        for x in range(W):
            n = rng.randint(-10, 10)
            base = 16 + n
            # faintly cooler asphalt
            r = clamp(base * band)
            g = clamp((base + 2) * band)
            b = clamp((base + 10) * band + 4)
            px[x, y] = (r, g, b, 255)

    # Long neon reflection streaks (tile-safe horizontal spacing)
    streaks = Image.new("RGBA", (W, ROAD_H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(streaks)
    palette = [
        (0, 230, 255, 70),
        (255, 60, 200, 55),
        (255, 170, 60, 50),
        (90, 140, 255, 45),
        (255, 220, 100, 40),
    ]
    for i, col in enumerate(palette):
        y = 36 + (i % 5) * 34 + (i % 2) * 8
        for k in range(5):
            cx = 64 + k * 256 + (i * 37) % 80
            sd.ellipse([cx - 70, y - 5, cx + 70, y + 5], fill=col)
            # thinner bright core
            core = (min(255, col[0] + 40), min(255, col[1] + 40), min(255, col[2] + 40), col[3] // 2)
            sd.ellipse([cx - 40, y - 2, cx + 40, y + 2], fill=core)
    streaks = streaks.filter(ImageFilter.GaussianBlur(3.5))
    img = Image.alpha_composite(img, streaks)

    # Soft puddle mirrors under each lane (not on divider paint)
    puddles = Image.new("RGBA", (W, ROAD_H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(puddles)
    for ly in (50, 110, 170):  # lane centers
        for k in range(4):
            cx = 160 + k * 300 + (ly % 40)
            pd.ellipse([cx - 55, ly + 8, cx + 55, ly + 20], fill=(0, 180, 220, 28))
    puddles = puddles.filter(ImageFilter.GaussianBlur(2.5))
    img = Image.alpha_composite(img, puddles)

    draw = ImageDraw.Draw(img)

    # Neon curbs
    draw.rectangle([0, 1, W - 1, 4], fill=(0, 245, 255, 210))
    draw.rectangle([0, ROAD_H - 5, W - 1, ROAD_H - 2], fill=(255, 45, 210, 190))
    # Soft curb glow
    curb_glow = Image.new("RGBA", (W, ROAD_H), (0, 0, 0, 0))
    cg = ImageDraw.Draw(curb_glow)
    cg.rectangle([0, 0, W - 1, 10], fill=(0, 230, 255, 40))
    cg.rectangle([0, ROAD_H - 12, W - 1, ROAD_H - 1], fill=(255, 50, 200, 35))
    curb_glow = curb_glow.filter(ImageFilter.GaussianBlur(3))
    img = Image.alpha_composite(img, curb_glow)
    draw = ImageDraw.Draw(img)

    # Dashed dividers BETWEEN lanes (local Y 80 & 140)
    # Screen: ROAD_TOP+80=545, ROAD_TOP+140=605 — midway between LANE_Y pairs.
    dash, gap = 40, 24
    period = dash + gap  # 64 → 1280/64 = 20 exact tiles
    for ly in (80, 140):
        x = 0
        while x < W:
            # soft outer
            draw.rectangle([x, ly - 1, min(x + dash - 1, W - 1), ly + 3], fill=(180, 220, 255, 90))
            # bright dash
            draw.rectangle([x, ly, min(x + dash - 1, W - 1), ly + 2], fill=(235, 245, 255, 230))
            x += period

    # Edge blend for seamless horizontal loop
    arr = img.load()
    blend = 28
    for x in range(blend):
        t = x / blend
        xr = W - blend + x
        for y in range(ROAD_H):
            a = arr[x, y]
            b = arr[xr, y]
            arr[x, y] = tuple(int(a[i] * (1 - t * 0.55) + b[i] * (t * 0.55)) for i in range(4))
            arr[xr, y] = tuple(int(b[i] * (1 - (1 - t) * 0.55) + a[i] * ((1 - t) * 0.55)) for i in range(4))

    return img


def make_road_reflect() -> Image.Image:
    """Matching 1280×255 ADD sheen plate (replaces stretched old reflections)."""
    img = Image.new("RGBA", (W, ROAD_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for i in range(8):
        y = 28 + i * 26
        col = (0, 230, 255, 35) if i % 2 == 0 else (255, 80, 200, 28)
        for k in range(6):
            cx = 40 + k * 210 + (i * 17) % 60
            d.ellipse([cx - 60, y - 4, cx + 60, y + 4], fill=col)
    return img.filter(ImageFilter.GaussianBlur(4))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    road = make_road_scroll()
    road.save(OUT / "road_scroll.png")
    print(f"wrote roads/road_scroll.png {road.size[0]}x{road.size[1]}")
    ref = make_road_reflect()
    ref.save(OUT / "reflections.png")
    print(f"wrote roads/reflections.png {ref.size[0]}x{ref.size[1]}")


if __name__ == "__main__":
    main()
