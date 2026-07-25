# Game Assets

Drop production art into these folders. Gameplay code loads by **stable asset keys**, so files can be replaced without changing scene/object logic.

## Expected keys (Stage 1+)

### backgrounds/
- `sky.webp`
- `skyline.webp`
- `landmarks.webp`
- `foreground.webp`
- `road.webp`
- `road_reflections.webp`

### vehicles/
- `zoox.webp` — transparent Zoox robotaxi only

### traffic/
- Separate transparent cars, e.g. `traffic_sedan.webp`, `traffic_van.webp`

### riders/
- `rider.webp`
- `kiosk.webp`

### ui/
- Buttons, panels, menu chrome

### effects/
- Pickup burst / collision sparks

### audio/
- Optional SFX / music

Until production art arrives, BootScene generates temporary fallback textures.
