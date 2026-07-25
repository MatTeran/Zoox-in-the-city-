import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, LANE_Y, PLAYER_X, VEHICLE_NAME } from '../config.js';
import { Hud } from '../ui/Hud.js';
import { MobileControls } from '../ui/MobileControls.js';
import { InputSystem } from '../systems/InputSystem.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';

/**
 * Core gameplay scene stub.
 * Stage 0 wires HUD + input scaffolding and a parked Zoox.
 * Later stages add parallax world, traffic, riders, and collisions.
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.DEEP_NAVY);
    this.drawPlaceholderWorld();

    this.scoreSystem = new ScoreSystem();
    this.hud = new Hud(this);
    this.mobileControls = new MobileControls(this);
    this.inputSystem = new InputSystem(this, {
      onLaneUp: () => this.nudgeLane(-1),
      onLaneDown: () => this.nudgeLane(1),
      onPause: () => this.togglePause(),
    });

    this.laneIndex = 1;
    this.player = this.add
      .image(PLAYER_X, LANE_Y[this.laneIndex], 'fallback-zoox')
      .setOrigin(0.5)
      .setDepth(20);

    this.add
      .text(GAME_WIDTH / 2, 96, `${VEHICLE_NAME} · STAGE 0 SANDBOX`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#9bb4d8',
      })
      .setOrigin(0.5)
      .setDepth(50);

    this.isPaused = false;
    this.hud.refresh(this.scoreSystem.getSnapshot());
  }

  update(_time, delta) {
    if (this.isPaused) return;

    this.inputSystem.update();
    this.scoreSystem.addPassive(delta);
    this.hud.refresh(this.scoreSystem.getSnapshot());
  }

  drawPlaceholderWorld() {
    const g = this.add.graphics();
    g.fillStyle(0x07101f, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Road band
    g.fillStyle(0x121826, 1);
    g.fillRect(0, 360, GAME_WIDTH, 320);

    // Lane markers
    g.lineStyle(3, COLORS.ELECTRIC_CYAN, 0.55);
    for (const y of LANE_Y) {
      g.strokeLineShape(new Phaser.Geom.Line(0, y + 34, GAME_WIDTH, y + 34));
    }

    // Horizon glow
    g.fillStyle(COLORS.PURPLE, 0.2);
    g.fillRect(0, 250, GAME_WIDTH, 90);
  }

  nudgeLane(dir) {
    const next = Phaser.Math.Clamp(this.laneIndex + dir, 0, LANE_Y.length - 1);
    if (next === this.laneIndex) return;

    this.laneIndex = next;
    this.tweens.add({
      targets: this.player,
      y: LANE_Y[this.laneIndex],
      duration: 140,
      ease: 'Sine.easeInOut',
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.hud.setPaused(this.isPaused);
  }
}
