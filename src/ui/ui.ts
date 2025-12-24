import type { BaseGame } from '../core/BaseGame';
import type { BaseRenderer } from '../core/BaseRenderer';
import type { Direction, GameState, GameType } from '../core/types';
import { Direction as DirectionEnum, GameType as GameTypeEnum } from '../core/types';
import { SnakeGame } from '../games/snake/SnakeGame';
import { SnakeRenderer } from '../games/snake/SnakeRenderer';
import { generateSnakeGrid } from '../games/snake/gridGenerator';
import { saveScore, getHighScores, getHighestScore } from '../services/scoreStorage';
import { shareToTwitter } from '../services/twitterShare';
import { INITIAL_SPEED } from '../games/snake/constants';

// Route definitions
const Route = {
  MENU: '/',
  SNAKE: '/snake',
  TANKS: '/tanks',
  BREAKOUT: '/breakout',
} as const;

type Route = (typeof Route)[keyof typeof Route];

const Screen = {
  MENU: 'menuScreen',
  GAME: 'gameScreen',
} as const;

type Screen = (typeof Screen)[keyof typeof Screen];

const ModalType = {
  PAUSE: 'pause',
  GAME_OVER: 'gameOver',
  SCOREBOARD: 'scoreboard',
} as const;

type ModalType = (typeof ModalType)[keyof typeof ModalType];

export class UI {
  private currentScreen: Screen;
  private game: BaseGame | null;
  private renderer: BaseRenderer | null;
  private currentGameType: GameType;
  private currentUsername: string;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private currentModal: ModalType | null = null;
  private readonly MIN_SWIPE_DISTANCE = 30;

  constructor() {
    this.currentScreen = Screen.MENU;
    this.game = null;
    this.renderer = null;
    this.currentGameType = GameTypeEnum.SNAKE;
    this.currentUsername = 'Player';
    this.initializeEventListeners();
    this.initializeRouter();
  }

  // ============================================
  // ROUTING
  // ============================================

  private initializeRouter(): void {
    // Handle initial route
    this.handleRoute();

    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  private handleRoute(): void {
    const hash = window.location.hash.slice(1) || Route.MENU;

    switch (hash) {
      case Route.SNAKE:
        this.navigateToGame(GameTypeEnum.SNAKE);
        break;
      case Route.TANKS:
        this.navigateToGame(GameTypeEnum.TANKS);
        break;
      case Route.BREAKOUT:
        this.navigateToGame(GameTypeEnum.BREAKOUT);
        break;
      case Route.MENU:
      default:
        this.navigateToMenu();
        break;
    }
  }

  private navigateToMenu(): void {
    if (this.game) {
      this.game.destroy();
      this.game = null;
    }
    if (this.renderer) {
      this.renderer.stopRenderLoop();
      this.renderer = null;
    }
    this.hideModal();
    this.showScreen(Screen.MENU);
  }

  private navigateToGame(gameType: GameType): void {
    this.currentGameType = gameType;

    if (gameType === GameTypeEnum.SNAKE) {
      this.startSnakeGame();
    } else if (gameType === GameTypeEnum.TANKS) {
      this.startTanksGame();
    } else if (gameType === GameTypeEnum.BREAKOUT) {
      this.startBreakoutGame();
    }
  }

  private navigate(route: Route): void {
    window.location.hash = route;
  }

  private initializeEventListeners(): void {
    // Game selection - find all game cards (use routing)
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach((card) => {
      const playButton = card.querySelector('.btn-play');
      if (playButton) {
        playButton.addEventListener('click', () => {
          const gameType = card.getAttribute('data-game') as GameType;
          this.navigate(`/${gameType}` as Route);
        });
      }
    });

    // Header scoreboard button
    this.getElement('showScoresButton').addEventListener('click', () => this.showScoreboardModal());

    // Keyboard input
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));

    // Touch/swipe controls for mobile
    const canvas = this.getElement<HTMLCanvasElement>('gameCanvas');
    canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    // Modal backdrop click to close (for pause only)
    const modalBackdrop = document.querySelector('.modal-backdrop');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', () => {
        if (this.currentModal === ModalType.PAUSE) {
          this.hideModal();
          this.game?.resume();
        }
      });
    }
  }

  private getElement<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element with id "${id}" not found`);
    }
    return element as T;
  }

  private showScreen(screen: Screen): void {
    Object.values(Screen).forEach((s) => {
      const element = document.getElementById(s);
      if (element) {
        element.classList.toggle('active', s === screen);
      }
    });
    this.currentScreen = screen;
  }

  // ============================================
  // MODAL SYSTEM
  // ============================================

  private showModal(type: ModalType, content: string, wide: boolean = false): void {
    const modal = this.getElement('gameModal');
    const container = modal.querySelector('.modal-container');
    const contentEl = modal.querySelector('.modal-content');

    if (container && contentEl) {
      container.classList.toggle('modal-container--wide', wide);
      contentEl.innerHTML = content;
    }

    modal.classList.remove('hidden');
    this.currentModal = type;

    // Attach event listeners for modal buttons
    this.attachModalEventListeners();
  }

  private hideModal(): void {
    const modal = this.getElement('gameModal');
    modal.classList.add('hidden');
    this.currentModal = null;
  }

  private attachModalEventListeners(): void {
    // Restart button
    const restartBtn = document.getElementById('modalRestartBtn');
    if (restartBtn) {
      restartBtn.onclick = () => this.handleRestart();
    }

    // Share button
    const shareBtn = document.getElementById('modalShareBtn');
    if (shareBtn) {
      shareBtn.onclick = () => this.handleShare();
    }

    // Menu button
    const menuBtn = document.getElementById('modalMenuBtn');
    if (menuBtn) {
      menuBtn.onclick = () => this.handleBackToMenu();
    }

    // Resume button (for pause modal)
    const resumeBtn = document.getElementById('modalResumeBtn');
    if (resumeBtn) {
      resumeBtn.onclick = () => {
        this.hideModal();
        this.game?.resume();
      };
    }

    // Close button (for scoreboard)
    const closeBtn = document.getElementById('modalCloseBtn');
    if (closeBtn) {
      closeBtn.onclick = () => this.hideModal();
    }
  }

  private showPauseModal(): void {
    const content = `
      <span class="modal-icon">⏸️</span>
      <h2 class="modal-title modal-title--info">Paused</h2>
      <p class="modal-message">Press Space or tap to resume</p>
      <div class="modal-actions">
        <button id="modalResumeBtn" class="btn btn-primary">Resume</button>
        <button id="modalMenuBtn" class="btn btn-tertiary">Menu</button>
      </div>
    `;
    this.showModal(ModalType.PAUSE, content);
  }

  private showGameOverModal(score: number): void {
    const content = `
      <span class="modal-icon">💀</span>
      <h2 class="modal-title modal-title--error">Game Over!</h2>
      <p class="modal-message">Your Final Score</p>
      <div class="modal-score">${score}</div>
      <div class="modal-actions">
        <button id="modalRestartBtn" class="btn btn-primary">Play Again</button>
        <button id="modalShareBtn" class="btn btn-secondary">Share on 𝕏</button>
        <button id="modalMenuBtn" class="btn btn-tertiary">Menu</button>
      </div>
    `;
    this.showModal(ModalType.GAME_OVER, content);
  }

  private showScoreboardModal(): void {
    const scores = getHighScores(this.currentGameType);

    let scoreListHtml: string;
    if (scores.length === 0) {
      scoreListHtml = '<div class="empty-state">No scores yet. Play your first game!</div>';
    } else {
      scoreListHtml = `
        <div class="score-list">
          ${scores.map((entry, index) => `
            <div class="score-item">
              <span class="rank">#${index + 1}</span>
              <div class="details">
                <span class="score">${entry.score}</span>
                <span class="date">${entry.date}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    const content = `
      <span class="modal-icon">🏆</span>
      <h2 class="modal-title modal-title--info">Best Scores</h2>
      <p class="modal-message">Your top 10 performances</p>
      ${scoreListHtml}
      <div class="modal-actions">
        <button id="modalCloseBtn" class="btn btn-tertiary">Close</button>
      </div>
    `;
    this.showModal(ModalType.SCOREBOARD, content, true);
  }

  // ============================================
  // GAME START METHODS
  // ============================================

  private startSnakeGame(): void {
    const grid = generateSnakeGrid();
    const game = new SnakeGame(grid);
    const canvas = this.getElement<HTMLCanvasElement>('gameCanvas');
    const renderer = new SnakeRenderer(canvas, game);
    this.startGame(game, renderer);
  }

  private startTanksGame(): void {
    // TODO: Implement Tanks game
    alert('Tanks game coming soon!');
    this.navigate(Route.MENU);
  }

  private startBreakoutGame(): void {
    // TODO: Implement Breakout game
    alert('Breakout game coming soon!');
    this.navigate(Route.MENU);
  }

  private startGame(game: BaseGame, renderer: BaseRenderer): void {
    if (this.game) {
      this.game.destroy();
    }

    this.game = game;
    this.renderer = renderer;

    this.setupGameCallbacks();
    this.renderer.startRenderLoop();

    this.updateScore(0);
    this.updateHighScore();
    this.updateSpeed(INITIAL_SPEED);
    this.showScreen(Screen.GAME);
    this.hideModal();

    this.game.start();
  }

  private setupGameCallbacks(): void {
    if (!this.game) return;

    this.game.setOnScoreChange((score) => this.updateScore(score));
    this.game.setOnGameOver((score) => this.handleGameOver(score));
    this.game.setOnStateChange((state) => this.handleStateChange(state));
  }

  // ============================================
  // SCORE & SPEED DISPLAY
  // ============================================

  private updateScore(score: number): void {
    this.getElement('currentScore').textContent = score.toString();
  }

  private updateHighScore(): void {
    const highScore = getHighestScore(this.currentGameType);
    this.getElement('highScore').textContent = highScore.toString();
  }

  private updateSpeed(speed: number): void {
    const speedMultiplier = (INITIAL_SPEED / speed).toFixed(1);
    this.getElement('speedValue').textContent = `${speedMultiplier}x`;
  }

  // ============================================
  // GAME EVENT HANDLERS
  // ============================================

  private handleGameOver(score: number): void {
    saveScore(score, this.currentUsername, this.currentGameType);
    this.updateHighScore();
    this.showGameOverModal(score);
  }

  private handleStateChange(state: GameState): void {
    if (state === 'PAUSED') {
      this.showPauseModal();
    } else if (state === 'PLAYING' && this.currentModal === ModalType.PAUSE) {
      this.hideModal();
    }
  }

  private handleRestart(): void {
    if (this.game) {
      this.hideModal();
      this.game.start();
    }
  }

  private handleBackToMenu(): void {
    this.navigate(Route.MENU);
  }

  private handleShare(): void {
    if (!this.game) return;

    const score = this.game.getScore();
    shareToTwitter({
      gameType: this.currentGameType,
      score,
      url: window.location.href,
    });
  }

  // ============================================
  // INPUT HANDLING
  // ============================================

  private handleKeyPress(event: KeyboardEvent): void {
    // Handle modal close on Escape
    if (event.key === 'Escape' && this.currentModal) {
      if (this.currentModal === ModalType.PAUSE) {
        this.hideModal();
        this.game?.resume();
      } else if (this.currentModal === ModalType.SCOREBOARD) {
        this.hideModal();
      }
      return;
    }

    if (this.currentScreen !== Screen.GAME || !this.game) {
      return;
    }

    // Don't process game input if modal is open (except for resume)
    if (this.currentModal && this.currentModal !== ModalType.PAUSE) {
      return;
    }

    const keyMap: Record<string, Direction> = {
      ArrowUp: DirectionEnum.UP,
      ArrowDown: DirectionEnum.DOWN,
      ArrowLeft: DirectionEnum.LEFT,
      ArrowRight: DirectionEnum.RIGHT,
      w: DirectionEnum.UP,
      W: DirectionEnum.UP,
      s: DirectionEnum.DOWN,
      S: DirectionEnum.DOWN,
      a: DirectionEnum.LEFT,
      A: DirectionEnum.LEFT,
      d: DirectionEnum.RIGHT,
      D: DirectionEnum.RIGHT,
    };

    const direction = keyMap[event.key];
    if (direction) {
      event.preventDefault();
      this.game.handleInput({ type: 'direction', direction });
    }

    if (event.key === ' ') {
      event.preventDefault();
      if (this.currentModal === ModalType.PAUSE) {
        this.hideModal();
        this.game.resume();
      } else {
        this.game.togglePause();
      }
    }
  }

  private handleTouchStart(event: TouchEvent): void {
    if (this.currentScreen !== Screen.GAME || !this.game) {
      return;
    }

    event.preventDefault();
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (this.currentScreen !== Screen.GAME || !this.game) {
      return;
    }

    event.preventDefault();
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Check if swipe is long enough
    if (absDeltaX < this.MIN_SWIPE_DISTANCE && absDeltaY < this.MIN_SWIPE_DISTANCE) {
      // Tap - toggle pause or resume
      if (this.currentModal === ModalType.PAUSE) {
        this.hideModal();
        this.game.resume();
      } else if (!this.currentModal) {
        this.game.togglePause();
      }
      return;
    }

    // Don't process swipes if modal is open
    if (this.currentModal) {
      return;
    }

    // Determine swipe direction
    let direction: Direction;
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      direction = deltaX > 0 ? DirectionEnum.RIGHT : DirectionEnum.LEFT;
    } else {
      // Vertical swipe
      direction = deltaY > 0 ? DirectionEnum.DOWN : DirectionEnum.UP;
    }

    this.game.handleInput({ type: 'direction', direction });
  }
}
