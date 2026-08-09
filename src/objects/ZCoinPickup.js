import Phaser from 'phaser';
import { ASSET_KEYS, LANE_Y } from '../config.js';

/**
 * Floating Z-coin collectible — wide hitbox for mobile fairness.
 */
export class ZCoinPickup extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} laneIndex
   */
  constructor(scene, x, laneIndex) {
    const key = scene.textures.exists(ASSET_KEYS.ZCOIN)
      ? ASSET_KEYS.ZCOIN
      : ASSET_KEYS.ZCOIN_FRAMES[0];
    super(scene, x, LANE_Y[laneIndex] - 18, key);

    this.laneIndex = laneIndex;
    this.collected = false;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.setDepth(16 + laneIndex);
    this.setScale(0.72);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    // Generous pickup window so collecting doesn't feel pixel-perfect.
    this.body.setSize(this.width * 1.05, this.height * 1.05);
    this.body.setOffset(this.width * -0.02, this.height * -0.02);

    this.shadow = scene.add
      .image(x, LANE_Y[laneIndex] + 10, ASSET_KEYS.SHADOW)
      .setDepth(15 + laneIndex)
      .setScale(0.55, 0.4)
      .setAlpha(0.5);

    this.glow = scene.add
      .image(x, this.y, ASSET_KEYS.PICKUP_SPARK)
      .setDepth(15 + laneIndex)
      .setScale(1.1)
      .setAlpha(0.55)
      .setTint(0xffd84d)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Lane marker under coin so it's easy to aim for.
    this.laneMark = scene.add.rectangle(x, LANE_Y[laneIndex] + 12, 64, 10, 0xffd84d, 0.2)
      .setDepth(14)
      .setStrokeStyle(2, 0xffd84d, 0.7);

    if (scene.anims.exists('zcoin-spin')) {
      this.play('zcoin-spin');
    }

    scene.tweens.add({
      targets: this,
      y: this.y - 10,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    scene.tweens.add({
      targets: this.glow,
      alpha: { from: 0.35, to: 0.75 },
      scale: { from: 0.95, to: 1.25 },
      duration: 650,
      yoyo: true,
      repeat: -1,
    });

    scene.tweens.add({
      targets: this.laneMark,
      alpha: { from: 0.12, to: 0.38 },
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
    if (this.glow) {
      this.glow.x = this.x;
      this.glow.y = this.y;
    }
    if (this.shadow) this.shadow.x = this.x;
    if (this.laneMark) this.laneMark.x = this.x;
  }

  collect() {
    if (this.collected) return false;
    this.collected = true;

    this.glow?.destroy();
    this.glow = null;
    this.laneMark?.destroy();
    this.laneMark = null;
    this.shadow?.destroy();
    this.shadow = null;

    if (this.body) {
      this.body.enable = true;
      this.setVelocityX(-420);
    }
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 1.35,
      y: this.y - 48,
      duration: 240,
      onComplete: () => this.destroy(),
    });
    return true;
  }

  get isOffscreen() {
    return this.x < -100;
  }

  destroy(fromScene) {
    this.glow?.destroy();
    this.shadow?.destroy();
    this.laneMark?.destroy();
    super.destroy(fromScene);
  }
}
