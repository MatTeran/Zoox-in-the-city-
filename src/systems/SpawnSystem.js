/**
 * Traffic / rider spawn scheduler.
 * Stage 0 stub — real spawn curves arrive in Stage 3.
 */
export class SpawnSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {{ onSpawnTraffic?: Function, onSpawnRider?: Function }} hooks
   */
  constructor(scene, hooks = {}) {
    this.scene = scene;
    this.hooks = hooks;
    this.elapsed = 0;
    this.enabled = false;
  }

  start() {
    this.enabled = true;
    this.elapsed = 0;
  }

  stop() {
    this.enabled = false;
  }

  /** @param {number} deltaMs */
  update(deltaMs) {
    if (!this.enabled) return;
    this.elapsed += deltaMs;
    // Stage 3 will emit traffic/riders from here.
  }
}
