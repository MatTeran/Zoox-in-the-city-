/**
 * Shared game constants for ZOOX FUTURE SF.
 * Scene/object modules should import from here instead of hardcoding values.
 */

export const GAME_TITLE = 'ZOOX FUTURE SF';
export const VEHICLE_CATEGORY = 'ROBOTAXI';
export const VEHICLE_NAME = 'ZOOX';
export const TAGLINE = 'The Future is for Riders';
export const MENU_BLURB = 'Pick up riders. Dodge traffic. Own the neon city.';

/** Logical gameplay resolution (16:9). */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const LANE_COUNT = 3;
/** Y centers for the three traffic lanes in world space. */
export const LANE_Y = [430, 520, 610];

export const PLAYER_X = 220;
export const STARTING_LIVES = 3;

export const SCORE = {
  PASSIVE_PER_SECOND: 10,
  RIDER_BONUS: 300,
  STREAK_MULTIPLIER_STEP: 0.25,
  HIGH_SCORE_KEY: 'zoox_future_sf_high_score',
};

export const SPEED = {
  BASE_SCROLL: 220,
  MAX_SCROLL: 520,
  RAMP_PER_SECOND: 4,
};

export const COLORS = {
  ELECTRIC_CYAN: 0x00f0ff,
  DEEP_NAVY: 0x050816,
  NEON_MAGENTA: 0xff2bd6,
  PURPLE: 0x7a3cff,
  BRIGHT_BLUE: 0x2f6bff,
  WARM_YELLOW: 0xffd84d,
  ORANGE_LANDMARK: 0xff8a1f,
  WHITE: 0xffffff,
};

export const KEYS = {
  UP: ['W', 'UP'],
  DOWN: ['S', 'DOWN'],
  START: ['SPACE'],
  PAUSE: ['P'],
};

/**
 * Phaser game configuration factory.
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
    audio: {
      disableWebAudio: false,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
  };
}
