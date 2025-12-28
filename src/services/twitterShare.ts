import type { GameType } from '../core/types';

interface ShareData {
  gameType: GameType;
  score: number;
  url?: string;
}

const GAME_NAMES = {
  snake: 'Snake',
  tanks: 'Battle City',
  breakout: 'Breakout',
} as const;

const GAME_EMOJIS = {
  snake: '🐍',
  tanks: '🎯',
  breakout: '🧱',
} as const;

/**
 * Generates shareable text for Twitter based on game and score.
 */
export function generateShareText(data: ShareData): string {
  const emoji = GAME_EMOJIS[data.gameType];
  const gameName = GAME_NAMES[data.gameType];

  return `${emoji} I scored ${data.score} in ${gameName}! Can you beat my score? #GitHubGames #${gameName.replace(/\s/g, '')}`;
}

/**
 * Shares score to Twitter/X using Twitter intent URL.
 */
export function shareToTwitter(data: ShareData): void {
  const text = generateShareText(data);
  const url = data.url || window.location.href;
  openTwitterIntent(text, url);
}

function openTwitterIntent(text: string, url: string): void {
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(twitterUrl, '_blank', 'width=550,height=420');
}
