import { BALL_SPEED, BALL_INITIAL_ANGLE, BREAKOUT_GRID_WIDTH, BREAKOUT_GRID_HEIGHT } from '../constants';

export interface BallPosition {
  x: number;
  y: number;
}

export class Ball {
  private x: number;
  private y: number;
  private velocityX: number;
  private velocityY: number;
  private speed: number;
  private launched: boolean = false;
  private moveAccumulator: number = 0;

  constructor(x: number, y: number, speedMultiplier: number = 1) {
    this.x = x;
    this.y = y;
    this.speed = BALL_SPEED * speedMultiplier;
    this.velocityX = Math.cos(BALL_INITIAL_ANGLE);
    this.velocityY = Math.sin(BALL_INITIAL_ANGLE);
  }

  getPosition(): BallPosition {
    return { x: Math.round(this.x), y: Math.round(this.y) };
  }

  getRawPosition(): BallPosition {
    return { x: this.x, y: this.y };
  }

  isLaunched(): boolean {
    return this.launched;
  }

  launch(): void {
    this.launched = true;
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  update(deltaTime: number): boolean {
    if (!this.launched) {
      return true;
    }

    this.moveAccumulator += deltaTime;

    while (this.moveAccumulator >= this.speed) {
      this.moveAccumulator -= this.speed;

      this.x += this.velocityX;
      this.y += this.velocityY;

      if (this.x <= 0) {
        this.x = 1;
        this.velocityX = Math.abs(this.velocityX);
      } else if (this.x >= BREAKOUT_GRID_WIDTH - 1) {
        this.x = BREAKOUT_GRID_WIDTH - 2;
        this.velocityX = -Math.abs(this.velocityX);
      }

      if (this.y <= 0) {
        this.y = 1;
        this.velocityY = Math.abs(this.velocityY);
      }

      if (this.y >= BREAKOUT_GRID_HEIGHT) {
        return false;
      }
    }

    return true;
  }

  bounceVertical(): void {
    this.velocityY = -this.velocityY;
  }

  bounceHorizontal(): void {
    this.velocityX = -this.velocityX;
  }

  bounceFromPaddle(relativeHitPosition: number): void {
    const maxAngle = Math.PI / 3;
    const angle = relativeHitPosition * maxAngle;

    this.velocityX = Math.sin(angle);
    this.velocityY = -Math.abs(Math.cos(angle));

    const magnitude = Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
    this.velocityX /= magnitude;
    this.velocityY /= magnitude;
  }

  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.velocityX = Math.cos(BALL_INITIAL_ANGLE);
    this.velocityY = Math.sin(BALL_INITIAL_ANGLE);
    this.launched = false;
    this.moveAccumulator = 0;
  }
}
