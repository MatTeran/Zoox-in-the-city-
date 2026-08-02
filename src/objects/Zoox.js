import Phaser from 'phaser';
import { ASSET_KEYS, INVINCIBLE_MS, LANE_Y, PLAYER_X } from '../config.js';

/**
 * Zoox RoboTaxi — grounded on the road (no hover).
 * Lane Y is authoritative; wheels stay planted.
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
    this.setOrigin(0.5, 0.95);
    this.setDepth(30);
    this.setScale(0.98);
    this.setCollideWorldBounds(false);

    // Body-only hitbox — exclude tires/shadow padding.
    this.body.setSize(this.width * 0.56, this.height * 0.38);
    this.body.setOffset(this.width * 0.22, this.height * 0.22);

    if (scene.anims.exists('zoox-drive')) {
      this.play('zoox-drive');
    }

    // Contact shadow under the tires (road shadow, not hover glow).
    this.shadow = scene.add.image(this.x, this.baseY + 4, ASSET_KEYS.SHADOW)
      .setDepth(27)
      .setScale(1.55, 0.65)
      .setAlpha(0.5);

    this.headlight = scene.add.image(this.x + 70, this.y - 28, ASSET_KEYS.HEADLIGHT)
      .setOrigin(0, 0.5)
      .setDepth(29)
      .setScale(0.6)
      .setAlpha(0.38)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.taillight = scene.add.image(this.x - 62, this.y - 28, ASSET_KEYS.TAILLIGHT)
      .setDepth(29)
      .setScale(0.65)
      .setAlpha(0.28)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.syncPosition();
  }

  syncPosition() {
    if (!this.active) return;
    if (!this.changingLane) {
      this.y = this.baseY;
    }
    this.shadow.setPosition(this.x + 2, this.baseY + 4);
    this.headlight.setPosition(this.x + 70, this.y - 28);
    this.taillight.setPosition(this.x - 62, this.y - 28);
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
        this.headlight.setPosition(this.x + 70, this.y - 28);
        this.taillight.setPosition(this.x - 62, this.y - 28);
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
    super.destroy(fromScene);
  }
}
