import Phaser from 'phaser';
import { ASSET_KEYS } from '../config.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';

/**
 * Start menu uses the painted reference plate as the full-bleed visual.
 * Only invisible hit zones sit over the baked-in buttons so the screen
 * looks like the mock, not a Phaser UI recreation.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;
    this.overlay = null;

    // Full-bleed painted menu plate (title, buttons, Zoox, landmarks baked in).
    this.add.image(width / 2, height / 2, ASSET_KEYS.MENU_BG)
      .setDisplaySize(width, height)
      .setDepth(0);

    this.createHitZones(width, height);

    this.input.keyboard?.on('keydown-SPACE', () => this.startGame());
    this.input.keyboard?.on('keydown-ENTER', () => this.startGame());
  }

  /**
   * Invisible interactive zones aligned to the painted button stack.
   * Coordinates tuned to the menu_reference plate composition.
   */
  createHitZones(width, height) {
    const cx = width * 0.5;
    // Button stack sits in the middle band of the plate.
    const startY = height * 0.365;
    const gap = height * 0.078;
    const zoneW = width * 0.30;
    const zoneH = height * 0.065;

    const items = [
      { action: () => this.startGame() },
      { action: () => this.showHighScores() },
      { action: () => this.showOptions() },
      { action: () => this.showHowTo() },
      { action: () => this.showExit() },
    ];

    items.forEach((item, i) => {
      const y = startY + i * gap;
      const zone = this.add.zone(cx, y, zoneW, zoneH)
        .setDepth(10)
        .setInteractive({ useHandCursor: true });

      // Subtle hover flash so players get feedback without hiding the art.
      const flash = this.add.graphics().setDepth(9).setAlpha(0);
      flash.fillStyle(0xffffff, 0.10);
      flash.fillRoundedRect(cx - zoneW / 2, y - zoneH / 2, zoneW, zoneH, 10);

      zone.on('pointerover', () => { flash.setAlpha(1); });
      zone.on('pointerout', () => { flash.setAlpha(0); });
      zone.on('pointerdown', () => item.action?.());
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

  startGame() {
    this.closeOverlay();
    this.scene.start('GameScene');
  }
}
