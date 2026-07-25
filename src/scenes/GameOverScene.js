import Phaser from 'phaser';
import { ASSET_KEYS, COLORS, KEYS } from '../config.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';

/**
 * Arcade game-over board with restart.
 */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data = {}) {
    this.finalScore = data.score ?? 0;
    this.riders = data.riders ?? 0;
    this.timeLabel = data.time ?? '0:00';
  }

  create() {
    const { width, height } = this.scale;
    const highScore = ScoreSystem.readHighScore();

    this.add.image(width / 2, height / 2, ASSET_KEYS.MENU_BG)
      .setDisplaySize(width, height)
      .setTint(0x666699);

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.DEEP_NAVY, 0.82);
    panel.fillRect(width * 0.2, height * 0.18, width * 0.6, height * 0.58);
    panel.lineStyle(3, COLORS.NEON_MAGENTA, 1);
    panel.strokeRect(width * 0.2, height * 0.18, width * 0.6, height * 0.58);

    this.add.text(width / 2, height * 0.28, 'GAME OVER', {
      fontFamily: '"Courier New", monospace',
      fontSize: '56px',
      color: '#ff2bd6',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.4, `SCORE  ${this.finalScore}`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '28px',
      color: '#00f0ff',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.48, `RIDERS ${this.riders}   TIME ${this.timeLabel}`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '20px',
      color: '#ffd84d',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.56, `HIGH  ${highScore}`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const btn = this.add.image(width / 2, height * 0.68, ASSET_KEYS.BUTTON)
      .setDisplaySize(220, 64)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2, height * 0.68, 'RESTART', {
      fontFamily: '"Courier New", monospace',
      fontSize: '26px',
      color: '#050816',
    }).setOrigin(0.5);

    const menu = this.add.text(width / 2, height * 0.78, 'MENU', {
      fontFamily: '"Courier New", monospace',
      fontSize: '18px',
      color: '#9bb4d8',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerup', () => this.scene.start('GameScene'));
    menu.on('pointerup', () => this.scene.start('MenuScene'));
    this.input.keyboard?.on(`keydown-${KEYS.START[0]}`, () => this.scene.start('GameScene'));
  }
}
