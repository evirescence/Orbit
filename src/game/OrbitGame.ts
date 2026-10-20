import Phaser from "phaser";
import { Planet, PlanetKind } from "./Planet";
import { ORBIT_CONFIG, GAME_WIDTH, GAME_HEIGHT, COLORS } from "./config";

export type GameState = "ORBIT" | "FLYING" | "DEAD";


type Crystal = {
  x: number;
  y: number;
  object: Phaser.GameObjects.Container;
  collected: boolean;
};


export class OrbitGame {
  state: GameState = "ORBIT";
  score = 0;
  best = 0;
  jumps = 0;

  satellite = { x: 0, y: 0, vx: 0, vy: 0, theta: 0 };
  trail: { x: number; y: number }[] = [];

  planets: Planet[] = [];
  currentPlanet: Planet | null = null;

  combo = 0;
  bestCombo = 0;
  crystalsCollected = 0;
  crystals: Crystal[] = [];

  private readonly crystalValue = 5;

  constructor(private scene: Phaser.Scene) {
    this.reset();
  }

  private isPositionFree(
    x: number,
    y: number,
    radius: number
  ): boolean {
    const minGap = 45; // минимальный зазор между планетами

    return this.planets.every((p) => {
      const dx = x - p.x;
      const dy = y - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      return distance >= radius + p.radius + minGap;
    });
  }

  reset(): void {
    this.state = "ORBIT";
    this.score = 0;
    this.jumps = 0;
    this.crystals.forEach((c) => c.object.destroy());
    this.crystals = [];

    this.combo = 0;
    this.bestCombo = 0;
    this.crystalsCollected = 0;
    this.planets.forEach((p) => p.destroy());
    this.planets = [];
    this.trail = [];

    const start = new Planet(this.scene, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      radius: 70,
      kind: "static",
      omega: ORBIT_CONFIG.baseOmega,
      color: COLORS.static,
    });
    this.planets.push(start);
    this.currentPlanet = start;

    this.satellite.theta = 0;
    this.satellite.x = start.x + (start.radius + ORBIT_CONFIG.orbitHeight);
    this.satellite.y = start.y;

    this.spawnNextPlanet(true);
  }

  tap(): void {
    if (this.state === "DEAD") {
      this.reset();
      return;
    }
    if (this.state !== "ORBIT" || !this.currentPlanet) return;

    const p = this.currentPlanet;
    const R = p.radius + ORBIT_CONFIG.orbitHeight;
    this.satellite.vx = -p.omega * R * Math.sin(this.satellite.theta);
    this.satellite.vy =  p.omega * R * Math.cos(this.satellite.theta);
    this.state = "FLYING";
  }

  update(dt: number): void {
    dt = Math.min(dt, 0.033);

    for (const p of this.planets) {
      p.update(dt, GAME_WIDTH, GAME_HEIGHT);
    }

    if (this.state === "ORBIT") this.updateOrbit(dt);
    else if (this.state === "FLYING") this.updateFlight(dt);

    this.trail.push({ x: this.satellite.x, y: this.satellite.y });
    if (this.trail.length > ORBIT_CONFIG.trailLength) this.trail.shift();
  }

  private updateOrbit(dt: number): void {
    const p = this.currentPlanet;
    if (!p) return;
    const R = p.radius + ORBIT_CONFIG.orbitHeight;
    this.satellite.theta += p.omega * dt;
    this.satellite.x = p.x + R * Math.cos(this.satellite.theta);
    this.satellite.y = p.y + R * Math.sin(this.satellite.theta);
  }


  private updateFlight(dt: number): void {
    this.satellite.x += this.satellite.vx * dt;
    this.satellite.y += this.satellite.vy * dt;
    this.collectCrystals();

    // Сначала смертельные столкновения
    for (const p of this.planets) {
      if (
        p.kind === "blackhole" &&
        p.distanceTo(this.satellite.x, this.satellite.y)
          < p.radius * 0.9
      ) {
        this.die();
        return;
      }
    }

    // Затем захват орбиты
    for (const p of this.planets) {
      if (p === this.currentPlanet) continue;
      if (p.kind === "vanishing" && !p.visibleNow) continue;

      if (
        p.distanceTo(this.satellite.x, this.satellite.y) <
        p.radius + ORBIT_CONFIG.captureZone
      ) {
        this.captureOrbit(p);
        return;
      }
    }

    // Затем проверка выхода за пределы поля
    const m = 60;

    if (
      this.satellite.x < -m ||
      this.satellite.x > GAME_WIDTH + m ||
      this.satellite.y < -m ||
      this.satellite.y > GAME_HEIGHT + m
    ) {
      this.die();
    }
  }

  private captureOrbit(p: Planet): void {
    this.state = "ORBIT";
    const oldPlanet = this.currentPlanet;
    this.currentPlanet = p;

    if (oldPlanet && oldPlanet !== p) {
  this.scene.tweens.add({
    targets: oldPlanet,
    alpha: 0,
    duration: 250,
    ease: "Quad.easeOut",
    onComplete: () => {
      oldPlanet.destroy();

      this.planets = this.planets.filter(
        (pl) => pl !== oldPlanet
      );
    },
  });
}
    this.satellite.theta = Math.atan2(
      this.satellite.y - p.y,
      this.satellite.x - p.x
    );
    p.omega = ORBIT_CONFIG.baseOmega *
      (1 + this.jumps * ORBIT_CONFIG.omegaGrowth);

    
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);

    // Первый захват даёт +1, второй +2, третий +3...
    this.score += this.combo;
    this.jumps++;

    if (this.score > this.best) {
      this.best = this.score;
    }

    // После захвата появляется новый бонус
    this.spawnCrystal();


    this.spawnNextPlanet(false);

    // Удаляем далёкие планеты и освобождаем их ресурсы
    this.planets = this.planets.filter((pl) => {
      const keep =
        pl === p ||
        (
          pl.x > -200 &&
          pl.x < GAME_WIDTH + 200 &&
          pl.y > -200 &&
          pl.y < GAME_HEIGHT + 200
        );

      if (!keep) {
        pl.destroy();
      }

      return keep;
    });
  }

  
private spawnCrystal(): void {
  const pad = 40;
  const radius = 10;
  const minGap = 35;

  for (let attempt = 0; attempt < 80; attempt++) {
    const x = Phaser.Math.FloatBetween(
      pad, GAME_WIDTH - pad
    );
    const y = Phaser.Math.FloatBetween(
      pad, GAME_HEIGHT - pad
    );

    // Не создаём кристалл рядом с планетами
    const overlapsPlanet = this.planets.some((p) =>
      Phaser.Math.Distance.Between(x, y, p.x, p.y)
        < p.radius + minGap
    );

    if (overlapsPlanet) continue;

    // Не создаём кристаллы друг на друге
    const overlapsCrystal = this.crystals.some((c) =>
      !c.collected &&
      Phaser.Math.Distance.Between(x, y, c.x, c.y)
        < radius * 2 + minGap
    );

    if (overlapsCrystal) continue;


    const star = this.scene.add.star(
  0,      // x
  0,      // y
  5,      // количество лучей
  5,      // внутренний радиус
  12,     // внешний радиус
  0xffe66d // золотистый цвет
);

star.setStrokeStyle(2, 0xffffff, 0.9);


    const object = this.scene.add.container(x, y, [star]);

    object.setDepth(5);

    this.crystals.push({
      x, y, object, collected: false,
    });

    return;
  }

  // Если места нет, попробуем создать кристалл позже
}


private collectCrystals(): void {
  for (const crystal of this.crystals) {
    if (crystal.collected) continue;

    const distance = Phaser.Math.Distance.Between(
      this.satellite.x,
      this.satellite.y,
      crystal.x,
      crystal.y
    );

    if (
      distance <
      ORBIT_CONFIG.satelliteRadius + 12
    ) {
      crystal.collected = true;
      crystal.object.destroy();

      this.crystalsCollected++;
      this.score += this.crystalValue;

      // Показываем бонус над местом сбора
      const popup = this.scene.add.text(
        crystal.x,
        crystal.y - 18,
        `+${this.crystalValue}`,
        {
          fontFamily: "system-ui, sans-serif",
          fontSize: "18px",
          color: "#45f3ff",
          fontStyle: "bold",
        }
      ).setOrigin(0.5).setDepth(15);

      this.scene.tweens.add({
        targets: popup,
        y: popup.y - 35,
        alpha: 0,
        duration: 650,
        onComplete: () => popup.destroy(),
      });

      if (this.score > this.best) {
        this.best = this.score;
      }
    }
  }

  this.crystals = this.crystals.filter(
    (c) => !c.collected
  );
}


  private die(): void {
    if (this.state === "DEAD") return;
    this.state = "DEAD";
    this.combo = 0;
    this.state = "DEAD";
  }



private spawnNextPlanet(initial: boolean): void {
  const anchor =
    this.planets[this.planets.length - 1] ??
    this.currentPlanet;

  if (!anchor) return;

  let dirAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

  if (!initial) {
    const prev = this.planets[this.planets.length - 2];

    if (prev) {
      dirAngle = Math.atan2(
        anchor.y - prev.y,
        anchor.x - prev.x
      );
    }
  }

  const kind = this.pickPlanetKind();

  const radius = kind === "blackhole"
    ? Phaser.Math.FloatBetween(24, 34)
    : Phaser.Math.FloatBetween(34, 56) *
      (1 - Math.min(this.jumps * 0.005, 0.3));

  const pad = 80;
  let x = 0;
  let y = 0;
  let found = false;

  // Сначала нормальный зазор, затем меньший
  for (const minGap of [40, 25, 10, 0]) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const angle =
        dirAngle + Phaser.Math.FloatBetween(-1.2, 1.2);

      const distance =
        Phaser.Math.FloatBetween(220, 360);

      x = Phaser.Math.Clamp(
        anchor.x + Math.cos(angle) * distance,
        pad + radius,
        GAME_WIDTH - pad - radius
      );

      y = Phaser.Math.Clamp(
        anchor.y + Math.sin(angle) * distance,
        pad + radius,
        GAME_HEIGHT - pad - radius
      );

      const free = this.planets.every((p) => {
        const d = Phaser.Math.Distance.Between(
          x, y, p.x, p.y
        );

        return d >= radius + p.radius + minGap;
      });

      if (free) {
        found = true;
        break;
      }
    }

    if (found) break;
  }

  // Не создаём планету поверх другой
  if (!found) {
    // Освобождаем место, удаляя самую дальнюю
    // от текущей планеты неактивную цель.
    const candidates = this.planets.filter(
      (p) => p !== this.currentPlanet
    );

    candidates.sort(
      (a, b) =>
        b.distanceTo(anchor.x, anchor.y) -
        a.distanceTo(anchor.x, anchor.y)
    );

    const old = candidates[0];

    if (old) {
      this.planets = this.planets.filter(
        (p) => p !== old
      );
      old.destroy();

      // Повторяем генерацию уже с меньшим числом планет
      this.spawnNextPlanet(initial);
    }

    return;
  }

  const planet = new Planet(this.scene, {
    x,
    y,
    radius,
    kind,
    color: this.colorForKind(kind),
    omega: ORBIT_CONFIG.baseOmega,
  });

  if (kind === "vanishing") {
    planet.vanishOnRatio = Phaser.Math.Clamp(
      0.7 - this.jumps * 0.005,
      0.45,
      0.7
    );
  }

  this.planets.push(planet);
}


  private pickPlanetKind(): PlanetKind {
    const j = this.jumps;
    const roll = Math.random();
    if (j < 3) return "static";
    if (j < 6) return roll < 0.5 ? "static" : "moving";
    if (j < 10) {
      if (roll < 0.4) return "static";
      if (roll < 0.75) return "moving";
      return "pulsing";
    }
    if (j < 15) {
      if (roll < 0.25) return "static";
      if (roll < 0.5) return "moving";
      if (roll < 0.75) return "pulsing";
      return "vanishing";
    }
    if (roll < 0.2) return "static";
    if (roll < 0.4) return "moving";
    if (roll < 0.6) return "pulsing";
    if (roll < 0.8) return "vanishing";
    return "blackhole";
  }

  private colorForKind(kind: PlanetKind): number {
    switch (kind) {
      case "static":    return COLORS.static;
      case "moving":    return COLORS.moving;
      case "pulsing":   return COLORS.pulsing;
      case "vanishing": return COLORS.vanishing;
      case "blackhole": return COLORS.blackhole;
    }
  }
}