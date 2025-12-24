# GitHub Contributions Snake

A modern, interactive Snake game that uses GitHub contribution graphs as the game board. Collect contribution squares to increase your score!

## Features

- **GitHub Integration**: Fetch real contribution data from any GitHub profile
- **Random Generation**: Generate random contribution patterns if you don't want to use GitHub
- **Large Game Board**: 1924×259px canvas with 32px cells for excellent visibility
- **Smooth Gameplay**: Responsive controls with smooth animations
- **Personal Score Tracking**: Track your top 10 best performances locally
- **Professional Design**: Clean, modern UI with GitHub's color scheme
- **Intuitive Controls**: Arrow keys or WASD for movement, Space to pause
- **Highly Visible Food**: Bright yellow glowing collectibles that are easy to spot

## Game Rules

1. Collect **bright yellow glowing squares** (food) to score points
2. Only 5-8 highlighted squares are collectible at a time - look for the bright glow!
3. Snake can go through walls (wraps around)
4. Game over when the snake hits itself
5. Speed increases as you collect more squares
6. New food spawns automatically, keeping the game going indefinitely

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## How to Play

1. **Setup**: Enter a GitHub username or generate a random contribution graph
2. **Controls**:
   - Arrow keys or WASD to move
   - Space or Escape to pause/resume
3. **Objective**: Collect as many contribution squares as possible without hitting yourself
4. **Scoring**: Each square is worth 10 points

## Tech Stack

- **Framework**: Vite + TypeScript
- **Architecture**: Clean separation of concerns
  - `game/`: Core game logic (Snake, Game loop, Renderer)
  - `services/`: External integrations (GitHub API, localStorage)
  - `ui/`: User interface management
- **Styling**: Pure CSS with CSS variables
- **Build**: TypeScript with strict type checking

## Project Structure

```
ghc-snake/
├── src/
│   ├── game/
│   │   ├── constants.ts      # Game configuration
│   │   ├── types.ts          # TypeScript types
│   │   ├── Snake.ts          # Snake logic
│   │   ├── Game.ts           # Game state & loop
│   │   └── renderer.ts       # Canvas rendering
│   ├── services/
│   │   ├── githubApi.ts      # GitHub API integration
│   │   ├── contributionGenerator.ts  # Random graph generation
│   │   └── scoreStorage.ts   # localStorage management
│   ├── ui/
│   │   └── ui.ts             # UI state management
│   ├── main.ts               # Entry point
│   └── style.css             # Styles
├── index.html
└── package.json
```

## Code Quality

This project follows SOLID principles and clean code practices:
- Single Responsibility: Each class/module has one clear purpose
- Open/Closed: Extensible without modification
- Dependency Inversion: Depends on abstractions, not concretions
- Named constants instead of magic numbers
- Type-safe TypeScript throughout

## Future Enhancements

- Mobile touch controls
- Multiple difficulty levels
- Sound effects
- Online leaderboard
- Custom themes
- Multiplayer mode

## License

MIT

## Author

Built with Claude Code
