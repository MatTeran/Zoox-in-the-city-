import Phaser from 'phaser';
import {
  ASSET_KEYS,
  COLORS,
  MENU_BLURB,
  TAGLINE,
  VEHICLE_CATEGORY,
  VEHICLE_NAME,
} from '../config.js';
import { ScoreSystem } from '../systems/ScoreSystem.js';

/**
 * Arcade-cabinet title screen with animated SF skyline and idling Zoox.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    this.add.image(width / 2, height / 2, ASSET_KEYS.MENU_BG).setDisplaySize(width, height);

    // Parallax drift layers for life on the title.
    this.clouds = this.add.tileSprite(0, 40, width, 140, ASSET_KEYS.CLOUDS)
      .setOrigin(0, 0)
      .setAlpha(0.8);
    this.skyline = this.add.tileSprite(0, 150, width, 200, ASSET_KEYS.SKYLINE)
      .setOrigin(0, 0)
      .setAlpha(0.95);
    this.mid = this.add.tileSprite(0, 260, width, 200, ASSET_KEYS.MIDGROUND)
      .setOrigin(0, 0);

    // Dim left/right panels for cabinet readability
    const veil = this.add.graphics();
    veil.fillStyle(COLORS.DEEP_NAVY, 0.45);
    veil.fillRect(0, 0, width * 0.42, height);
    veil.fillStyle(COLORS.DEEP_NAVY, 0.35);
    veil.fillRect(width * 0.55, 0, width * 0.45, height);

    // LEFT — always-selected robotaxi
    this.add.text(width * 0.22, height * 0.14, VEHICLE_CATEGORY, {
      fontFamily: '"Courier New", monospace',
      fontSize: '20px',
      color: '#7a3cff',
    }).setOrigin(0.5);

    this.zoox = this.add.sprite(width * 0.22, height * 0.42, ASSET_KEYS.ZOOX)
      .setScale(0.95);
    if (this.anims.exists('zoox-drive')) this.zoox.play('zoox-drive');

    this.tweens.add({
      targets: this.zoox,
      y: this.zoox.y - 6,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.text(width * 0.22, height * 0.62, VEHICLE_NAME, {
      fontFamily: '"Courier New", monospace',
      fontSize: '54px',
      color: '#00f0ff',
    }).setOrigin(0.5);

    this.add.text(width * 0.22, height * 0.71, TAGLINE, {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      color: '#ffd84d',
    }).setOrigin(0.5);

    this.add.text(width * 0.22, height * 0.79, 'SELECTED', {
      fontFamily: '"Courier New", monospace',
      fontSize: '22px',
      color: '#ff2bd6',
    }).setOrigin(0.5);

    // RIGHT — title + start
    const [titleA, titleB] = ['ZOOX', 'FUTURE SF'];
    this.add.text(width * 0.72, height * 0.22, titleA, {
      fontFamily: '"Courier New", monospace',
      fontSize: '72px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(width * 0.72, height * 0.34, titleB, {
      fontFamily: '"Courier New", monospace',
      fontSize: '56px',
      color: '#00f0ff',
    }).setOrigin(0.5);

    this.add.text(width * 0.72, height * 0.48, MENU_BLURB, {
      fontFamily: '"Courier New", monospace',
      fontSize: '18px',
      color: '#d7e7ff',
      align: 'center',
      wordWrap: { width: width * 0.38 },
    }).setOrigin(0.5);

    this.add.text(width * 0.72, height * 0.58, `HIGH ${ScoreSystem.readHighScore()}`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '18px',
      color: '#ffd84d',
    }).setOrigin(0.5);

    const start = this.add.image(width * 0.72, height * 0.72, ASSET_KEYS.BUTTON)
      .setDisplaySize(260, 72)
      .setInteractive({ useHandCursor: true });

    const startLabel = this.add.text(width * 0.72, height * 0.72, 'START GAME', {
      fontFamily: '"Courier New", monospace',
      fontSize: '28px',
      color: '#050816',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [start, startLabel],
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 650,
      yoyo: true,
      repeat: -1,
    });

    start.on('pointerup', () => this.startGame());
    this.input.keyboard?.on('keydown-SPACE', () => this.startGame());

    this.add.text(width * 0.72, height * 0.84, 'SPACE / TAP  ·  W S LANES  ·  P PAUSE', {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#9bb4d8',
    }).setOrigin(0.5);
  }

  update(_t, delta) {
    const d = delta / 16;
    this.clouds.tilePositionX += 0.15 * d;
    this.skyline.tilePositionX += 0.35 * d;
    this.mid.tilePositionX += 0.7 * d;
  }

  startGame() {
    this.scene.start('GameScene');
  }
}
