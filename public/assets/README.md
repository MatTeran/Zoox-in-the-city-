# ZOOX FUTURE SF — Pixel Asset Pack

All gameplay objects are **separate sprites**. Backgrounds never bake in the player, traffic, coins, or controls.

## Folders

| Folder | Contents |
|---|---|
| `backgrounds/` | Night sky, clouds, static `city_sf` / `city_vegas` plates |
| `skyline/` | Distant SF landmarks + neon midground districts |
| `roads/` | 3-lane wet road, reflections, seamless `road_scroll` band |
| `zoox/` | Player robotaxi frames |
| `traffic/` | Sedan, SUV, van, taxi, EV, bus, truck |
| `coins/` | Gold Z-coin collectible + spin frames + HUD icon |
| `riders/` | Legacy rider/kiosk art (unused) |
| `effects/` | Rain, sparks, burst, headlight cone, fragments |
| `ui/` | HUD panels, hearts, buttons, radar, menu backdrop |
| `audio/` | Reserved for SFX / music |

## Landmark coverage (skyline art)

- Salesforce Tower
- Transamerica Pyramid
- Ferry Building
- Bay Bridge
- Pier 39
- Painted Ladies
- Chinatown lanterns / Dragon district
- Market Street strip
- Cable car
- Lombard zigzag cue
- Fisherman’s Wharf signage

## Regenerating

```bash
python3 scripts/art/generate_pixel_assets.py
```

Replace any PNG in-place — BootScene keys stay stable.

```bash
python3 scripts/art/make_zcoin.py
python3 scripts/art/make_city_worlds.py
```
