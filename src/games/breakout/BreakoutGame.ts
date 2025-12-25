import { BaseGame } from '../../core/BaseGame';
import type { Grid } from '../../core/Grid';
import type { GameInput, Direction } from '../../core/types';
import { Direction as DirectionEnum, CellType } from '../../core/types';
import { Paddle } from './entities/Paddle';
import { Ball } from './entities/Ball';
import { Block } from './entities/Block';
import { INITIAL_LIVES, PADDLE_Y, PADDLE_WIDTH, BREAKOUT_GRID_WIDTH } from './constants';

export class BreakoutGame extends BaseGame {
  private paddle: Paddle;
  private ball: Ball;
  private blocks: Block[];
  private lives: number;
  private moveDirection: Direction | null = null;
  private speedMultiplier: number;

  constructor(grid: Grid, blocks: Block[], speedMultiplier: number = 1) {
    super(grid);
    this.speedMultiplier = speedMultiplier;
    this.paddle = new Paddle();
    this.ball = this.createBall();
    this.blocks = blocks;
    this.lives = INITIAL_LIVES;
  }

  private createBall(): Ball {
    const paddleCenter = Math.floor(BREAKOUT_GRID_WIDTH / 2);
    return new Ball(paddleCenter, PADDLE_Y - 1, this.speedMultiplier);
  }

  protected update(deltaTime: number): void {
    this.paddle.setMoveDirection(this.moveDirection);
    this.paddle.update(deltaTime);

    if (!this.ball.isLaunched()) {
      const paddleX = this.paddle.getX();
      const ballX = paddleX + Math.floor(PADDLE_WIDTH / 2);
      this.ball.setPosition(ballX, PADDLE_Y - 1);
      return;
    }

    const ballAlive = this.ball.update(deltaTime);
    if (!ballAlive) {
      this.loseLife();
      return;
    }

    this.checkPaddleCollision();
    this.checkBlockCollisions();

    if (this.blocks.every((b) => b.isDestroyed())) {
      this.endGame();
    }
  }

  private checkPaddleCollision(): void {
    const ballPos = this.ball.getPosition();

    if (ballPos.y === PADDLE_Y - 1 || ballPos.y === PADDLE_Y) {
      if (this.paddle.containsX(ballPos.x)) {
        const relativeHit = this.paddle.getRelativeHitPosition(ballPos.x);
        this.ball.bounceFromPaddle(relativeHit);
      }
    }
  }

  private checkBlockCollisions(): void {
    const ballPos = this.ball.getPosition();

    for (const block of this.blocks) {
      if (block.isDestroyed()) continue;

      const blockPos = block.getPosition();

      if (blockPos.x === ballPos.x && blockPos.y === ballPos.y) {
        const points = block.hit();

        if (points > 0) {
          this.updateScore(this.score + points);
          this.grid.updateCellType(blockPos, CellType.PLAYABLE);
          this.grid.updateCellLevel(blockPos, 0);
        } else {
          this.grid.updateCellLevel(blockPos, block.getLevel());
        }

        this.ball.bounceVertical();
        return;
      }

      const rawPos = this.ball.getRawPosition();
      if (block.containsPosition(rawPos.x, rawPos.y)) {
        const points = block.hit();

        if (points > 0) {
          this.updateScore(this.score + points);
          this.grid.updateCellType(blockPos, CellType.PLAYABLE);
          this.grid.updateCellLevel(blockPos, 0);
        } else {
          this.grid.updateCellLevel(blockPos, block.getLevel());
        }

        const dx = Math.abs(rawPos.x - blockPos.x);
        const dy = Math.abs(rawPos.y - blockPos.y);

        if (dx > dy) {
          this.ball.bounceHorizontal();
        } else {
          this.ball.bounceVertical();
        }

        return;
      }
    }
  }

  private loseLife(): void {
    this.lives--;

    if (this.lives <= 0) {
      this.endGame();
      return;
    }

    this.paddle.reset();
    this.ball = this.createBall();
  }

  protected reset(): void {
    this.paddle.reset();
    this.ball = this.createBall();
    this.lives = INITIAL_LIVES;
    this.updateScore(0);

    for (const block of this.blocks) {
      if (block.isDestroyed()) {
        const pos = block.getPosition();
        this.grid.updateCellType(pos, CellType.OBSTACLE);
        this.grid.updateCellLevel(pos, block.getMaxLevel());
      }
    }

    this.blocks = this.blocks.map((b) => {
      const pos = b.getPosition();
      return new Block(pos, b.getMaxLevel());
    });
  }

  handleInput(input: GameInput): void {
    if (input.type === 'direction' && input.direction) {
      if (input.direction === DirectionEnum.LEFT || input.direction === DirectionEnum.RIGHT) {
        this.moveDirection = input.direction;
      }
    } else if (input.type === 'action' && input.action === 'launch') {
      if (!this.ball.isLaunched()) {
        this.ball.launch();
      }
    } else if (input.type === 'release') {
      this.moveDirection = null;
    }
  }

  getPaddle(): Paddle {
    return this.paddle;
  }

  getBall(): Ball {
    return this.ball;
  }

  getBlocks(): Block[] {
    return this.blocks;
  }

  getLives(): number {
    return this.lives;
  }
}
