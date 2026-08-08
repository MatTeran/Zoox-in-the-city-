#!/usr/bin/env python3
"""
Paint a reference-matched Zoox robotaxi sprite.

Matches the white carriage-style side profile:
- pale body, bold outline
- dark central sliding door
- scalloped / notched cabin glass
- cyan underglow + wet-road spill
- glowing cyan X wheels
- magenta / cyan corner light clusters
- corner roof sensor pods
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2] / "public" / "assets"
# 126×75 ×2 = 252×150 — same on-disk size the game already expects.
W, H = 126, 75
UPSCALE = 2

C = {
    "outline": (12, 14, 22, 255),
    "body": (236, 240, 246, 255),
    "body_mid": (214, 220, 230, 255),
    "body_shade": (186, 194, 208, 255),
    "body_deep": (148, 158, 176, 255),
    "roof": (226, 232, 240, 255),
    "glass": (16, 22, 38, 255),
    "glass2": (28, 40, 64, 255),
    "glass_hi": (70, 150, 210, 180),
    "door": (22, 26, 36, 255),
    "door2": (34, 40, 54, 255),
    "door_line": (8, 10, 16, 255),
    "cyan": (0, 230, 255, 255),
    "cyan2": (70, 245, 255, 255),
    "cyan_dim": (0, 170, 210, 255),
    "magenta": (255, 70, 210, 255),
    "magenta2": (255, 130, 230, 255),
    "white": (250, 252, 255, 255),
    "tire": (18, 20, 26, 255),
    "rim": (48, 56, 72, 255),
    "sensor": (28, 32, 42, 255),
    "sensor2": (70, 78, 96, 255),
    "black": (0, 0, 0, 255),
}


def new():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def put(img, x, y, color):
    x, y = int(x), int(y)
    if not (0 <= x < img.width and 0 <= y < img.height):
        return
    if len(color) < 4:
        color = (*color, 255)
    if color[3] >= 250:
        img.putpixel((x, y), color)
        return
    r0, g0, b0, a0 = img.getpixel((x, y))
    a = color[3] / 255.0
    r = int(r0 * (1 - a) + color[0] * a)
    g = int(g0 * (1 - a) + color[1] * a)
    b = int(b0 * (1 - a) + color[2] * a)
    img.putpixel((x, y), (r, g, b, min(255, a0 + color[3])))


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


def glow(img, cx, cy, radius, color, strength=120):
    cr, cg, cb = color[:3]
    for y in range(-radius, radius + 1):
        for x in range(-radius, radius + 1):
            d = math.sqrt(x * x + y * y)
            if d <= radius:
                a = int(strength * (1 - d / radius) ** 1.45)
                if a > 2:
                    put(img, cx + x, cy + y, (cr, cg, cb, a))


def oval_glow(img, cx, cy, rx, ry, color, strength=130):
    cr, cg, cb = color[:3]
    for y in range(-ry, ry + 1):
        for x in range(-rx, rx + 1):
            nx = x / max(1, rx)
            ny = y / max(1, ry)
            d = math.sqrt(nx * nx + ny * ny)
            if d <= 1:
                a = int(strength * (1 - d) ** 1.35)
                if a > 2:
                    put(img, cx + x, cy + y, (cr, cg, cb, a))


def rounded_body(img, x, y, w, h, fill, outline, r=6):
    """Filled rounded rect with outer outline."""
    for yy in range(h):
        for xx in range(w):
            # distance to nearest corner for roundness
            cx = xx if xx < r else (0 if xx < w - r else xx - (w - 1 - r))
            cy = yy if yy < r else (0 if yy < h - r else yy - (h - 1 - r))
            if xx < r and yy < r and (r - xx) ** 2 + (r - yy) ** 2 > r * r:
                continue
            if xx >= w - r and yy < r and (xx - (w - 1 - r)) ** 2 + (r - yy) ** 2 > r * r:
                continue
            if xx < r and yy >= h - r and (r - xx) ** 2 + (yy - (h - 1 - r)) ** 2 > r * r:
                continue
            if xx >= w - r and yy >= h - r and (xx - (w - 1 - r)) ** 2 + (yy - (h - 1 - r)) ** 2 > r * r:
                continue
            put(img, x + xx, y + yy, fill)

    # outline ring
    for yy in range(h):
        for xx in range(w):
            inside = False
            # sample if pixel exists (opaque-ish)
            px = img.getpixel((x + xx, y + yy))
            if px[3] < 20:
                continue
            # edge if neighbor missing
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nx, ny = x + xx + dx, y + yy + dy
                if not (0 <= nx < img.width and 0 <= ny < img.height):
                    inside = True
                    break
                if img.getpixel((nx, ny))[3] < 20:
                    inside = True
                    break
            if inside:
                put(img, x + xx, y + yy, outline)


def scalloped_window(img, x, y, w, h, glass, glass2, notch_amp=3):
    """Cabin glass with wavy / notched bottom edge (reference silhouette)."""
    for yy in range(h):
        for xx in range(w):
            # scallop bottom: two soft scoops (Zoox cabin silhouette)
            t = xx / max(1, w - 1)
            wave = int((0.55 + 0.45 * math.sin(t * math.pi * 2.0)) * notch_amp)
            max_y = h - 1 - wave
            if yy > max_y:
                continue
            # side inset for rounded cabin feel
            if (xx < 1 or xx >= w - 1) and yy < 2:
                continue
            col = glass2 if (yy < 2 or xx in (0, w - 1)) else glass
            # subtle vertical gradient into deeper glass
            if yy > h * 0.55 and col == glass:
                col = (12, 18, 32, 255)
            put(img, x + xx, y + yy, col)

    # cyan glass reflection streaks (not a skyline cutout)
    for i in range(max(4, w // 3)):
        put(img, x + 2 + i, y + 2, C["glass_hi"])
    for i in range(max(2, w // 5)):
        put(img, x + 4 + i, y + 3, (110, 210, 245, 70))
    # thin highlight along scallop lip
    for xx in range(w):
        t = xx / max(1, w - 1)
        wave = int((0.55 + 0.45 * math.sin(t * math.pi * 2.0)) * notch_amp)
        lip = h - 1 - wave
        put(img, x + xx, y + lip, (40, 80, 120, 160))


def draw_wheel(img, cx, cy, frame=0):
    """Dark tire with glowing cyan X hub."""
    r = 7
    for y in range(-r, r + 1):
        for x in range(-r, r + 1):
            d2 = x * x + y * y
            if d2 <= r * r:
                put(img, cx + x, cy + y, C["tire"])
            if d2 <= (r - 2) * (r - 2):
                put(img, cx + x, cy + y, C["rim"])

    # glowing X — rotate 45° every other frame
    arms = [(-3, -3, 3, 3), (-3, 3, 3, -3)] if frame % 2 == 0 else [(0, -4, 0, 4), (-4, 0, 4, 0)]
    for x0, y0, x1, y1 in arms:
        steps = max(abs(x1 - x0), abs(y1 - y0))
        for i in range(steps + 1):
            t = i / max(1, steps)
            x = int(round(x0 + (x1 - x0) * t))
            y = int(round(y0 + (y1 - y0) * t))
            put(img, cx + x, cy + y, C["cyan"])
            put(img, cx + x, cy + y, (180, 255, 255, 120))
    put(img, cx, cy, C["white"])
    glow(img, cx, cy, 5, C["cyan"], 55)


def draw_zoox(frame=0):
    img = new()

    # Soft wet-road underglow spill (under the whole carriage)
    oval_glow(img, 63, 66, 48, 8, C["cyan"], 150)
    oval_glow(img, 63, 64, 34, 5, C["cyan2"], 90)
    glow(img, 22, 58, 10, C["magenta"], 70)
    glow(img, 104, 58, 10, C["cyan"], 70)

    # Contact shadow
    oval_glow(img, 63, 70, 40, 4, (0, 0, 0, 255), 100)

    # --- Main body (carriage) ---
    bx, by, bw, bh = 12, 12, 102, 42
    # shade pass then mid then highlight band
    rounded_body(img, bx, by + 2, bw, bh - 2, C["body_mid"], C["outline"], r=8)
    # upper pale shell
    rect(img, bx + 3, by + 3, bw - 6, 16, C["body"])
    # roof band
    rect(img, bx + 10, by + 1, bw - 20, 5, C["roof"])
    hline(img, bx + 12, by, bw - 24, C["outline"])
    # lower rocker darker
    rect(img, bx + 3, by + 30, bw - 6, 10, C["body_shade"])
    rect(img, bx + 4, by + 34, bw - 8, 5, C["body_deep"])

    # cyan belt line above rocker
    hline(img, bx + 6, by + 32, bw - 12, C["cyan_dim"])
    hline(img, bx + 12, by + 33, bw - 24, (0, 230, 255, 150))

    # re-stroke outer outline for crisp silhouette
    for yy in range(by, by + bh):
        for xx in range(bx, bx + bw):
            px = img.getpixel((xx, yy))
            if px[3] < 40:
                continue
            edge = False
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                n = img.getpixel((xx + dx, yy + dy)) if 0 <= xx + dx < W and 0 <= yy + dy < H else (0, 0, 0, 0)
                if n[3] < 40:
                    edge = True
                    break
            if edge:
                put(img, xx, yy, C["outline"])

    # --- Central sliding door ---
    door_x, door_y, door_w, door_h = 54, 16, 18, 28
    rect(img, door_x, door_y, door_w, door_h, C["door"])
    rect(img, door_x + 1, door_y + 1, door_w - 2, door_h - 2, C["door2"])
    # vertical door rails (double slider)
    vline(img, door_x + door_w // 2 - 1, door_y + 2, door_h - 4, C["door_line"])
    vline(img, door_x + door_w // 2, door_y + 2, door_h - 4, (10, 12, 18, 200))
    # handle notch
    rect(img, door_x + door_w - 5, door_y + 13, 3, 5, C["cyan_dim"])
    put(img, door_x + door_w - 4, door_y + 14, C["cyan"])

    # --- Scalloped cabin windows (left / right of door) — taller glass ---
    scalloped_window(img, 18, 16, 34, 22, C["glass"], C["glass2"], notch_amp=4)
    scalloped_window(img, 74, 16, 34, 22, C["glass"], C["glass2"], notch_amp=4)
    # pillar frames between glass and door
    vline(img, 52, 15, 26, C["outline"])
    vline(img, 72, 15, 26, C["outline"])
    vline(img, 17, 15, 24, C["outline"])
    vline(img, 108, 15, 24, C["outline"])

    # --- Roof sensor pods (corners) ---
    for sx in (20, 98):
        rect(img, sx, 6, 8, 5, C["sensor"])
        rect(img, sx + 1, 5, 6, 3, C["sensor2"])
        put(img, sx + 3, 4, C["cyan"])
        put(img, sx + 4, 4, C["white"])
        glow(img, sx + 3, 5, 3, C["cyan"], 50)
    # tiny mid roof ridge sensors
    rect(img, 58, 7, 10, 3, C["sensor"])
    put(img, 61, 6, C["cyan_dim"])
    put(img, 64, 6, C["cyan_dim"])

    # --- Corner light clusters ---
    # Left (rear-ish): magenta / hot pink cluster
    rect(img, 13, 38, 6, 7, C["magenta"])
    rect(img, 14, 39, 4, 5, C["magenta2"])
    put(img, 15, 40, C["white"])
    glow(img, 16, 41, 7, C["magenta"], 100)

    # Right (front-ish): white / cyan cluster
    rect(img, 107, 38, 6, 7, C["white"])
    rect(img, 108, 39, 4, 5, C["cyan2"])
    put(img, 109, 40, C["white"])
    glow(img, 110, 41, 7, C["cyan"], 100)

    # Upper end markers (bidirectional look)
    vline(img, 14, 20, 10, C["magenta2"] if frame % 2 == 0 else C["magenta"])
    vline(img, 111, 20, 10, C["cyan2"] if frame % 2 == 0 else C["white"])

    # --- Strong underbody neon bar ---
    hline(img, 20, 55, 86, C["cyan"])
    hline(img, 24, 56, 78, C["cyan2"])
    for i in range(0, 86, 2):
        put(img, 20 + i, 54, (0, 230, 255, 170))
    oval_glow(img, 63, 58, 44, 5, C["cyan"], 120)

    # --- Wheel wells + wheels ---
    for wx in (32, 94):
        # well shade cut into rocker
        rect(img, wx - 9, 48, 18, 8, C["outline"])
        rect(img, wx - 8, 49, 16, 6, (8, 10, 16, 255))
        draw_wheel(img, wx, 58 + (frame % 2), frame)

    # tiny body highlight seam
    hline(img, 22, 14, 82, (255, 255, 255, 55))

    return img


def make_underglow():
    """Separate ADD-blend underglow plate for runtime pulse."""
    img = Image.new("RGBA", (96, 28), (0, 0, 0, 0))
    oval_glow(img, 48, 14, 44, 10, C["cyan"], 180)
    oval_glow(img, 48, 12, 28, 6, C["cyan2"], 120)
    oval_glow(img, 48, 16, 40, 5, (120, 255, 255, 255), 70)
    return img.resize((96 * UPSCALE, 28 * UPSCALE), Image.NEAREST)


def save(img, rel):
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    big = img.resize((img.width * UPSCALE, img.height * UPSCALE), Image.NEAREST)
    big.save(path, "PNG")
    print(f"wrote {rel} {big.size[0]}x{big.size[1]}")


def main():
    for i in range(2):
        save(draw_zoox(i), f"zoox/zoox_{i}.png")
    save(draw_zoox(0), "zoox/zoox.png")
    ug = make_underglow()
    path = ROOT / "effects" / "zoox_underglow.png"
    path.parent.mkdir(parents=True, exist_ok=True)
    ug.save(path, "PNG")
    print(f"wrote effects/zoox_underglow.png {ug.size[0]}x{ug.size[1]}")


if __name__ == "__main__":
    main()
