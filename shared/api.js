// Shared API layer for Riot Data Dragon integration

import { API_CONFIG, GAME_CONFIG } from './constants.js'
import { validateChampion } from './utils.js'

/**
 * Load latest version from Data Dragon
 * @returns {Promise<string>} Latest version string
 */
export async function loadLatestVersion() {
  try {
    const response = await fetch(API_CONFIG.DDRAGON_VERSIONS)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const versions = await response.json()
    return versions[0]
  } catch (error) {
    console.warn('Failed to load latest version, using fallback:', GAME_CONFIG.DEFAULT_VERSION)
    return GAME_CONFIG.DEFAULT_VERSION
  }
}

/**
 * Load champions from Data Dragon
 * @param {string} version - Data Dragon version
 * @returns {Promise<Array>} Array of champion objects
 */
export async function loadChampions(version) {
  try {
    const url = `${API_CONFIG.DDRAGON_CDN(version)}${API_CONFIG.CHAMPION_DATA_PATH(version)}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    
    // Transform and validate champion data
    const champions = Object.values(data.data)
      .map(champ => ({
        id: champ.id,
        name: champ.name,
        roles: champ.tags || [],
        key: champ.key
      }))
      .filter(validateChampion)
    
    return champions
  } catch (error) {
    console.error('Failed to load champions:', error)
    throw new Error('Failed to load champions. Please check your internet connection and try again.')
  }
}

/**
 * Load champions with version detection
 * @returns {Promise<Object>} Object containing champions and version
 */
export async function loadChampionsWithVersion() {
  try {
    const version = await loadLatestVersion()
    const champions = await loadChampions(version)
    
    return {
      champions,
      version,
      success: true
    }
  } catch (error) {
    return {
      champions: [],
      version: GAME_CONFIG.DEFAULT_VERSION,
      success: false,
      error: error.message
    }
  }
}

/**
 * Get champion image URL
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
 * Check if Data Dragon is accessible
 * @returns {Promise<boolean>} Whether Data Dragon is accessible
 */
export async function checkDataDragonAccess() {
  try {
    const response = await fetch(API_CONFIG.DDRAGON_VERSIONS, { 
      method: 'HEAD',
      mode: 'no-cors'
    })
    return true
  } catch (error) {
    return false
  }
}

/**
 * Get champion data by ID
 * @param {Array} champions - Array of champions
 * @param {string} championId - Champion ID
 * @returns {Object|null} Champion object or null
 */
export function getChampionById(champions, championId) {
  return champions.find(champ => champ.id === championId) || null
}

/**
 * Get champions by role
 * @param {Array} champions - Array of champions
 * @param {string} role - Role to filter by
 * @returns {Array} Filtered champions
 */
export function getChampionsByRole(champions, role) {
  return champions.filter(champ => champ.roles.includes(role))
}

/**
 * Search champions by name
 * @param {Array} champions - Array of champions
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered champions
 */
export function searchChampions(champions, searchTerm) {
  if (!searchTerm.trim()) return champions
  
  const term = searchTerm.toLowerCase()
  return champions.filter(champ => 
    champ.name.toLowerCase().includes(term)
  )
}
