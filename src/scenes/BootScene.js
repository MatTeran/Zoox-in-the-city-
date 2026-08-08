import Phaser from 'phaser';
import { ASSET_KEYS, COLORS, GAME_TITLE, PAINTED_ASSET_KEYS } from '../config.js';

/**
 * Preloads the pixel-art cabinet pack and applies nearest-neighbor filtering.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(COLORS.DEEP_NAVY);

    this.add
      .text(width / 2, height / 2 - 36, GAME_TITLE, {
        fontFamily: '"Courier New", monospace',
        fontSize: '40px',
        color: '#00f0ff',
      })
      .setOrigin(0.5);

    const barW = 420;
    const bar = this.add.graphics();
    const drawBar = (p) => {
      bar.clear();
      bar.fillStyle(0x121826, 1);
      bar.fillRect(width / 2 - barW / 2, height / 2 + 20, barW, 16);
      bar.fillStyle(COLORS.ELECTRIC_CYAN, 1);
      bar.fillRect(width / 2 - barW / 2, height / 2 + 20, barW * p, 16);
      bar.lineStyle(2, COLORS.NEON_MAGENTA, 1);
      bar.strokeRect(width / 2 - barW / 2, height / 2 + 20, barW, 16);
    };
    drawBar(0.05);

    this.load.on('progress', drawBar);
    this.load.on('loaderror', (file) => {
      console.warn(`[BootScene] Missing asset: ${file?.key ?? 'unknown'} (${file?.src ?? ''})`);
    });

    // Background layers
    this.load.image(ASSET_KEYS.SKY, 'assets/backgrounds/sky.png');
    this.load.image(ASSET_KEYS.CLOUDS, 'assets/backgrounds/clouds.png');
    this.load.image(ASSET_KEYS.SKYLINE, 'assets/skyline/distant.png');
    this.load.image(ASSET_KEYS.MIDGROUND, 'assets/skyline/midground.png');
    this.load.image(ASSET_KEYS.ROAD, 'assets/roads/road.png');
    this.load.image(ASSET_KEYS.ROAD_REFLECT, 'assets/roads/reflections.png');
    this.load.image(ASSET_KEYS.ROAD_SCROLL, 'assets/roads/road_scroll.png');
    this.load.image(ASSET_KEYS.GAME_WORLD, 'assets/backgrounds/game_world.png');
    this.load.image(ASSET_KEYS.CITY_SF, 'assets/backgrounds/city_sf.png');
    this.load.image(ASSET_KEYS.CITY_VEGAS, 'assets/backgrounds/city_vegas.png');
    this.load.image(ASSET_KEYS.MENU_BG, 'assets/ui/menu_bg.png');

    // Player
    this.load.image(ASSET_KEYS.ZOOX, 'assets/zoox/zoox_0.png');
    this.load.image(ASSET_KEYS.ZOOX_1, 'assets/zoox/zoox_1.png');
    this.load.image(ASSET_KEYS.HEADLIGHT, 'assets/effects/headlight_cone.png');
    this.load.image(ASSET_KEYS.TAILLIGHT, 'assets/effects/taillight_glow.png');
    this.load.image(ASSET_KEYS.UNDERGLOW, 'assets/effects/zoox_underglow.png');
    this.load.image(ASSET_KEYS.SHADOW, 'assets/effects/shadow.png');

    // Traffic
    const trafficFiles = ['sedan', 'suv', 'van', 'taxi', 'ev', 'bus', 'truck'];
    trafficFiles.forEach((name, i) => {
      this.load.image(ASSET_KEYS.TRAFFIC[i], `assets/traffic/${name}.png`);
    });

    // Z coins
    this.load.image(ASSET_KEYS.ZCOIN, 'assets/coins/zcoin.png');
    this.load.image(ASSET_KEYS.ZCOIN_HUD, 'assets/coins/zcoin_hud.png');
    ASSET_KEYS.ZCOIN_FRAMES.forEach((key, i) => {
      this.load.image(key, `assets/coins/zcoin_${i}.png`);
    });

    // FX / UI
    this.load.image(ASSET_KEYS.PICKUP_SPARK, 'assets/effects/pickup_spark.png');
    this.load.image(ASSET_KEYS.NEON_BURST, 'assets/effects/neon_burst.png');
    this.load.image(ASSET_KEYS.RAIN, 'assets/effects/raindrop.png');
    this.load.image(ASSET_KEYS.FRAGMENT, 'assets/effects/collision_fragment.png');
    this.load.image(ASSET_KEYS.HUD_BAR, 'assets/ui/hud_bar.png');
    this.load.image(ASSET_KEYS.HUD_PANEL, 'assets/ui/hud_panel.png');
    this.load.image(ASSET_KEYS.HEART, 'assets/ui/heart.png');
    this.load.image(ASSET_KEYS.BUTTON, 'assets/ui/button.png');
    this.load.image(ASSET_KEYS.RADAR, 'assets/ui/radar.png');
  }

  create() {
    // Crisp pixels for UI icons; linear for painted world/vehicle art.
    const painted = new Set(PAINTED_ASSET_KEYS);
    this.textures.getTextureKeys().forEach((key) => {
      if (key === '__DEFAULT' || key === '__MISSING') return;
      const mode = painted.has(key)
        ? Phaser.Textures.FilterMode.LINEAR
        : Phaser.Textures.FilterMode.NEAREST;
      this.textures.get(key).setFilter(mode);
    });

    if (!this.anims.exists('zoox-drive')) {
      this.anims.create({
        key: 'zoox-drive',
        frames: [{ key: ASSET_KEYS.ZOOX }, { key: ASSET_KEYS.ZOOX_1 }],
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists('zcoin-spin')) {
      this.anims.create({
        key: 'zcoin-spin',
        frames: ASSET_KEYS.ZCOIN_FRAMES.map((key) => ({ key })),
        frameRate: 10,
        repeat: -1,
      });
    }

    this.scene.start('MenuScene');
  }
}
