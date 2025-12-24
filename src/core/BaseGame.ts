import type { GameState, GameInput } from './types';
import { GameState as GameStateEnum } from './types';
import type { Grid } from './Grid';

/**
 * Abstract base class for all games.
 * Implements Template Method pattern for game loop and state management.
 * Concrete games extend this and implement game-specific logic.
 */
export abstract class BaseGame {
  protected grid: Grid;
  protected state: GameState;
  protected score: number;
  protected lastUpdateTime: number;
  protected animationFrameId: number | null;

  // Callbacks for UI updates
  protected onScoreChange?: (score: number) => void;
  protected onGameOver?: (score: number) => void;
  protected onStateChange?: (state: GameState) => void;

  constructor(grid: Grid) {
    this.grid = grid;
    this.state = GameStateEnum.READY;
    this.score = 0;
    this.lastUpdateTime = 0;
    this.animationFrameId = null;
  }

  // Abstract methods that concrete games must implement
  protected abstract update(deltaTime: number): void;
  protected abstract reset(): void;

  // Template method for game loop
  protected gameLoop = (): void => {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastUpdateTime;

    this.update(deltaTime);
    this.lastUpdateTime = currentTime;

    if (this.state === GameStateEnum.PLAYING) {
      this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }
  };

  // Common lifecycle methods
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

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Input handling - can be overridden by concrete games
  handleInput(_input: GameInput): void {
    // Default implementation does nothing
    // Concrete games override this for specific input handling
  }

  // Protected helper for updating score
  protected updateScore(newScore: number): void {
    this.score = newScore;
    this.onScoreChange?.(this.score);
  }

  // Protected helper for ending game
  protected endGame(): void {
    this.state = GameStateEnum.GAME_OVER;
    this.onStateChange?.(this.state);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.onGameOver?.(this.score);
  }

  // Getters
  getState(): GameState {
    return this.state;
  }

  getScore(): number {
    return this.score;
  }

  getGrid(): Grid {
    return this.grid;
  }

  // Callback setters
  setOnScoreChange(callback: (score: number) => void): void {
    this.onScoreChange = callback;
  }

  setOnGameOver(callback: (score: number) => void): void {
    this.onGameOver = callback;
  }

  setOnStateChange(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }
}
