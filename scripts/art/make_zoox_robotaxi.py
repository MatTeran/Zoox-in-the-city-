#!/usr/bin/env python3
"""
Build high-quality Zoox robotaxi sprites from the painted reference plate.

Source: scripts/art/sources/zoox_robotaxi_ref.png
Outputs: public/assets/zoox/zoox_{0,1,}.png + effects/zoox_underglow.png
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SRC = Path(__file__).resolve().parent / "sources" / "zoox_robotaxi_ref.png"
OUT = ROOT / "public" / "assets"
CANVAS = (380, 220)


def key_background(src: Image.Image) -> Image.Image:
    arr = np.array(src.convert("RGBA"))
    r = arr[..., 0].astype(np.int16)
    g = arr[..., 1].astype(np.int16)
    b = arr[..., 2].astype(np.int16)
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    h, w = lum.shape

    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        q.append((0, x))
        q.append((h - 1, x))
    for y in range(h):
        q.append((y, 0))
        q.append((y, w - 1))

    thresh = 45
    while q:
        y, x = q.popleft()
        if y < 0 or y >= h or x < 0 or x >= w or visited[y, x]:
            continue
        if lum[y, x] > thresh:
            continue
        visited[y, x] = True
        q.append((y - 1, x))
        q.append((y + 1, x))
        q.append((y, x - 1))
        q.append((y, x + 1))

    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    keep = (lum > 55) | ((mx - mn) > 40)
    bg = visited & (~keep)

    alpha = arr[..., 3].astype(np.float32)
    alpha[bg] = 0
    mask = (~bg).astype(np.uint8) * 255
    feather = np.array(
        Image.fromarray(mask, "L").filter(ImageFilter.GaussianBlur(1.2)),
        dtype=np.float32,
    ) / 255.0
    alpha = np.minimum(alpha, feather * 255)
    arr[..., 3] = alpha.astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def fit_car(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        raise RuntimeError("empty sprite after keying")
    pad = 10
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(img.width, x1 + pad)
    y1 = min(img.height, y1 + pad)
    crop = img.crop((x0, y0, x1, y1))
    cw, ch = CANVAS
    scale = min((cw - 20) / crop.width, (ch - 16) / crop.height)
    nw, nh = int(crop.width * scale), int(crop.height * scale)
    return crop.resize((nw, nh), Image.Resampling.LANCZOS)


def compose(car: Image.Image, glow_boost: float = 1.0) -> Image.Image:
    cw, ch = CANVAS
    out = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    x = (cw - car.width) // 2
    y = ch - car.height - 4
    cx = cw // 2
    cy = y + int(car.height * 0.86)
    glow = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    for rx, ry, col, blur in (
        (145, 16, (0, 220, 255, int(50 * glow_boost)), 5),
        (95, 9, (150, 245, 255, int(35 * glow_boost)), 2.5),
    ):
        layer = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        ImageDraw.Draw(layer).ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=col)
        glow = Image.alpha_composite(glow, layer.filter(ImageFilter.GaussianBlur(blur)))
    out = Image.alpha_composite(out, glow)
    out.paste(car, (x, y), car)
    return out


def make_underglow() -> Image.Image:
    ug = Image.new("RGBA", (240, 70), (0, 0, 0, 0))
    for rx, ry, col, blur in (
        (110, 18, (0, 220, 255, 140), 7),
        (70, 10, (160, 255, 255, 100), 3),
    ):
        layer = Image.new("RGBA", ug.size, (0, 0, 0, 0))
        ImageDraw.Draw(layer).ellipse([120 - rx, 28 - ry, 120 + rx, 28 + ry], fill=col)
        ug = Image.alpha_composite(ug, layer.filter(ImageFilter.GaussianBlur(blur)))
    return ug


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing source plate: {SRC}")
    keyed = key_background(Image.open(SRC))
    car = fit_car(keyed)
    frame0 = compose(car, 1.0)
    car1 = ImageEnhance.Color(ImageEnhance.Brightness(car).enhance(1.04)).enhance(1.08)
    frame1 = compose(car1, 1.18)

    zoox_dir = OUT / "zoox"
    zoox_dir.mkdir(parents=True, exist_ok=True)
    frame0.save(zoox_dir / "zoox_0.png")
    frame1.save(zoox_dir / "zoox_1.png")
    frame0.save(zoox_dir / "zoox.png")
    print(f"wrote zoox/zoox_*.png {frame0.size[0]}x{frame0.size[1]}")

    fx = OUT / "effects"
    fx.mkdir(parents=True, exist_ok=True)
    ug = make_underglow()
    ug.save(fx / "zoox_underglow.png")
    print(f"wrote effects/zoox_underglow.png {ug.size[0]}x{ug.size[1]}")


if __name__ == "__main__":
    main()
