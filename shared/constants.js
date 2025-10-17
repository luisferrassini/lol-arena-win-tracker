// Shared constants for LoL Arena Tracker

// API Configuration
export const API_CONFIG = {
  DDRAGON_VERSIONS: 'https://ddragon.leagueoflegends.com/api/versions.json',
  DDRAGON_CDN: (version) => `https://ddragon.leagueoflegends.com/cdn/${version}`,
  DDRAGON_IMG: 'https://ddragon.leagueoflegends.com/cdn/img',
  CHAMPION_DATA_PATH: (version) => `/data/en_US/champion.json`,
  CHAMPION_IMAGE_PATH: (championId) => `/img/champion/${championId}.png`,
  CHAMPION_SPLASH_PATH: (championId) => `/img/champion/splash/${championId}_0.jpg`
}

// Storage Configuration
export const STORAGE_CONFIG = {
  WINS_KEY: 'arenaWinsByChampion',
  MILESTONE_KEY: 'milestone60',
  GRID_SIZE_KEY: 'gridSize'
}

// Game Configuration
export const GAME_CONFIG = {
  ARENA_GOD_TARGET: 60,
  DEFAULT_VERSION: '14.21.1',
  CHAMPION_ROLES: ['Fighter', 'Tank', 'Mage', 'Assassin', 'Marksman', 'Support'],
  GRID_SIZES: {
    SMALL: 'small',
    MEDIUM: 'medium'
  }
}

// UI Configuration
export const UI_CONFIG = {
  LOADING_DELAY: 100,
  ANIMATION_DURATION: 800,
  PROGRESS_BAR_DURATION: 1500,
  MILESTONE_ANIMATION_DURATION: 300
}

// Color Configuration
export const COLOR_CONFIG = {
  SEMANTIC_COLORS: {
    RED: '#ff6b6b',
    YELLOW: '#ffd93d', 
    GREEN: '#6bcf7f'
  },
  CLASS_COLORS: {
    'Fighter': '#ff6b6b',
    'Tank': '#4ecdc4',
    'Mage': '#45b7d1',
    'Assassin': '#96ceb4',
    'Marksman': '#feca57',
    'Support': '#ff9ff3'
  }
}

// Error Messages
export const ERROR_MESSAGES = {
  CHAMPIONS_LOAD_FAILED: 'Failed to load champions',
  NETWORK_ERROR: 'Please check your internet connection and try again.',
  PROGRESS_BAR_ERROR: 'ProgressBar.js not loaded',
  CHART_ERROR: 'Chart.js not loaded'
}

// Milestone Configuration
export const MILESTONE_CONFIG = {
  TARGET: 60,
  MESSAGE: 'You are an Arena God!',
  CELEBRATION_DURATION: 2000
}
