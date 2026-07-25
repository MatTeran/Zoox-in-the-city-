import Phaser from 'phaser';
import { ASSET_KEYS, LANE_Y } from '../config.js';

/**
 * Neon kiosk + waiting rider pickup station.
 */
export class RiderPickup extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} laneIndex
   */
  constructor(scene, x, laneIndex) {
    super(scene, x, LANE_Y[laneIndex] - 8, ASSET_KEYS.KIOSK);

    this.laneIndex = laneIndex;
    this.collected = false;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    this.setDepth(16 + laneIndex);
    this.setScale(0.55);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setSize(this.width * 0.7, this.height * 0.55);
    this.body.setOffset(this.width * 0.15, this.height * 0.4);

    const riderKey = Phaser.Utils.Array.GetRandom(
      ASSET_KEYS.RIDERS.filter((k) => scene.textures.exists(k)),
    );

    this.rider = scene.add
      .image(x - 22, LANE_Y[laneIndex] - 4, riderKey)
      .setOrigin(0.5, 1)
      .setScale(0.55)
      .setDepth(17 + laneIndex);

    this.holo = scene.add
      .image(x + 2, LANE_Y[laneIndex] - this.displayHeight + 8, ASSET_KEYS.PICKUP_SPARK)
      .setDepth(19)
      .setScale(0.7)
      .setAlpha(0.9);

    scene.tweens.add({
      targets: this.holo,
      y: this.holo.y - 8,
      alpha: 0.45,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    scene.tweens.add({
      targets: this.rider,
      angle: { from: -4, to: 4 },
      duration: 280,
      yoyo: true,
      repeat: -1,
    });
  }

  /** @param {number} speed */
  scroll(speed) {
    this.setVelocityX(-speed * 0.92);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.rider) this.rider.x = this.x - 18;
    if (this.holo) this.holo.x = this.x + 2;
  }

  collect() {
    if (this.collected) return false;
    this.collected = true;
    this.rider?.destroy();
    this.rider = null;
    this.holo?.destroy();
    this.holo = null;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      scale: 0.85,
      duration: 180,
    });
    return true;
  }

  get isOffscreen() {
    return this.x < -100;
  }

  destroy(fromScene) {
    this.rider?.destroy();
    this.holo?.destroy();
    super.destroy(fromScene);
  }
}
