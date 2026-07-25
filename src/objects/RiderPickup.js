import Phaser from 'phaser';
import { LANE_Y } from '../config.js';

/**
 * Rider + kiosk pickup station.
 * Stage 0 stub — collection logic arrives in Stage 3.
 */
export class RiderPickup extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} laneIndex
   */
  constructor(scene, x, laneIndex) {
    super(scene, x, LANE_Y[laneIndex]);

    this.laneIndex = laneIndex;
    this.collected = false;

    const kioskKey = scene.textures.exists('kiosk') ? 'kiosk' : 'fallback-panel';
    const riderKey = scene.textures.exists('rider') ? 'rider' : 'fallback-panel';

    this.kiosk = scene.add.image(0, 10, kioskKey).setScale(0.45).setOrigin(0.5);
    this.rider = scene.add.image(0, -18, riderKey).setScale(0.4).setOrigin(0.5);
    this.add([this.kiosk, this.rider]);

    scene.add.existing(this);
    this.setDepth(12);
  }

  collect() {
    if (this.collected) return false;
    this.collected = true;
    this.rider.setVisible(false);
    return true;
  }
}
