import { SCORE, STARTING_LIVES } from '../config.js';

/**
 * Scoring, streak, lives, and local high-score persistence.
 */
export class ScoreSystem {
  constructor() {
    this.score = 0;
    this.riders = 0;
    this.lives = STARTING_LIVES;
    this.streak = 0;
    this.multiplier = 1;
  }

  /** @param {number} deltaMs */
  addPassive(deltaMs) {
    this.score += (SCORE.PASSIVE_PER_SECOND * deltaMs) / 1000;
  }

  collectRider() {
    this.riders += 1;
    this.streak += 1;
    this.multiplier = 1 + Math.max(0, this.streak - 1) * SCORE.STREAK_MULTIPLIER_STEP;
    const gained = Math.round(SCORE.RIDER_BONUS * this.multiplier);
    this.score += gained;
    this.persistHighScore();
    return gained;
  }

  hitTraffic() {
    this.streak = 0;
    this.multiplier = 1;
    this.lives = Math.max(0, this.lives - 1);
    return this.lives;
  }

  getSnapshot() {
    return {
      score: Math.floor(this.score),
      riders: this.riders,
      lives: this.lives,
      streak: this.streak,
      multiplier: this.multiplier,
      highScore: ScoreSystem.readHighScore(),
    };
  }

  persistHighScore() {
    const current = Math.floor(this.score);
    const previous = ScoreSystem.readHighScore();
    if (current > previous) {
      try {
        localStorage.setItem(SCORE.HIGH_SCORE_KEY, String(current));
      } catch {
        // Ignore private-mode / blocked storage.
      }
    }
  }

  static readHighScore() {
    try {
      const raw = localStorage.getItem(SCORE.HIGH_SCORE_KEY);
      const value = Number(raw);
      return Number.isFinite(value) ? value : 0;
    } catch {
      return 0;
    }
  }
}
