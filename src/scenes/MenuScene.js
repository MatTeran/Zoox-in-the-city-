import Phaser from 'phaser';
import {
  COLORS,
  GAME_TITLE,
  KEYS,
  MENU_BLURB,
  TAGLINE,
  VEHICLE_CATEGORY,
  VEHICLE_NAME,
} from '../config.js';

/**
 * Premium title screen stub.
 * Stage 0 establishes layout regions; Stage 4 will polish visuals/assets.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(COLORS.DEEP_NAVY);
    this.drawBackdrop(width, height);

    // LEFT: vehicle select card (always Zoox / ROBOTAXI)
    this.add
      .text(width * 0.24, height * 0.16, VEHICLE_CATEGORY, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#7a3cff',
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    this.add
      .image(width * 0.24, height * 0.42, 'fallback-zoox')
      .setScale(2.1)
      .setOrigin(0.5);

    this.add
      .text(width * 0.24, height * 0.62, VEHICLE_NAME, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '48px',
        color: '#00f0ff',
      })
      .setOrigin(0.5);

    this.add
      .text(width * 0.24, height * 0.71, TAGLINE, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#ffd84d',
      })
      .setOrigin(0.5);

    this.add
      .text(width * 0.24, height * 0.79, 'SELECTED', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '20px',
        color: '#ff2bd6',
      })
      .setOrigin(0.5);

    // RIGHT: title + start CTA
    const [titleA, titleB] = GAME_TITLE.split(' FUTURE ');
    this.add
      .text(width * 0.68, height * 0.28, titleA, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '64px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(width * 0.68, height * 0.38, `FUTURE ${titleB}`, {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '54px',
        color: '#00f0ff',
      })
      .setOrigin(0.5);

    this.add
      .text(width * 0.68, height * 0.52, MENU_BLURB, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#d7e7ff',
        align: 'center',
        wordWrap: { width: width * 0.42 },
      })
      .setOrigin(0.5);

    const startBtn = this.add
      .text(width * 0.68, height * 0.68, 'START GAME', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '28px',
        color: '#050816',
        backgroundColor: '#00f0ff',
        padding: { x: 28, y: 16 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setStyle({ backgroundColor: '#ff2bd6' }));
    startBtn.on('pointerout', () => startBtn.setStyle({ backgroundColor: '#00f0ff' }));
    startBtn.on('pointerup', () => this.startGame());

    this.add
      .text(width * 0.68, height * 0.8, 'Press SPACE · Swipe or tap Start', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#9bb4d8',
      })
      .setOrigin(0.5);

    this.input.keyboard?.on(`keydown-${KEYS.START[0]}`, () => this.startGame());
  }

  drawBackdrop(width, height) {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0a1230, 0x0a1230, 0x1a0b36, 0x071828, 1);
    g.fillRect(0, 0, width, height);

    // Soft neon orbs — atmosphere only for Stage 0.
    g.fillStyle(COLORS.PURPLE, 0.18);
    g.fillCircle(width * 0.2, height * 0.2, 160);
    g.fillStyle(COLORS.ELECTRIC_CYAN, 0.12);
    g.fillCircle(width * 0.78, height * 0.7, 180);
  }

  startGame() {
    this.scene.start('GameScene');
  }
}
