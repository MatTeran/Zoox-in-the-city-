import Phaser from 'phaser';
import {
  ASSET_KEYS,
  COLORS,
  MENU_BLURB,
  TAGLINE,
} from '../config.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';

/**
 * Reference-matched arcade title menu:
 * centered neon title, stacked glowing buttons, Zoox bottom-left, objective card.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;
    this.overlay = null;

    this.createBackdrop(width, height);
    this.createTitle(width, height);
    this.createMenuButtons(width, height);
    this.createZoox(width, height);
    this.createObjectiveCard(width, height);
    this.createFooter(width, height);

    this.input.keyboard?.on('keydown-SPACE', () => this.startGame());
    this.input.keyboard?.on('keydown-ENTER', () => this.startGame());
  }

  createBackdrop(width, height) {
    this.add.image(width / 2, height / 2, ASSET_KEYS.MENU_BG)
      .setDisplaySize(width, height)
      .setDepth(0);

    this.clouds = this.add.tileSprite(0, 30, width, 130, ASSET_KEYS.CLOUDS)
      .setOrigin(0, 0)
      .setDepth(1)
      .setAlpha(0.85);

    this.skyline = this.add.tileSprite(0, 90, width, 240, ASSET_KEYS.SKYLINE)
      .setOrigin(0, 0)
      .setDepth(2);

    this.mid = this.add.tileSprite(0, 230, width, 260, ASSET_KEYS.MIDGROUND)
      .setOrigin(0, 0)
      .setDepth(3);

    this.road = this.add.tileSprite(0, 520, width, 200, ASSET_KEYS.ROAD)
      .setOrigin(0, 0)
      .setDepth(4);

    this.roadReflect = this.add.tileSprite(0, 520, width, 200, ASSET_KEYS.ROAD_REFLECT)
      .setOrigin(0, 0)
      .setDepth(5)
      .setAlpha(0.75)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Soft center vignette so the menu stack stays readable.
    const veil = this.add.graphics().setDepth(6);
    veil.fillStyle(COLORS.DEEP_NAVY, 0.28);
    veil.fillRect(width * 0.28, 0, width * 0.44, height);
    veil.fillStyle(0x000000, 0.18);
    veil.fillRect(0, 0, width, 90);
    veil.fillRect(0, height - 70, width, 70);

    this.add.particles(width * 0.5, height * 0.35, ASSET_KEYS.PICKUP_SPARK, {
      x: { min: -220, max: 220 },
      y: { min: -120, max: 180 },
      lifespan: 1600,
      speedY: { min: -12, max: 12 },
      scale: { start: 0.28, end: 0 },
      frequency: 220,
      alpha: { start: 0.55, end: 0 },
      tint: [0x00f0ff, 0xff2bd6, 0xffd84d],
    }).setDepth(7);
  }

  createTitle(width, height) {
    const cx = width * 0.5;
    const titleY = height * 0.14;

    // Glow plates behind title
    const glow = this.add.graphics().setDepth(10);
    glow.fillStyle(0x00f0ff, 0.08);
    glow.fillEllipse(cx, titleY + 10, 420, 70);
    glow.fillStyle(0xff2bd6, 0.07);
    glow.fillEllipse(cx, titleY + 58, 380, 50);

    this.add.text(cx, titleY, 'ZOOX', {
      fontFamily: '"Courier New", monospace',
      fontSize: '78px',
      color: '#00f0ff',
      stroke: '#003844',
      strokeThickness: 8,
      shadow: { offsetX: 0, offsetY: 0, color: '#00f0ff', blur: 18, fill: true, stroke: true },
    }).setOrigin(0.5).setDepth(11);

    this.add.text(cx, titleY + 58, 'FUTURE SF', {
      fontFamily: '"Courier New", monospace',
      fontSize: '48px',
      color: '#ff2bd6',
      stroke: '#3a0030',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 0, color: '#ff2bd6', blur: 16, fill: true, stroke: true },
    }).setOrigin(0.5).setDepth(11);

    this.add.text(cx, titleY + 100, `— ${TAGLINE} —`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      color: '#7ef9ff',
    }).setOrigin(0.5).setDepth(11);
  }

  createMenuButtons(width, height) {
    const cx = width * 0.5;
    const startY = height * 0.38;
    const gap = 54;

    const items = [
      { label: 'START GAME', color: 0x00f0ff, text: '#e8ffff', icon: '>', action: () => this.startGame() },
      { label: 'HIGH SCORES', color: 0xff2bd6, text: '#ffe0f7', icon: '*', action: () => this.showHighScores() },
      { label: 'OPTIONS', color: 0xff2bd6, text: '#ffe0f7', icon: '#', action: () => this.showOptions() },
      { label: 'HOW TO PLAY', color: 0x40ffa0, text: '#e9ffe8', icon: '?', action: () => this.showHowTo() },
      { label: 'EXIT GAME', color: 0xff8a1f, text: '#ffe8c8', icon: 'x', action: () => this.showExit() },
    ];

    items.forEach((item, i) => {
      const y = startY + i * gap;
      this.makeMenuButton(cx, y, item.label, item.color, item.text, item.icon, item.action, i === 0);
    });
  }

  /**
   * Glowing bordered arcade button.
   */
  makeMenuButton(x, y, label, borderColor, textColor, icon, onClick, pulse = false) {
    const w = 320;
    const h = 44;

    const zone = this.add.zone(x, y, w + 24, h + 14)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });

    const g = this.add.graphics().setDepth(19);
    const draw = (hot = false) => {
      g.clear();
      g.fillStyle(0x050816, hot ? 0.92 : 0.82);
      g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
      g.lineStyle(3, borderColor, hot ? 1 : 0.9);
      g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
      g.lineStyle(1, 0xffffff, hot ? 0.35 : 0.15);
      g.strokeRoundedRect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6, 8);
    };
    draw(false);

    const iconText = this.add.text(x - w / 2 + 28, y, icon, {
      fontFamily: '"Courier New", monospace',
      fontSize: '20px',
      color: textColor,
    }).setOrigin(0.5).setDepth(20);

    const labelText = this.add.text(x + 8, y, label, {
      fontFamily: '"Courier New", monospace',
      fontSize: '22px',
      color: textColor,
    }).setOrigin(0.5).setDepth(20);

    zone.on('pointerover', () => draw(true));
    zone.on('pointerout', () => draw(false));
    zone.on('pointerdown', () => {
      draw(true);
      onClick?.();
    });

    if (pulse) {
      this.tweens.add({
        targets: [labelText, iconText],
        alpha: { from: 0.85, to: 1 },
        duration: 700,
        yoyo: true,
        repeat: -1,
      });
    }

    return { zone, g, labelText };
  }

  createZoox(width, height) {
    const x = width * 0.18;
    const y = height * 0.78;

    this.menuGlow = this.add.graphics().setDepth(8);
    this.zoox = this.add.sprite(x, y, ASSET_KEYS.ZOOX)
      .setScale(1.35)
      .setDepth(9);
    if (this.anims.exists('zoox-drive')) this.zoox.play('zoox-drive');

    const drawGlow = () => {
      this.menuGlow.clear();
      this.menuGlow.fillStyle(0x00f0ff, 0.35);
      this.menuGlow.fillEllipse(this.zoox.x, this.zoox.y + 52, 170, 26);
      this.menuGlow.fillStyle(0x40ffa0, 0.16);
      this.menuGlow.fillEllipse(this.zoox.x + 20, this.zoox.y + 54, 90, 16);
      this.menuGlow.fillStyle(0x000000, 0.35);
      this.menuGlow.fillEllipse(this.zoox.x, this.zoox.y + 58, 120, 14);
    };
    drawGlow();

    this.tweens.add({
      targets: this.zoox,
      y: y - 5,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: drawGlow,
    });

    this.add.image(x + 70, y + 4, ASSET_KEYS.HEADLIGHT)
      .setOrigin(0, 0.5)
      .setScale(0.9)
      .setAlpha(0.75)
      .setDepth(8)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  createObjectiveCard(width, height) {
    const x = width * 0.82;
    const y = height * 0.78;
    const g = this.add.graphics().setDepth(18);
    g.fillStyle(0x050816, 0.82);
    g.fillRoundedRect(x - 150, y - 70, 300, 130, 10);
    g.lineStyle(3, COLORS.ELECTRIC_CYAN, 0.95);
    g.strokeRoundedRect(x - 150, y - 70, 300, 130, 10);

    this.add.text(x, y - 48, 'OBJECTIVE', {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      color: '#00f0ff',
    }).setOrigin(0.5).setDepth(19);

    this.add.text(x, y - 8, MENU_BLURB, {
      fontFamily: '"Courier New", monospace',
      fontSize: '13px',
      color: '#d7e7ff',
      align: 'center',
      wordWrap: { width: 260 },
    }).setOrigin(0.5).setDepth(19);

    // Rider silhouettes row
    const colors = ['#ff2bd6', '#7a3cff', '#00f0ff', '#40ffa0', '#ffd84d'];
    colors.forEach((c, i) => {
      const px = x - 70 + i * 35;
      const body = this.add.rectangle(px, y + 42, 12, 18, Phaser.Display.Color.HexStringToColor(c).color)
        .setDepth(19);
      this.add.circle(px, y + 28, 5, Phaser.Display.Color.HexStringToColor(c).color).setDepth(19);
      if (i === 2) {
        body.setStrokeStyle(2, 0xffffff, 0.9);
      }
    });
  }

  createFooter(width, height) {
    this.add.text(18, height - 22, 'v1.0.0', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#6b7c99',
    }).setDepth(20);

    this.add.text(width / 2, height - 22, '© 2026 ZOOX FUTURE SF', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#6b7c99',
    }).setOrigin(0.5).setDepth(20);

    this.add.text(width - 18, height - 22, `HIGH ${ScoreSystem.readHighScore()}`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#ffd84d',
    }).setOrigin(1, 0).setDepth(20);
  }

  showPanel(title, lines, accent = '#00f0ff') {
    this.closeOverlay();
    const { width, height } = this.scale;
    const root = this.add.container(0, 0).setDepth(200);
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x050816, 0.72)
      .setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(0x050816, 0.95);
    panel.fillRoundedRect(width * 0.2, height * 0.2, width * 0.6, height * 0.55, 12);
    panel.lineStyle(3, Phaser.Display.Color.HexStringToColor(accent).color, 1);
    panel.strokeRoundedRect(width * 0.2, height * 0.2, width * 0.6, height * 0.55, 12);

    const titleText = this.add.text(width / 2, height * 0.28, title, {
      fontFamily: '"Courier New", monospace',
      fontSize: '32px',
      color: accent,
    }).setOrigin(0.5);

    const body = this.add.text(width / 2, height * 0.42, lines.join('\n\n'), {
      fontFamily: '"Courier New", monospace',
      fontSize: '18px',
      color: '#d7e7ff',
      align: 'center',
      wordWrap: { width: width * 0.5 },
      lineSpacing: 6,
    }).setOrigin(0.5);

    const close = this.add.text(width / 2, height * 0.66, 'CLOSE', {
      fontFamily: '"Courier New", monospace',
      fontSize: '22px',
      color: '#050816',
      backgroundColor: accent,
      padding: { x: 22, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    close.on('pointerup', () => this.closeOverlay());
    dim.on('pointerup', () => this.closeOverlay());

    root.add([dim, panel, titleText, body, close]);
    this.overlay = root;
  }

  closeOverlay() {
    this.overlay?.destroy(true);
    this.overlay = null;
  }

  showHighScores() {
    const high = ScoreSystem.readHighScore();
    this.showPanel('HIGH SCORES', [
      `LOCAL BEST  ${high}`,
      'Clear browser storage to reset.',
      'Survive longer. Stack rider streaks.',
    ], '#ff2bd6');
  }

  showOptions() {
    this.showPanel('OPTIONS', [
      'Landscape mode recommended',
      'Swipe or tap UP / DOWN to change lanes',
      'P or PAUSE to pause',
      'Audio coming in a later build',
    ], '#ff2bd6');
  }

  showHowTo() {
    this.showPanel('HOW TO PLAY', [
      'Drive the Zoox through neon SF',
      'UP / DOWN or W / S to change lanes',
      'Pick up riders for +300 and streaks',
      'Dodge traffic — 3 lives',
      'Near misses earn bonus points',
    ], '#40ffa0');
  }

  showExit() {
    this.showPanel('EXIT GAME', [
      'Thanks for playing ZOOX FUTURE SF',
      'Close this tab / Expo Go to exit',
      'Or tap CLOSE and keep riding',
    ], '#ff8a1f');
  }

  update(_t, delta) {
    const d = delta / 16;
    this.clouds.tilePositionX += 0.12 * d;
    this.skyline.tilePositionX += 0.28 * d;
    this.mid.tilePositionX += 0.55 * d;
    this.road.tilePositionX += 0.9 * d;
    this.roadReflect.tilePositionX += 1.0 * d;
  }

  startGame() {
    this.closeOverlay();
    this.scene.start('GameScene');
  }
}
