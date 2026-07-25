import Phaser from 'phaser';
import { ASSET_KEYS, COLORS, STARTING_LIVES } from '../config.js';

/**
 * Reference-style arcade HUD:
 * solid top bezel bar + SCORE / RIDERS / LIVES / TIME / STREAK + bottom-right minimap.
 */
export class Hud {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;
    this.pausedLabel = null;
    const w = scene.scale.width;
    const h = scene.scale.height;

    // Solid dark-blue arcade header like the reference screenshot
    this.bar = scene.add.image(0, 0, ASSET_KEYS.HUD_BAR)
      .setOrigin(0, 0)
      .setDisplaySize(w, 52)
      .setDepth(100)
      .setScrollFactor(0);

    const style = {
      fontFamily: '"Courier New", monospace',
      fontSize: '20px',
      color: '#ffffff',
    };

    this.levelText = scene.add.text(24, 16, 'LEVEL 1', style).setDepth(101).setScrollFactor(0);
    this.scoreText = scene.add.text(180, 16, 'SCORE 000000', style).setDepth(101).setScrollFactor(0);
    this.ridersText = scene.add.text(420, 16, 'RIDERS 0', style).setDepth(101).setScrollFactor(0);
    this.timeText = scene.add.text(600, 16, 'TIME 0:00', style).setDepth(101).setScrollFactor(0);
    this.streakText = scene.add.text(780, 16, 'STREAK 0', {
      ...style,
      color: '#ffd84d',
    }).setDepth(101).setScrollFactor(0);

    this.livesLabel = scene.add.text(980, 16, 'LIVES', style).setDepth(101).setScrollFactor(0);
    this.hearts = [];
    for (let i = 0; i < STARTING_LIVES; i += 1) {
      this.hearts.push(
        scene.add.image(1060 + i * 34, 26, ASSET_KEYS.HEART)
          .setDepth(101)
          .setScale(1.25)
          .setScrollFactor(0),
      );
    }

    // Bottom-right minimap (reference)
    this.radar = scene.add.image(w - 78, h - 78, ASSET_KEYS.RADAR)
      .setDepth(100)
      .setDisplaySize(120, 120)
      .setAlpha(0.92)
      .setScrollFactor(0);

    this.radarPlayer = scene.add.triangle(
      w - 110,
      h - 78,
      0, 9, 11, 0, 22, 9,
      COLORS.GREEN,
    ).setDepth(101).setScrollFactor(0);

    this.radarBlips = [];
  }

  /**
   * @param {{ score: number, riders: number, lives: number, streak: number, time: string }} snap
   */
  refresh(snap) {
    // Level ramps loosely with score for arcade flavor
    const level = Math.max(1, Math.floor(snap.score / 2500) + 1);
    this.levelText.setText(`LEVEL ${level}`);
    this.scoreText.setText(`SCORE ${String(snap.score).padStart(6, '0')}`);
    this.ridersText.setText(`RIDERS ${snap.riders}`);
    this.timeText.setText(`TIME ${snap.time}`);
    this.streakText.setText(`STREAK ${snap.streak}`);
    this.hearts.forEach((heart, i) => heart.setVisible(i < snap.lives));
  }

  /**
   * @param {number} playerLane
   * @param {{ laneIndex: number, x: number }[]} cars
   */
  updateRadar(playerLane, cars) {
    const baseX = this.scene.scale.width - 128;
    const baseY = this.scene.scale.height - 118;
    const laneY = [baseY + 18, baseY + 40, baseY + 62];

    this.radarPlayer.setPosition(baseX + 22, laneY[playerLane]);

    this.radarBlips.forEach((b) => b.destroy());
    this.radarBlips = [];

    cars.slice(0, 10).forEach((car) => {
      const nx = Phaser.Math.Clamp(car.x / this.scene.scale.width, 0, 1);
      const blip = this.scene.add.rectangle(
        baseX + 16 + nx * 80,
        laneY[car.laneIndex],
        6,
        6,
        0xffffff,
      ).setDepth(101).setScrollFactor(0);
      this.radarBlips.push(blip);
    });
  }

  /** @param {boolean} paused */
  setPaused(paused) {
    if (paused && !this.pausedLabel) {
      this.pausedLabel = this.scene.add
        .text(this.scene.scale.width / 2, this.scene.scale.height / 2, 'PAUSED', {
          fontFamily: '"Courier New", monospace',
          fontSize: '56px',
          color: '#ff2bd6',
          backgroundColor: '#050816',
          padding: { x: 18, y: 10 },
        })
        .setOrigin(0.5)
        .setDepth(200)
        .setScrollFactor(0);
    } else if (!paused && this.pausedLabel) {
      this.pausedLabel.destroy();
      this.pausedLabel = null;
    }
  }
}
