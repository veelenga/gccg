import type { Position, Direction } from '../../../core/types';
import { Direction as DirectionEnum } from '../../../core/types';
import { BULLET_SPEED, BULLET_DAMAGE } from '../constants';

export interface BulletConfig {
  position: Position;
  direction: Direction;
  isPlayerBullet: boolean;
}

export class Bullet {
  private position: Position;
  private direction: Direction;
  private isPlayerBullet: boolean;
  private moveAccumulator: number = 0;
  private active: boolean = true;

  constructor(config: BulletConfig) {
    this.position = { ...config.position };
    this.direction = config.direction;
    this.isPlayerBullet = config.isPlayerBullet;
  }

  getPosition(): Position {
    return { ...this.position };
  }

  getDirection(): Direction {
    return this.direction;
  }

  isFromPlayer(): boolean {
    return this.isPlayerBullet;
  }

  isActive(): boolean {
    return this.active;
  }

  getDamage(): number {
    return BULLET_DAMAGE;
  }

  deactivate(): void {
    this.active = false;
  }

  update(deltaTime: number): boolean {
    if (!this.active) return false;

    this.moveAccumulator += deltaTime;
    if (this.moveAccumulator >= BULLET_SPEED) {
      this.moveAccumulator -= BULLET_SPEED;
      this.move();
      return true; // Moved
    }
    return false; // Didn't move yet
  }

  private move(): void {
    switch (this.direction) {
      case DirectionEnum.UP:
        this.position.y -= 1;
        break;
      case DirectionEnum.DOWN:
        this.position.y += 1;
        break;
      case DirectionEnum.LEFT:
        this.position.x -= 1;
        break;
      case DirectionEnum.RIGHT:
        this.position.x += 1;
        break;
    }
  }
}
