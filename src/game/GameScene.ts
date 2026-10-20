import Phaser from "phaser";
import { OrbitGame } from "./OrbitGame";
import { GAME_WIDTH, GAME_HEIGHT, COLORS, ORBIT_CONFIG } from "./config";

type Screen = "RULES" | "PLAYING" | "GAMEOVER";

export class GameScene extends Phaser.Scene {
  private game!: OrbitGame;
  private screen: Screen = "RULES";

  private satelliteGfx!: Phaser.GameObjects.Arc;
  private trailGfx!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private crystalsText!: Phaser.GameObjects.Text;

  // экран правил
  private rulesContainer!: Phaser.GameObjects.Container;

  // экран game over
  private gameOverContainer!: Phaser.GameObjects.Container;
  private finalScoreText!: Phaser.GameObjects.Text;
  private bestResultText!: Phaser.GameObjects.Text;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.createBackground();

    this.game = new OrbitGame(this);

    // графика для игры
    this.trailGfx = this.add.graphics();
    this.satelliteGfx = this.add.circle(
      0, 0, ORBIT_CONFIG.satelliteRadius, COLORS.satellite, 1
    );

    // HUD (счёт)
    this.scoreText = this.add.text(GAME_WIDTH / 2, 40, "0", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "42px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(10);

    this.bestText = this.add.text(GAME_WIDTH / 2, 76, "best 0", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      color: "#8888aa",
    }).setOrigin(0.5).setDepth(10);

    
this.comboText = this.add.text(35, 40, "COMBO x0", {
  fontFamily: "system-ui, sans-serif",
  fontSize: "16px",
  color: "#45eaff",
  fontStyle: "bold",
}).setDepth(10);

this.crystalsText = this.add.text(
  GAME_WIDTH - 35, 40, "◆ 0", {
    fontFamily: "system-ui, sans-serif",
    fontSize: "18px",
    color: "#45f3ff",
    fontStyle: "bold",
  }
).setOrigin(1, 0).setDepth(10);


    this.createRulesScreen();
    this.createGameOverScreen();

        // ввод: тап по канвасу работает только в PLAYING
    this.input.on("pointerdown", () => {
      if (this.screen === "PLAYING") {
        this.game.tap();
      }
    });

    this.input.keyboard?.on("keydown-SPACE", () => {
      if (this.screen === "PLAYING") {
        this.game.tap();
      }
    });

    this.input.keyboard?.on("keydown-UP", () => {
      if (this.screen === "PLAYING") {
        this.game.tap();
      }
    });

    // прячем игровой HUD и графику до старта
    this.setGameplayVisible(false);
    this.rulesContainer.setVisible(true);
    this.gameOverContainer.setVisible(false);
  }

  // ---------- ЭКРАН ПРАВИЛ ----------

  private createRulesScreen(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 -180;

    // полупрозрачный тёмный фон
    const bg = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75);

    const title = this.add.text(cx, cy - 20, "ORBIT", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "64px",
      color: "#00d4ff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const subtitle = this.add.text(cx, cy + 20, "космический прыжок", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      color: "#8888aa",
    }).setOrigin(0.5);

    const rules = this.add.text(cx, cy + 30, [
      "Как играть:",
      "",
      "1.  Спутник летает вокруг планеты",
      "2.  ТАП / ПРОБЕЛ — оторваться от орбиты",
      "3.  Летишь по касательной к следующей планете",
      "4.  Попал в кольцо — захват, счёт +1",
      "5.  Промахнулся или улетел — Game Over",
      "6.  Звездочка дает бонус к счету",
      "",
      "Планеты:",
      "•  голубая   — статичная",
      "•  розовая   — движется",
      "•  золотая   — пульсирует",
      "•  фиолетовая — исчезает",
      "•  красная   — чёрная дыра (смерть!)",
    ].join("\n"), {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      color: "#ccccdd",
      lineSpacing: 6,
      align: "left",
    }).setOrigin(0.5, 0);

    const button = this.createButton(cx, GAME_HEIGHT - 80, "ИГРАТЬ", () => {
      this.startGame();
    });

    this.rulesContainer = this.add.container(0, 0, [
      bg, title, subtitle, rules, button,
    ]).setDepth(20);
  }

  // ---------- ЭКРАН GAME OVER ----------

  private createGameOverScreen(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const bg = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);

    const title = this.add.text(cx, cy - 100, "GAME OVER", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "56px",
      color: "#ff3355",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.finalScoreText = this.add.text(cx, cy - 20, "0", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "72px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.bestResultText = this.add.text(cx, cy + 50, "best 0", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      color: "#8888aa",
    }).setOrigin(0.5);

    const button = this.createButton(cx, cy + 140, "ЗАНОВО", () => {
      this.startGame();
    });

    this.gameOverContainer = this.add.container(0, 0, [
      bg, title, this.finalScoreText, this.bestResultText, button,
    ]).setDepth(20);
  }

  // ---------- КНОПКА ----------

  private createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    width = 220,
    height = 56,
  ): Phaser.GameObjects.Container {
    const bg = this.add.rectangle(0, 0, width, height, 0x00d4ff, 1)
      .setStrokeStyle(2, 0xffffff, 0.8);

    const text = this.add.text(0, 0, label, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
      color: "#000000",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const btn = this.add.container(x, y, [bg, text]);

    // интерактивность
    bg.setInteractive({ useHandCursor: true });

    bg.on("pointerover", () => {
      bg.setFillStyle(0xffffff, 1);
    });
    bg.on("pointerout", () => {
      bg.setFillStyle(0x00d4ff, 1);
    });
    bg.on("pointerdown", (pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation(); // не даём тапу уйти в игровую логику
      onClick();
    });

    return btn;
  }

  // ---------- УПРАВЛЕНИЕ ЭКРАНАМИ ----------

  private setGameplayVisible(v: boolean): void {
    this.satelliteGfx.setVisible(v);
    this.trailGfx.setVisible(v);
    this.scoreText.setVisible(v);
    this.bestText.setVisible(v);
    for (const p of this.game.planets) p.setVisible(v);
    this.comboText.setVisible(v);
    this.crystalsText.setVisible(v);
  }

  private startGame(): void {
    this.screen = "PLAYING";

    // очищаем поле
    this.game.reset();

    // прячем оверлеи
    this.rulesContainer.setVisible(false);
    this.gameOverContainer.setVisible(false);

    // показываем игру
    this.setGameplayVisible(true);

    // обновляем trail graphics
    this.trailGfx.clear();
  }

  private showGameOver(): void {
    this.screen = "GAMEOVER";

    // прячем игровые объекты (поле чистое)
    for (const p of this.game.planets) p.setVisible(false);
    this.satelliteGfx.setVisible(false);
    this.trailGfx.clear();
    this.comboText.setVisible(false);
this.crystalsText.setVisible(false);

    // HUD счёта прячем — он будет на оверлее
    this.scoreText.setVisible(false);
    this.bestText.setVisible(false);

    // заполняем данные
    this.finalScoreText.setText(String(this.game.score));
    this.bestResultText.setText(`best ${this.game.best}`);

    this.gameOverContainer.setVisible(true);
    this.gameOverContainer.setAlpha(0);
    this.tweens.add({
      targets: this.gameOverContainer,
      alpha: 1,
      duration: 250,
      ease: "Quad.easeOut",
    });
  }

  // ---------- ИГРОВОЙ ЦИКЛ ----------

  update(_time: number, delta: number): void {
    if (this.screen !== "PLAYING") return;

    const dt = delta / 1000;
    this.game.update(dt);

    // если игра умерла — переключаемся на экран game over
    if (this.game.state === "DEAD") {
      this.showGameOver();
      return;
    }

    // рендер спутника
    this.satelliteGfx.setPosition(
      this.game.satellite.x, this.game.satellite.y
    );

    // trail
    this.trailGfx.clear();
    const tr = this.game.trail;
    for (let i = 0; i < tr.length; i++) {
      const t = i / tr.length;
      this.trailGfx.fillStyle(COLORS.satellite, t * 0.6);
      this.trailGfx.fillCircle(tr[i].x, tr[i].y,
                               ORBIT_CONFIG.satelliteRadius * t);
    }

    // HUD
    this.scoreText.setText(String(this.game.score));
    this.bestText.setText(`best ${this.game.best}`);
    this.comboText.setText(
      `COMBO x${this.game.combo}`
    );

    this.crystalsText.setText(
      `◆ ${this.game.crystalsCollected}`
    );
  }

  // ---------- ФОН ----------

  private createBackground(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(COLORS.bgTop, COLORS.bgTop,
                        COLORS.bgBottom, COLORS.bgBottom, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (let i = 0; i < 120; i++) {
      this.add.circle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.FloatBetween(0.3, 1.5),
        COLORS.star,
        Phaser.Math.FloatBetween(0.2, 0.8)
      ).setDepth(-1);
    }
  }

  // ---------- ВВОД ----------

  // регистрируем ввод один раз, но реагируем только в PLAYING
  // (create вызывается до startGame, поэтому вешаем здесь)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _registerInput(): void {
    // placeholder — ввод регистрируется в create через this.input.on
  }
}