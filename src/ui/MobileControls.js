import { ASSET_KEYS } from '../config.js';

/**
 * Thumb-friendly UP / DOWN / PAUSE controls for landscape phones.
 */
export class MobileControls {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;

    const makeBtn = (x, y, label, color, event) => {
      const img = scene.add.image(x, y, ASSET_KEYS.BUTTON)
        .setDisplaySize(110, 56)
        .setScrollFactor(0)
        .setDepth(110)
        .setInteractive({ useHandCursor: true });

      const text = scene.add.text(x, y, label, {
        fontFamily: '"Courier New", monospace',
        fontSize: '20px',
        color: color || '#050816',
      }).setOrigin(0.5).setDepth(111).setScrollFactor(0);

      img.on('pointerdown', () => img.setAlpha(0.7));
      img.on('pointerup', () => {
        img.setAlpha(1);
        scene.events.emit(event);
      });
      img.on('pointerout', () => img.setAlpha(1));

      return { img, text };
    };

    this.up = makeBtn(width - 96, height - 150, 'UP', '#050816', 'mobile-lane-up');
    this.down = makeBtn(width - 96, height - 70, 'DOWN', '#050816', 'mobile-lane-down');
    this.pause = makeBtn(width - 96, 86, 'PAUSE', '#050816', 'mobile-pause');
    this.pause.img.setTint(0xff2bd6);
  }
}
