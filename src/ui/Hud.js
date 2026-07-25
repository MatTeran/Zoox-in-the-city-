import { COLORS } from '../config.js';

/**
 * Top neon HUD: SCORE / RIDERS / LIVES / STREAK.
 */
export class Hud {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;
    this.pausedLabel = null;

    const style = {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '18px',
      color: '#00f0ff',
    };

    this.scoreText = scene.add.text(24, 18, 'SCORE 0', style).setDepth(100);
    this.ridersText = scene.add.text(250, 18, 'RIDERS 0', style).setDepth(100);
    this.livesText = scene.add.text(460, 18, 'LIVES 3', style).setDepth(100);
    this.streakText = scene.add.text(650, 18, 'STREAK 0', {
      ...style,
      color: '#ffd84d',
    }).setDepth(100);

    // Soft panel backing for readability.
    const panel = scene.add.graphics().setDepth(99);
    panel.fillStyle(COLORS.DEEP_NAVY, 0.55);
    panel.fillRoundedRect(12, 8, 820, 44, 10);
    panel.lineStyle(1, COLORS.ELECTRIC_CYAN, 0.55);
    panel.strokeRoundedRect(12, 8, 820, 44, 10);
  }

  /** @param {{ score: number, riders: number, lives: number, streak: number }} snap */
  refresh(snap) {
    this.scoreText.setText(`SCORE ${snap.score}`);
    this.ridersText.setText(`RIDERS ${snap.riders}`);
    this.livesText.setText(`LIVES ${snap.lives}`);
    this.streakText.setText(`STREAK ${snap.streak}`);
  }

  /** @param {boolean} paused */
  setPaused(paused) {
    if (paused && !this.pausedLabel) {
      this.pausedLabel = this.scene.add
        .text(this.scene.scale.width / 2, this.scene.scale.height / 2, 'PAUSED', {
          fontFamily: 'Arial Black, Arial, sans-serif',
          fontSize: '48px',
          color: '#ff2bd6',
        })
        .setOrigin(0.5)
        .setDepth(120);
    } else if (!paused && this.pausedLabel) {
      this.pausedLabel.destroy();
      this.pausedLabel = null;
    }
  }
}
