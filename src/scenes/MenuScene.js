import Phaser from 'phaser';
import { ASSET_KEYS } from '../config.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';

/**
 * Painted menu plate is the full-bleed visual.
 * Invisible hit targets are pixel-aligned to the baked button stack.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;
    this.overlay = null;
    this._busy = false;

    this.add.image(width / 2, height / 2, ASSET_KEYS.MENU_BG)
      .setDisplaySize(width, height)
      .setDepth(0);

    this.createHitZones(width, height);

    this.input.keyboard?.on('keydown-SPACE', () => this.startGame());
    this.input.keyboard?.on('keydown-ENTER', () => this.startGame());
  }

  /**
   * Button centers measured from menu_bg.png neon borders (1280×720).
   * Oversized targets for reliable phone taps.
   */
  createHitZones(width, height) {
    // Measured mid-Y of each painted button on the plate.
    const mids = [255, 318, 380, 447, 513].map((y) => (y / 720) * height);
    const zoneW = Math.min(width * 0.42, 520);
    const zoneH = Math.max(height * 0.085, 56);
    const cx = width * 0.5;

    const items = [
      { action: () => this.startGame() },
      { action: () => this.showHighScores() },
      { action: () => this.showOptions() },
      { action: () => this.showHowTo() },
      { action: () => this.showExit() },
    ];

    items.forEach((item, i) => {
      const y = mids[i];

      // Near-invisible rect — more reliable than Zone for touch hit-testing.
      const hit = this.add.rectangle(cx, y, zoneW, zoneH, 0xffffff, 0.001)
        .setDepth(10)
        .setInteractive({ useHandCursor: true });

      const flash = this.add.rectangle(cx, y, zoneW, zoneH, 0xffffff, 0.12)
        .setDepth(9)
        .setAlpha(0);

      const fire = () => {
        if (this._busy || this.overlay) return;
        this._busy = true;
        flash.setAlpha(1);
        this.time.delayedCall(40, () => {
          item.action?.();
          this._busy = false;
        });
      };

      hit.on('pointerover', () => flash.setAlpha(0.8));
      hit.on('pointerout', () => flash.setAlpha(0));
      hit.on('pointerdown', () => flash.setAlpha(1));
      // pointerup is more reliable than pointerdown on iOS WebViews.
      hit.on('pointerup', fire);
    });
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
      'Survive longer. Stack Z-coin streaks.',
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
      'Collect Z coins for +300 and streaks',
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

  startGame() {
    this.closeOverlay();
    this.scene.start('GameScene');
  }
}
