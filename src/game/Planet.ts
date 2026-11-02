import Phaser from "phaser";
import { ORBIT_CONFIG } from "./config";

export type PlanetKind =
  | "static"
  | "moving"
  | "pulsing"
  | "vanishing"
  | "blackhole";

export interface PlanetOptions {
  x: number;
  y: number;
  radius: number;
  kind: PlanetKind;
  omega: number;
  color: number;
}

export class Planet extends Phaser.GameObjects.Container {
  radius: number;
  kind: PlanetKind;
  omega: number;
  color: number;

  // для moving
  moveDir?: Phaser.Math.Vector2;
  moveSpeed?: number;

  // для pulsing
  baseRadius: number;
  pulseAmp: number;
  pulsePhase: number;

  // для vanishing
  vanishTimer: number;
  vanishPeriod: number;
  vanishOnRatio: number;
  visibleNow: boolean = true;

  private bodyGfx: Phaser.GameObjects.Arc;
  private glowGfx: Phaser.GameObjects.Arc;
  private captureRing: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, opts: PlanetOptions) {
    super(scene, opts.x, opts.y);
    scene.add.existing(this);

    this.radius = opts.radius;
    this.baseRadius = opts.radius;
    this.kind = opts.kind;
    this.omega = opts.omega;
    this.color = opts.color;

    this.pulseAmp = 0;
    this.pulsePhase = 0;
    this.vanishTimer = 0;
    this.vanishPeriod = 1.6;
    this.vanishOnRatio = 0.65;

    // свечение
    this.glowGfx = scene.add.circle(0, 0, this.radius * 1.6, this.color, 0.15);
    // тело
    this.bodyGfx = scene.add.circle(0, 0, this.radius, this.color, 1);
    // индикатор захвата
    this.captureRing = scene.add.circle(
      0, 0, this.radius + ORBIT_CONFIG.captureZone, this.color, 0
    );
    this.captureRing.setStrokeStyle(1, this.color, 0.3);

    this.add([this.glowGfx, this.bodyGfx, this.captureRing]);

    if (this.kind === "blackhole") {
      const hole = scene.add.circle(0, 0, this.radius * 0.55, 0x000000, 1);
      this.add(hole);
    }

    if (this.kind === "moving") {
      const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
      this.moveDir = new Phaser.Math.Vector2(Math.cos(a), Math.sin(a));
      this.moveSpeed = Phaser.Math.FloatBetween(20, 45);
    }

    if (this.kind === "pulsing") {
      this.pulseAmp = Phaser.Math.FloatBetween(8, 16);
      this.pulsePhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    }

    if (this.kind === "vanishing") {
      this.vanishTimer = Phaser.Math.FloatBetween(0, 1);
      this.vanishPeriod = Phaser.Math.FloatBetween(1.4, 2.0);
      this.vanishOnRatio = 0.65;
    }
  }

  update(dt: number, width: number, height: number, planets: Planet[]): void {
    if (this.kind === "moving" && this.moveDir && this.moveSpeed) {
      const nextX = this.x + this.moveDir.x * this.moveSpeed * dt;
      const nextY = this.y + this.moveDir.y * this.moveSpeed * dt;

      if (this.overlapsPlanet(nextX, nextY, this.getMaximumRadius(), planets)) {
        this.moveDir.scale(-1);
      } else {
        this.x = nextX;
        this.y = nextY;
      }

      if (this.x < this.radius || this.x > width - this.radius) {
        this.moveDir.x *= -1;
        this.x = Phaser.Math.Clamp(this.x, this.radius, width - this.radius);
      }
      if (this.y < this.radius || this.y > height - this.radius) {
        this.moveDir.y *= -1;
        this.y = Phaser.Math.Clamp(this.y, this.radius, height - this.radius);
      }
    }

    if (this.kind === "pulsing") {
      this.pulsePhase += dt * 2;
      const targetRadius = this.baseRadius + Math.sin(this.pulsePhase) * this.pulseAmp;
      const maxRadius = planets.reduce((max, planet) => {
        if (planet === this) return max;
        return Math.min(
          max,
          this.distanceTo(planet.x, planet.y) -
            planet.getMaximumRadius() - ORBIT_CONFIG.planetMinGap,
        );
      }, this.getMaximumRadius());
      this.radius = Math.min(targetRadius, maxRadius);
      this.bodyGfx.setRadius(this.radius);
      this.glowGfx.setRadius(this.radius * 1.6);
      this.captureRing.setRadius(this.radius + ORBIT_CONFIG.captureZone);
    }

    if (this.kind === "vanishing") {
      this.vanishTimer += dt;
      const t = (this.vanishTimer % this.vanishPeriod) / this.vanishPeriod;
      this.visibleNow = t < this.vanishOnRatio;
      this.setAlpha(this.visibleNow ? 1 : 0.15);
    }
  }

  distanceTo(x: number, y: number): number {
    return Phaser.Math.Distance.Between(this.x, this.y, x, y);
  }

  getMaximumRadius(): number {
    return this.baseRadius + this.pulseAmp;
  }

  private overlapsPlanet(
    x: number,
    y: number,
    radius: number,
    planets: Planet[],
  ): boolean {
    return planets.some((planet) => {
      if (planet === this) return false;
      return Phaser.Math.Distance.Between(x, y, planet.x, planet.y) <
        radius + planet.getMaximumRadius() + ORBIT_CONFIG.planetMinGap;
    });
  }
}