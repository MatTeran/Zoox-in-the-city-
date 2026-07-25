import Phaser from 'phaser';
import { LANE_Y, PLAYER_X } from '../config.js';

/**
 * Player robotaxi.
 * Stage 0: lightweight placeholder class used once GameScene adopts it fully.
 */
export class Zoox extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} laneIndex
   */
  constructor(scene, laneIndex = 1) {
    super(scene, PLAYER_X, LANE_Y[laneIndex]);

    this.laneIndex = laneIndex;
    this.invincible = false;

    const textureKey = scene.textures.exists('zoox') ? 'zoox' : 'fallback-zoox';
    this.bodySprite = scene.add.image(0, 0, textureKey).setOrigin(0.5);
    this.add(this.bodySprite);

    scene.add.existing(this);
    this.setDepth(20);
  }

  /**
   * Smoothly move to an adjacent lane.
   * @param {number} dir -1 up, +1 down
   */
  changeLane(dir) {
    const next = Phaser.Math.Clamp(this.laneIndex + dir, 0, LANE_Y.length - 1);
    if (next === this.laneIndex) return;

    this.laneIndex = next;
    this.scene.tweens.add({
      targets: this,
      y: LANE_Y[this.laneIndex],
      duration: 140,
      ease: 'Sine.easeInOut',
    });
  }
}
