import type { Position, Direction } from '../../core/types';
import { Direction as DirectionEnum } from '../../core/types';

const INITIAL_SNAKE_LENGTH = 3;
const MAX_DIRECTION_QUEUE_SIZE = 2;

export class SnakeEntity {
  private body: Position[];
  private direction: Direction;
  private nextDirection: Direction;
  private directionQueue: Direction[];
  private growing: boolean;
  private readonly gridWidth: number;
  private readonly gridHeight: number;

  constructor(gridWidth: number, gridHeight: number) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.body = this.initializeBody();
    this.direction = DirectionEnum.RIGHT;
    this.nextDirection = DirectionEnum.RIGHT;
    this.directionQueue = [];
    this.growing = false;
  }

  private initializeBody(): Position[] {
    const startX = Math.floor(this.gridWidth / 4);
    const startY = Math.floor(this.gridHeight / 2);
    const body: Position[] = [];

    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      body.push({ x: startX - i, y: startY });
    }

    return body;
  }

  getHead(): Position {
    return this.body[0];
  }

  getBody(): Position[] {
    return [...this.body];
  }

  getDirection(): Direction {
    return this.direction;
  }

  setDirection(newDirection: Direction): void {
    const checkDirection =
      this.directionQueue.length > 0
        ? this.directionQueue[this.directionQueue.length - 1]
        : this.nextDirection;

    if (!this.isValidDirectionChange(newDirection, checkDirection)) {
      return;
    }

    if (this.directionQueue.length === 0) {
      this.nextDirection = newDirection;
    } else if (this.directionQueue.length < MAX_DIRECTION_QUEUE_SIZE) {
      this.directionQueue.push(newDirection);
    }
  }

  private isValidDirectionChange(
    newDirection: Direction,
    currentDirection: Direction
  ): boolean {
    const opposites: Record<Direction, Direction> = {
      [DirectionEnum.UP]: DirectionEnum.DOWN,
      [DirectionEnum.DOWN]: DirectionEnum.UP,
      [DirectionEnum.LEFT]: DirectionEnum.RIGHT,
      [DirectionEnum.RIGHT]: DirectionEnum.LEFT,
    };

    return opposites[currentDirection] !== newDirection;
  }

  move(): void {
    this.direction = this.nextDirection;

    if (this.directionQueue.length > 0) {
      this.nextDirection = this.directionQueue.shift()!;
    }

    const head = this.getHead();
    const newHead = this.calculateNewHead(head);

    this.body.unshift(newHead);

    if (!this.growing) {
      this.body.pop();
    } else {
      this.growing = false;
    }
  }

  private calculateNewHead(currentHead: Position): Position {
    let { x, y } = currentHead;

    switch (this.direction) {
      case DirectionEnum.UP:
        y -= 1;
        break;
      case DirectionEnum.DOWN:
        y += 1;
        break;
      case DirectionEnum.LEFT:
        x -= 1;
        break;
      case DirectionEnum.RIGHT:
        x += 1;
        break;
    }

    x = this.wrapCoordinate(x, this.gridWidth);
    y = this.wrapCoordinate(y, this.gridHeight);

    return { x, y };
  }

  private wrapCoordinate(value: number, max: number): number {
    if (value < 0) return max - 1;
    if (value >= max) return 0;
    return value;
  }

  grow(): void {
    this.growing = true;
  }

  checkSelfCollision(): boolean {
    const head = this.getHead();
    return this.body
      .slice(1)
      .some((segment) => segment.x === head.x && segment.y === head.y);
  }

  reset(): void {
    this.body = this.initializeBody();
    this.direction = DirectionEnum.RIGHT;
    this.nextDirection = DirectionEnum.RIGHT;
    this.directionQueue = [];
    this.growing = false;
  }
}
