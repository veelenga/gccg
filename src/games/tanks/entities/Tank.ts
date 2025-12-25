import type { Position, Direction } from '../../../core/types';
import { Direction as DirectionEnum } from '../../../core/types';
import { TANK_SHOOT_COOLDOWN } from '../constants';

export interface TankConfig {
  position: Position;
  direction: Direction;
  hp: number;
  isPlayer: boolean;
  moveSpeed: number;
}

export class Tank {
  private position: Position;
  private direction: Direction;
  private hp: number;
  private maxHp: number;
  private isPlayer: boolean;
  private moveSpeed: number;
  private lastShootTime: number = 0;
  private moveAccumulator: number = 0;

  constructor(config: TankConfig) {
    this.position = { ...config.position };
    this.direction = config.direction;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.isPlayer = config.isPlayer;
    this.moveSpeed = config.moveSpeed;
  }

  getPosition(): Position {
    return { ...this.position };
  }

  getDirection(): Direction {
    return this.direction;
  }

  getHp(): number {
    return this.hp;
  }

  getMaxHp(): number {
    return this.maxHp;
  }

  isPlayerTank(): boolean {
    return this.isPlayer;
  }

  isAlive(): boolean {
    return this.hp > 0;
  }

  setDirection(direction: Direction): void {
    this.direction = direction;
  }

  setPosition(position: Position): void {
    this.position = { ...position };
  }

  canMove(deltaTime: number): boolean {
    this.moveAccumulator += deltaTime;
    if (this.moveAccumulator >= this.moveSpeed) {
      this.moveAccumulator -= this.moveSpeed;
      return true;
    }
    return false;
  }

  getNextPosition(): Position {
    const next = { ...this.position };

    switch (this.direction) {
      case DirectionEnum.UP:
        next.y -= 1;
        break;
      case DirectionEnum.DOWN:
        next.y += 1;
        break;
      case DirectionEnum.LEFT:
        next.x -= 1;
        break;
      case DirectionEnum.RIGHT:
        next.x += 1;
        break;
    }

    return next;
  }

  move(): void {
    this.position = this.getNextPosition();
  }

  canShoot(currentTime: number): boolean {
    return currentTime - this.lastShootTime >= TANK_SHOOT_COOLDOWN;
  }

  shoot(currentTime: number): Position {
    this.lastShootTime = currentTime;
    return this.getNextPosition();
  }

  takeDamage(damage: number): void {
    this.hp = Math.max(0, this.hp - damage);
  }

  reset(position: Position): void {
    this.position = { ...position };
    this.direction = DirectionEnum.UP;
    this.hp = this.maxHp;
    this.lastShootTime = 0;
    this.moveAccumulator = 0;
  }
}
