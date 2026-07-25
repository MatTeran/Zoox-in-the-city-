import Phaser from 'phaser';
import { ASSET_KEYS, LANE_Y } from '../config.js';

/**
 * Oncoming pixel traffic with ground shadow + forgiving hitbox.
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
    this.setScale(0.64);
    // Smaller body = fairer dodges / near-misses.
    this.body.setSize(this.width * 0.5, this.height * 0.28);
    this.body.setOffset(this.width * 0.25, this.height * 0.48);

    this.shadow = scene.add.image(x, LANE_Y[laneIndex] + 22, ASSET_KEYS.SHADOW)
      .setDepth(17 + laneIndex)
      .setScale(1.15, 0.78)
      .setAlpha(0.65);
  }

  /** @param {number} speed */
  drive(speed) {
    this.setVelocityX(-speed);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.shadow?.active) {
      this.shadow.setPosition(this.x, this.y + this.displayHeight * 0.32);
    }
  }

  get isOffscreen() {
    return this.x < -120;
  }

  destroy(fromScene) {
    this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
