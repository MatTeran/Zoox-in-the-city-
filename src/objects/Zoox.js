import Phaser from 'phaser';
import { ASSET_KEYS, INVINCIBLE_MS, LANE_Y, PLAYER_X } from '../config.js';

/**
 * Zoox RoboTaxi — white carriage body, cyan underglow, planted tires.
 * Lane Y is authoritative; wheels stay on the asphalt.
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
    this.invincible = false;
    this.changingLane = false;
    this.pendingDir = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Origin at the tire contact row so the car sits on the asphalt.
    this.setOrigin(0.5, 0.92);
    this.setDepth(30);
    this.setScale(1.02);
    this.setCollideWorldBounds(false);

    // Body-only hitbox — exclude tires / underglow padding.
    this.body.setSize(this.width * 0.58, this.height * 0.42);
    this.body.setOffset(this.width * 0.21, this.height * 0.22);

    if (scene.anims.exists('zoox-drive')) {
      this.play('zoox-drive');
    }

    // Contact shadow under the tires.
    this.shadow = scene.add.image(this.x, this.baseY + 4, ASSET_KEYS.SHADOW)
      .setDepth(27)
      .setScale(1.7, 0.7)
      .setAlpha(0.48);

    // Soft ADD underglow pulse (wet neon road spill).
    this.underglow = scene.add.image(this.x, this.baseY + 2, ASSET_KEYS.UNDERGLOW)
      .setDepth(28)
      .setScale(1.15, 0.95)
      .setAlpha(0.55)
      .setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: this.underglow,
      alpha: { from: 0.42, to: 0.72 },
      scaleX: { from: 1.08, to: 1.22 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Front cyan spill / rear magenta spill (bidirectional robotaxi cues).
    this.headlight = scene.add.image(this.x + 78, this.y - 34, ASSET_KEYS.HEADLIGHT)
      .setOrigin(0, 0.5)
      .setDepth(29)
      .setScale(0.55)
      .setAlpha(0.32)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.taillight = scene.add.image(this.x - 72, this.y - 34, ASSET_KEYS.TAILLIGHT)
      .setDepth(29)
      .setScale(0.7)
      .setAlpha(0.34)
      .setTint(0xff45d2)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.syncPosition();
  }

  syncPosition() {
    if (!this.active) return;
    if (!this.changingLane) {
      this.y = this.baseY;
    }
    this.shadow.setPosition(this.x + 2, this.baseY + 4);
    this.underglow?.setPosition(this.x, this.baseY + 2);
    this.headlight.setPosition(this.x + 78, this.y - 34);
    this.taillight.setPosition(this.x - 72, this.y - 34);
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
        this.shadow.setPosition(this.x + 2, this.y + 4);
        this.underglow?.setPosition(this.x, this.y + 2);
        this.headlight.setPosition(this.x + 78, this.y - 34);
        this.taillight.setPosition(this.x - 72, this.y - 34);
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
    this.underglow?.destroy();
    this.headlight?.destroy();
    this.taillight?.destroy();
    super.destroy(fromScene);
  }
}
