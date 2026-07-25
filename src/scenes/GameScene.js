import Phaser from 'phaser';
import {
  ASSET_KEYS,
  COLORS,
  GAME_HEIGHT,
  GAME_WIDTH,
  SPEED,
} from '../config.js';
import { Zoox } from '../objects/Zoox.js';
import { Hud } from '../ui/Hud.js';
import { MobileControls } from '../ui/MobileControls.js';
import { InputSystem } from '../systems/InputSystem.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';
import { SpawnSystem } from '../systems/SpawnSystem.js';

/**
 * Neon SF endless runner — readable, mobile-friendly lane arcade.
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.isPaused = false;
    this.scrollSpeed = SPEED.BASE_SCROLL;
    this.gameOverPending = false;

    this.createWorld();
    this.createRain();

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setScroll(0, 0);

    // Player must exist before input handlers bind.
    this.player = new Zoox(this, 1);

    this.trafficGroup = this.physics.add.group({ runChildUpdate: true });
    this.riderGroup = this.physics.add.group({ runChildUpdate: true });

    this.scoreSystem = new ScoreSystem();
    this.hud = new Hud(this);

    const laneHandlers = {
      onLaneUp: () => {
        if (this.isPaused || this.gameOverPending) return;
        this.player.changeLane(-1);
      },
      onLaneDown: () => {
        if (this.isPaused || this.gameOverPending) return;
        this.player.changeLane(1);
      },
      onPause: () => this.togglePause(),
    };

    // Direct callbacks (not scene events) so mobile taps always reach gameplay.
    this.mobileControls = new MobileControls(this, laneHandlers);
    this.inputSystem = new InputSystem(this, laneHandlers);

    this.spawnSystem = new SpawnSystem(this, {
      trafficGroup: this.trafficGroup,
      riderGroup: this.riderGroup,
      getPlayerLane: () => this.player?.laneIndex ?? 1,
    });
    this.spawnSystem.start();

    this.physics.add.overlap(this.player, this.trafficGroup, (_p, car) => {
      this.handleTrafficHit(car);
    });

    this.physics.add.overlap(this.player, this.riderGroup, (_p, pickup) => {
      this.handleRiderPickup(pickup);
    });

    this.hud.refresh(this.scoreSystem.getSnapshot());

    // Brief tip so players know controls work.
    const tip = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, 'TAP UP / DOWN  ·  SWIPE  ·  W/S', {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      color: '#9bb4d8',
      backgroundColor: '#050816aa',
      padding: { x: 10, y: 4 },
    }).setOrigin(0.5).setDepth(900);
    this.tweens.add({
      targets: tip,
      alpha: 0,
      delay: 3200,
      duration: 600,
      onComplete: () => tip.destroy(),
    });
  }

  createWorld() {
    this.sky = this.add.image(0, 0, ASSET_KEYS.SKY)
      .setOrigin(0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);

    this.clouds = this.add.tileSprite(0, 52, GAME_WIDTH, 120, ASSET_KEYS.CLOUDS)
      .setOrigin(0, 0)
      .setDepth(1)
      .setAlpha(0.9);

    this.skyline = this.add.tileSprite(0, 70, GAME_WIDTH, 280, ASSET_KEYS.SKYLINE)
      .setOrigin(0, 0)
      .setDepth(2);

    const fog = this.add.graphics().setDepth(3);
    fog.fillStyle(0x7a3cff, 0.12);
    fog.fillRect(0, 220, GAME_WIDTH, 100);

    this.midground = this.add.tileSprite(0, 200, GAME_WIDTH, 280, ASSET_KEYS.MIDGROUND)
      .setOrigin(0, 0)
      .setDepth(4);

    this.road = this.add.tileSprite(0, 455, GAME_WIDTH, 265, ASSET_KEYS.ROAD)
      .setOrigin(0, 0)
      .setDepth(8);
    this.roadReflect = this.add.tileSprite(0, 455, GAME_WIDTH, 265, ASSET_KEYS.ROAD_REFLECT)
      .setOrigin(0, 0)
      .setDepth(9)
      .setAlpha(0.7)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Strong lane readability guides
    this.laneGuides = this.add.graphics().setDepth(9);
    this.drawLaneGuides();

    this.neonWash = this.add.graphics().setDepth(7).setAlpha(0.24);
    this.drawNeonWash(0);

    this.speedLines = this.add.graphics().setDepth(10).setAlpha(0.28);

    this.splashes = this.add.particles(0, 0, ASSET_KEYS.PICKUP_SPARK, {
      x: { min: 0, max: GAME_WIDTH },
      y: { min: 500, max: 700 },
      lifespan: 260,
      speedY: { min: -16, max: -40 },
      scale: { start: 0.2, end: 0 },
      quantity: 1,
      frequency: 120,
      alpha: { start: 0.35, end: 0 },
      tint: [0x88ddff, 0xffffff],
    });
    this.splashes.setDepth(11);
  }

  drawLaneGuides() {
    this.laneGuides.clear();
    // Soft filled bands so current lanes are obvious on phones.
    const bands = [
      { y: 488, color: 0x00f0ff },
      { y: 548, color: 0x7a3cff },
      { y: 608, color: 0xff2bd6 },
    ];
    bands.forEach((b, i) => {
      this.laneGuides.fillStyle(b.color, i === 1 ? 0.08 : 0.05);
      this.laneGuides.fillRect(0, b.y, GAME_WIDTH, 52);
    });
  }

  /** @param {number} t */
  drawNeonWash(t) {
    this.neonWash.clear();
    const pulse = 0.5 + Math.sin(t / 400) * 0.5;
    this.neonWash.fillStyle(COLORS.WARM_YELLOW, 0.05 + pulse * 0.03);
    this.neonWash.fillEllipse(180, 430, 160, 40);
    this.neonWash.fillEllipse(520, 430, 140, 36);
    this.neonWash.fillEllipse(900, 430, 160, 40);
    this.neonWash.fillStyle(COLORS.ELECTRIC_CYAN, 0.05 + pulse * 0.03);
    this.neonWash.fillRect(0, 448, GAME_WIDTH, 24);
  }

  createRain() {
    // Lighter rain so gameplay stays readable.
    this.rain = this.add.particles(0, 0, ASSET_KEYS.RAIN, {
      x: { min: 0, max: GAME_WIDTH },
      y: -20,
      lifespan: 1100,
      speedY: { min: 360, max: 560 },
      speedX: { min: -30, max: -8 },
      scale: { min: 0.6, max: 1.1 },
      quantity: 1,
      frequency: 70,
      alpha: { start: 0.35, end: 0.04 },
    });
    this.rain.setDepth(40);
  }

  update(_time, delta) {
    if (this.gameOverPending) return;

    this.inputSystem.update(delta);
    if (this.isPaused) return;

    this.scrollSpeed = Math.min(
      SPEED.MAX_SCROLL,
      this.scrollSpeed + (SPEED.RAMP_PER_SECOND * delta) / 1000,
    );

    const d = delta / 16;
    const roadScroll = (this.scrollSpeed / 60) * d;
    this.clouds.tilePositionX += roadScroll * 0.12;
    this.skyline.tilePositionX += roadScroll * 0.28;
    this.midground.tilePositionX += roadScroll * 0.55;
    this.road.tilePositionX += roadScroll;
    this.roadReflect.tilePositionX += roadScroll * 1.05;

    this.midground.setAlpha(0.96 + Math.sin(this.time.now / 320) * 0.03);
    this.roadReflect.setAlpha(0.5 + Math.sin(this.time.now / 220) * 0.12);
    this.drawNeonWash(this.time.now);
    this.drawSpeedLines();
    this.highlightPlayerLane();

    this.scoreSystem.addPassive(delta);
    this.spawnSystem.update(delta, this.scrollSpeed);

    this.riderGroup.getChildren().forEach((r) => {
      if (r.active && r.body) r.setVelocityX(-this.scrollSpeed * 0.92);
    });

    this.cleanupEntities();
    this.checkNearMisses();

    const snap = this.scoreSystem.getSnapshot();
    this.hud.refresh(snap);
    this.hud.updateRadar(
      this.player.laneIndex,
      this.trafficGroup.getChildren().filter((c) => c.active),
    );
  }

  highlightPlayerLane() {
    // Recolor lane bands so the active lane is brightest.
    this.laneGuides.clear();
    const bands = [488, 548, 608];
    const colors = [0x00f0ff, 0x7a3cff, 0xff2bd6];
    bands.forEach((y, i) => {
      const active = i === this.player.laneIndex;
      this.laneGuides.fillStyle(colors[i], active ? 0.16 : 0.05);
      this.laneGuides.fillRect(0, y, GAME_WIDTH, 52);
      if (active) {
        this.laneGuides.lineStyle(2, colors[i], 0.55);
        this.laneGuides.strokeRect(8, y + 4, GAME_WIDTH - 16, 44);
      }
    });
  }

  drawSpeedLines() {
    this.speedLines.clear();
    this.speedLines.lineStyle(2, COLORS.ELECTRIC_CYAN, 0.2);
    for (let i = 0; i < 6; i += 1) {
      const y = 470 + i * 30 + ((this.time.now / 14) % 30);
      const x = (this.time.now * 0.35 + i * 100) % GAME_WIDTH;
      this.speedLines.lineBetween(x, y, x + 28, y);
    }
  }

  cleanupEntities() {
    this.trafficGroup.getChildren().forEach((car) => {
      if (car.isOffscreen) car.destroy();
    });
    this.riderGroup.getChildren().forEach((r) => {
      if (r.isOffscreen) r.destroy();
    });
  }

  checkNearMisses() {
    this.trafficGroup.getChildren().forEach((car) => {
      if (!car.active || car.nearMissAwarded || car.laneIndex !== this.player.laneIndex) return;
      const dx = car.x - this.player.x;
      if (dx > 50 && dx < 130) {
        car.nearMissAwarded = true;
        const gained = this.scoreSystem.nearMiss();
        this.floatText(this.player.x + 40, this.player.y - 30, `NEAR +${gained}`, '#40ffa0');
      }
    });
  }

  handleRiderPickup(pickup) {
    if (!pickup?.active || pickup.collected) return;
    if (pickup.laneIndex !== this.player.laneIndex) return;
    if (!pickup.collect()) return;

    const gained = this.scoreSystem.collectRider();
    this.floatText(pickup.x, pickup.y - 60, `+${gained}`, '#ffd84d');

    const burst = this.add.image(pickup.x, pickup.y - 40, ASSET_KEYS.NEON_BURST)
      .setDepth(50)
      .setScale(0.9)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: burst,
      alpha: 0,
      scale: 1.8,
      duration: 380,
      onComplete: () => burst.destroy(),
    });

    this.cameras.main.flash(70, 0, 240, 255);
  }

  handleTrafficHit(car) {
    if (!car?.active || this.player.invincible || this.gameOverPending) return;
    if (car.laneIndex !== this.player.laneIndex) return;

    const lives = this.scoreSystem.hitTraffic();
    this.player.flashInvincible();
    this.cameras.main.shake(160, 0.01);

    for (let i = 0; i < 7; i += 1) {
      const frag = this.add.image(this.player.x, this.player.y, ASSET_KEYS.FRAGMENT).setDepth(60);
      this.tweens.add({
        targets: frag,
        x: frag.x + Phaser.Math.Between(-55, 55),
        y: frag.y + Phaser.Math.Between(-35, 35),
        alpha: 0,
        duration: 380,
        onComplete: () => frag.destroy(),
      });
    }

    this.floatText(this.player.x, this.player.y - 50, 'HIT -1', '#ff4060');
    car.destroy();

    if (lives <= 0) {
      this.gameOverPending = true;
      this.time.delayedCall(450, () => {
        const snap = this.scoreSystem.getSnapshot();
        this.scoreSystem.persistHighScore();
        this.scene.start('GameOverScene', {
          score: snap.score,
          riders: snap.riders,
          time: snap.time,
        });
      });
    }
  }

  floatText(x, y, msg, color) {
    const t = this.add.text(x, y, msg, {
      fontFamily: '"Courier New", monospace',
      fontSize: '24px',
      color,
      stroke: '#050816',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(120);

    this.tweens.add({
      targets: t,
      y: y - 52,
      alpha: 0,
      duration: 750,
      ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  togglePause() {
    if (this.gameOverPending) return;
    this.isPaused = !this.isPaused;
    this.hud.setPaused(this.isPaused);
    if (this.isPaused) {
      this.physics.pause();
      this.rain?.pause();
      this.splashes?.pause();
    } else {
      this.physics.resume();
      this.rain?.resume();
      this.splashes?.resume();
    }
  }
}
