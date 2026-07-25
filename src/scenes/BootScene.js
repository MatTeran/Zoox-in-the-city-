import Phaser from 'phaser';
import { COLORS, GAME_TITLE } from '../config.js';

/**
 * Boot / preload scene.
 * Stage 0: shows a loading label and generates tiny fallback textures
 * so later scenes can run before real art lands.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 24, GAME_TITLE, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '42px',
        color: '#00f0ff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 28, 'LOADING SYSTEMS...', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#ff2bd6',
      })
      .setOrigin(0.5);

    // Real assets will be loaded here in later stages.
    // Keep keys stable so gameplay code does not change when art is swapped.
    this.load.on('loaderror', (file) => {
      console.warn(`[BootScene] Missing asset: ${file?.key ?? 'unknown'}`);
    });
  }

  create() {
    this.createFallbackTextures();
    this.scene.start('MenuScene');
  }

  /**
   * Temporary textures so the pipeline works before production art arrives.
   * These will be replaced by PNG/WebP files under public/assets/.
   */
  createFallbackTextures() {
    if (!this.textures.exists('fallback-zoox')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(COLORS.ELECTRIC_CYAN, 1);
      g.fillRoundedRect(0, 16, 140, 56, 14);
      g.fillStyle(0x101828, 1);
      g.fillRoundedRect(18, 24, 104, 40, 10);
      g.fillStyle(COLORS.BRIGHT_BLUE, 0.9);
      g.fillRect(0, 68, 140, 6);
      g.generateTexture('fallback-zoox', 140, 80);
      g.destroy();
    }

    if (!this.textures.exists('fallback-panel')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(COLORS.DEEP_NAVY, 0.85);
      g.fillRoundedRect(0, 0, 220, 64, 12);
      g.lineStyle(2, COLORS.ELECTRIC_CYAN, 0.9);
      g.strokeRoundedRect(1, 1, 218, 62, 12);
      g.generateTexture('fallback-panel', 220, 64);
      g.destroy();
    }
  }
}
