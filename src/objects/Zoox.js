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

    // Origin on the tire / wet-reflection contact line.
    this.setOrigin(0.5, 0.84);
    this.setDepth(30);
    // Shorter silhouette: compress X a touch more than Y.
    this.setScale(0.68, 0.8);
    this.setCollideWorldBounds(false);

    // Body-only hitbox — exclude baked wet reflection padding.
    this.body.setSize(this.width * 0.52, this.height * 0.34);
    this.body.setOffset(this.width * 0.24, this.height * 0.20);

    if (scene.anims.exists('zoox-drive')) {
      this.play('zoox-drive');
    }

    // Contact shadow under the tires.
    this.shadow = scene.add.image(this.x, this.baseY + 6, ASSET_KEYS.SHADOW)
      .setDepth(27)
      .setScale(1.85, 0.75)
      .setAlpha(0.35);

    // Soft ADD underglow pulse on top of the baked wet reflection.
    this.underglow = scene.add.image(this.x, this.baseY + 4, ASSET_KEYS.UNDERGLOW)
      .setDepth(28)
      .setScale(1.05, 0.85)
      .setAlpha(0.45)
      .setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: this.underglow,
      alpha: { from: 0.32, to: 0.62 },
      scaleX: { from: 0.98, to: 1.12 },
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Front cyan spill / rear magenta spill (bidirectional robotaxi cues).
    this.headlight = scene.add.image(this.x + 70, this.y - 28, ASSET_KEYS.HEADLIGHT)
      .setOrigin(0, 0.5)
      .setDepth(29)
      .setScale(0.5)
      .setAlpha(0.28)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.taillight = scene.add.image(this.x - 66, this.y - 28, ASSET_KEYS.TAILLIGHT)
      .setDepth(29)
      .setScale(0.65)
      .setAlpha(0.3)
      .setTint(0xff45d2)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.syncPosition();
  }

  syncPosition() {
    if (!this.active) return;
    if (!this.changingLane) {
      this.y = this.baseY;
    }
    this.shadow.setPosition(this.x + 2, this.baseY + 6);
    this.underglow?.setPosition(this.x, this.baseY + 4);
    this.headlight.setPosition(this.x + 70, this.y - 28);
    this.taillight.setPosition(this.x - 66, this.y - 28);
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
        this.shadow.setPosition(this.x + 2, this.y + 6);
        this.underglow?.setPosition(this.x, this.y + 4);
        this.headlight.setPosition(this.x + 70, this.y - 28);
        this.taillight.setPosition(this.x - 66, this.y - 28);
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
