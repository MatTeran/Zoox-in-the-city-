# ZOOX FUTURE SF

Neon San Francisco robotaxi arcade game — 16-bit pixel cabinet energy for mobile.

- **Engine:** Phaser 3 + Vite (HTML5 Canvas, pixelArt mode)
- **Demo shell:** Expo SDK 54 landscape WebView
- **Tagline:** The Future is for Riders

## Quick start

```bash
npm install
npm run dev
```

## Expo Go demo

```bash
npm run dev
cp expo-app/.env.example expo-app/.env
# set EXPO_PUBLIC_GAME_URL to your reachable Vite URL
npm --prefix expo-app install
cd expo-app && npx expo start --tunnel
```

## Regenerate pixel art pack

```bash
python3 scripts/art/generate_pixel_assets.py
```

## Controls

- **W / ↑** lane up · **S / ↓** lane down
- **Space** start / restart · **P** pause
- Mobile: **UP / DOWN / PAUSE** + swipe

## Gameplay

- 3-lane endless runner through rainy neon SF
- Pick up riders (+300, streak multiplier)
- Near-miss bonus · traffic costs a life
- Progressive speed · local high score

## Structure

```text
src/scenes|objects|systems|ui
public/assets/{backgrounds,skyline,roads,zoox,traffic,riders,effects,ui,audio}
expo-app/   Expo WebView demo
scripts/art/generate_pixel_assets.py
```
