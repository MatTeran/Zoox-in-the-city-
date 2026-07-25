import Phaser from 'phaser';
import { ASSET_KEYS, INVINCIBLE_MS, LANE_Y, PLAYER_X } from '../config.js';

/**
 * Pixel Zoox — reference lighting: soft headlight spill, red taillight bloom,
 * ground shadow, cyan underglow, idle float + wheel frames.
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
    this.setScale(0.72);
    this.setCollideWorldBounds(false);
    this.body.setSize(this.width * 0.72, this.height * 0.45);
    this.body.setOffset(this.width * 0.14, this.height * 0.35);

    if (scene.anims.exists('zoox-drive')) {
      this.play('zoox-drive');
    }

    this.shadow = scene.add.image(this.x, this.y + 28, ASSET_KEYS.SHADOW)
      .setDepth(27)
      .setScale(1.35, 0.9)
      .setAlpha(0.7);

    this.headlight = scene.add.image(this.x + 58, this.y + 2, ASSET_KEYS.HEADLIGHT)
      .setOrigin(0, 0.5)
      .setDepth(29)
      .setScale(0.85)
      .setAlpha(0.85)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.taillight = scene.add.image(this.x - 48, this.y + 2, ASSET_KEYS.TAILLIGHT)
      .setDepth(29)
      .setScale(1.1)
      .setAlpha(0.75)
      .setBlendMode(Phaser.BlendModes.ADD);

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
    this.shadow.setPosition(this.x + 2, this.y + this.displayHeight * 0.34);
    this.headlight.setPosition(this.x + 56, this.y + 2);
    this.taillight.setPosition(this.x - 50, this.y + 2);
    this.underglow.clear();
    const pulse = 0.32 + Math.sin(this.scene.time.now / 180) * 0.1;
    this.underglow.fillStyle(0x00e5ff, pulse);
    this.underglow.fillEllipse(this.x, this.y + this.displayHeight * 0.3, 84, 14);
    this.underglow.fillStyle(0x40ffa0, pulse * 0.35);
    this.underglow.fillEllipse(this.x + 20, this.y + this.displayHeight * 0.3, 40, 10);
  }

  /** @param {number} dir */
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
    this.shadow?.destroy();
    this.headlight?.destroy();
    this.taillight?.destroy();
    this.underglow?.destroy();
    this.idleTween?.stop();
    super.destroy(fromScene);
  }
}
