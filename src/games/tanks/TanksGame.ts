import { BaseGame } from '../../core/BaseGame';
import type { Grid } from '../../core/Grid';
import type { Position, GameInput, Direction } from '../../core/types';
import { Direction as DirectionEnum, CellType } from '../../core/types';
import { Tank } from './entities/Tank';
import { Bullet } from './entities/Bullet';
import {
  PLAYER_TANK_HP,
  ENEMY_TANK_HP,
  TANK_MOVE_SPEED,
  INITIAL_ENEMY_COUNT,
  MAX_ENEMIES_ON_FIELD,
  ENEMY_SPAWN_INTERVAL,
  ENEMY_AI_UPDATE_INTERVAL,
  SCORE_PER_ENEMY,
} from './constants';
import { getPlayerSpawnPosition, getEnemySpawnPositions } from './gridGenerator';

export class TanksGame extends BaseGame {
  private player: Tank;
  private enemies: Tank[] = [];
  private bullets: Bullet[] = [];
  private enemySpawnPositions: Position[];
  private lastEnemySpawnTime: number = 0;
  private lastAIUpdateTime: number = 0;
  private enemiesDestroyed: number = 0;
  private wantToShoot: boolean = false;
  private wantToMove: boolean = false;
  private moveDirection: Direction = DirectionEnum.UP;
  private speedMultiplier: number;

  constructor(grid: Grid, speedMultiplier: number = 1) {
    super(grid);
    this.speedMultiplier = speedMultiplier;

    const playerSpawn = getPlayerSpawnPosition();
    this.player = new Tank({
      position: playerSpawn,
      direction: DirectionEnum.UP,
      hp: PLAYER_TANK_HP,
      isPlayer: true,
      moveSpeed: TANK_MOVE_SPEED * speedMultiplier,
    });

    this.enemySpawnPositions = getEnemySpawnPositions();
  }

  protected update(deltaTime: number): void {
    const currentTime = performance.now();
    this.updatePlayer(deltaTime);
    this.updateBullets(deltaTime);
    this.updateEnemies(deltaTime, currentTime);
    this.spawnEnemies(currentTime);
    this.checkCollisions();

    if (!this.player.isAlive()) {
      this.endGame();
    }
  }

  private updatePlayer(deltaTime: number): void {
    if (!this.player.isAlive()) return;

    if (this.wantToMove && this.player.canMove(deltaTime)) {
      this.player.setDirection(this.moveDirection);
      const nextPos = this.player.getNextPosition();
      if (this.isValidMove(nextPos)) {
        this.player.move();
      }
    }

    if (this.wantToShoot && this.player.canShoot(performance.now())) {
      this.shootBullet(this.player);
      this.wantToShoot = false;
    }
  }

  private updateBullets(deltaTime: number): void {
    for (const bullet of this.bullets) {
      if (bullet.isActive()) {
        bullet.update(deltaTime);
        if (!this.isInBounds(bullet.getPosition())) {
          bullet.deactivate();
        }
      }
    }
    this.bullets = this.bullets.filter((b) => b.isActive());
  }

  private updateEnemies(_deltaTime: number, currentTime: number): void {
    if (currentTime - this.lastAIUpdateTime < ENEMY_AI_UPDATE_INTERVAL) {
      return;
    }
    this.lastAIUpdateTime = currentTime;

    for (const enemy of this.enemies) {
      if (enemy.isAlive()) {
        this.updateEnemyAI(enemy, currentTime);
      }
    }
    this.enemies = this.enemies.filter((e) => e.isAlive());
  }

  private updateEnemyAI(enemy: Tank, currentTime: number): void {
    const playerPos = this.player.getPosition();
    const enemyPos = enemy.getPosition();
    const dx = playerPos.x - enemyPos.x;
    const dy = playerPos.y - enemyPos.y;

    let newDirection: Direction = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? DirectionEnum.RIGHT : DirectionEnum.LEFT)
      : (dy > 0 ? DirectionEnum.DOWN : DirectionEnum.UP);

    if (Math.random() < 0.2) {
      const directions = [DirectionEnum.UP, DirectionEnum.DOWN, DirectionEnum.LEFT, DirectionEnum.RIGHT];
      newDirection = directions[Math.floor(Math.random() * directions.length)];
    }

    enemy.setDirection(newDirection);
    if (this.isValidMoveForEnemy(enemy.getNextPosition(), enemy)) {
      enemy.move();
    }

    if (this.isAlignedWithPlayer(enemy) && enemy.canShoot(currentTime)) {
      if (enemyPos.x === playerPos.x) {
        enemy.setDirection(playerPos.y < enemyPos.y ? DirectionEnum.UP : DirectionEnum.DOWN);
      } else if (enemyPos.y === playerPos.y) {
        enemy.setDirection(playerPos.x < enemyPos.x ? DirectionEnum.LEFT : DirectionEnum.RIGHT);
      }
      this.shootBullet(enemy);
    }
  }

  private isAlignedWithPlayer(enemy: Tank): boolean {
    const playerPos = this.player.getPosition();
    const enemyPos = enemy.getPosition();
    return enemyPos.x === playerPos.x || enemyPos.y === playerPos.y;
  }

  private spawnEnemies(currentTime: number): void {
    if (this.enemies.length >= MAX_ENEMIES_ON_FIELD) return;
    if (currentTime - this.lastEnemySpawnTime < ENEMY_SPAWN_INTERVAL) return;

    if (this.enemies.length === 0 && this.lastEnemySpawnTime === 0) {
      for (let i = 0; i < INITIAL_ENEMY_COUNT; i++) {
        this.spawnEnemy(i % this.enemySpawnPositions.length);
      }
      this.lastEnemySpawnTime = currentTime;
      return;
    }

    this.spawnEnemy(Math.floor(Math.random() * this.enemySpawnPositions.length));
    this.lastEnemySpawnTime = currentTime;
  }

  private spawnEnemy(spawnIndex: number): void {
    const spawnPos = this.enemySpawnPositions[spawnIndex];
    if (!this.isPositionClear(spawnPos)) return;

    this.enemies.push(new Tank({
      position: spawnPos,
      direction: DirectionEnum.DOWN,
      hp: ENEMY_TANK_HP,
      isPlayer: false,
      moveSpeed: TANK_MOVE_SPEED * 1.5 * this.speedMultiplier,
    }));
  }

  private shootBullet(tank: Tank): void {
    const bulletPos = tank.shoot(performance.now());
    const bullet = new Bullet({
      position: bulletPos,
      direction: tank.getDirection(),
      isPlayerBullet: tank.isPlayerTank(),
    });
    this.bullets.push(bullet);
  }

  private checkCollisions(): void {
    this.checkBulletVsBulletCollisions();

    for (const bullet of this.bullets) {
      if (!bullet.isActive()) continue;

      const bulletPos = bullet.getPosition();
      const cell = this.grid.getCellAt(bulletPos);

      if (cell && cell.type === CellType.OBSTACLE) {
        bullet.deactivate();
        const newLevel = cell.level - 1;
        if (newLevel <= 0) {
          this.grid.updateCellType(bulletPos, CellType.PLAYABLE);
          this.grid.updateCellLevel(bulletPos, 0);
        } else {
          this.grid.updateCellLevel(bulletPos, newLevel);
        }
        continue;
      }

      if (bullet.isFromPlayer()) {
        for (const enemy of this.enemies) {
          if (!enemy.isAlive()) continue;
          const enemyPos = enemy.getPosition();
          if (bulletPos.x === enemyPos.x && bulletPos.y === enemyPos.y) {
            enemy.takeDamage(bullet.getDamage());
            bullet.deactivate();
            if (!enemy.isAlive()) {
              this.enemiesDestroyed++;
              this.updateScore(this.score + SCORE_PER_ENEMY);
            }
            break;
          }
        }
      } else {
        const playerPos = this.player.getPosition();
        if (bulletPos.x === playerPos.x && bulletPos.y === playerPos.y) {
          this.player.takeDamage(bullet.getDamage());
          bullet.deactivate();
        }
      }
    }
  }

  private checkBulletVsBulletCollisions(): void {
    for (let i = 0; i < this.bullets.length; i++) {
      const bullet1 = this.bullets[i];
      if (!bullet1.isActive()) continue;

      for (let j = i + 1; j < this.bullets.length; j++) {
        const bullet2 = this.bullets[j];
        if (!bullet2.isActive()) continue;
        if (bullet1.isFromPlayer() === bullet2.isFromPlayer()) continue;

        const pos1 = bullet1.getPosition();
        const pos2 = bullet2.getPosition();
        if (pos1.x === pos2.x && pos1.y === pos2.y) {
          bullet1.deactivate();
          bullet2.deactivate();
        }
      }
    }
  }

  private isValidMove(position: Position): boolean {
    if (!this.isInBounds(position)) return false;
    const cell = this.grid.getCellAt(position);
    if (!cell || cell.type === CellType.OBSTACLE) return false;
    return !this.enemies.some((e) => e.getPosition().x === position.x && e.getPosition().y === position.y);
  }

  private isValidMoveForEnemy(position: Position, movingEnemy: Tank): boolean {
    if (!this.isInBounds(position)) return false;
    const cell = this.grid.getCellAt(position);
    if (!cell || cell.type === CellType.OBSTACLE) return false;

    const playerPos = this.player.getPosition();
    if (position.x === playerPos.x && position.y === playerPos.y) return false;

    return !this.enemies.some((e) => e !== movingEnemy && e.getPosition().x === position.x && e.getPosition().y === position.y);
  }

  private isPositionClear(position: Position): boolean {
    const cell = this.grid.getCellAt(position);
    if (!cell || cell.type === CellType.OBSTACLE) return false;

    const playerPos = this.player.getPosition();
    if (Math.abs(position.x - playerPos.x) < 2 && Math.abs(position.y - playerPos.y) < 2) return false;

    return !this.enemies.some((e) => e.getPosition().x === position.x && e.getPosition().y === position.y);
  }

  private isInBounds(position: Position): boolean {
    return (
      position.x >= 0 &&
      position.x < this.grid.config.width &&
      position.y >= 0 &&
      position.y < this.grid.config.height
    );
  }

  protected reset(): void {
    const playerSpawn = getPlayerSpawnPosition();
    this.player.reset(playerSpawn);
    this.enemies = [];
    this.bullets = [];
    this.enemiesDestroyed = 0;
    this.lastEnemySpawnTime = 0;
    this.lastAIUpdateTime = 0;
    this.wantToShoot = false;
    this.wantToMove = false;
    this.updateScore(0);
  }

  handleInput(input: GameInput): void {
    if (input.type === 'direction' && input.direction) {
      this.wantToMove = true;
      this.moveDirection = input.direction;
    } else if (input.type === 'action' && input.action === 'shoot') {
      this.wantToShoot = true;
    } else if (input.type === 'release') {
      this.wantToMove = false;
    }
  }

  getPlayer(): Tank {
    return this.player;
  }

  getEnemies(): Tank[] {
    return this.enemies;
  }

  getBullets(): Bullet[] {
    return this.bullets;
  }

  getEnemiesDestroyed(): number {
    return this.enemiesDestroyed;
  }
}
