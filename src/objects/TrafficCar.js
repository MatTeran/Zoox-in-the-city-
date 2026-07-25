import Phaser from 'phaser';
import { ASSET_KEYS, LANE_Y } from '../config.js';

/**
 * Oncoming pixel traffic (right → left).
 */
export class TrafficCar extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} laneIndex
   * @param {string} [textureKey]
   */
  constructor(scene, x, laneIndex, textureKey) {
    const key = textureKey
      || Phaser.Utils.Array.GetRandom(ASSET_KEYS.TRAFFIC.filter((k) => scene.textures.exists(k)));

    super(scene, x, LANE_Y[laneIndex], key);

    this.laneIndex = laneIndex;
    this.nearMissAwarded = false;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5);
    this.setDepth(18 + laneIndex);
    this.setScale(0.48);
    this.setFlipX(false);
    this.body.setSize(this.width * 0.7, this.height * 0.45);
    this.body.setOffset(this.width * 0.15, this.height * 0.4);
  }

  /** @param {number} speed */
  drive(speed) {
    this.setVelocityX(-speed);
  }

  get isOffscreen() {
    return this.x < -120;
  }
}
