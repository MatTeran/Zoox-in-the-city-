import Phaser from 'phaser';
import { ASSET_KEYS, INVINCIBLE_MS, LANE_Y, PLAYER_X } from '../config.js';

/**
 * Pixel Zoox robotaxi — lane-locked, left-anchored, neon underglow + headlight cone.
 */
export class Zoox extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} laneIndex
   */
  constructor(scene, laneIndex = 1) {
    super(scene, PLAYER_X, LANE_Y[laneIndex], ASSET_KEYS.ZOOX);

    this.laneIndex = laneIndex;
    this.invincible = false;
    this.changingLane = false;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5);
    this.setDepth(30);
    this.setScale(0.52);
    this.setCollideWorldBounds(false);
    this.body.setSize(this.width * 0.72, this.height * 0.45);
    this.body.setOffset(this.width * 0.14, this.height * 0.35);

    if (scene.anims.exists('zoox-drive')) {
      this.play('zoox-drive');
    }

    this.headlight = scene.add
      .image(this.x + 70, this.y + 4, ASSET_KEYS.HEADLIGHT)
      .setOrigin(0, 0.5)
      .setDepth(29)
      .setScale(0.7)
      .setAlpha(0.8);

    this.underglow = scene.add.graphics().setDepth(28);
    this.idleTween = scene.tweens.add({
      targets: this,
      y: this.y - 2,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => this.syncFx(),
    });

    this.syncFx();
  }

  syncFx() {
    if (!this.active) return;
    this.headlight.setPosition(this.x + 52, this.y + 4);
    this.underglow.clear();
    this.underglow.fillStyle(0x00b4ff, 0.35 + Math.sin(this.scene.time.now / 180) * 0.1);
    this.underglow.fillEllipse(this.x, this.y + this.displayHeight * 0.28, 70, 12);
  }

  /**
   * @param {number} dir -1 up / +1 down
   */
  changeLane(dir) {
    if (this.changingLane) return;
    const next = Phaser.Math.Clamp(this.laneIndex + dir, 0, LANE_Y.length - 1);
    if (next === this.laneIndex) return;

    this.changingLane = true;
    this.laneIndex = next;

    if (this.idleTween) this.idleTween.pause();

    this.scene.tweens.add({
      targets: this,
      y: LANE_Y[this.laneIndex],
      duration: 150,
      ease: 'Sine.easeInOut',
      onUpdate: () => this.syncFx(),
      onComplete: () => {
        this.changingLane = false;
        if (this.idleTween) {
          this.idleTween.targets[0].y = LANE_Y[this.laneIndex];
          this.idleTween.resume();
        }
        this.syncFx();
      },
    });
  }

  flashInvincible() {
    this.invincible = true;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.35,
      duration: 90,
      yoyo: true,
      repeat: Math.floor(INVINCIBLE_MS / 180),
      onComplete: () => {
        this.setAlpha(1);
        this.invincible = false;
      },
    });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    this.syncFx();
  }

  destroy(fromScene) {
    this.headlight?.destroy();
    this.underglow?.destroy();
    this.idleTween?.stop();
    super.destroy(fromScene);
  }
}
