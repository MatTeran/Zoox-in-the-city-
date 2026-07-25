import Phaser from 'phaser';
import { createGameConfig } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

/**
 * Prevent mobile browser scroll/bounce while playing.
 */
function lockPageScroll() {
  const block = (event) => event.preventDefault();
  document.addEventListener('touchmove', block, { passive: false });
  document.addEventListener('gesturestart', block);
}

lockPageScroll();

const game = new Phaser.Game(
  createGameConfig([BootScene, MenuScene, GameScene, GameOverScene]),
);

// Expose for Expo/WebView debugging without polluting gameplay modules.
window.__ZOOX_GAME__ = game;
