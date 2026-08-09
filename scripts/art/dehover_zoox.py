#!/usr/bin/env python3
"""
Ground the painted Zoox RoboTaxi.

Removes the cyan hover/thruster pad under the car while preserving the
sky-blue body, then plants tires on a road contact line with a soft shadow.
"""

from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "assets" / "zoox"
SOURCE_COMMIT = "02e5a92"


def load_source(name: str) -> Image.Image:
    data = subprocess.check_output(
        ["git", "-C", str(ROOT), "show", f"{SOURCE_COMMIT}:public/assets/zoox/{name}"],
    )
    tmp = Path(tempfile.gettempdir()) / f"zoox_src_{name}"
    tmp.write_bytes(data)
    return Image.open(tmp).convert("RGBA")


def dehover(src: Image.Image) -> Image.Image:
    arr = np.array(src)
    h, _w = arr.shape[:2]

    for y in range(122, h):
        a = arr[y, :, 3].astype(np.int16)
        r = arr[y, :, 0].astype(np.int16)
        g = arr[y, :, 1].astype(np.int16)
        b = arr[y, :, 2].astype(np.int16)
        if y < 124:
            glow = (b > r + 50) & (g > r + 40) & (b > 160) & (a < 220)
            arr[y, glow, 3] = 0
            continue
        tire = (a > 210) & ((r + g + b) < 150) & (r < 55) & (g < 70)
        arr[y, ~tire, 3] = 0

    img = Image.fromarray(arr, "RGBA")
    bbox = img.getbbox()
    vehicle = img.crop(bbox)
    vw, vh = vehicle.size

    nw, nh = 252, 150
    x0 = (nw - vw) // 2
    y0 = nh - vh - 4
    shadow = Image.new("RGBA", (nw, nh), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse([x0 + 20, nh - 14, x0 + vw - 20, nh - 2], fill=(0, 0, 0, 115))
    shadow = shadow.filter(ImageFilter.GaussianBlur(1.1))
    canvas = Image.alpha_composite(Image.new("RGBA", (nw, nh), (0, 0, 0, 0)), shadow)
    canvas.paste(vehicle, (x0, max(0, y0)), vehicle)
    return canvas


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name in ("zoox_0.png", "zoox_1.png"):
        out = dehover(load_source(name))
        out.save(OUT / name)
        print("wrote", OUT / name, out.size)
    dehover(load_source("zoox_0.png")).save(OUT / "zoox.png")
    print("wrote", OUT / "zoox.png")


if __name__ == "__main__":
    main()
