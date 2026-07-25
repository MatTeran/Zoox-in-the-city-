import Phaser from 'phaser';
import { KEYS } from '../config.js';

/**
 * Keyboard + swipe + mobile button input bridge.
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
      this.keyUp = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
      this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyDown = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      this.keyS = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyPause = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.keyStart = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    scene.input.on('pointerdown', (pointer) => {
      // Ignore presses on control gutters (left lane buttons / right minimap+pause).
      if (pointer.x < 160 || pointer.x > scene.scale.width - 160) return;
      this.swipeStartY = pointer.y;
    });

    scene.input.on('pointerup', (pointer) => {
      if (this.swipeStartY == null) return;
      const dy = pointer.y - this.swipeStartY;
      this.swipeStartY = null;
      if (Math.abs(dy) < 36) return;
      if (dy < 0) this.handlers.onLaneUp?.();
      else this.handlers.onLaneDown?.();
    });

    scene.events.on('mobile-lane-up', () => this.handlers.onLaneUp?.());
    scene.events.on('mobile-lane-down', () => this.handlers.onLaneDown?.());
    scene.events.on('mobile-pause', () => this.handlers.onPause?.());
  }

  update() {
    if (this.keyUp && Phaser.Input.Keyboard.JustDown(this.keyUp)) this.handlers.onLaneUp?.();
    if (this.keyW && Phaser.Input.Keyboard.JustDown(this.keyW)) this.handlers.onLaneUp?.();
    if (this.keyDown && Phaser.Input.Keyboard.JustDown(this.keyDown)) this.handlers.onLaneDown?.();
    if (this.keyS && Phaser.Input.Keyboard.JustDown(this.keyS)) this.handlers.onLaneDown?.();
    if (this.keyPause && Phaser.Input.Keyboard.JustDown(this.keyPause)) this.handlers.onPause?.();
    if (this.keyStart && Phaser.Input.Keyboard.JustDown(this.keyStart)) this.handlers.onStart?.();
  }
}
