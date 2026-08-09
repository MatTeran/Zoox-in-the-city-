#!/usr/bin/env python3
"""Generate gold Z-coin sprites (face + spin frames + HUD icon)."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "assets" / "coins"
SIZE = 128


def clamp(v: float, a: int = 0, b: int = 255) -> int:
    return max(a, min(b, int(v)))


def gold(shade: float) -> tuple[int, int, int, int]:
    """shade: -1 dark .. +1 highlight"""
    return (
        clamp(205 + shade * 50),
        clamp(155 + shade * 55),
        clamp(35 + shade * 40),
        255,
    )


def paint_face() -> Image.Image:
    cx = cy = SIZE // 2
    r = 58
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    px = img.load()

    glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse(
        [cx - r - 6, cy - r - 6, cx + r + 6, cy + r + 6],
        fill=(255, 200, 60, 60),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(4))
    img = Image.alpha_composite(img, glow)
    px = img.load()

    for y in range(SIZE):
        for x in range(SIZE):
            dx, dy = x - cx, y - cy
            d = math.hypot(dx, dy)
            if d > r:
                continue
            nx, ny = dx / r, dy / r
            ndot = max(0.0, -(nx * -0.45 + ny * -0.55))
            rim = 1.0 - abs(d / r - 0.92) * 8 if d > r * 0.86 else 0.0
            shade = -0.22 + ndot * 1.05 + rim * 0.35
            shade += ((x * 17 + y * 31) % 7 - 3) * 0.012
            if d < r * 0.78:
                shade = shade * 0.85 + 0.04
            px[x, y] = gold(shade)

    # Outer rim highlight band
    for a in range(360):
        rad = math.radians(a)
        shade = 0.9 if a < 140 or a > 300 else 0.25
        if 180 < a < 250:
            shade = 0.1
        for rr in (r - 1, r - 2, r - 3):
            ix = int(round(cx + math.cos(rad) * rr))
            iy = int(round(cy + math.sin(rad) * rr))
            if 0 <= ix < SIZE and 0 <= iy < SIZE and px[ix, iy][3] > 0:
                px[ix, iy] = gold(shade)

    # Beaded ring
    bead_r = r - 10
    for i in range(36):
        ang = (i / 36) * math.pi * 2
        bx = cx + math.cos(ang) * bead_r
        by = cy + math.sin(ang) * bead_r
        br = 3.15
        for yy in range(int(by - br - 1), int(by + br + 2)):
            for xx in range(int(bx - br - 1), int(bx + br + 2)):
                if not (0 <= xx < SIZE and 0 <= yy < SIZE):
                    continue
                dd = math.hypot(xx - bx, yy - by)
                if dd <= br:
                    nx = (xx - bx) / br
                    ny = (yy - by) / br
                    ndot = max(0.0, -(nx * -0.4 + ny * -0.6))
                    shade = -0.12 + ndot * 1.15
                    if dd > br * 0.72:
                        shade += 0.2
                    px[xx, yy] = gold(shade)

    # Embossed geometric Z (recessed face + highlight edge)
    z = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    zd = ImageDraw.Draw(z)

    def z_parts(ox: float, oy: float, scale: float, fill):
        t = 12 * scale
        w = 32 * scale
        h = 38 * scale
        top = [
            (cx - w + ox, cy - h + oy),
            (cx + w + ox, cy - h + oy),
            (cx + w + ox, cy - h + t + oy),
            (cx - w + ox, cy - h + t + oy),
        ]
        bot = [
            (cx - w + ox, cy + h - t + oy),
            (cx + w + ox, cy + h - t + oy),
            (cx + w + ox, cy + h + oy),
            (cx - w + ox, cy + h + oy),
        ]
        diag = [
            (cx + w - 2 + ox, cy - h + t + oy),
            (cx + w + ox, cy - h + t + oy),
            (cx - w + 2 + ox, cy + h - t + oy),
            (cx - w + ox, cy + h - t + oy),
        ]
        zd.polygon(top, fill=fill)
        zd.polygon(bot, fill=fill)
        zd.polygon(diag, fill=fill)

    z_parts(2, 2, 1.0, gold(-0.55))
    z_parts(1, 1, 1.0, gold(-0.42))
    z_parts(0, 0, 1.0, gold(-0.32))
    # Thin highlight on top edge of Z
    z_parts(-1.2, -1.2, 0.94, gold(0.7))
    # Carve center of highlight back to recessed tone for thickness
    z_parts(0.2, 0.2, 0.82, gold(-0.28))

    img = Image.alpha_composite(img, z)

    # Specular blob
    spec = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(spec).ellipse(
        [cx - 30, cy - 38, cx - 2, cy - 10],
        fill=(255, 245, 200, 75),
    )
    spec = spec.filter(ImageFilter.GaussianBlur(3))
    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).ellipse(
        [cx - r + 2, cy - r + 2, cx + r - 2, cy + r - 2],
        fill=255,
    )
    sa = Image.composite(spec.split()[3], Image.new("L", (SIZE, SIZE), 0), mask)
    spec.putalpha(sa)
    img = Image.alpha_composite(img, spec)

    px = img.load()
    for y in range(SIZE):
        for x in range(SIZE):
            if math.hypot(x - cx, y - cy) > r + 0.5:
                px[x, y] = (0, 0, 0, 0)
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    face = paint_face()
    face.save(OUT / "zcoin.png")
    face.resize((32, 32), Image.Resampling.LANCZOS).save(OUT / "zcoin_hud.png")

    for i, sx in enumerate([1.0, 0.72, 0.28, 0.72]):
        w = max(8, int(SIZE * sx))
        frame = face.resize((w, SIZE), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        canvas.paste(frame, ((SIZE - w) // 2, 0), frame)
        canvas.save(OUT / f"zcoin_{i}.png")

    print(f"Wrote Z-coin assets to {OUT}")


if __name__ == "__main__":
    main()
