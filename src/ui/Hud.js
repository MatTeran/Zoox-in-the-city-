import Phaser from 'phaser';
import { ASSET_KEYS, COLORS, STARTING_LIVES } from '../config.js';

/**
 * Arcade cabinet top HUD: SCORE / RIDERS / LIVES / TIME / STREAK + mini radar.
 */
export class Hud {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;
    this.pausedLabel = null;

    const panelY = 10;
    const mkPanel = (x) => scene.add.image(x, panelY, ASSET_KEYS.HUD_PANEL)
      .setOrigin(0, 0)
      .setDepth(100)
      .setDisplaySize(200, 44);

    mkPanel(16);
    mkPanel(230);
    mkPanel(444);
    mkPanel(658);
    mkPanel(872);

    const style = {
      fontFamily: '"Courier New", monospace',
      fontSize: '18px',
      color: '#e8f7ff',
    };

    this.scoreText = scene.add.text(28, 20, 'SCORE 000000', style).setDepth(101);
    this.ridersText = scene.add.text(242, 20, 'RIDERS 0', style).setDepth(101);
    this.timeText = scene.add.text(456, 20, 'TIME 0:00', style).setDepth(101);
    this.streakText = scene.add.text(670, 20, 'STREAK 0', {
      ...style,
      color: '#ffd84d',
    }).setDepth(101);

    this.livesLabel = scene.add.text(886, 20, 'LIVES', style).setDepth(101);
    this.hearts = [];
    for (let i = 0; i < STARTING_LIVES; i += 1) {
      this.hearts.push(
        scene.add.image(960 + i * 30, 32, ASSET_KEYS.HEART).setDepth(101).setScale(1.1),
      );
    }

    this.radar = scene.add.image(scene.scale.width - 70, scene.scale.height - 70, ASSET_KEYS.RADAR)
      .setDepth(100)
      .setAlpha(0.9);
    this.radarPlayer = scene.add.triangle(
      scene.scale.width - 88,
      scene.scale.height - 70,
      0, 8, 10, 0, 20, 8,
      COLORS.GREEN,
    ).setDepth(101);
    this.radarBlips = [];
  }

  /**
   * @param {{ score: number, riders: number, lives: number, streak: number, time: string }} snap
   */
  refresh(snap) {
    this.scoreText.setText(`SCORE ${String(snap.score).padStart(6, '0')}`);
    this.ridersText.setText(`RIDERS ${snap.riders}`);
    this.timeText.setText(`TIME ${snap.time}`);
    this.streakText.setText(`STREAK ${snap.streak}`);
    this.hearts.forEach((h, i) => h.setVisible(i < snap.lives));
  }

  /**
   * Lightweight radar: player triangle + traffic blips.
   * @param {number} playerLane
   * @param {{ laneIndex: number, x: number }[]} cars
   */
  updateRadar(playerLane, cars) {
    const baseX = this.scene.scale.width - 110;
    const baseY = this.scene.scale.height - 94;
    const laneY = [baseY + 8, baseY + 24, baseY + 40];

    this.radarPlayer.setPosition(baseX + 18, laneY[playerLane]);

    this.radarBlips.forEach((b) => b.destroy());
    this.radarBlips = [];

    cars.slice(0, 8).forEach((car) => {
      const nx = Phaser.Math.Clamp(car.x / this.scene.scale.width, 0, 1);
      const blip = this.scene.add.rectangle(
        baseX + 10 + nx * 70,
        laneY[car.laneIndex],
        5,
        5,
        0xffffff,
      ).setDepth(101);
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
        .setDepth(200);
    } else if (!paused && this.pausedLabel) {
      this.pausedLabel.destroy();
      this.pausedLabel = null;
    }
  }
}
