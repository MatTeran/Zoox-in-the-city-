#!/usr/bin/env python3
"""
Build city_vegas.png from the painted Strip plate (vegas_strip_source.png).

The painted plate matches the neon Las Vegas reference mock and SF plate energy.
Regenerate source via image tool if needed, then run this script to fit ROAD_TOP.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
BG = ROOT / "public" / "assets" / "backgrounds"
ROADS = ROOT / "public" / "assets" / "roads"
W, H = 1280, 720
ROAD_TOP = 465


def fit_plate(src: Image.Image) -> Image.Image:
    plate = src.convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)

    road = plate.crop((0, ROAD_TOP, W, H))
    road = ImageEnhance.Brightness(road).enhance(0.82)
    road = road.filter(ImageFilter.GaussianBlur(1.1))
    plate.paste(road, (0, ROAD_TOP))

    scroll_path = ROADS / "road_scroll.png"
    if scroll_path.exists():
        scroll = Image.open(scroll_path).convert("RGBA")
        under = ImageEnhance.Brightness(scroll).enhance(0.7).filter(ImageFilter.GaussianBlur(1.1))
        painted = plate.crop((0, ROAD_TOP, W, H))
        plate.paste(Image.blend(under, painted, 0.35), (0, ROAD_TOP))

    d = ImageDraw.Draw(plate)
    d.rectangle([0, ROAD_TOP - 3, W, ROAD_TOP + 1], fill=(255, 200, 90, 170))
    return plate


def main() -> None:
    BG.mkdir(parents=True, exist_ok=True)
    candidates = [
        BG / "vegas_strip_source.png",
        Path("/opt/cursor/artifacts/assets/vegas-strip-plate.png"),
    ]
    src_path = next((p for p in candidates if p.exists()), None)
    if src_path is None:
        raise SystemExit(
            "Missing painted Vegas source. Place vegas_strip_source.png in "
            "public/assets/backgrounds/ (or artifacts/assets/vegas-strip-plate.png)."
        )

    src = Image.open(src_path)
    # Persist canonical source inside the repo assets folder
    fitted_src = src.convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
    fitted_src.save(BG / "vegas_strip_source.png")

    plate = fit_plate(src)
    out = BG / "city_vegas.png"
    plate.save(out)
    print(f"wrote {out} from {src_path}")


if __name__ == "__main__":
    main()
