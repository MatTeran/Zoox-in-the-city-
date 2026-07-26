import Phaser from 'phaser';
import { ASSET_KEYS, LANE_Y } from '../config.js';

function nameScale(key = '') {
  if (key.includes('bus')) return 1.05;
  if (key.includes('truck') || key.includes('van')) return 1.0;
  return 0.95;
}

/**
 * Oncoming traffic — Zoox-matched HD pixel cars.
 * Gameplay/physics sizing stays forgiving; art is the upgrade.
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

    // Match Zoox grounding (origin near undercarriage).
    this.setOrigin(0.5, 0.72);
    this.setDepth(18 + laneIndex);
    this.setScale(nameScale(key));
    // Flip if a sprite was authored facing right — oncoming traffic faces left.
    if (this.frame && this.frame.width) {
      // Prefer facing left (toward the player).
      // Most generated plates already face left; keep false by default.
      this.setFlipX(false);
    }

    // Forgiving hitbox — unchanged gameplay feel.
    this.body.setSize(this.width * 0.52, this.height * 0.3);
    this.body.setOffset(this.width * 0.24, this.height * 0.42);

    this.shadow = scene.add.image(x, LANE_Y[laneIndex] + 18, ASSET_KEYS.SHADOW)
      .setDepth(17 + laneIndex)
      .setScale(1.25, 0.75)
      .setAlpha(0.5);

    // Soft cyan underglow so traffic shares Zoox's neon language (dimmer).
    this.underglow = scene.add.graphics().setDepth(17.5 + laneIndex);
  }

  /** @param {number} speed */
  drive(speed) {
    this.setVelocityX(-speed);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.shadow?.active) {
      this.shadow.setPosition(this.x, this.y + 16);
    }
    if (this.underglow?.active) {
      this.underglow.clear();
      const pulse = 0.14 + Math.sin((time + this.x) / 200) * 0.04;
      this.underglow.fillStyle(0x00e5ff, pulse);
      this.underglow.fillEllipse(this.x, this.y + 14, Math.max(70, this.displayWidth * 0.55), 10);
    }
  }

  get isOffscreen() {
    return this.x < -140;
  }

  destroy(fromScene) {
    this.shadow?.destroy();
    this.underglow?.destroy();
    super.destroy(fromScene);
  }
}
