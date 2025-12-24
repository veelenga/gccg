import type { BaseGame } from './BaseGame';
import type { Position } from './types';

/**
 * Abstract base class for game renderers.
 * Provides common canvas setup and rendering utilities.
 * Concrete renderers extend this and implement game-specific visuals.
 */
export abstract class BaseRenderer {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected game: BaseGame;
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement, game: BaseGame) {
    this.canvas = canvas;
    this.game = game;

    const gridConfig = game.getGrid().config;
    this.canvas.width = gridConfig.width * (gridConfig.cellSize + gridConfig.gap);
    this.canvas.height = gridConfig.height * (gridConfig.cellSize + gridConfig.gap);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    this.ctx = ctx;

    this.setupCanvas();
  }

  private setupCanvas(): void {
    this.ctx.imageSmoothingEnabled = true;
  }

  // Abstract method that concrete renderers must implement
  protected abstract renderGame(): void;

  // Template method for rendering
  render(): void {
    this.clear();
    this.renderGame();
  }

  startRenderLoop(): void {
    const renderLoop = () => {
      this.render();
      this.animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();
  }

  stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Common rendering utilities
  protected clear(): void {
    this.ctx.fillStyle = '#0d1117';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  protected drawCell(pos: Position, color: string, size?: number, gap?: number): void {
    const gridConfig = this.game.getGrid().config;
    const cellSize = size ?? gridConfig.cellSize;
    const cellGap = gap ?? gridConfig.gap;
    const effectiveSize = cellSize + cellGap;

    const x = pos.x * effectiveSize;
    const y = pos.y * effectiveSize;

    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, cellSize, cellSize);
  }

  protected drawCellWithBorder(
    pos: Position,
    fillColor: string,
    borderColor: string,
    borderWidth: number = 2
  ): void {
    const gridConfig = this.game.getGrid().config;
    const effectiveSize = gridConfig.cellSize + gridConfig.gap;

    const x = pos.x * effectiveSize;
    const y = pos.y * effectiveSize;

    // Fill
    this.ctx.fillStyle = fillColor;
    this.ctx.fillRect(x, y, gridConfig.cellSize, gridConfig.cellSize);

    // Border
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = borderWidth;
    this.ctx.strokeRect(x, y, gridConfig.cellSize, gridConfig.cellSize);
  }

  protected positionToKey(pos: Position): string {
    return `${pos.x},${pos.y}`;
  }
}
