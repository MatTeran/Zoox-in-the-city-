#!/usr/bin/env python3
"""
Build Zoox robotaxi sprites from the mint seafoam reference plate.

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

    while q:
        y, x = q.popleft()
        if y < 0 or y >= h or x < 0 or x >= w or visited[y, x]:
            continue
        if lum[y, x] > 45:
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
        Image.fromarray(mask, "L").filter(ImageFilter.GaussianBlur(1.1)),
        dtype=np.float32,
    ) / 255.0
    alpha = np.minimum(alpha, feather * 255)
    arr[..., 3] = alpha.astype(np.uint8)
    return Image.fromarray(arr, "RGBA")


def polish_colors(img: Image.Image) -> Image.Image:
    """Push body toward mint seafoam; punch cyan / purple neon for the night road."""
    arr = np.array(img).astype(np.float32)
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]

    mint = (g > r + 8) & (g > b + 5) & (g > 70) & (g < 230) & (a > 180)
    r = np.where(mint, r * 0.55 + 120 * 0.45, r)
    g = np.where(mint, np.minimum(255, g * 0.55 + 220 * 0.45), g)
    b = np.where(mint, b * 0.55 + 185 * 0.45, b)

    cyan = (b > 140) & (g > 120) & (r < 120) & (a > 100)
    g = np.where(cyan, np.minimum(255, g * 1.08), g)
    b = np.where(cyan, np.minimum(255, b * 1.12), b)

    purp = (r > 120) & (b > 140) & (g < r * 0.85) & (a > 100)
    r = np.where(purp, np.minimum(255, r * 1.1), r)
    b = np.where(purp, np.minimum(255, b * 1.08), b)

    out = np.stack([r, g, b, a], axis=-1)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")


def fit_car(img: Image.Image) -> Image.Image:
    """Fit the keyed plate into the canvas, shortened horizontally for arcade read."""
    bbox = img.getbbox()
    if not bbox:
        raise RuntimeError("empty sprite after keying")
    pad = 10
    x0, y0, x1, y1 = bbox
    crop = img.crop((
        max(0, x0 - pad),
        max(0, y0 - pad),
        min(img.width, x1 + pad),
        min(img.height, y1 + pad),
    ))
    cw, ch = CANVAS
    # Shorter arcade silhouette (source plates are too stretched vs traffic).
    target_aspect = 1.32  # width / height
    scale_h = (ch - 28) / crop.height
    nh = int(crop.height * scale_h)
    nw = min(int(nh * target_aspect), cw - 40)
    car = crop.resize((nw, nh), Image.Resampling.LANCZOS)
    return car.filter(ImageFilter.UnsharpMask(radius=1.0, percent=130, threshold=2))


def compose(car: Image.Image, glow_boost: float = 1.0) -> Image.Image:
    cw, ch = CANVAS
    out = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    x = (cw - car.width) // 2
    y = ch - car.height - 4
    cx = cw // 2
    cy = y + int(car.height * 0.86)
    glow = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    # Keep glow pools under the shortened body (avoid wide bbox stretch).
    for rx, ry, col, blur, ox in (
        (100, 14, (0, 230, 255, int(55 * glow_boost)), 4, 0),
        (68, 8, (160, 250, 255, int(40 * glow_boost)), 2.2, 0),
        (28, 11, (220, 70, 255, int(38 * glow_boost)), 3.0, -72),
        (28, 11, (220, 70, 255, int(38 * glow_boost)), 3.0, 72),
    ):
        layer = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        ImageDraw.Draw(layer).ellipse([cx - rx + ox, cy - ry, cx + rx + ox, cy + ry], fill=col)
        glow = Image.alpha_composite(glow, layer.filter(ImageFilter.GaussianBlur(blur)))
    out = Image.alpha_composite(out, glow)
    out.paste(car, (x, y), car)
    return out


def make_underglow() -> Image.Image:
    ug = Image.new("RGBA", (240, 70), (0, 0, 0, 0))
    for rx, ry, col, blur in (
        (110, 18, (0, 230, 255, 150), 7),
        (70, 10, (170, 255, 255, 110), 3),
    ):
        layer = Image.new("RGBA", ug.size, (0, 0, 0, 0))
        ImageDraw.Draw(layer).ellipse([120 - rx, 28 - ry, 120 + rx, 28 + ry], fill=col)
        ug = Image.alpha_composite(ug, layer.filter(ImageFilter.GaussianBlur(blur)))
    return ug


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Missing source plate: {SRC}")
    keyed = polish_colors(key_background(Image.open(SRC)))
    car = fit_car(keyed)
    frame0 = compose(car, 1.0)
    car1 = ImageEnhance.Color(ImageEnhance.Brightness(car).enhance(1.04)).enhance(1.1)
    frame1 = compose(car1, 1.2)

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
