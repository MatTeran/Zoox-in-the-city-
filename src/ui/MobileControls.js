import Phaser from 'phaser';
import { COLORS } from '../config.js';

/**
 * Modern glass lane pad — soft shell, thin chevrons, quiet neon accents.
 * Hit targets are full rectangles (Phaser circle hitAreas are top-left based).
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
    const DEPTH = 1000;

    const cx = 92;
    const cy = height - 118;

    this.shell = this.drawShell(cx, cy, DEPTH);

    this.up = this.makeChevronButton({
      x: cx,
      y: cy - 48,
      depth: DEPTH,
      direction: 'up',
      onPress: handlers.onLaneUp,
    });

    this.down = this.makeChevronButton({
      x: cx,
      y: cy + 48,
      depth: DEPTH,
      direction: 'down',
      onPress: handlers.onLaneDown,
    });

    this.pause = this.makePauseButton({
      x: width - 50,
      y: 76,
      depth: DEPTH,
      onPress: handlers.onPause,
    });

    // Allow overlapping UI to receive presses; zones sit above art graphics.
    scene.input.setTopOnly(false);
  }

  /**
   * Soft frosted shell behind the two lane keys.
   * @param {number} x
   * @param {number} y
   * @param {number} depth
   */
  drawShell(x, y, depth) {
    const g = this.scene.add.graphics().setScrollFactor(0).setDepth(depth - 1);
    const w = 88;
    const h = 188;
    const r = 28;

    g.fillStyle(0x02060f, 0.45);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, r);

    // Inner glass sheen
    g.fillStyle(0xffffff, 0.04);
    g.fillRoundedRect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h * 0.38, r - 4);

    g.lineStyle(1.5, COLORS.ELECTRIC_CYAN, 0.35);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, r);

    // Quiet center rule
    g.lineStyle(1, 0xffffff, 0.1);
    g.lineBetween(x - 18, y, x + 18, y);

    return g;
  }

  /**
   * Circular glass key with thin-line double chevron.
   * @param {{ x: number, y: number, depth: number, direction: 'up'|'down', onPress: Function }} opts
   */
  makeChevronButton(opts) {
    const { x, y, depth, direction, onPress } = opts;
    const radius = 32;

    const face = this.scene.add.graphics();
    const icon = this.scene.add.graphics();

    const paint = (pressed = false) => {
      face.clear();
      icon.clear();

      face.fillStyle(COLORS.ELECTRIC_CYAN, pressed ? 0.2 : 0.05);
      face.fillCircle(0, 0, radius + 6);

      face.fillStyle(0x0a1524, pressed ? 0.92 : 0.55);
      face.fillCircle(0, 0, radius);
      face.lineStyle(1.75, pressed ? 0xb8f7ff : 0x6ae7ff, pressed ? 0.95 : 0.55);
      face.strokeCircle(0, 0, radius);

      // Specular rim
      face.lineStyle(1.25, 0xffffff, pressed ? 0.35 : 0.16);
      face.beginPath();
      face.arc(0, -1, radius - 5, Phaser.Math.DegToRad(210), Phaser.Math.DegToRad(330), false);
      face.strokePath();

      this.drawChevrons(icon, direction, pressed);
    };

    paint(false);

    const root = this.scene.add.container(x, y, [face, icon])
      .setScrollFactor(0)
      .setDepth(depth);

    // Full rectangular hit box covering the visible key (generous for thumbs).
    const hit = 96;
    const zone = this.scene.add.zone(x, y, hit, hit)
      .setScrollFactor(0)
      .setDepth(depth + 2)
      .setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, hit, hit),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      });

    let busy = false;
    const press = (pointer) => {
      pointer?.event?.preventDefault?.();
      if (busy) return;
      busy = true;
      paint(true);
      this.scene.tweens.add({
        targets: root,
        scale: 0.9,
        duration: 55,
        yoyo: true,
        onComplete: () => {
          paint(false);
          busy = false;
        },
      });
      onPress?.();
    };
    // pointerup is more reliable than pointerdown alone on iOS WebViews.
    zone.on('pointerdown', press);
    zone.on('pointerup', press);

    return { zone, root, paint };
  }

  /**
   * Thin double-chevron (modern, not chunky filled triangle).
   * @param {Phaser.GameObjects.Graphics} g
   * @param {'up'|'down'} direction
   * @param {boolean} pressed
   */
  drawChevrons(g, direction, pressed) {
    const dir = direction === 'up' ? -1 : 1;
    const color = pressed ? 0xffffff : 0xe7fbff;
    const alpha = pressed ? 1 : 0.92;
    const thickness = 3.2;
    const width = 15;
    const offsets = [-5, 5];

    offsets.forEach((oy) => {
      const y = oy * dir;
      g.lineStyle(thickness, color, alpha);
      g.beginPath();
      g.moveTo(-width, y - dir * 5);
      g.lineTo(0, y + dir * 7);
      g.lineTo(width, y - dir * 5);
      g.strokePath();
    });
  }

  /**
   * Minimal pause chip.
   * @param {{ x: number, y: number, depth: number, onPress: Function }} opts
   */
  makePauseButton(opts) {
    const { x, y, depth, onPress } = opts;
    const r = 18;
    const g = this.scene.add.graphics();

    const paint = (pressed = false) => {
      g.clear();
      g.fillStyle(0x02060f, pressed ? 0.75 : 0.42);
      g.fillCircle(0, 0, r);
      g.lineStyle(1.5, pressed ? COLORS.NEON_MAGENTA : COLORS.ELECTRIC_CYAN, pressed ? 0.9 : 0.45);
      g.strokeCircle(0, 0, r);
      g.fillStyle(0xf2fcff, 0.95);
      g.fillRoundedRect(-6.5, -7, 4, 14, 1.5);
      g.fillRoundedRect(2.5, -7, 4, 14, 1.5);
    };

    paint(false);

    const root = this.scene.add.container(x, y, [g])
      .setScrollFactor(0)
      .setDepth(depth);

    const hit = 56;
    const zone = this.scene.add.zone(x, y, hit, hit)
      .setScrollFactor(0)
      .setDepth(depth + 2)
      .setInteractive({
        hitArea: new Phaser.Geom.Rectangle(0, 0, hit, hit),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains,
        useHandCursor: true,
      });

    let busy = false;
    const press = (pointer) => {
      pointer?.event?.preventDefault?.();
      if (busy) return;
      busy = true;
      paint(true);
      this.scene.tweens.add({
        targets: root,
        scale: 0.9,
        duration: 55,
        yoyo: true,
        onComplete: () => {
          paint(false);
          busy = false;
        },
      });
      onPress?.();
    };
    zone.on('pointerdown', press);
    zone.on('pointerup', press);

    return { zone, root, paint };
  }
}
