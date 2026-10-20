// Конфигурация Phaser + параметры игры

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
import Phaser from "phaser";

export const ORBIT_CONFIG = {
  captureZone: 18,
  satelliteRadius: 5,
  orbitHeight: 22,        // высота спутника над планетой
  baseOmega: 1.6,         // рад/сек
  omegaGrowth: 0.02,      // +2% за прыжок
  trailLength: 14,
  gravity: 0,
};

export const COLORS = {
  bgTop: 0x0a0a1f,
  bgBottom: 0x000000,
  satellite: 0xffffff,
  static: 0x00d4ff,
  moving: 0xff00aa,
  pulsing: 0xffaa00,
  vanishing: 0xaa66ff,
  blackhole: 0xff3355,
  star: 0xffffff,
};

export const PHASER_CONFIG = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#000000",
  parent: "game",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
};