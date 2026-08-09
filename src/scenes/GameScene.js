import Phaser from 'phaser';
import {
  ASSET_KEYS,
  COLORS,
  GAME_HEIGHT,
  GAME_WIDTH,
  LANE_Y,
  PLAYER_X,
  ROAD_TOP,
  SCORE,
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
    this.cityId = 'sf';
    this.cityTransitioning = false;

    this.createWorld();
    this.createRain();

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setScroll(0, 0);

    // Player must exist before input handlers bind.
    this.player = new Zoox(this, 1);

    this.trafficGroup = this.physics.add.group({ runChildUpdate: true });
    this.coinGroup = this.physics.add.group({ runChildUpdate: true });

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
      coinGroup: this.coinGroup,
      getPlayerLane: () => this.player?.laneIndex ?? 1,
    });
    this.spawnSystem.start();

    this.physics.add.overlap(this.player, this.trafficGroup, (_p, car) => {
      this.handleTrafficHit(car);
    });

    this.physics.add.overlap(this.player, this.coinGroup, (_p, coin) => {
      this.handleZCoinPickup(coin);
    });

    this.hud.refresh(this.scoreSystem.getSnapshot());

    // Brief tip so players know controls work.
    const tip = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, 'LANE PAD  ·  SWIPE  ·  W/S', {
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
    // Static city plates — skyline does not scroll.
    this.citySf = this.add.image(0, 0, ASSET_KEYS.CITY_SF)
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0);

    this.cityVegas = this.add.image(0, 0, ASSET_KEYS.CITY_VEGAS)
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(0)
      .setAlpha(0);

    // Only the road band scrolls — long-highway driving feel.
    const roadH = GAME_HEIGHT - ROAD_TOP;
    this.road = this.add.tileSprite(0, ROAD_TOP, GAME_WIDTH, roadH, ASSET_KEYS.ROAD_SCROLL)
      .setOrigin(0, 0)
      .setDepth(2);

    // Soft wet sheen that also scrolls with the asphalt.
    this.roadReflect = this.add.tileSprite(0, ROAD_TOP, GAME_WIDTH, roadH, ASSET_KEYS.ROAD_REFLECT)
      .setOrigin(0, 0)
      .setDepth(3)
      .setAlpha(0.22)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Alias kept for any legacy references.
    this.world = this.citySf;
    this.clouds = this.citySf;
    this.skyline = this.citySf;
    this.midground = this.citySf;

    // Soft active-lane underglow only — no full-width purple bands.
    this.laneGuides = this.add.graphics().setDepth(9);
    this.drawLaneGuides();

    this.neonWash = this.add.graphics().setDepth(7).setAlpha(0.12);
    this.drawNeonWash(0);

    this.speedLines = this.add.graphics().setDepth(10).setAlpha(0.18);

    this.splashes = this.add.particles(0, 0, ASSET_KEYS.PICKUP_SPARK, {
      x: { min: 0, max: GAME_WIDTH },
      y: { min: 520, max: 700 },
      lifespan: 260,
      speedY: { min: -12, max: -30 },
      scale: { start: 0.18, end: 0 },
      quantity: 1,
      frequency: 160,
      alpha: { start: 0.28, end: 0 },
      tint: [0x88ddff, 0xffffff],
    });
    this.splashes.setDepth(11);
  }

  drawLaneGuides() {
    this.laneGuides.clear();
    // Quiet baseline: thin cyan ticks at divider Ys (between lanes).
    const dividers = [
      (LANE_Y[0] + LANE_Y[1]) / 2,
      (LANE_Y[1] + LANE_Y[2]) / 2,
    ];
    this.laneGuides.lineStyle(1, COLORS.ELECTRIC_CYAN, 0.12);
    dividers.forEach((y) => {
      this.laneGuides.lineBetween(0, y, GAME_WIDTH, y);
    });
  }

  /** @param {number} t */
  drawNeonWash(t) {
    this.neonWash.clear();
    const pulse = 0.5 + Math.sin(t / 400) * 0.5;
    const vegas = this.cityId === 'vegas';
    const warm = vegas ? COLORS.ORANGE_LANDMARK : COLORS.WARM_YELLOW;
    const cool = vegas ? COLORS.NEON_MAGENTA : COLORS.ELECTRIC_CYAN;
    this.neonWash.fillStyle(warm, 0.05 + pulse * 0.03);
    this.neonWash.fillEllipse(180, 430, 160, 40);
    this.neonWash.fillEllipse(520, 430, 140, 36);
    this.neonWash.fillEllipse(900, 430, 160, 40);
    this.neonWash.fillStyle(cool, 0.05 + pulse * 0.03);
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
    // City stays put; only the asphalt rushes past.
    this.road.tilePositionX += roadScroll * 1.15;
    this.roadReflect.tilePositionX += roadScroll * 1.35;

    this.drawNeonWash(this.time.now);
    this.drawSpeedLines();
    this.highlightPlayerLane();

    this.scoreSystem.addPassive(delta);
    this.spawnSystem.update(delta, this.scrollSpeed);

    this.coinGroup.getChildren().forEach((c) => {
      if (c.active && c.body) c.setVelocityX(-this.scrollSpeed * 0.92);
    });

    this.cleanupEntities();
    this.checkNearMisses();

    const snap = this.scoreSystem.getSnapshot();
    this.hud.refresh(snap);
    this.hud.updateRadar(
      this.player.laneIndex,
      this.trafficGroup.getChildren().filter((c) => c.active),
    );

    if (
      !this.cityTransitioning
      && this.cityId === 'sf'
      && snap.score >= SCORE.VEGAS_UNLOCK
    ) {
      this.enterLasVegas();
    }
  }

  /** Crossfade the static skyline from San Francisco to Las Vegas. */
  enterLasVegas() {
    if (this.cityTransitioning || this.cityId === 'vegas') return;
    this.cityTransitioning = true;
    this.cityId = 'vegas';

    this.cameras.main.flash(220, 255, 180, 60);
    this.cameras.main.shake(180, 0.004);

    const banner = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.38, 'NOW ENTERING\nLAS VEGAS', {
      fontFamily: '"Courier New", monospace',
      fontSize: '42px',
      color: '#ffd84d',
      align: 'center',
      stroke: '#050816',
      strokeThickness: 6,
      backgroundColor: '#050816cc',
      padding: { x: 18, y: 12 },
    }).setOrigin(0.5).setDepth(950).setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: 1,
      scale: { from: 0.92, to: 1 },
      duration: 280,
      yoyo: true,
      hold: 1100,
      onComplete: () => banner.destroy(),
    });

    this.tweens.add({
      targets: this.citySf,
      alpha: 0,
      duration: 1400,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: this.cityVegas,
      alpha: 1,
      duration: 1400,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.cityTransitioning = false;
      },
    });

    // Warmer splash tint once we're on the Strip.
    this.splashes?.setParticleTint([0xffd84d, 0xff2bd6, 0xffffff]);
  }

  highlightPlayerLane() {
    // Soft underglow under the active lane only — keeps wet asphalt readable.
    this.laneGuides.clear();
    const dividers = [
      (LANE_Y[0] + LANE_Y[1]) / 2,
      (LANE_Y[1] + LANE_Y[2]) / 2,
    ];
    this.laneGuides.lineStyle(1, COLORS.ELECTRIC_CYAN, 0.1);
    dividers.forEach((y) => {
      this.laneGuides.lineBetween(0, y, GAME_WIDTH, y);
    });

    const y = LANE_Y[this.player?.laneIndex ?? 1];
    this.laneGuides.fillStyle(COLORS.ELECTRIC_CYAN, 0.1);
    this.laneGuides.fillEllipse(PLAYER_X + 40, y + 10, 220, 36);
    this.laneGuides.lineStyle(2, COLORS.ELECTRIC_CYAN, 0.35);
    this.laneGuides.strokeEllipse(PLAYER_X + 40, y + 10, 220, 36);
  }

  drawSpeedLines() {
    this.speedLines.clear();
    // Sparse motion ticks near curbs — don't clutter lane paint.
    this.speedLines.lineStyle(2, COLORS.ELECTRIC_CYAN, 0.14);
    for (let i = 0; i < 3; i += 1) {
      const y = ROAD_TOP + 12 + i * (GAME_HEIGHT - ROAD_TOP - 28) / 2;
      const x = (this.time.now * 0.4 + i * 180) % GAME_WIDTH;
      this.speedLines.lineBetween(x, y, x + 22, y);
    }
  }

  cleanupEntities() {
    this.trafficGroup.getChildren().forEach((car) => {
      if (car.isOffscreen) car.destroy();
    });
    this.coinGroup.getChildren().forEach((c) => {
      if (c.isOffscreen) c.destroy();
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

  handleZCoinPickup(coin) {
    if (!coin?.active || coin.collected) return;
    if (coin.laneIndex !== this.player.laneIndex) return;
    if (!coin.collect()) return;

    const gained = this.scoreSystem.collectZCoin();
    this.floatText(coin.x, coin.y - 40, `Z +${gained}`, '#ffd84d');

    const burst = this.add.image(coin.x, coin.y, ASSET_KEYS.NEON_BURST)
      .setDepth(50)
      .setScale(0.9)
      .setTint(0xffd84d)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: burst,
      alpha: 0,
      scale: 1.8,
      duration: 380,
      onComplete: () => burst.destroy(),
    });

    this.cameras.main.flash(70, 255, 210, 80);
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
          zCoins: snap.zCoins,
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
