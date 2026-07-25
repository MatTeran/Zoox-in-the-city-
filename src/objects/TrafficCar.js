import Phaser from 'phaser';
import { LANE_Y } from '../config.js';

/**
 * Oncoming traffic vehicle (right → left).
 * Stage 0 stub — spawn/motion arrive in Stage 3.
 */
export class TrafficCar extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} laneIndex
   * @param {string} textureKey
   */
  constructor(scene, x, laneIndex, textureKey = 'fallback-traffic') {
    const key = scene.textures.exists(textureKey) ? textureKey : 'fallback-panel';
    super(scene, x, LANE_Y[laneIndex], key);

    this.laneIndex = laneIndex;
    scene.add.existing(this);
    scene.physics?.add?.existing?.(this);
    this.setOrigin(0.5);
    this.setDepth(15);
  }

  /**
   * @param {number} speed
   */
  drive(speed) {
    if (this.body) {
      this.setVelocityX(-speed);
    }
  }
}
