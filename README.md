# ZOOX FUTURE SF

Neon San Francisco robotaxi arcade game.

- **Game engine:** Phaser 3 + Vite (HTML5 Canvas)
- **Mobile demo shell:** Expo (landscape WebView → Phaser game)
- **Later packaging:** Capacitor-ready structure (not installed yet)

Tagline: **The Future is for Riders**

## Quick start (desktop)

```bash
npm install
npm run dev
```

Open the local Vite URL (default `http://localhost:5173`).

## Demo on your phone with Expo Go

1. Start the Phaser game (binds to LAN):

```bash
npm run dev
```

2. Configure Expo to point at that server:

```bash
cp expo-app/.env.example expo-app/.env
```

Edit `expo-app/.env` and set your machine LAN IP:

```bash
EXPO_PUBLIC_GAME_URL=http://YOUR_LAN_IP:5173
```

3. Install Expo deps and launch:

```bash
npm --prefix expo-app install
npm run expo
```

4. Scan the QR code with **Expo Go** (same Wi‑Fi as your computer). Keep the phone in **landscape**.

### Optional helpers

```bash
npm run build           # production web build
npm run preview         # preview dist/
npm run sync:expo-web   # copy dist/ into expo-app/assets/www (for future offline packaging)
```

## Project structure

```text
src/
  main.js
  config.js
  scenes/          Boot, Menu, Game, GameOver
  objects/         Zoox, TrafficCar, RiderPickup
  systems/         Score, Spawn, Input
  ui/              Hud, MobileControls
  styles.css
public/assets/     backgrounds, vehicles, traffic, riders, ui, effects, audio
expo-app/          Expo WebView demo shell
```

## Stage status

- **Stage 0 (current):** scaffolding, stub scenes, HUD/input wiring, Expo demo shell
- Stage 1: layered neon SF world + parallax
- Stage 2: full Zoox vehicle + polished controls
- Stage 3: traffic, riders, collisions, scoring
- Stage 4: premium menu / game over
- Stage 5: juice + mobile polish

## Controls (Stage 0 sandbox)

- **W / ↑** lane up
- **S / ↓** lane down
- **Space** start
- **P** pause
- Mobile: **UP / DOWN / PAUSE** buttons + swipe
