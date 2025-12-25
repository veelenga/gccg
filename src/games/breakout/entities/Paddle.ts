import type { Direction } from '../../../core/types';
import { Direction as DirectionEnum } from '../../../core/types';
import { PADDLE_WIDTH, PADDLE_Y, PADDLE_MOVE_SPEED, BREAKOUT_GRID_WIDTH } from '../constants';

export class Paddle {
  private x: number;
  private width: number;
  private y: number;
  private moveAccumulator: number = 0;
  private moveDirection: Direction | null = null;

  constructor() {
    this.width = PADDLE_WIDTH;
    this.y = PADDLE_Y;
    this.x = Math.floor((BREAKOUT_GRID_WIDTH - this.width) / 2);
  }

  getX(): number {
    return this.x;
  }

  getY(): number {
    return this.y;
  }

  getWidth(): number {
    return this.width;
  }

  setMoveDirection(direction: Direction | null): void {
    this.moveDirection = direction;
  }

  update(deltaTime: number): void {
    if (!this.moveDirection) {
      return;
    }

    this.moveAccumulator += deltaTime;

    while (this.moveAccumulator >= PADDLE_MOVE_SPEED) {
      this.moveAccumulator -= PADDLE_MOVE_SPEED;

      if (this.moveDirection === DirectionEnum.LEFT) {
        this.x = Math.max(1, this.x - 1);
      } else if (this.moveDirection === DirectionEnum.RIGHT) {
        this.x = Math.min(BREAKOUT_GRID_WIDTH - this.width - 1, this.x + 1);
      }
    }
  }

  containsX(x: number): boolean {
    return x >= this.x && x < this.x + this.width;
  }

  getRelativeHitPosition(x: number): number {
    const paddleCenter = this.x + this.width / 2;
    const relativeX = x - paddleCenter;
    return relativeX / (this.width / 2);
  }

  reset(): void {
    this.x = Math.floor((BREAKOUT_GRID_WIDTH - this.width) / 2);
    this.moveAccumulator = 0;
    this.moveDirection = null;
  }
}
