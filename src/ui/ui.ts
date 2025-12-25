import type { BaseGame } from '../core/BaseGame';
import type { BaseRenderer } from '../core/BaseRenderer';
import type { Direction, GameState, GameType } from '../core/types';
import { Direction as DirectionEnum, GameType as GameTypeEnum } from '../core/types';
import { SnakeGame } from '../games/snake/SnakeGame';
import { SnakeRenderer } from '../games/snake/SnakeRenderer';
import { generateSnakeGrid } from '../games/snake/gridGenerator';
import { TanksGame } from '../games/tanks/TanksGame';
import { TanksRenderer } from '../games/tanks/TanksRenderer';
import { generateTanksGrid } from '../games/tanks/gridGenerator';
import { BreakoutGame } from '../games/breakout/BreakoutGame';
import { BreakoutRenderer } from '../games/breakout/BreakoutRenderer';
import { generateBreakoutGrid } from '../games/breakout/gridGenerator';
import { saveScore, getHighestScore } from '../services/scoreStorage';
import { shareToTwitter } from '../services/twitterShare';
import { INITIAL_SPEED } from '../games/snake/constants';

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
} as const;

type ModalType = (typeof ModalType)[keyof typeof ModalType];

const MOBILE_BREAKPOINT = 932;
const MIN_SWIPE_DISTANCE = 30;
const MOBILE_SPEED_MULTIPLIER = 1.5;

export class UI {
  private currentScreen: Screen;
  private game: BaseGame | null;
  private renderer: BaseRenderer | null;
  private currentGameType: GameType;
  private currentUsername: string;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private currentModal: ModalType | null = null;
  private modalFocusIndex: number = 0;
  private menuFocusIndex: number = 0;
  private isMobile: boolean = false;

  constructor() {
    this.currentScreen = Screen.MENU;
    this.game = null;
    this.renderer = null;
    this.currentGameType = GameTypeEnum.SNAKE;
    this.currentUsername = 'Player';
    this.isMobile = this.detectMobile();
    this.initializeEventListeners();
    this.initializeRouter();
    this.setupResizeHandler();
  }

  private detectMobile(): boolean {
    return window.innerWidth <= MOBILE_BREAKPOINT || 'ontouchstart' in window;
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.isMobile = this.detectMobile();
      this.updateTouchControlsVisibility();
    });
  }

  private initializeRouter(): void {
    this.handleRoute();
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
    this.menuFocusIndex = 0;
    this.updateMenuFocus();
    this.updateTouchControlsVisibility();
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
    this.initializeGameCardListeners();
    this.initializeKeyboardListeners();
    this.initializeCanvasTouchListeners();
    this.initializeModalListeners();
    this.initializeTouchControls();
  }

  private initializeGameCardListeners(): void {
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach((card) => {
      card.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (!target.classList.contains('btn-play')) {
          const gameType = card.getAttribute('data-game') as GameType;
          this.navigate(`/${gameType}` as Route);
        }
      });

      const playButton = card.querySelector('.btn-play');
      if (playButton) {
        playButton.addEventListener('click', (e) => {
          e.stopPropagation();
          const gameType = card.getAttribute('data-game') as GameType;
          this.navigate(`/${gameType}` as Route);
        });
      }
    });
  }

  private initializeKeyboardListeners(): void {
    document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    document.addEventListener('keyup', (e) => this.handleKeyRelease(e));
  }

  private initializeCanvasTouchListeners(): void {
    const canvas = this.getElement<HTMLCanvasElement>('gameCanvas');
    canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }

  private initializeModalListeners(): void {
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

  private initializeTouchControls(): void {
    const dpadButtons = document.querySelectorAll('.dpad-btn[data-direction]');
    dpadButtons.forEach((btn) => {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const direction = (btn as HTMLElement).dataset.direction as Direction;
        if (direction && this.game) {
          this.game.handleInput({ type: 'direction', direction });
        }
      });
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (this.game && this.currentGameType !== GameTypeEnum.SNAKE) {
          this.game.handleInput({ type: 'release' });
        }
      });
    });

    const pauseBtn = document.querySelector('.action-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (this.currentModal === ModalType.PAUSE) {
          this.hideModal();
          this.game?.resume();
        } else if (!this.currentModal && this.game) {
          this.game.togglePause();
        }
      });
    }

    const fireBtn = document.querySelector('.action-fire');
    if (fireBtn) {
      fireBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!this.game || this.currentModal) return;

        if (this.currentGameType === GameTypeEnum.TANKS) {
          this.game.handleInput({ type: 'action', action: 'shoot' });
        } else if (this.currentGameType === GameTypeEnum.BREAKOUT) {
          this.game.handleInput({ type: 'action', action: 'launch' });
        }
      });
    }
  }

  private updateTouchControlsVisibility(): void {
    const touchControls = document.getElementById('touchControls');
    if (!touchControls) return;

    const shouldShow = this.isMobile && this.currentScreen === Screen.GAME;
    touchControls.classList.toggle('active', shouldShow);
    touchControls.classList.toggle('hidden', !shouldShow);

    this.updateFireButtonVisibility();
  }

  private updateFireButtonVisibility(): void {
    const fireBtn = document.querySelector('.action-fire') as HTMLElement;
    if (!fireBtn) return;

    const showFire = this.currentGameType === GameTypeEnum.TANKS ||
                     this.currentGameType === GameTypeEnum.BREAKOUT;
    fireBtn.style.display = showFire ? 'flex' : 'none';
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

  private showModal(type: ModalType, content: string): void {
    const modal = this.getElement('gameModal');
    const contentEl = modal.querySelector('.modal-content');

    if (contentEl) {
      contentEl.innerHTML = content;
    }

    modal.classList.remove('hidden');
    this.currentModal = type;
    this.modalFocusIndex = 0;

    this.attachModalEventListeners();
    this.updateModalFocus();
  }

  private hideModal(): void {
    const modal = this.getElement('gameModal');
    modal.classList.add('hidden');
    this.currentModal = null;
    this.modalFocusIndex = 0;
  }

  private getModalButtons(): HTMLButtonElement[] {
    const modal = this.getElement('gameModal');
    return Array.from(modal.querySelectorAll('.modal-actions .btn')) as HTMLButtonElement[];
  }

  private updateModalFocus(): void {
    const buttons = this.getModalButtons();
    buttons.forEach((btn, index) => {
      btn.classList.toggle('btn-focused', index === this.modalFocusIndex);
    });
  }

  private handleModalNavigation(direction: 'left' | 'right'): void {
    const buttons = this.getModalButtons();
    if (buttons.length === 0) return;

    if (direction === 'left') {
      this.modalFocusIndex = (this.modalFocusIndex - 1 + buttons.length) % buttons.length;
    } else {
      this.modalFocusIndex = (this.modalFocusIndex + 1) % buttons.length;
    }
    this.updateModalFocus();
  }

  private activateFocusedModalButton(): void {
    const buttons = this.getModalButtons();
    if (buttons[this.modalFocusIndex]) {
      buttons[this.modalFocusIndex].click();
    }
  }

  private getGameCards(): HTMLElement[] {
    return Array.from(document.querySelectorAll('.game-card')) as HTMLElement[];
  }

  private updateMenuFocus(): void {
    const cards = this.getGameCards();
    cards.forEach((card, index) => {
      card.classList.toggle('game-card-focused', index === this.menuFocusIndex);
    });
  }

  private handleMenuNavigation(direction: 'left' | 'right'): void {
    const cards = this.getGameCards();
    if (cards.length === 0) return;

    if (direction === 'left') {
      this.menuFocusIndex = (this.menuFocusIndex - 1 + cards.length) % cards.length;
    } else {
      this.menuFocusIndex = (this.menuFocusIndex + 1) % cards.length;
    }
    this.updateMenuFocus();
  }

  private activateFocusedGameCard(): void {
    const cards = this.getGameCards();
    const card = cards[this.menuFocusIndex];
    if (card) {
      const gameType = card.getAttribute('data-game') as GameType;
      this.navigate(`/${gameType}` as Route);
    }
  }

  private attachModalEventListeners(): void {
    const restartBtn = document.getElementById('modalRestartBtn');
    if (restartBtn) {
      restartBtn.onclick = () => this.handleRestart();
    }

    const shareBtn = document.getElementById('modalShareBtn');
    if (shareBtn) {
      shareBtn.onclick = () => this.handleShare();
    }

    const menuBtn = document.getElementById('modalMenuBtn');
    if (menuBtn) {
      menuBtn.onclick = () => this.handleBackToMenu();
    }

    const resumeBtn = document.getElementById('modalResumeBtn');
    if (resumeBtn) {
      resumeBtn.onclick = () => {
        this.hideModal();
        this.game?.resume();
      };
    }

    const closeBtn = document.getElementById('modalCloseBtn');
    if (closeBtn) {
      closeBtn.onclick = () => this.hideModal();
    }
  }

  private showPauseModal(): void {
    const content = `
      <span class="modal-icon">⏸️</span>
      <div class="modal-body">
        <h2 class="modal-title modal-title--info">Paused</h2>
        <p class="modal-message">Tap Resume to continue</p>
        <div class="modal-actions">
          <button id="modalResumeBtn" class="btn btn-primary">Resume</button>
          <button id="modalMenuBtn" class="btn btn-tertiary">Menu</button>
        </div>
      </div>
    `;
    this.showModal(ModalType.PAUSE, content);
  }

  private showGameOverModal(score: number): void {
    const content = `
      <span class="modal-icon">💀</span>
      <div class="modal-body">
        <h2 class="modal-title modal-title--error">Game Over!</h2>
        <div class="modal-score">${score}</div>
        <div class="modal-actions">
          <button id="modalRestartBtn" class="btn btn-primary">Play Again</button>
          <button id="modalShareBtn" class="btn btn-secondary">Share</button>
          <button id="modalMenuBtn" class="btn btn-tertiary">Menu</button>
        </div>
      </div>
    `;
    this.showModal(ModalType.GAME_OVER, content);
  }

  private startSnakeGame(): void {
    const grid = generateSnakeGrid();
    const speedMultiplier = this.isMobile ? MOBILE_SPEED_MULTIPLIER : 1;
    const game = new SnakeGame(grid, speedMultiplier);
    const canvas = this.getElement<HTMLCanvasElement>('gameCanvas');
    const renderer = new SnakeRenderer(canvas, game);
    this.startGame(game, renderer);
  }

  private startTanksGame(): void {
    const grid = generateTanksGrid();
    const speedMultiplier = this.isMobile ? MOBILE_SPEED_MULTIPLIER : 1;
    const game = new TanksGame(grid, speedMultiplier);
    const canvas = this.getElement<HTMLCanvasElement>('gameCanvas');
    const renderer = new TanksRenderer(canvas, game);
    this.startGame(game, renderer);
  }

  private startBreakoutGame(): void {
    const { grid, blocks } = generateBreakoutGrid();
    const speedMultiplier = this.isMobile ? MOBILE_SPEED_MULTIPLIER : 1;
    const game = new BreakoutGame(grid, blocks, speedMultiplier);
    const canvas = this.getElement<HTMLCanvasElement>('gameCanvas');
    const renderer = new BreakoutRenderer(canvas, game);
    this.startGame(game, renderer);
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
    this.updateTouchControlsVisibility();

    this.game.start();
  }

  private setupGameCallbacks(): void {
    if (!this.game) return;

    this.game.setOnScoreChange((score) => this.updateScore(score));
    this.game.setOnGameOver((score) => this.handleGameOver(score));
    this.game.setOnStateChange((state) => this.handleStateChange(state));
  }

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

  private handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.currentModal === ModalType.PAUSE) {
        this.hideModal();
        this.game?.resume();
        return;
      }
      if (this.currentScreen === Screen.GAME && this.game && !this.currentModal) {
        this.game.togglePause();
        return;
      }
      return;
    }

    if (this.currentModal) {
      event.preventDefault();
      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        this.handleModalNavigation('left');
      } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        this.handleModalNavigation('right');
      } else if (event.key === 'Enter' || event.key === ' ') {
        this.activateFocusedModalButton();
      }
      return;
    }

    if (this.currentScreen === Screen.MENU) {
      if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
        event.preventDefault();
        this.handleMenuNavigation('left');
      } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
        event.preventDefault();
        this.handleMenuNavigation('right');
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.activateFocusedGameCard();
      }
      return;
    }

    if (this.currentScreen !== Screen.GAME || !this.game) {
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
      if (this.currentGameType === GameTypeEnum.TANKS) {
        this.game.handleInput({ type: 'action', action: 'shoot' });
      } else if (this.currentGameType === GameTypeEnum.BREAKOUT) {
        this.game.handleInput({ type: 'action', action: 'launch' });
      }
    }
  }

  private handleKeyRelease(event: KeyboardEvent): void {
    if (this.currentScreen !== Screen.GAME || !this.game) {
      return;
    }

    if (this.currentGameType === GameTypeEnum.BREAKOUT) {
      const releaseKeys = ['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'];
      if (releaseKeys.includes(event.key)) {
        this.game.handleInput({ type: 'release' });
      }
      return;
    }

    if (this.currentGameType === GameTypeEnum.TANKS) {
      const releaseKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'];
      if (releaseKeys.includes(event.key)) {
        this.game.handleInput({ type: 'release' });
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

    if (absDeltaX < MIN_SWIPE_DISTANCE && absDeltaY < MIN_SWIPE_DISTANCE) {
      if (this.currentModal === ModalType.PAUSE) {
        this.hideModal();
        this.game.resume();
      } else if (!this.currentModal) {
        this.game.togglePause();
      }
      return;
    }

    if (this.currentModal) {
      return;
    }

    const direction: Direction = absDeltaX > absDeltaY
      ? (deltaX > 0 ? DirectionEnum.RIGHT : DirectionEnum.LEFT)
      : (deltaY > 0 ? DirectionEnum.DOWN : DirectionEnum.UP);

    this.game.handleInput({ type: 'direction', direction });
  }
}
