import type { BaseGame } from './BaseGame';
import type { Position } from './types';

export abstract class BaseRenderer {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected game: BaseGame;
  protected renderTime: number = 0;
  protected gridConfig: { width: number; height: number; cellSize: number; gap: number };
  protected effectiveSize: number;
  private animationFrameId: number | null = null;
  private hexColorCache: Map<string, { r: number; g: number; b: number }> = new Map();

  constructor(canvas: HTMLCanvasElement, game: BaseGame) {
    this.canvas = canvas;
    this.game = game;

    this.gridConfig = game.getGrid().config;
    this.effectiveSize = this.gridConfig.cellSize + this.gridConfig.gap;
    this.canvas.width = this.gridConfig.width * this.effectiveSize;
    this.canvas.height = this.gridConfig.height * this.effectiveSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    this.ctx = ctx;

    this.setupCanvas();
  }

  private setupCanvas(): void {
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  protected abstract renderGame(): void;

  render(): void {
    this.clear();
    this.renderGame();
  }

  startRenderLoop(): void {
    const renderLoop = (timestamp: number) => {
      this.renderTime = timestamp;
      this.render();
      this.animationFrameId = requestAnimationFrame(renderLoop);
    };
    this.animationFrameId = requestAnimationFrame(renderLoop);
  }

  stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  protected clear(): void {
    this.ctx.fillStyle = '#0d1117';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  protected drawCell(pos: Position, color: string): void {
    const x = pos.x * this.effectiveSize;
    const y = pos.y * this.effectiveSize;
    const size = this.gridConfig.cellSize;
    const radius = Math.min(3, size / 8);

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, size, size, radius);
    this.ctx.fill();
  }

  protected drawCellAtPixel(x: number, y: number, color: string, size?: number): void {
    const cellSize = size ?? this.gridConfig.cellSize;
    const radius = Math.min(3, cellSize / 8);

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, cellSize, cellSize, radius);
    this.ctx.fill();
  }

  protected drawCellWithGlow(pos: Position, color: string, glowColor?: string, glowSize: number = 8): void {
    const x = pos.x * this.effectiveSize;
    const y = pos.y * this.effectiveSize;
    const size = this.gridConfig.cellSize;
    const radius = Math.min(3, size / 8);

    this.ctx.shadowBlur = glowSize;
    this.ctx.shadowColor = glowColor ?? color;
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, size, size, radius);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  protected drawCellWithBorder(
    pos: Position,
    fillColor: string,
    borderColor: string,
    borderWidth: number = 2
  ): void {
    const x = pos.x * this.effectiveSize;
    const y = pos.y * this.effectiveSize;
    const size = this.gridConfig.cellSize;
    const radius = Math.min(3, size / 8);

    this.ctx.fillStyle = fillColor;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, size, size, radius);
    this.ctx.fill();

    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = borderWidth;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, size, size, radius);
    this.ctx.stroke();
  }

  protected getPixelPosition(pos: Position): { x: number; y: number } {
    return {
      x: pos.x * this.effectiveSize,
      y: pos.y * this.effectiveSize,
    };
  }

  protected getCenterPixelPosition(pos: Position): { x: number; y: number } {
    return {
      x: pos.x * this.effectiveSize + this.gridConfig.cellSize / 2,
      y: pos.y * this.effectiveSize + this.gridConfig.cellSize / 2,
    };
  }

  protected positionToKey(pos: Position): string {
    return `${pos.x},${pos.y}`;
  }

  protected hexToRgb(hex: string): { r: number; g: number; b: number } {
    const cached = this.hexColorCache.get(hex);
    if (cached) return cached;

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    const rgb = result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };

    this.hexColorCache.set(hex, rgb);
    return rgb;
  }

  protected darkenColor(color: string, amount: number): string {
    const rgb = this.hexToRgb(color);
    const r = Math.round(rgb.r * (1 - amount));
    const g = Math.round(rgb.g * (1 - amount));
    const b = Math.round(rgb.b * (1 - amount));
    return `rgb(${r}, ${g}, ${b})`;
  }

  protected lightenColor(color: string, amount: number): string {
    const rgb = this.hexToRgb(color);
    const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
    const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
    const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));
    return `rgb(${r}, ${g}, ${b})`;
  }

  protected interpolateColor(color1: string, color2: string, factor: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);

    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);

    return `rgb(${r}, ${g}, ${b})`;
  }
}
