import Phaser from 'phaser';

/**
 * Keyboard + swipe input. Mobile buttons call handlers directly (not via events).
 */
export class InputSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {{ onLaneUp?: Function, onLaneDown?: Function, onPause?: Function, onStart?: Function }} handlers
   */
  constructor(scene, handlers = {}) {
    this.scene = scene;
    this.handlers = handlers;
    this.swipeStartY = null;
    this.swipeStartX = null;
    this.cooldownMs = 0;

    const keyboard = scene.input.keyboard;
    if (keyboard) {
      this.keyUp = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
      this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyDown = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      this.keyS = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyPause = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.keyStart = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    scene.input.on('pointerdown', (pointer) => {
      // Ignore UI gutters (lane buttons left, pause/minimap right).
      if (pointer.x < 220 || pointer.x > scene.scale.width - 180) return;
      this.swipeStartY = pointer.y;
      this.swipeStartX = pointer.x;
    });

    scene.input.on('pointerup', (pointer) => {
      if (this.swipeStartY == null) return;
      const dy = pointer.y - this.swipeStartY;
      const dx = pointer.x - (this.swipeStartX ?? pointer.x);
      this.swipeStartY = null;
      this.swipeStartX = null;
      // Prefer vertical swipes; ignore mostly-horizontal drags.
      if (Math.abs(dy) < 28 || Math.abs(dy) < Math.abs(dx)) return;
      if (dy < 0) this.tryLaneUp();
      else this.tryLaneDown();
    });
  }

  tryLaneUp() {
    if (this.cooldownMs > 0) return;
    this.cooldownMs = 120;
    this.handlers.onLaneUp?.();
  }

  tryLaneDown() {
    if (this.cooldownMs > 0) return;
    this.cooldownMs = 120;
    this.handlers.onLaneDown?.();
  }

  /** @param {number} delta */
  update(delta = 16) {
    this.cooldownMs = Math.max(0, this.cooldownMs - delta);

    if (this.keyUp && Phaser.Input.Keyboard.JustDown(this.keyUp)) this.tryLaneUp();
    if (this.keyW && Phaser.Input.Keyboard.JustDown(this.keyW)) this.tryLaneUp();
    if (this.keyDown && Phaser.Input.Keyboard.JustDown(this.keyDown)) this.tryLaneDown();
    if (this.keyS && Phaser.Input.Keyboard.JustDown(this.keyS)) this.tryLaneDown();
    if (this.keyPause && Phaser.Input.Keyboard.JustDown(this.keyPause)) this.handlers.onPause?.();
    if (this.keyStart && Phaser.Input.Keyboard.JustDown(this.keyStart)) this.handlers.onStart?.();
  }
}
