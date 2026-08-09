import Phaser from 'phaser';
import { ASSET_KEYS, LANE_COUNT, SPAWN, SPEED } from '../config.js';
import { TrafficCar } from '../objects/TrafficCar.js';
import { ZCoinPickup } from '../objects/ZCoinPickup.js';

/**
 * Fairer spawn curves: fewer stacked lane traps, more Z coins early.
 */
export class SpawnSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {{ trafficGroup: Phaser.Physics.Arcade.Group, coinGroup: Phaser.Physics.Arcade.Group, getPlayerLane?: Function }} groups
   */
  constructor(scene, groups) {
    this.scene = scene;
    this.trafficGroup = groups.trafficGroup;
    this.coinGroup = groups.coinGroup;
    this.getPlayerLane = groups.getPlayerLane || (() => 1);
    this.enabled = false;
    this.trafficTimer = 0;
    this.coinTimer = 0;
    this.elapsed = 0;
    this.lastTrafficLane = 1;
    this.recentTrafficLanes = [];
  }

  start() {
    this.enabled = true;
    this.elapsed = 0;
    this.trafficTimer = 900;
    this.coinTimer = 700;
    this.recentTrafficLanes = [];
  }

  stop() {
    this.enabled = false;
  }

  /**
   * @param {number} deltaMs
   * @param {number} scrollSpeed
   */
  update(deltaMs, scrollSpeed) {
    if (!this.enabled) return;

    this.elapsed += deltaMs;
    this.trafficTimer -= deltaMs;
    this.coinTimer -= deltaMs;

    const t = this.elapsed / 1000;
    const trafficEvery = Math.max(
      SPAWN.TRAFFIC_MIN_MS,
      SPAWN.TRAFFIC_START_MS - t * 18,
    );
    const coinEvery = Math.max(
      SPAWN.ZCOIN_MIN_MS,
      SPAWN.ZCOIN_START_MS - t * 14,
    );

    if (this.trafficTimer <= 0) {
      this.spawnTraffic(scrollSpeed);
      this.trafficTimer = trafficEvery;
    }

    if (this.coinTimer <= 0) {
      this.spawnZCoin(scrollSpeed);
      this.coinTimer = coinEvery;
    }
  }

  pickTrafficLane() {
    const playerLane = this.getPlayerLane();
    const options = [0, 1, 2].filter((lane) => {
      // Avoid repeating the same lane three times in a row.
      const recentSame = this.recentTrafficLanes.filter((l) => l === lane).length;
      if (recentSame >= 2) return false;
      return true;
    });

    // 55% chance to avoid the player's current lane — keeps the game readable.
    let pool = options;
    if (Math.random() < 0.55) {
      const safe = options.filter((l) => l !== playerLane);
      if (safe.length) pool = safe;
    }

    let lane = Phaser.Utils.Array.GetRandom(pool.length ? pool : [0, 1, 2]);
    if (lane === this.lastTrafficLane && pool.length > 1) {
      lane = Phaser.Utils.Array.GetRandom(pool.filter((l) => l !== lane));
    }
    return lane;
  }

  /** @param {number} scrollSpeed */
  spawnTraffic(scrollSpeed) {
    const lane = this.pickTrafficLane();
    this.lastTrafficLane = lane;
    this.recentTrafficLanes.push(lane);
    if (this.recentTrafficLanes.length > 4) this.recentTrafficLanes.shift();

    // Prefer smaller cars early; buses/trucks later.
    const early = this.elapsed < 20000;
    const keys = early
      ? ASSET_KEYS.TRAFFIC.filter((k) => !k.includes('bus') && !k.includes('truck'))
      : ASSET_KEYS.TRAFFIC;
    const key = Phaser.Utils.Array.GetRandom(keys);

    const car = new TrafficCar(this.scene, this.scene.scale.width + 90, lane, key);
    const speed = Phaser.Math.Clamp(
      scrollSpeed + Phaser.Math.Between(30, 100),
      SPEED.TRAFFIC_MIN,
      SPEED.TRAFFIC_MAX,
    );
    car.drive(speed);
    this.trafficGroup.add(car);
  }

  /** @param {number} scrollSpeed */
  spawnZCoin(scrollSpeed) {
    const playerLane = this.getPlayerLane();
    // Often put a coin in/near the player lane so collecting feels rewarding.
    let lane = playerLane;
    if (Math.random() < 0.45) {
      lane = Phaser.Math.Clamp(playerLane + Phaser.Math.Between(-1, 1), 0, LANE_COUNT - 1);
    }
    if (lane === this.lastTrafficLane && Math.random() < 0.5) {
      lane = (lane + 1) % LANE_COUNT;
    }

    const coin = new ZCoinPickup(this.scene, this.scene.scale.width + 70, lane);
    coin.scroll(scrollSpeed);
    this.coinGroup.add(coin);
  }
}
