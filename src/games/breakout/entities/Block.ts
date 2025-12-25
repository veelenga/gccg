import type { Position } from '../../../core/types';
import { SCORE_PER_LEVEL } from '../constants';

export class Block {
  private position: Position;
  private hitsRemaining: number;
  private maxHits: number;
  private destroyed: boolean = false;

  constructor(position: Position, level: number) {
    this.position = { ...position };
    this.maxHits = level;
    this.hitsRemaining = level;
  }

  getPosition(): Position {
    return { ...this.position };
  }

  getLevel(): number {
    return this.hitsRemaining;
  }

  getMaxLevel(): number {
    return this.maxHits;
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }

  hit(): number {
    this.hitsRemaining--;

    if (this.hitsRemaining <= 0) {
      this.destroyed = true;
      return SCORE_PER_LEVEL[this.maxHits] || 10;
    }

    return 0;
  }

  containsPosition(x: number, y: number): boolean {
    return this.position.x === Math.round(x) && this.position.y === Math.round(y);
  }
}
