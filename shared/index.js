// Shared utilities index - exports all shared functionality

// Constants
export * from './constants.js'

// Types (for TypeScript projects)
// export * from './types.ts'

// Utilities
export * from './utils.js'

// API layer
export * from './api.js'

// Storage utilities
export * from './storage.js'

// Progress calculation
export * from './progress.js'

// Re-export commonly used items for convenience
export { 
  API_CONFIG, 
  STORAGE_CONFIG, 
  GAME_CONFIG, 
  UI_CONFIG, 
  COLOR_CONFIG,
  ERROR_MESSAGES,
  MILESTONE_CONFIG 
} from './constants.js'

export { 
  calculateProgress,
  calculateClassStats,
  getSemanticColor,
  filterChampions,
  getChampionImageUrl,
  loadWins,
  saveWins,
  loadGridSize,
  saveGridSize,
  checkMilestone,
  setMilestoneFlag,
  debounce,
  formatPercentage,
  generateId,
  validateChampion
} from './utils.js'

export { 
  loadLatestVersion,
  loadChampions,
  loadChampionsWithVersion,
  getChampionImageUrl as getChampionImageUrlFromAPI,
  checkDataDragonAccess,
  getChampionById,
  getChampionsByRole,
  searchChampions
} from './api.js'

export { 
  StorageManager 
} from './storage.js'

export { 
  ProgressCalculator 
} from './progress.js'
