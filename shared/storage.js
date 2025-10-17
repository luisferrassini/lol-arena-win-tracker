// Shared storage utilities for localStorage operations

import { STORAGE_CONFIG, GAME_CONFIG } from './constants.js'

/**
 * Storage utility class for managing localStorage operations
 */
export class StorageManager {
  /**
   * Load wins from localStorage
   * @returns {Object} Win data object
   */
  static loadWins() {
    try {
      const stored = localStorage.getItem(STORAGE_CONFIG.WINS_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error('Failed to load wins from localStorage:', error)
      return {}
    }
  }

  /**
   * Save wins to localStorage
   * @param {Object} wins - Win data object
   */
  static saveWins(wins) {
    try {
      localStorage.setItem(STORAGE_CONFIG.WINS_KEY, JSON.stringify(wins))
    } catch (error) {
      console.error('Failed to save wins to localStorage:', error)
    }
  }

  /**
   * Clear all wins
   */
  static clearWins() {
    try {
      localStorage.removeItem(STORAGE_CONFIG.WINS_KEY)
    } catch (error) {
      console.error('Failed to clear wins from localStorage:', error)
    }
  }

  /**
   * Load grid size from localStorage
   * @returns {string} Grid size
   */
  static loadGridSize() {
    try {
      return localStorage.getItem(STORAGE_CONFIG.GRID_SIZE_KEY) || GAME_CONFIG.GRID_SIZES.MEDIUM
    } catch (error) {
      console.error('Failed to load grid size from localStorage:', error)
      return GAME_CONFIG.GRID_SIZES.MEDIUM
    }
  }

  /**
   * Save grid size to localStorage
   * @param {string} gridSize - Grid size
   */
  static saveGridSize(gridSize) {
    try {
      localStorage.setItem(STORAGE_CONFIG.GRID_SIZE_KEY, gridSize)
    } catch (error) {
      console.error('Failed to save grid size to localStorage:', error)
    }
  }

  /**
   * Load milestone flag from localStorage
   * @returns {boolean} Whether milestone was reached
   */
  static loadMilestoneFlag() {
    try {
      return localStorage.getItem(STORAGE_CONFIG.MILESTONE_KEY) === 'true'
    } catch (error) {
      console.error('Failed to load milestone flag from localStorage:', error)
      return false
    }
  }

  /**
   * Save milestone flag to localStorage
   * @param {boolean} reached - Whether milestone was reached
   */
  static saveMilestoneFlag(reached) {
    try {
      localStorage.setItem(STORAGE_CONFIG.MILESTONE_KEY, String(reached))
    } catch (error) {
      console.error('Failed to save milestone flag to localStorage:', error)
    }
  }

  /**
   * Clear milestone flag
   */
  static clearMilestoneFlag() {
    try {
      localStorage.removeItem(STORAGE_CONFIG.MILESTONE_KEY)
    } catch (error) {
      console.error('Failed to clear milestone flag from localStorage:', error)
    }
  }

  /**
   * Get all app data from localStorage
   * @returns {Object} All app data
   */
  static getAllData() {
    return {
      wins: this.loadWins(),
      gridSize: this.loadGridSize(),
      milestoneReached: this.loadMilestoneFlag()
    }
  }

  /**
   * Clear all app data from localStorage
   */
  static clearAllData() {
    this.clearWins()
    this.clearMilestoneFlag()
    // Note: We don't clear grid size as it's a UI preference
  }

  /**
   * Export app data as JSON string
   * @returns {string} JSON string of app data
   */
  static exportData() {
    try {
      return JSON.stringify(this.getAllData(), null, 2)
    } catch (error) {
      console.error('Failed to export data:', error)
      return '{}'
    }
  }

  /**
   * Import app data from JSON string
   * @param {string} jsonData - JSON string of app data
   * @returns {boolean} Whether import was successful
   */
  static importData(jsonData) {
    try {
      const data = JSON.parse(jsonData)
      
      if (data.wins) this.saveWins(data.wins)
      if (data.gridSize) this.saveGridSize(data.gridSize)
      if (typeof data.milestoneReached === 'boolean') {
        this.saveMilestoneFlag(data.milestoneReached)
      }
      
      return true
    } catch (error) {
      console.error('Failed to import data:', error)
      return false
    }
  }

  /**
   * Check if localStorage is available
   * @returns {boolean} Whether localStorage is available
   */
  static isAvailable() {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get storage usage information
   * @returns {Object} Storage usage information
   */
  static getStorageInfo() {
    if (!this.isAvailable()) {
      return { available: false, used: 0, total: 0 }
    }

    let used = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length
      }
    }

    return {
      available: true,
      used: used,
      total: 5 * 1024 * 1024, // 5MB typical limit
      percentage: Math.round((used / (5 * 1024 * 1024)) * 100)
    }
  }
}
