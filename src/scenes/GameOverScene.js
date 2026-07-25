import Phaser from 'phaser';
import { COLORS, KEYS } from '../config.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';

/**
 * Game over stub. Stage 3+ will pass real final score payloads.
 */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data = {}) {
    this.finalScore = data.score ?? 0;
    this.riders = data.riders ?? 0;
  }

  create() {
    const { width, height } = this.scale;
    const highScore = ScoreSystem.readHighScore();

    this.cameras.main.setBackgroundColor(COLORS.DEEP_NAVY);

    this.add
      .text(width / 2, height * 0.28, 'GAME OVER', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '56px',
        color: '#ff2bd6',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.42, `SCORE  ${this.finalScore}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        color: '#00f0ff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.5, `RIDERS  ${this.riders}    HIGH  ${highScore}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#ffd84d',
      })
      .setOrigin(0.5);

    const restart = this.add
      .text(width / 2, height * 0.68, 'RESTART', {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: '26px',
        color: '#050816',
        backgroundColor: '#00f0ff',
        padding: { x: 26, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    restart.on('pointerup', () => this.scene.start('GameScene'));
    this.input.keyboard?.on(`keydown-${KEYS.START[0]}`, () => this.scene.start('GameScene'));
  }
}
