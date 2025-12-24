import { Snake } from './Snake';
import type { ContributionGraph, GameState, Position, Direction } from './types';
import { GameState as GameStateEnum } from './types';
import {
  INITIAL_SPEED,
  MIN_SPEED,
  SPEED_INCREMENT,
  SCORE_PER_FOOD,
  INITIAL_FOOD_COUNT,
  MAX_FOOD_ON_BOARD,
} from './constants';

export class Game {
  private snake: Snake;
  private contributionGraph: ContributionGraph;
  private availablePositions: Position[];
  private foodSquares: Set<string>;
  private state: GameState;
  private score: number;
  private speed: number;
  private lastUpdateTime: number;
  private animationFrameId: number | null;
  private onScoreChange?: (score: number) => void;
  private onGameOver?: (score: number) => void;
  private onStateChange?: (state: GameState) => void;
  private onSpeedChange?: (speed: number) => void;

  constructor(contributionGraph: ContributionGraph) {
    this.snake = new Snake();
    this.contributionGraph = contributionGraph;
    this.availablePositions = this.getAvailablePositions();
    this.foodSquares = new Set<string>();
    this.state = GameStateEnum.READY;
    this.score = 0;
    this.speed = INITIAL_SPEED;
    this.lastUpdateTime = 0;
    this.animationFrameId = null;
    this.spawnInitialFood();
  }

  private getAvailablePositions(): Position[] {
    return this.contributionGraph.squares
      .filter((square) => square.level > 0)
      .map((square) => square.position);
  }

  private spawnInitialFood(): void {
    for (let i = 0; i < INITIAL_FOOD_COUNT; i++) {
      this.spawnFood();
    }
  }

  private spawnFood(): void {
    if (this.availablePositions.length === 0) return;

    const snakeBody = this.snake.getBody();
    const snakePositions = new Set(
      snakeBody.map((pos) => this.positionToKey(pos))
    );

    const availableForFood = this.availablePositions.filter((pos) => {
      const key = this.positionToKey(pos);
      return !snakePositions.has(key) && !this.foodSquares.has(key);
    });

    if (availableForFood.length === 0) return;

    const randomPos =
      availableForFood[Math.floor(Math.random() * availableForFood.length)];
    this.foodSquares.add(this.positionToKey(randomPos));
  }

  private positionToKey(pos: Position): string {
    return `${pos.x},${pos.y}`;
  }

  getSnake(): Snake {
    return this.snake;
  }

  getContributionGraph(): ContributionGraph {
    return this.contributionGraph;
  }

  getFoodSquares(): Set<string> {
    return this.foodSquares;
  }

  getState(): GameState {
    return this.state;
  }

  getScore(): number {
    return this.score;
  }

  getSpeed(): number {
    return this.speed;
  }

  setOnScoreChange(callback: (score: number) => void): void {
    this.onScoreChange = callback;
  }

  setOnGameOver(callback: (score: number) => void): void {
    this.onGameOver = callback;
  }

  setOnStateChange(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  setOnSpeedChange(callback: (speed: number) => void): void {
    this.onSpeedChange = callback;
  }

  start(): void {
    if (this.state === GameStateEnum.READY || this.state === GameStateEnum.GAME_OVER) {
      this.reset();
    }
    this.state = GameStateEnum.PLAYING;
    this.onStateChange?.(this.state);
    this.lastUpdateTime = performance.now();
    this.gameLoop();
  }

  pause(): void {
    if (this.state === GameStateEnum.PLAYING) {
      this.state = GameStateEnum.PAUSED;
      this.onStateChange?.(this.state);
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
  }

  resume(): void {
    if (this.state === GameStateEnum.PAUSED) {
      this.state = GameStateEnum.PLAYING;
      this.onStateChange?.(this.state);
      this.lastUpdateTime = performance.now();
      this.gameLoop();
    }
  }

  togglePause(): void {
    if (this.state === GameStateEnum.PLAYING) {
      this.pause();
    } else if (this.state === GameStateEnum.PAUSED) {
      this.resume();
    }
  }

  handleInput(direction: Direction): void {
    if (this.state === GameStateEnum.PLAYING) {
      this.snake.setDirection(direction);
    } else if (this.state === GameStateEnum.READY) {
      this.snake.setDirection(direction);
      this.start();
    }
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastUpdateTime;

    if (deltaTime >= this.speed) {
      this.update();
      this.lastUpdateTime = currentTime;
    }

    if (this.state === GameStateEnum.PLAYING) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
  };

  private update(): void {
    this.snake.move();

    if (this.snake.checkSelfCollision()) {
      this.endGame();
      return;
    }

    this.checkFoodCollision();
  }

  private checkFoodCollision(): void {
    const head = this.snake.getHead();
    const headKey = this.positionToKey(head);

    if (this.foodSquares.has(headKey)) {
      this.foodSquares.delete(headKey);
      this.snake.grow();
      this.increaseScore();
      this.increaseSpeed();

      if (this.foodSquares.size < MAX_FOOD_ON_BOARD) {
        this.spawnFood();
      }
    }
  }

  private increaseScore(): void {
    this.score += SCORE_PER_FOOD;
    this.onScoreChange?.(this.score);
  }

  private increaseSpeed(): void {
    this.speed = Math.max(MIN_SPEED, this.speed - SPEED_INCREMENT);
    this.onSpeedChange?.(this.speed);
  }

  private endGame(): void {
    this.state = GameStateEnum.GAME_OVER;
    this.onStateChange?.(this.state);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.onGameOver?.(this.score);
  }

  reset(): void {
    this.snake.reset();
    this.foodSquares.clear();
    this.spawnInitialFood();
    this.score = 0;
    this.speed = INITIAL_SPEED;
    this.state = GameStateEnum.READY;
    this.onScoreChange?.(this.score);
    this.onStateChange?.(this.state);
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
