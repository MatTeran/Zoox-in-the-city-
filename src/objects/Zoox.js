import Phaser from 'phaser';
import { ASSET_KEYS, INVINCIBLE_MS, LANE_Y, PLAYER_X } from '../config.js';

/**
 * Pixel Zoox — lane Y is authoritative; idle bounce is a visual offset only.
 */
export class Zoox extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} laneIndex
   */
  constructor(scene, laneIndex = 1) {
    super(scene, PLAYER_X, LANE_Y[laneIndex], ASSET_KEYS.ZOOX);

    this.laneIndex = laneIndex;
    this.baseY = LANE_Y[laneIndex];
    this.bounce = 0;
    this.invincible = false;
    this.changingLane = false;
    this.pendingDir = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5);
    this.setDepth(30);
    this.setScale(0.78);
    this.setCollideWorldBounds(false);
    this.body.setSize(this.width * 0.55, this.height * 0.32);
    this.body.setOffset(this.width * 0.22, this.height * 0.42);

    if (scene.anims.exists('zoox-drive')) {
      this.play('zoox-drive');
    }

    this.shadow = scene.add.image(this.x, this.y + 28, ASSET_KEYS.SHADOW)
      .setDepth(27)
      .setScale(1.4, 0.95)
      .setAlpha(0.75);

    this.headlight = scene.add.image(this.x + 58, this.y + 2, ASSET_KEYS.HEADLIGHT)
      .setOrigin(0, 0.5)
      .setDepth(29)
      .setScale(0.9)
      .setAlpha(0.9)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.taillight = scene.add.image(this.x - 48, this.y + 2, ASSET_KEYS.TAILLIGHT)
      .setDepth(29)
      .setScale(1.15)
      .setAlpha(0.8)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.underglow = scene.add.graphics().setDepth(28);

    // Bounce offset object — never tween sprite.y directly for idle.
    this.bounceState = { v: 0 };
    this.idleTween = scene.tweens.add({
      targets: this.bounceState,
      v: -3,
      duration: 480,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.syncPosition();
  }

  syncPosition() {
    if (!this.active) return;
    if (!this.changingLane) {
      this.y = this.baseY + this.bounceState.v;
    }
    this.shadow.setPosition(this.x + 2, this.baseY + this.displayHeight * 0.34);
    this.headlight.setPosition(this.x + 58, this.y + 2);
    this.taillight.setPosition(this.x - 52, this.y + 2);
    this.underglow.clear();
    const pulse = 0.35 + Math.sin(this.scene.time.now / 180) * 0.1;
    this.underglow.fillStyle(0x00e5ff, pulse);
    this.underglow.fillEllipse(this.x, this.y + this.displayHeight * 0.3, 90, 15);
    this.underglow.fillStyle(0x40ffa0, pulse * 0.4);
    this.underglow.fillEllipse(this.x + 22, this.y + this.displayHeight * 0.3, 44, 11);
  }

  /**
   * @param {number} dir -1 up / +1 down
   */
  changeLane(dir) {
    if (!dir) return;
    if (this.changingLane) {
      this.pendingDir = dir;
      return;
    }

    const next = Phaser.Math.Clamp(this.laneIndex + dir, 0, LANE_Y.length - 1);
    if (next === this.laneIndex) return;

    this.changingLane = true;
    this.laneIndex = next;
    this.baseY = LANE_Y[this.laneIndex];

    this.scene.tweens.add({
      targets: this,
      y: this.baseY,
      duration: 110,
      ease: 'Sine.easeOut',
      onUpdate: () => {
        this.shadow.setPosition(this.x + 2, this.y + this.displayHeight * 0.34);
        this.headlight.setPosition(this.x + 58, this.y + 2);
        this.taillight.setPosition(this.x - 52, this.y + 2);
      },
      onComplete: () => {
        this.changingLane = false;
        this.y = this.baseY;
        this.syncPosition();
        if (this.pendingDir) {
          const queued = this.pendingDir;
          this.pendingDir = 0;
          this.changeLane(queued);
        }
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
    this.syncPosition();
  }

  destroy(fromScene) {
    this.shadow?.destroy();
    this.headlight?.destroy();
    this.taillight?.destroy();
    this.underglow?.destroy();
    this.idleTween?.stop();
    super.destroy(fromScene);
  }
}
