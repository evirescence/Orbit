import Phaser from "phaser";
import { PHASER_CONFIG } from "./game/config";
import { GameScene } from "./game/GameScene";
import "./style.css";

new Phaser.Game({
  ...PHASER_CONFIG,
  scene: [GameScene],
});