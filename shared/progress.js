// Shared progress calculation and milestone logic

import { GAME_CONFIG, COLOR_CONFIG } from './constants.js'

/**
 * Progress calculation utilities
 */
export class ProgressCalculator {
  /**
   * Calculate basic progress statistics
   * @param {number} completed - Number of completed items
   * @param {number} total - Total number of items
   * @param {number} target - Target milestone
   * @returns {Object} Progress statistics
   */
  static calculateProgress(completed, total, target = GAME_CONFIG.ARENA_GOD_TARGET) {
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
  static calculateClassStats(champions, wins) {
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
        percentage: winsPercentage,
        total: classChampions.length,
        completionPercentage: classChampions.length > 0 ? 
          Math.round((classWins / classChampions.length) * 100) : 0
      }
    })

    return classStats
  }

  /**
   * Get semantic color based on percentage
   * @param {number} percentage - Percentage value (0-100)
   * @returns {string} RGB color string
   */
  static getSemanticColor(percentage) {
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
   * Calculate progress bar color based on percentage
   * @param {number} percentage - Percentage value (0-100)
   * @returns {string} HSL color string
   */
  static getProgressBarColor(percentage) {
    const hue = percentage * 1.2 // 0 (red) to 120 (green)
    return `hsl(${hue}, 70%, 50%)`
  }

  /**
   * Calculate milestone achievement status
   * @param {number} completed - Number of completed champions
   * @param {number} target - Target milestone
   * @param {boolean} wasAlreadyReached - Whether milestone was already reached
   * @returns {Object} Milestone status
   */
  static calculateMilestoneStatus(completed, target = GAME_CONFIG.ARENA_GOD_TARGET, wasAlreadyReached = false) {
    const hasReachedMilestone = completed >= target
    const shouldShow = hasReachedMilestone && !wasAlreadyReached
    const shouldHide = !hasReachedMilestone && wasAlreadyReached
    const isNewlyReached = hasReachedMilestone && !wasAlreadyReached

    return {
      hasReachedMilestone,
      shouldShow,
      shouldHide,
      isNewlyReached,
      progress: Math.min(completed / target, 1.0)
    }
  }

  /**
   * Calculate segmented progress for complex progress bars
   * @param {number} completed - Number of completed items
   * @param {number} total - Total number of items
   * @param {number} target - Target milestone
   * @returns {Object} Segmented progress data
   */
  static calculateSegmentedProgress(completed, total, target = GAME_CONFIG.ARENA_GOD_TARGET) {
    const milestonePosition = (target / total) * 100 // Position of milestone on progress bar
    
    if (completed <= target) {
      // First segment: 0 to target
      const segmentProgress = (completed / target) * 100
      const color = this.getSemanticColor(segmentProgress * 2) // Scale to 0-100% range
      
      return {
        segment: 1,
        progress: segmentProgress,
        color: color,
        position: (completed / total) * 100
      }
    } else {
      // Second segment: target+ to total
      const remainingChampions = total - target
      const segmentProgress = ((completed - target) / remainingChampions) * 100
      const color = this.getSemanticColor(50 + (segmentProgress * 0.5)) // Start from yellow (50%)
      
      return {
        segment: 2,
        progress: segmentProgress,
        color: color,
        position: (completed / total) * 100
      }
    }
  }

  /**
   * Calculate completion rate by role
   * @param {Array} champions - Array of champion objects
   * @param {Object} wins - Win data object
   * @returns {Object} Completion rates by role
   */
  static calculateRoleCompletion(champions, wins) {
    const roleStats = {}
    
    GAME_CONFIG.CHAMPION_ROLES.forEach(role => {
      const roleChampions = champions.filter(champ => champ.roles.includes(role))
      const roleWins = roleChampions.filter(champ => wins[champ.id]).length
      const completionRate = roleChampions.length > 0 ? 
        Math.round((roleWins / roleChampions.length) * 100) : 0

      roleStats[role] = {
        total: roleChampions.length,
        won: roleWins,
        completionRate: completionRate,
        color: COLOR_CONFIG.CLASS_COLORS[role] || '#666666'
      }
    })

    return roleStats
  }

  /**
   * Calculate average completion time estimate
   * @param {number} completed - Number of completed champions
   * @param {number} total - Total number of champions
   * @param {number} averageTimePerChampion - Average time per champion in minutes
   * @returns {Object} Time estimates
   */
  static calculateTimeEstimates(completed, total, averageTimePerChampion = 30) {
    const remaining = total - completed
    const estimatedTimeRemaining = remaining * averageTimePerChampion
    
    return {
      completed,
      remaining,
      total,
      estimatedTimeRemaining: estimatedTimeRemaining,
      estimatedTimeRemainingHours: Math.round(estimatedTimeRemaining / 60),
      estimatedTimeRemainingDays: Math.round(estimatedTimeRemaining / (60 * 24))
    }
  }

  /**
   * Calculate streak information
   * @param {Array} champions - Array of champion objects
   * @param {Object} wins - Win data object
   * @returns {Object} Streak information
   */
  static calculateStreakInfo(champions, wins) {
    // This would require additional data about when champions were won
    // For now, return basic streak info
    const wonChampions = champions.filter(champ => wins[champ.id])
    
    return {
      totalWon: wonChampions.length,
      currentStreak: 0, // Would need timestamp data
      longestStreak: 0, // Would need timestamp data
      averageWinsPerDay: 0 // Would need timestamp data
    }
  }
}
