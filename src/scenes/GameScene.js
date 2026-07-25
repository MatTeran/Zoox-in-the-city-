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
 * Neon SF endless runner — parallax city, rain, traffic, rider pickups.
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
    this.createSystems();
    this.createRain();

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.player = new Zoox(this, 1);

    this.physics.add.overlap(this.player, this.trafficGroup, (_p, car) => {
      this.handleTrafficHit(car);
    });

    this.physics.add.overlap(this.player, this.riderGroup, (_p, pickup) => {
      this.handleRiderPickup(pickup);
    });
  }

  createWorld() {
    // Layer stack: sky → clouds → landmarks → fog → neon street → wet road
    this.sky = this.add.image(0, 0, ASSET_KEYS.SKY)
      .setOrigin(0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);

    this.clouds = this.add.tileSprite(0, 10, GAME_WIDTH, 130, ASSET_KEYS.CLOUDS)
      .setOrigin(0, 0)
      .setDepth(1)
      .setAlpha(0.88);

    this.skyline = this.add.tileSprite(0, 110, GAME_WIDTH, 260, ASSET_KEYS.SKYLINE)
      .setOrigin(0, 0)
      .setDepth(2)
      .setTint(0xddeeff);

    // Atmosphere between distant landmarks and street
    const fog = this.add.graphics().setDepth(3);
    fog.fillStyle(0x6b5cff, 0.16);
    fog.fillRect(0, 260, GAME_WIDTH, 90);
    fog.fillStyle(0x00f0ff, 0.05);
    fog.fillRect(0, 320, GAME_WIDTH, 40);

    this.midground = this.add.tileSprite(0, 235, GAME_WIDTH, 230, ASSET_KEYS.MIDGROUND)
      .setOrigin(0, 0)
      .setDepth(4);

    this.road = this.add.tileSprite(0, 430, GAME_WIDTH, 290, ASSET_KEYS.ROAD)
      .setOrigin(0, 0)
      .setDepth(8);
    this.roadReflect = this.add.tileSprite(0, 430, GAME_WIDTH, 290, ASSET_KEYS.ROAD_REFLECT)
      .setOrigin(0, 0)
      .setDepth(9)
      .setAlpha(0.75);

    // Pulsing neon wash over the street band (cabinet bloom feel, not photo blur)
    this.neonWash = this.add.graphics().setDepth(7).setAlpha(0.22);
    this.drawNeonWash(0);

    this.speedLines = this.add.graphics().setDepth(10).setAlpha(0.4);

    // Occasional rain splash sparks on asphalt
    this.splashes = this.add.particles(0, 0, ASSET_KEYS.PICKUP_SPARK, {
      x: { min: 0, max: GAME_WIDTH },
      y: { min: 470, max: 690 },
      lifespan: 280,
      speedY: { min: -20, max: -60 },
      scale: { start: 0.25, end: 0 },
      quantity: 1,
      frequency: 90,
      alpha: { start: 0.45, end: 0 },
      tint: [0x88ddff, 0xffffff],
    });
    this.splashes.setDepth(11);
  }

  /** @param {number} t */
  drawNeonWash(t) {
    this.neonWash.clear();
    const pulse = 0.5 + Math.sin(t / 400) * 0.5;
    this.neonWash.fillStyle(COLORS.ELECTRIC_CYAN, 0.08 + pulse * 0.05);
    this.neonWash.fillRect(0, 400, GAME_WIDTH, 40);
    this.neonWash.fillStyle(COLORS.NEON_MAGENTA, 0.06 + (1 - pulse) * 0.05);
    this.neonWash.fillRect(0, 680, GAME_WIDTH, 30);
    this.neonWash.fillStyle(COLORS.PURPLE, 0.07);
    this.neonWash.fillEllipse(GAME_WIDTH * 0.7, 360, 280, 60);
  }

  createSystems() {
    this.trafficGroup = this.physics.add.group({ runChildUpdate: true });
    this.riderGroup = this.physics.add.group({ runChildUpdate: true });

    this.scoreSystem = new ScoreSystem();
    this.hud = new Hud(this);
    this.mobileControls = new MobileControls(this);
    this.spawnSystem = new SpawnSystem(this, {
      trafficGroup: this.trafficGroup,
      riderGroup: this.riderGroup,
    });
    this.spawnSystem.start();

    this.inputSystem = new InputSystem(this, {
      onLaneUp: () => !this.isPaused && this.player.changeLane(-1),
      onLaneDown: () => !this.isPaused && this.player.changeLane(1),
      onPause: () => this.togglePause(),
    });

    this.hud.refresh(this.scoreSystem.getSnapshot());
  }

  createRain() {
    this.rain = this.add.particles(0, 0, ASSET_KEYS.RAIN, {
      x: { min: 0, max: GAME_WIDTH },
      y: -20,
      lifespan: 1200,
      speedY: { min: 420, max: 680 },
      speedX: { min: -40, max: -10 },
      scale: { min: 0.7, max: 1.3 },
      quantity: 2,
      frequency: 40,
      alpha: { start: 0.55, end: 0.05 },
    });
    this.rain.setDepth(40);
  }

  update(_time, delta) {
    if (this.gameOverPending) return;

    this.inputSystem.update();
    if (this.isPaused) return;

    // Progressive speed
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

    // Neon sign “living city” pulse on midground + wash
    this.midground.setAlpha(0.92 + Math.sin(this.time.now / 320) * 0.06);
    this.roadReflect.setAlpha(0.55 + Math.sin(this.time.now / 220) * 0.15);
    this.drawNeonWash(this.time.now);
    this.drawSpeedLines();

    this.scoreSystem.addPassive(delta);
    this.spawnSystem.update(delta, this.scrollSpeed);

    // Keep rider scroll matched to current road speed
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

    // Subtle camera follow on lane changes
    const targetY = (this.player.y - GAME_HEIGHT / 2) * 0.04;
    this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, targetY, 0.08);
  }

  drawSpeedLines() {
    this.speedLines.clear();
    this.speedLines.lineStyle(2, COLORS.ELECTRIC_CYAN, 0.25);
    for (let i = 0; i < 8; i += 1) {
      const y = 450 + i * 28 + ((this.time.now / 12) % 28);
      const x = (this.time.now * 0.4 + i * 90) % GAME_WIDTH;
      this.speedLines.lineBetween(x, y, x + 36, y);
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
      if (dx > 40 && dx < 110) {
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
      .setScale(0.8);
    this.tweens.add({
      targets: burst,
      alpha: 0,
      scale: 1.6,
      duration: 350,
      onComplete: () => burst.destroy(),
    });

    this.cameras.main.flash(80, 0, 240, 255);
  }

  handleTrafficHit(car) {
    if (!car?.active || this.player.invincible || this.gameOverPending) return;
    if (car.laneIndex !== this.player.laneIndex) return;

    const lives = this.scoreSystem.hitTraffic();
    this.player.flashInvincible();
    this.cameras.main.shake(180, 0.012);

    for (let i = 0; i < 8; i += 1) {
      const frag = this.add.image(this.player.x, this.player.y, ASSET_KEYS.FRAGMENT).setDepth(60);
      this.tweens.add({
        targets: frag,
        x: frag.x + Phaser.Math.Between(-60, 60),
        y: frag.y + Phaser.Math.Between(-40, 40),
        alpha: 0,
        duration: 400,
        onComplete: () => frag.destroy(),
      });
    }

    this.floatText(this.player.x, this.player.y - 50, 'HIT!', '#ff4060');
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
      fontSize: '22px',
      color,
    }).setOrigin(0.5).setDepth(120);

    this.tweens.add({
      targets: t,
      y: y - 48,
      alpha: 0,
      duration: 700,
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
