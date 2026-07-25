import { ASSET_KEYS } from '../config.js';

/**
 * Thumb controls on the LEFT so the reference-style minimap keeps the bottom-right.
 */
export class MobileControls {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;
    const { height } = scene.scale;

    const makeBtn = (x, y, label, event, tint) => {
      const img = scene.add.image(x, y, ASSET_KEYS.BUTTON)
        .setDisplaySize(110, 56)
        .setScrollFactor(0)
        .setDepth(110)
        .setInteractive({ useHandCursor: true });
      if (tint) img.setTint(tint);

      const text = scene.add.text(x, y, label, {
        fontFamily: '"Courier New", monospace',
        fontSize: '20px',
        color: '#050816',
      }).setOrigin(0.5).setDepth(111).setScrollFactor(0);

      img.on('pointerdown', () => img.setAlpha(0.7));
      img.on('pointerup', () => {
        img.setAlpha(1);
        scene.events.emit(event);
      });
      img.on('pointerout', () => img.setAlpha(1));

      return { img, text };
    };

    this.up = makeBtn(86, height - 150, 'UP', 'mobile-lane-up');
    this.down = makeBtn(86, height - 70, 'DOWN', 'mobile-lane-down');
    this.pause = makeBtn(scene.scale.width - 96, 86, 'PAUSE', 'mobile-pause', 0xff2bd6);
  }
}
