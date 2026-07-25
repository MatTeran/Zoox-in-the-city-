import Phaser from 'phaser';
import { KEYS } from '../config.js';

/**
 * Keyboard + swipe input bridge for lane changes / pause / start.
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

    const keyboard = scene.input.keyboard;
    if (keyboard) {
      this.keyUp = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[KEYS.UP[1]]);
      this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyDown = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[KEYS.DOWN[1]]);
      this.keyS = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyPause = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[KEYS.PAUSE[0]]);
      this.keyStart = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[KEYS.START[0]]);
    }

    scene.input.on('pointerdown', (pointer) => {
      this.swipeStartY = pointer.y;
    });

    scene.input.on('pointerup', (pointer) => {
      if (this.swipeStartY == null) return;
      const dy = pointer.y - this.swipeStartY;
      this.swipeStartY = null;
      if (Math.abs(dy) < 40) return;
      if (dy < 0) this.handlers.onLaneUp?.();
      else this.handlers.onLaneDown?.();
    });

    // MobileControls emits these custom events on the scene.
    scene.events.on('mobile-lane-up', () => this.handlers.onLaneUp?.());
    scene.events.on('mobile-lane-down', () => this.handlers.onLaneDown?.());
    scene.events.on('mobile-pause', () => this.handlers.onPause?.());
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyUp) || Phaser.Input.Keyboard.JustDown(this.keyW)) {
      this.handlers.onLaneUp?.();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyDown) || Phaser.Input.Keyboard.JustDown(this.keyS)) {
      this.handlers.onLaneDown?.();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyPause)) {
      this.handlers.onPause?.();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyStart)) {
      this.handlers.onStart?.();
    }
  }
}
