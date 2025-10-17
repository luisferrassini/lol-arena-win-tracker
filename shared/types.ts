// Shared TypeScript interfaces and types for LoL Arena Tracker

export interface Champion {
  id: string
  name: string
  roles: string[]
  key: string
}

export interface WinData {
  [championId: string]: boolean
}

export interface ProgressStats {
  total: number
  completed: number
  percentage: number
  remaining: number
}

export interface ClassStats {
  [className: string]: {
    wins: number
    percentage: number
  }
}

export interface GridSize {
  small: 'small'
  medium: 'medium'
}

export interface FilterState {
  searchTerm: string
  roleFilter: string
  completionFilter: string
}

export interface AppState {
  champions: Champion[]
  wins: WinData
  currentVersion: string
  loading: boolean
  gridSize: keyof GridSize
  activeTab: 'champions' | 'stats'
  showMilestone: boolean
}

export interface APIResponse<T> {
  data: T
  success: boolean
  error?: string
}

export interface ChampionData {
  id: string
  name: string
  tags: string[]
  key: string
}

export interface DataDragonResponse {
  data: {
    [key: string]: ChampionData
  }
}

export interface ProgressBarConfig {
  color: string
  strokeWidth: number
  trailWidth: number
  trailColor: string
  easing: string
  duration: number
}

export interface MilestoneState {
  hasReached: boolean
  wasAlreadyReached: boolean
  target: number
  current: number
}
