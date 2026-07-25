import Phaser from 'phaser';
import { ASSET_KEYS, LANE_COUNT, SPAWN, SPEED } from '../config.js';
import { TrafficCar } from '../objects/TrafficCar.js';
import { RiderPickup } from '../objects/RiderPickup.js';

/**
 * Progressive traffic + rider spawn curves.
 */
export class SpawnSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {{ trafficGroup: Phaser.Physics.Arcade.Group, riderGroup: Phaser.Physics.Arcade.Group }} groups
   */
  constructor(scene, groups) {
    this.scene = scene;
    this.trafficGroup = groups.trafficGroup;
    this.riderGroup = groups.riderGroup;
    this.enabled = false;
    this.trafficTimer = 0;
    this.riderTimer = 0;
    this.elapsed = 0;
    this.lastTrafficLane = 1;
  }

  start() {
    this.enabled = true;
    this.elapsed = 0;
    this.trafficTimer = 400;
    this.riderTimer = 1200;
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
    this.riderTimer -= deltaMs;

    const t = this.elapsed / 1000;
    const trafficEvery = Math.max(
      SPAWN.TRAFFIC_MIN_MS,
      SPAWN.TRAFFIC_START_MS - t * 35,
    );
    const riderEvery = Math.max(
      SPAWN.RIDER_MIN_MS,
      SPAWN.RIDER_START_MS - t * 20,
    );

    if (this.trafficTimer <= 0) {
      this.spawnTraffic(scrollSpeed);
      this.trafficTimer = trafficEvery;
    }

    if (this.riderTimer <= 0) {
      this.spawnRider(scrollSpeed);
      this.riderTimer = riderEvery;
    }
  }

  /** @param {number} scrollSpeed */
  spawnTraffic(scrollSpeed) {
    let lane = Phaser.Math.Between(0, LANE_COUNT - 1);
    if (lane === this.lastTrafficLane) {
      lane = (lane + 1) % LANE_COUNT;
    }
    this.lastTrafficLane = lane;

    const key = Phaser.Utils.Array.GetRandom(ASSET_KEYS.TRAFFIC);
    const car = new TrafficCar(this.scene, this.scene.scale.width + 80, lane, key);
    const speed = Phaser.Math.Clamp(
      scrollSpeed + Phaser.Math.Between(40, 140),
      SPEED.TRAFFIC_MIN,
      SPEED.TRAFFIC_MAX,
    );
    car.drive(speed);
    this.trafficGroup.add(car);
  }

  /** @param {number} scrollSpeed */
  spawnRider(scrollSpeed) {
    // Prefer a lane that is not the last traffic lane for fairness.
    let lane = Phaser.Math.Between(0, LANE_COUNT - 1);
    if (lane === this.lastTrafficLane) {
      lane = (lane + 2) % LANE_COUNT;
    }
    const pickup = new RiderPickup(this.scene, this.scene.scale.width + 60, lane);
    pickup.scroll(scrollSpeed);
    this.riderGroup.add(pickup);
  }
}
