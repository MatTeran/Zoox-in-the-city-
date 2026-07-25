/**
 * Thumb-friendly UP / DOWN / PAUSE controls for landscape phones.
 */
export class MobileControls {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;

    const { width, height } = scene.scale;
    const btnStyle = {
      fontFamily: 'Arial Black, Arial, sans-serif',
      fontSize: '22px',
      color: '#050816',
      backgroundColor: '#00f0ff',
      padding: { x: 22, y: 16 },
    };

    this.upBtn = scene.add
      .text(width - 110, height - 170, 'UP', btnStyle)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(110)
      .setInteractive({ useHandCursor: true });

    this.downBtn = scene.add
      .text(width - 110, height - 70, 'DOWN', btnStyle)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(110)
      .setInteractive({ useHandCursor: true });

    this.pauseBtn = scene.add
      .text(width - 110, 40, 'PAUSE', {
        ...btnStyle,
        backgroundColor: '#ff2bd6',
        fontSize: '16px',
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(110)
      .setInteractive({ useHandCursor: true });

    this.upBtn.on('pointerup', () => scene.events.emit('mobile-lane-up'));
    this.downBtn.on('pointerup', () => scene.events.emit('mobile-lane-down'));
    this.pauseBtn.on('pointerup', () => scene.events.emit('mobile-pause'));
  }
}
