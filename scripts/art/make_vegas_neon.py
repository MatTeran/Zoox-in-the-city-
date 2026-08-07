#!/usr/bin/env python3
"""
Build city_vegas.png from the painted Strip plate (vegas_strip_source.png).

Fits the painted reference-matched art to ROAD_TOP and adds wet neon road
reflections so it reads like the SF plate + Vegas mock.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
BG = ROOT / "public" / "assets" / "backgrounds"
ROADS = ROOT / "public" / "assets" / "roads"
W, H = 1280, 720
ROAD_TOP = 465


def align_road(plate: Image.Image) -> Image.Image:
    arr = np.array(plate)
    road_y = ROAD_TOP
    for y in range(400, 560):
        mean = arr[y, :, :3].mean()
        dark = (arr[y, :, 0] < 70).mean()
        if dark > 0.7 and mean < 60:
            road_y = y
            break
    if abs(road_y - ROAD_TOP) <= 6:
        return plate
    shift = ROAD_TOP - road_y
    shifted = Image.new("RGBA", (W, H), (8, 6, 24, 255))
    shifted.paste(plate, (0, shift))
    return shifted


def wet_reflections(plate: Image.Image) -> Image.Image:
    """Streak skyline neon colors onto the asphalt (reference wet-road look)."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(layer)
    arr = np.array(plate)
    fallback = [(255, 90, 180), (120, 200, 255), (255, 200, 70), (200, 80, 255)]
    for i, x in enumerate(range(16, W, 16)):
        col_strip = arr[max(0, ROAD_TOP - 45) : max(1, ROAD_TOP - 6), min(x, W - 1), :3]
        if col_strip.size == 0:
            c = fallback[i % len(fallback)]
        else:
            bri = col_strip.sum(axis=1)
            c = tuple(int(v) for v in col_strip[int(bri.argmax())])
            if sum(c) < 180:
                c = fallback[i % len(fallback)]
        y0 = ROAD_TOP + 18 + (i % 5) * 12
        rd.ellipse([x - 26, y0, x + 26, y0 + 16], fill=(*c, 60))
        rd.rectangle([x - 2, ROAD_TOP + 6, x + 2, H - 8], fill=(*c, 32))
    return layer.filter(ImageFilter.GaussianBlur(4))


def fit_plate(src: Image.Image) -> Image.Image:
    plate = src.convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
    plate = align_road(plate)

    # Punch skyline neon a touch
    skyline = plate.crop((0, 0, W, ROAD_TOP))
    skyline = ImageEnhance.Color(skyline).enhance(1.12)
    skyline = ImageEnhance.Contrast(skyline).enhance(1.06)
    plate.paste(skyline, (0, 0))

    road = plate.crop((0, ROAD_TOP, W, H))
    road = ImageEnhance.Brightness(road).enhance(0.78)
    road = road.filter(ImageFilter.GaussianBlur(1.0))
    plate.paste(road, (0, ROAD_TOP))

    scroll_path = ROADS / "road_scroll.png"
    if scroll_path.exists():
        scroll = Image.open(scroll_path).convert("RGBA")
        under = ImageEnhance.Brightness(scroll).enhance(0.65).filter(ImageFilter.GaussianBlur(1.0))
        painted = plate.crop((0, ROAD_TOP, W, H))
        plate.paste(Image.blend(under, painted, 0.4), (0, ROAD_TOP))

    plate = Image.alpha_composite(plate, wet_reflections(plate))

    # Soft red Strat tip bloom (reference cue)
    red = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(red).ellipse([70, 36, 155, 118], fill=(255, 60, 90, 48))
    plate = Image.alpha_composite(plate, red.filter(ImageFilter.GaussianBlur(12)))

    d = ImageDraw.Draw(plate)
    d.rectangle([0, ROAD_TOP - 3, W, ROAD_TOP + 1], fill=(255, 200, 90, 170))
    return plate


def main() -> None:
    BG.mkdir(parents=True, exist_ok=True)
    candidates = [
        BG / "vegas_strip_source.png",
        Path("/opt/cursor/artifacts/assets/vegas-strip-plate-v2.png"),
        Path("/opt/cursor/artifacts/assets/vegas-strip-plate.png"),
    ]
    src_path = next((p for p in candidates if p.exists()), None)
    if src_path is None:
        raise SystemExit(
            "Missing painted Vegas source. Place vegas_strip_source.png in "
            "public/assets/backgrounds/."
        )

    src = Image.open(src_path)
    # Keep a canonical 1280x720 source in-repo
    src.convert("RGBA").resize((W, H), Image.Resampling.LANCZOS).save(BG / "vegas_strip_source.png")

    plate = fit_plate(src)
    out = BG / "city_vegas.png"
    plate.save(out)
    print(f"wrote {out} from {src_path}")


if __name__ == "__main__":
    main()
