// Shared utility functions for LoL Arena Tracker

import { API_CONFIG, GAME_CONFIG, STORAGE_CONFIG, COLOR_CONFIG } from './constants.js'

/**
 * Calculate progress statistics
 * @param {number} completed - Number of completed items
 * @param {number} total - Total number of items
 * @param {number} target - Target milestone (default: 60)
 * @returns {Object} Progress statistics
 */
export function calculateProgress(completed, total, target = GAME_CONFIG.ARENA_GOD_TARGET) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const targetPercentage = Math.round((completed / target) * 100)
  const remaining = Math.max(0, target - completed)
  const isTargetReached = completed >= target

  return {
    completed,
    total,
    percentage,
    targetPercentage,
    remaining,
    isTargetReached
  }
}

/**
 * Calculate class-specific statistics
 * @param {Array} champions - Array of champion objects
 * @param {Object} wins - Win data object
 * @returns {Object} Class statistics
 */
export function calculateClassStats(champions, wins) {
  const classStats = {}
  const totalWins = Object.values(wins).filter(Boolean).length

  GAME_CONFIG.CHAMPION_ROLES.forEach(className => {
    const classChampions = champions.filter(champ => 
      champ.roles && champ.roles.includes(className)
    )
    const classWins = classChampions.filter(champ => wins[champ.id]).length
    const winsPercentage = totalWins > 0 ? Math.round((classWins / totalWins) * 100) : 0

    classStats[className] = {
      wins: classWins,
      percentage: winsPercentage
    }
  })

  return classStats
}

/**
 * Get semantic color based on percentage
 * @param {number} percentage - Percentage value (0-100)
 * @returns {string} RGB color string
 */
export function getSemanticColor(percentage) {
  let red, green, blue

  if (percentage <= 50) {
    // Red to Yellow transition (0% to 50%)
    const factor = percentage / 50
    red = 255
    green = Math.round(107 + (148 * factor)) // 107 to 255
    blue = Math.round(107 + (61 * factor)) // 107 to 168
  } else {
    // Yellow to Green transition (50% to 100%)
    const factor = (percentage - 50) / 50
    red = Math.round(255 - (188 * factor)) // 255 to 67
    green = 255
    blue = Math.round(168 - (101 * factor)) // 168 to 67
  }

  return `rgb(${red}, ${green}, ${blue})`
}

/**
 * Filter champions based on search and filter criteria
 * @param {Array} champions - Array of champion objects
 * @param {string} searchTerm - Search term
 * @param {string} roleFilter - Role filter
 * @param {string} completionFilter - Completion filter
 * @param {Object} wins - Win data object
 * @returns {Array} Filtered champions
 */
export function filterChampions(champions, searchTerm, roleFilter, completionFilter, wins) {
  return champions.filter(champ => {
    const matchesSearch = champ.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !roleFilter || champ.roles.includes(roleFilter)
    const matchesCompletion = !completionFilter || 
      (completionFilter === 'won' && wins[champ.id]) ||
      (completionFilter === 'not-won' && !wins[champ.id])

    return matchesSearch && matchesRole && matchesCompletion
  })
}

/**
 * Generate champion image URL
 * @param {string} championId - Champion ID
 * @param {string} version - Data Dragon version
 * @param {string} type - Image type ('square' or 'splash')
 * @returns {string} Image URL
 */
export function getChampionImageUrl(championId, version, type = 'square') {
  if (type === 'splash') {
    return `${API_CONFIG.DDRAGON_IMG}${API_CONFIG.CHAMPION_SPLASH_PATH(championId)}`
  }
  return `${API_CONFIG.DDRAGON_CDN(version)}${API_CONFIG.CHAMPION_IMAGE_PATH(championId)}`
}

/**
 * Load wins from localStorage
 * @returns {Object} Win data object
 */
export function loadWins() {
  const stored = localStorage.getItem(STORAGE_CONFIG.WINS_KEY)
  return stored ? JSON.parse(stored) : {}
}

/**
 * Save wins to localStorage
 * @param {Object} wins - Win data object
 */
export function saveWins(wins) {
  localStorage.setItem(STORAGE_CONFIG.WINS_KEY, JSON.stringify(wins))
}

/**
 * Load grid size from localStorage
 * @returns {string} Grid size
 */
export function loadGridSize() {
  return localStorage.getItem(STORAGE_CONFIG.GRID_SIZE_KEY) || GAME_CONFIG.GRID_SIZES.MEDIUM
}

/**
 * Save grid size to localStorage
 * @param {string} gridSize - Grid size
 */
export function saveGridSize(gridSize) {
  localStorage.setItem(STORAGE_CONFIG.GRID_SIZE_KEY, gridSize)
}

/**
 * Check milestone achievement
 * @param {number} completed - Number of completed champions
 * @param {number} target - Target milestone
 * @returns {Object} Milestone state
 */
export function checkMilestone(completed, target = GAME_CONFIG.ARENA_GOD_TARGET) {
  const hasReachedMilestone = completed >= target
  const wasAlreadyReached = localStorage.getItem(STORAGE_CONFIG.MILESTONE_KEY) === 'true'

  return {
    hasReachedMilestone,
    wasAlreadyReached,
    shouldShow: hasReachedMilestone && !wasAlreadyReached,
    shouldHide: !hasReachedMilestone && wasAlreadyReached
  }
}

/**
 * Set milestone flag in localStorage
 * @param {boolean} reached - Whether milestone was reached
 */
export function setMilestoneFlag(reached) {
  localStorage.setItem(STORAGE_CONFIG.MILESTONE_KEY, String(reached))
}

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Format percentage for display
 * @param {number} percentage - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export function formatPercentage(percentage, decimals = 1) {
  return percentage.toFixed(decimals)
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

/**
 * Validate champion data
 * @param {Object} champion - Champion object
 * @returns {boolean} Whether champion data is valid
 */
export function validateChampion(champion) {
  return champion && 
         champion.id && 
         champion.name && 
         Array.isArray(champion.roles) &&
         champion.key
}
