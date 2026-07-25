import { SCORE, STARTING_LIVES } from '../config.js';

/**
 * Scoring, streak, lives, elapsed time, and local high-score persistence.
 */
export class ScoreSystem {
  constructor() {
    this.score = 0;
    this.riders = 0;
    this.lives = STARTING_LIVES;
    this.streak = 0;
    this.multiplier = 1;
    this.elapsedMs = 0;
  }

  /** @param {number} deltaMs */
  addPassive(deltaMs) {
    this.elapsedMs += deltaMs;
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

  nearMiss() {
    this.score += SCORE.NEAR_MISS_BONUS;
    this.persistHighScore();
    return SCORE.NEAR_MISS_BONUS;
  }

  hitTraffic() {
    this.streak = 0;
    this.multiplier = 1;
    this.lives = Math.max(0, this.lives - 1);
    this.persistHighScore();
    return this.lives;
  }

  get timeLabel() {
    const total = Math.floor(this.elapsedMs / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  getSnapshot() {
    return {
      score: Math.floor(this.score),
      riders: this.riders,
      lives: this.lives,
      streak: this.streak,
      multiplier: this.multiplier,
      time: this.timeLabel,
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
