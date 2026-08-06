/**
 * Shared constants for ZOOX FUTURE SF — pixel neon arcade cabinet.
 */

export const GAME_TITLE = 'ZOOX FUTURE SF';
export const VEHICLE_CATEGORY = 'ROBOTAXI';
export const VEHICLE_NAME = 'ZOOX';
export const TAGLINE = 'The Future is for Riders';
export const MENU_BLURB = 'COLLECT Z COINS. DODGE TRAFFIC. OWN THE NEON CITY.';

/** Logical gameplay resolution (16:9 arcade viewport). */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const LANE_COUNT = 3;
/** Y centers for the three traffic lanes (road sits in lower third, reference-style). */
export const LANE_Y = [515, 575, 635];

export const PLAYER_X = 250;
export const STARTING_LIVES = 3;

export const SCORE = {
  PASSIVE_PER_SECOND: 10,
  ZCOIN_BONUS: 300,
  NEAR_MISS_BONUS: 75,
  STREAK_MULTIPLIER_STEP: 0.25,
  HIGH_SCORE_KEY: 'zoox_future_sf_high_score',
};

export const SPEED = {
  BASE_SCROLL: 180,
  MAX_SCROLL: 420,
  RAMP_PER_SECOND: 2.2,
  TRAFFIC_MIN: 220,
  TRAFFIC_MAX: 480,
};

export const SPAWN = {
  TRAFFIC_START_MS: 1600,
  TRAFFIC_MIN_MS: 750,
  ZCOIN_START_MS: 1800,
  ZCOIN_MIN_MS: 1100,
};

/** Longer forgiveness window after a hit. */
export const INVINCIBLE_MS = 2200;

export const COLORS = {
  ELECTRIC_CYAN: 0x00f0ff,
  DEEP_NAVY: 0x050816,
  NEON_MAGENTA: 0xff2bd6,
  PURPLE: 0x7a3cff,
  BRIGHT_BLUE: 0x2f6bff,
  WARM_YELLOW: 0xffd84d,
  ORANGE_LANDMARK: 0xff8a1f,
  WHITE: 0xffffff,
  GREEN: 0x40ffa0,
};

export const KEYS = {
  UP: ['W', 'UP'],
  DOWN: ['S', 'DOWN'],
  START: ['SPACE'],
  PAUSE: ['P'],
};

export const ASSET_KEYS = {
  SKY: 'sky',
  CLOUDS: 'clouds',
  SKYLINE: 'skyline',
  MIDGROUND: 'midground',
  ROAD: 'road',
  ROAD_REFLECT: 'road_reflect',
  GAME_WORLD: 'game_world',
  ZOOX: 'zoox',
  ZOOX_1: 'zoox_1',
  HEADLIGHT: 'headlight_cone',
  TAILLIGHT: 'taillight_glow',
  SHADOW: 'shadow',
  PICKUP_SPARK: 'pickup_spark',
  NEON_BURST: 'neon_burst',
  RAIN: 'raindrop',
  FRAGMENT: 'collision_fragment',
  HUD_BAR: 'hud_bar',
  HUD_PANEL: 'hud_panel',
  HEART: 'heart',
  BUTTON: 'button',
  RADAR: 'radar',
  MENU_BG: 'menu_bg',
  ZCOIN: 'zcoin',
  ZCOIN_HUD: 'zcoin_hud',
  ZCOIN_FRAMES: ['zcoin_0', 'zcoin_1', 'zcoin_2', 'zcoin_3'],
  TRAFFIC: ['traffic_sedan', 'traffic_suv', 'traffic_van', 'traffic_taxi', 'traffic_ev', 'traffic_bus', 'traffic_truck'],
};

/** Painted plates/sprites that should use linear filtering (not nearest). */
export const PAINTED_ASSET_KEYS = [
  ASSET_KEYS.MENU_BG,
  ASSET_KEYS.GAME_WORLD,
  ASSET_KEYS.ZOOX,
  ASSET_KEYS.ZOOX_1,
  ASSET_KEYS.ZCOIN,
  ASSET_KEYS.ZCOIN_HUD,
  ...ASSET_KEYS.ZCOIN_FRAMES,
  ...ASSET_KEYS.TRAFFIC,
];

/**
 * @param {typeof Phaser.Scene[]} scenes
 */
export function createGameConfig(scenes) {
  return {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#050816',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: { y: 0 },
      },
    },
    input: {
      activePointers: 3,
    },
    scene: scenes,
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true,
    },
  };
}
