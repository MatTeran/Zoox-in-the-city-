import Phaser from 'phaser';
import { ASSET_KEYS, LANE_Y } from '../config.js';

/**
 * Neon kiosk + waiting rider — wide pickup hitbox for mobile fairness.
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
    this.setScale(0.7);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    // Generous pickup window so rides don't feel pixel-perfect.
    this.body.setSize(this.width * 1.15, this.height * 0.7);
    this.body.setOffset(-this.width * 0.08, this.height * 0.25);

    const riderKey = Phaser.Utils.Array.GetRandom(
      ASSET_KEYS.RIDERS.filter((k) => scene.textures.exists(k)),
    );

    this.rider = scene.add
      .image(x - 24, LANE_Y[laneIndex] - 4, riderKey)
      .setOrigin(0.5, 1)
      .setScale(0.7)
      .setDepth(17 + laneIndex);

    this.shadow = scene.add
      .image(x, LANE_Y[laneIndex] + 8, ASSET_KEYS.SHADOW)
      .setDepth(15 + laneIndex)
      .setScale(0.8, 0.55)
      .setAlpha(0.55);

    this.holo = scene.add
      .image(x + 2, LANE_Y[laneIndex] - this.displayHeight + 8, ASSET_KEYS.PICKUP_SPARK)
      .setDepth(19)
      .setScale(0.85)
      .setAlpha(0.95)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Bright lane marker under pickup so it's easy to aim for.
    this.laneMark = scene.add.rectangle(x, LANE_Y[laneIndex] + 10, 70, 10, 0x00f0ff, 0.22)
      .setDepth(14)
      .setStrokeStyle(2, 0x00f0ff, 0.65);

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
      angle: { from: -6, to: 6 },
      duration: 260,
      yoyo: true,
      repeat: -1,
    });

    scene.tweens.add({
      targets: this.laneMark,
      alpha: { from: 0.15, to: 0.4 },
      duration: 450,
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
    if (this.rider) this.rider.x = this.x - 24;
    if (this.holo) this.holo.x = this.x + 2;
    if (this.shadow) this.shadow.x = this.x;
    if (this.laneMark) this.laneMark.x = this.x;
  }

  collect() {
    if (this.collected) return false;
    this.collected = true;

    // Tear down satellites immediately so nothing can latch onto the Zoox.
    this.rider?.destroy();
    this.rider = null;
    this.holo?.destroy();
    this.holo = null;
    this.laneMark?.destroy();
    this.laneMark = null;
    this.shadow?.destroy();
    this.shadow = null;

    // Keep scrolling left while fading, then fully destroy the kiosk.
    // (Disabling the body without destroying froze the Z icon on the player.)
    if (this.body) {
      this.body.enable = true;
      this.setVelocityX(-420);
    }
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.55,
      y: this.y - 36,
      duration: 220,
      onComplete: () => this.destroy(),
    });
    return true;
  }

  get isOffscreen() {
    return this.x < -100;
  }

  destroy(fromScene) {
    this.rider?.destroy();
    this.holo?.destroy();
    this.shadow?.destroy();
    this.laneMark?.destroy();
    super.destroy(fromScene);
  }
}
