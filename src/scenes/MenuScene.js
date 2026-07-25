import Phaser from 'phaser';
import {
  ASSET_KEYS,
  COLORS,
  MENU_BLURB,
  TAGLINE,
} from '../config.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';

/**
 * Neon arcade start menu matching the ZOOX FUTURE SF reference mock:
 * centered glowing title, stacked bordered buttons with icons,
 * white Zoox bottom-left, OBJECTIVE card bottom-right.
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
    // Full-bleed neon SF plate — primary visual matching the reference mock.
    this.add.image(width / 2, height / 2, ASSET_KEYS.MENU_BG)
      .setDisplaySize(width, height)
      .setDepth(0);

    // Light parallax only (keeps the baked plate readable).
    this.clouds = this.add.tileSprite(0, 18, width, 100, ASSET_KEYS.CLOUDS)
      .setOrigin(0, 0)
      .setDepth(1)
      .setAlpha(0.28);

    this.skyline = this.add.tileSprite(0, 64, width, 200, ASSET_KEYS.SKYLINE)
      .setOrigin(0, 0)
      .setDepth(2)
      .setAlpha(0.22);

    this.mid = this.add.tileSprite(0, 200, width, 220, ASSET_KEYS.MIDGROUND)
      .setOrigin(0, 0)
      .setDepth(3)
      .setAlpha(0.18);

    this.road = this.add.tileSprite(0, 505, width, 215, ASSET_KEYS.ROAD)
      .setOrigin(0, 0)
      .setDepth(4)
      .setAlpha(0.35);

    this.roadReflect = this.add.tileSprite(0, 505, width, 215, ASSET_KEYS.ROAD_REFLECT)
      .setOrigin(0, 0)
      .setDepth(5)
      .setAlpha(0.55)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Soft center veil so the menu stack stays readable over neon density.
    const veil = this.add.graphics().setDepth(6);
    veil.fillStyle(COLORS.DEEP_NAVY, 0.18);
    veil.fillRect(width * 0.32, 50, width * 0.36, height - 120);
    veil.fillStyle(0x000000, 0.16);
    veil.fillRect(0, 0, width, 60);
    veil.fillRect(0, height - 48, width, 48);

    // Twinkling neon dust
    this.add.particles(width * 0.5, height * 0.32, ASSET_KEYS.PICKUP_SPARK, {
      x: { min: -260, max: 260 },
      y: { min: -140, max: 200 },
      lifespan: 1800,
      speedY: { min: -10, max: 10 },
      scale: { start: 0.26, end: 0 },
      frequency: 280,
      alpha: { start: 0.45, end: 0 },
      tint: [0x00f0ff, 0xff2bd6, 0xffd84d, 0x40ffa0],
    }).setDepth(7);
  }

  createTitle(width, height) {
    const cx = width * 0.5;
    const titleY = height * 0.11;

    const glow = this.add.graphics().setDepth(10);
    glow.fillStyle(0x00f0ff, 0.10);
    glow.fillEllipse(cx, titleY + 12, 460, 78);
    glow.fillStyle(0xff2bd6, 0.09);
    glow.fillEllipse(cx, titleY + 64, 420, 56);

    // Chunkier arcade title — cyan then magenta stack
    this.add.text(cx, titleY, 'ZOOX', {
      fontFamily: '"Courier New", monospace',
      fontSize: '84px',
      fontStyle: 'bold',
      color: '#00f0ff',
      stroke: '#003844',
      strokeThickness: 10,
      shadow: { offsetX: 0, offsetY: 0, color: '#00f0ff', blur: 22, fill: true, stroke: true },
    }).setOrigin(0.5).setDepth(11);

    this.add.text(cx, titleY + 62, 'FUTURE SF', {
      fontFamily: '"Courier New", monospace',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#ff2bd6',
      stroke: '#3a0030',
      strokeThickness: 8,
      shadow: { offsetX: 0, offsetY: 0, color: '#ff2bd6', blur: 18, fill: true, stroke: true },
    }).setOrigin(0.5).setDepth(11);

    this.add.text(cx, titleY + 108, `— ${TAGLINE} —`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '15px',
      color: '#7ef9ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00f0ff', blur: 6, fill: true },
    }).setOrigin(0.5).setDepth(11);
  }

  createMenuButtons(width, height) {
    const cx = width * 0.5;
    const startY = height * 0.36;
    const gap = 52;

    const items = [
      { label: 'START GAME', color: 0x00f0ff, text: '#e8ffff', icon: 'play', action: () => this.startGame() },
      { label: 'HIGH SCORES', color: 0xff2bd6, text: '#ffe0f7', icon: 'trophy', action: () => this.showHighScores() },
      { label: 'OPTIONS', color: 0xff2bd6, text: '#ffe0f7', icon: 'gear', action: () => this.showOptions() },
      { label: 'HOW TO PLAY', color: 0x40ffa0, text: '#e9ffe8', icon: 'help', action: () => this.showHowTo() },
      { label: 'EXIT GAME', color: 0xff8a1f, text: '#ffe8c8', icon: 'exit', action: () => this.showExit() },
    ];

    items.forEach((item, i) => {
      const y = startY + i * gap;
      this.makeMenuButton(cx, y, item.label, item.color, item.text, item.icon, item.action, i === 0);
    });
  }

  /**
   * Draw a small pixel icon inside a button.
   */
  drawIcon(g, kind, x, y, color) {
    g.fillStyle(color, 1);
    g.lineStyle(2, color, 1);

    if (kind === 'play') {
      g.fillTriangle(x - 5, y - 8, x - 5, y + 8, x + 9, y);
    } else if (kind === 'trophy') {
      g.fillRect(x - 7, y - 4, 14, 8);
      g.fillRect(x - 3, y + 4, 6, 5);
      g.fillRect(x - 6, y + 9, 12, 2);
      g.fillRect(x - 10, y - 2, 3, 5);
      g.fillRect(x + 7, y - 2, 3, 5);
    } else if (kind === 'gear') {
      g.fillCircle(x, y, 6);
      g.fillStyle(0x050816, 1);
      g.fillCircle(x, y, 2.5);
      g.fillStyle(color, 1);
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2;
        g.fillRect(x + Math.cos(a) * 8 - 1.5, y + Math.sin(a) * 8 - 1.5, 3, 3);
      }
    } else if (kind === 'help') {
      g.strokeRect(x - 9, y - 9, 18, 18);
      g.fillStyle(color, 1);
      // simple "?" via blocks
      g.fillRect(x - 3, y - 6, 6, 2);
      g.fillRect(x + 3, y - 4, 2, 4);
      g.fillRect(x - 1, y, 4, 2);
      g.fillRect(x - 1, y + 5, 2, 2);
    } else if (kind === 'exit') {
      g.strokeRect(x - 8, y - 7, 12, 14);
      g.fillRect(x + 2, y - 1, 8, 2);
      g.fillTriangle(x + 8, y - 5, x + 8, y + 5, x + 14, y);
    }
  }

  /**
   * Glowing bordered arcade button with neon icon.
   */
  makeMenuButton(x, y, label, borderColor, textColor, icon, onClick, pulse = false) {
    const w = 340;
    const h = 46;

    const zone = this.add.zone(x, y, w + 28, h + 16)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });

    const g = this.add.graphics().setDepth(19);
    const iconG = this.add.graphics().setDepth(20);

    const draw = (hot = false) => {
      g.clear();
      // Outer glow
      g.lineStyle(6, borderColor, hot ? 0.35 : 0.18);
      g.strokeRoundedRect(x - w / 2 - 2, y - h / 2 - 2, w + 4, h + 4, 12);
      g.fillStyle(0x050816, hot ? 0.94 : 0.84);
      g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
      g.lineStyle(3, borderColor, hot ? 1 : 0.92);
      g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
      g.lineStyle(1, 0xffffff, hot ? 0.35 : 0.14);
      g.strokeRoundedRect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6, 8);

      iconG.clear();
      this.drawIcon(iconG, icon, x - w / 2 + 28, y, borderColor);
    };
    draw(false);

    const labelText = this.add.text(x + 10, y, label, {
      fontFamily: '"Courier New", monospace',
      fontSize: '22px',
      fontStyle: 'bold',
      color: textColor,
      shadow: { offsetX: 0, offsetY: 0, color: textColor, blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(20);

    zone.on('pointerover', () => draw(true));
    zone.on('pointerout', () => draw(false));
    zone.on('pointerdown', () => {
      draw(true);
      onClick?.();
    });

    if (pulse) {
      this.tweens.add({
        targets: [labelText],
        alpha: { from: 0.85, to: 1 },
        duration: 700,
        yoyo: true,
        repeat: -1,
      });
    }

    return { zone, g, labelText };
  }

  createZoox(width, height) {
    const x = width * 0.17;
    const y = height * 0.80;

    this.menuGlow = this.add.graphics().setDepth(8);
    this.zoox = this.add.sprite(x, y, ASSET_KEYS.ZOOX)
      .setScale(1.55)
      .setDepth(9);
    if (this.anims.exists('zoox-drive')) this.zoox.play('zoox-drive');

    const drawGlow = () => {
      this.menuGlow.clear();
      this.menuGlow.fillStyle(0x00f0ff, 0.42);
      this.menuGlow.fillEllipse(this.zoox.x, this.zoox.y + 56, 190, 28);
      this.menuGlow.fillStyle(0x40ffa0, 0.18);
      this.menuGlow.fillEllipse(this.zoox.x + 24, this.zoox.y + 58, 100, 16);
      this.menuGlow.fillStyle(0x000000, 0.38);
      this.menuGlow.fillEllipse(this.zoox.x, this.zoox.y + 62, 130, 14);
    };
    drawGlow();

    this.tweens.add({
      targets: this.zoox,
      y: y - 6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: drawGlow,
    });

    this.add.image(x + 78, y + 4, ASSET_KEYS.HEADLIGHT)
      .setOrigin(0, 0.5)
      .setScale(1.0)
      .setAlpha(0.8)
      .setDepth(8)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  createObjectiveCard(width, height) {
    const x = width * 0.82;
    const y = height * 0.80;
    const g = this.add.graphics().setDepth(18);

    // Soft outer glow
    g.lineStyle(8, COLORS.ELECTRIC_CYAN, 0.18);
    g.strokeRoundedRect(x - 154, y - 74, 308, 138, 12);
    g.fillStyle(0x050816, 0.86);
    g.fillRoundedRect(x - 150, y - 70, 300, 130, 10);
    g.lineStyle(3, COLORS.ELECTRIC_CYAN, 0.95);
    g.strokeRoundedRect(x - 150, y - 70, 300, 130, 10);

    this.add.text(x, y - 48, 'OBJECTIVE', {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#00f0ff',
      shadow: { offsetX: 0, offsetY: 0, color: '#00f0ff', blur: 8, fill: true },
    }).setOrigin(0.5).setDepth(19);

    this.add.text(x, y - 6, MENU_BLURB, {
      fontFamily: '"Courier New", monospace',
      fontSize: '13px',
      color: '#d7e7ff',
      align: 'center',
      wordWrap: { width: 260 },
      lineSpacing: 4,
    }).setOrigin(0.5).setDepth(19);

    // Rider silhouettes — center rider highlighted cyan
    const colors = [0xff2bd6, 0x7a3cff, 0x00f0ff, 0x40ffa0, 0xffd84d];
    colors.forEach((c, i) => {
      const px = x - 70 + i * 35;
      const body = this.add.rectangle(px, y + 42, 12, 18, c).setDepth(19);
      this.add.circle(px, y + 28, 5, c).setDepth(19);
      if (i === 2) {
        body.setStrokeStyle(2, 0xffffff, 0.95);
        this.add.circle(px, y + 28, 7).setStrokeStyle(2, 0x00f0ff, 0.9).setDepth(19);
      }
    });
  }

  createFooter(width, height) {
    this.add.text(18, height - 22, 'v1.0.0', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#6b7c99',
    }).setDepth(20);

    this.add.text(width / 2, height - 22, '© 2024 ZOOX FUTURE SF', {
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
    this.clouds.tilePositionX += 0.10 * d;
    this.skyline.tilePositionX += 0.22 * d;
    this.mid.tilePositionX += 0.45 * d;
    this.road.tilePositionX += 0.75 * d;
    this.roadReflect.tilePositionX += 0.85 * d;
  }

  startGame() {
    this.closeOverlay();
    this.scene.start('GameScene');
  }
}
