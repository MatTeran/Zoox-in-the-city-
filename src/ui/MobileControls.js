import { ASSET_KEYS } from '../config.js';

/**
 * Large thumb-friendly lane controls.
 * Uses oversized hit Zones + pointerdown so taps always register on mobile/WebView.
 */
export class MobileControls {
  /**
   * @param {Phaser.Scene} scene
   * @param {{ onLaneUp: Function, onLaneDown: Function, onPause: Function }} handlers
   */
  constructor(scene, handlers) {
    this.scene = scene;
    this.handlers = handlers;
    const { width, height } = scene.scale;

    // Keep UI above world / particles / radar.
    const DEPTH = 1000;

    this.up = this.makeLaneButton(120, height - 168, 'UP', handlers.onLaneUp, DEPTH);
    this.down = this.makeLaneButton(120, height - 72, 'DOWN', handlers.onLaneDown, DEPTH);
    this.pause = this.makeLaneButton(width - 100, 78, 'PAUSE', handlers.onPause, DEPTH, 0xff2bd6);

    // Ensure UI receives input even when overlapping other objects.
    scene.input.setTopOnly(true);
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {string} label
   * @param {Function} onPress
   * @param {number} depth
   * @param {number} [tint]
   */
  makeLaneButton(x, y, label, onPress, depth, tint) {
    const hitW = 160;
    const hitH = 88;

    // Invisible generous hit target (most important for phones).
    const zone = this.scene.add.zone(x, y, hitW, hitH)
      .setScrollFactor(0)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true });

    const img = this.scene.add.image(x, y, ASSET_KEYS.BUTTON)
      .setDisplaySize(140, 72)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(0.92);
    if (tint) img.setTint(tint);

    const text = this.scene.add.text(x, y, label, {
      fontFamily: '"Courier New", monospace',
      fontSize: '26px',
      color: '#050816',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(depth + 1).setScrollFactor(0);

    const press = () => {
      img.setAlpha(0.5);
      onPress?.();
      this.scene.time.delayedCall(90, () => {
        if (img.active) img.setAlpha(0.92);
      });
    };

    // pointerdown is reliable on iOS Safari / Expo WebView; pointerup often misses.
    zone.on('pointerdown', (pointer) => {
      pointer?.event?.preventDefault?.();
      press();
    });

    // Soft idle pulse so controls read as tappable.
    this.scene.tweens.add({
      targets: img,
      alpha: { from: 0.85, to: 1 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    return { zone, img, text };
  }
}
