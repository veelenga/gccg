import { BaseGame } from '../../core/BaseGame';
import { SnakeEntity } from './SnakeEntity';
import type { Grid } from '../../core/Grid';
import type { Position, GameInput } from '../../core/types';
import { CellType } from '../../core/types';
import {
  INITIAL_SPEED,
  MIN_SPEED,
  SPEED_INCREMENT,
  SCORE_PER_FOOD,
  INITIAL_FOOD_COUNT,
  MAX_FOOD_ON_BOARD,
} from './constants';

export class SnakeGame extends BaseGame {
  private snake: SnakeEntity;
  private availablePositions: Position[];
  private foodSquares: Set<string>;
  private speed: number;
  private accumulatedTime: number = 0;
  private onSpeedChange?: (speed: number) => void;
  private speedMultiplier: number;

  constructor(grid: Grid, speedMultiplier: number = 1) {
    super(grid);
    this.speedMultiplier = speedMultiplier;
    this.snake = new SnakeEntity(grid.config.width, grid.config.height);
    this.availablePositions = this.getAvailablePositions();
    this.foodSquares = new Set<string>();
    this.speed = INITIAL_SPEED * speedMultiplier;
    this.spawnInitialFood();
  }

  private getAvailablePositions(): Position[] {
    return this.grid
      .getAvailableCells((cell) => cell.type === CellType.PLAYABLE)
      .map((cell) => cell.position);
  }

  private spawnInitialFood(): void {
    for (let i = 0; i < INITIAL_FOOD_COUNT; i++) {
      this.spawnFood();
    }
  }

  private spawnFood(): void {
    if (this.availablePositions.length === 0) return;

    const snakeBody = this.snake.getBody();
    const snakePositions = new Set(snakeBody.map((pos) => this.positionToKey(pos)));

    const availableForFood = this.availablePositions.filter((pos) => {
      const key = this.positionToKey(pos);
      return !snakePositions.has(key) && !this.foodSquares.has(key);
    });

    if (availableForFood.length === 0) return;

    const randomPos = availableForFood[Math.floor(Math.random() * availableForFood.length)];
    this.foodSquares.add(this.positionToKey(randomPos));
  }

  private positionToKey(pos: Position): string {
    return `${pos.x},${pos.y}`;
  }

  protected update(deltaTime: number): void {
    this.accumulatedTime += deltaTime;

    if (this.accumulatedTime < this.speed) return;

    this.accumulatedTime -= this.speed;

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
    this.updateScore(this.score + SCORE_PER_FOOD);
  }

  private increaseSpeed(): void {
    this.speed = Math.max(MIN_SPEED, this.speed - SPEED_INCREMENT);
    this.onSpeedChange?.(this.speed);
  }

  protected reset(): void {
    this.snake.reset();
    this.foodSquares.clear();
    this.spawnInitialFood();
    this.updateScore(0);
    this.speed = INITIAL_SPEED * this.speedMultiplier;
    this.accumulatedTime = 0;
    this.onSpeedChange?.(this.speed);
  }

  handleInput(input: GameInput): void {
    if (input.type === 'direction' && input.direction) {
      this.snake.setDirection(input.direction);
    }
  }

  getSnake(): SnakeEntity {
    return this.snake;
  }

  getFoodSquares(): Set<string> {
    return this.foodSquares;
  }

  getSpeed(): number {
    return this.speed;
  }

  setOnSpeedChange(callback: (speed: number) => void): void {
    this.onSpeedChange = callback;
  }
}
