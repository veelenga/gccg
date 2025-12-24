import type { Position, Direction } from './types';
import { Direction as DirectionEnum } from './types';
import { INITIAL_SNAKE_LENGTH, GRID_SIZE, CONTRIBUTION_DAYS } from './constants';

export class Snake {
  private body: Position[];
  private direction: Direction;
  private nextDirection: Direction;
  private directionQueue: Direction[];
  private growing: boolean;
  private readonly MAX_QUEUE_SIZE = 2;

  constructor() {
    this.body = this.initializeBody();
    this.direction = DirectionEnum.RIGHT;
    this.nextDirection = DirectionEnum.RIGHT;
    this.directionQueue = [];
    this.growing = false;
  }

  private initializeBody(): Position[] {
    const startX = Math.floor(GRID_SIZE / 4);
    const startY = Math.floor(CONTRIBUTION_DAYS / 2);
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
    // Determine what direction to check against
    const checkDirection = this.directionQueue.length > 0
      ? this.directionQueue[this.directionQueue.length - 1]
      : this.nextDirection;

    if (!this.isValidDirectionChange(newDirection, checkDirection)) {
      return;
    }

    // If queue is empty, set immediately for instant response
    if (this.directionQueue.length === 0) {
      this.nextDirection = newDirection;
    } else if (this.directionQueue.length < this.MAX_QUEUE_SIZE) {
      // Queue subsequent rapid inputs
      this.directionQueue.push(newDirection);
    }
  }

  private isValidDirectionChange(newDirection: Direction, currentDirection: Direction): boolean {
    const opposites: Record<Direction, Direction> = {
      [DirectionEnum.UP]: DirectionEnum.DOWN,
      [DirectionEnum.DOWN]: DirectionEnum.UP,
      [DirectionEnum.LEFT]: DirectionEnum.RIGHT,
      [DirectionEnum.RIGHT]: DirectionEnum.LEFT,
    };

    return opposites[currentDirection] !== newDirection;
  }

  move(): void {
    // Apply the next direction
    this.direction = this.nextDirection;

    // If there are queued inputs, pull the next one
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

    x = this.wrapCoordinate(x, GRID_SIZE);
    y = this.wrapCoordinate(y, CONTRIBUTION_DAYS);

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
