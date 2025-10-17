# Shared Utilities for LoL Arena Tracker

This directory contains shared utilities, constants, and functions that can be used by both the vanilla JavaScript and React versions of the LoL Arena Tracker.

## Structure

```
shared/
├── constants.js      # Configuration constants and API endpoints
├── types.ts          # TypeScript interfaces and types
├── utils.js          # General utility functions
├── api.js            # Riot Data Dragon API integration
├── storage.js        # localStorage utilities
├── progress.js       # Progress calculation and milestone logic
├── styles.css        # Shared CSS utilities and design system
├── index.js          # Main export file
└── README.md         # This file
```

## Usage

### Import all utilities
```javascript
import * from './shared/index.js'
```

### Import specific modules
```javascript
import { API_CONFIG, GAME_CONFIG } from './shared/constants.js'
import { calculateProgress, getSemanticColor } from './shared/utils.js'
import { StorageManager } from './shared/storage.js'
import { ProgressCalculator } from './shared/progress.js'
```

## Modules

### Constants (`constants.js`)
- **API_CONFIG**: Riot Data Dragon API endpoints and configuration
- **STORAGE_CONFIG**: localStorage keys and configuration
- **GAME_CONFIG**: Game-specific constants (targets, roles, etc.)
- **UI_CONFIG**: UI-related constants (animations, delays)
- **COLOR_CONFIG**: Color schemes and semantic colors
- **ERROR_MESSAGES**: Standardized error messages
- **MILESTONE_CONFIG**: Milestone achievement configuration

### Types (`types.ts`)
TypeScript interfaces for:
- `Champion`: Champion data structure
- `WinData`: Win tracking data
- `ProgressStats`: Progress calculation results
- `ClassStats`: Class-specific statistics
- `AppState`: Application state structure
- And more...

### Utils (`utils.js`)
General utility functions:
- `calculateProgress()`: Calculate progress statistics
- `calculateClassStats()`: Calculate class-specific stats
- `getSemanticColor()`: Get color based on percentage
- `filterChampions()`: Filter champions by criteria
- `getChampionImageUrl()`: Generate champion image URLs
- `loadWins()` / `saveWins()`: localStorage operations
- `checkMilestone()`: Milestone achievement logic
- `debounce()`: Performance optimization
- And more...

### API (`api.js`)
Riot Data Dragon integration:
- `loadLatestVersion()`: Get latest Data Dragon version
- `loadChampions()`: Load champion data
- `loadChampionsWithVersion()`: Load champions with version detection
- `getChampionImageUrl()`: Generate image URLs
- `checkDataDragonAccess()`: Check API availability
- `getChampionById()`: Find champion by ID
- `getChampionsByRole()`: Filter by role
- `searchChampions()`: Search by name

### Storage (`storage.js`)
localStorage management:
- `StorageManager.loadWins()`: Load win data
- `StorageManager.saveWins()`: Save win data
- `StorageManager.loadGridSize()`: Load grid size preference
- `StorageManager.saveGridSize()`: Save grid size preference
- `StorageManager.loadMilestoneFlag()`: Load milestone status
- `StorageManager.saveMilestoneFlag()`: Save milestone status
- `StorageManager.exportData()`: Export all data
- `StorageManager.importData()`: Import data
- `StorageManager.isAvailable()`: Check localStorage availability
- `StorageManager.getStorageInfo()`: Get storage usage info

### Progress (`progress.js`)
Progress calculation and milestone logic:
- `ProgressCalculator.calculateProgress()`: Basic progress stats
- `ProgressCalculator.calculateClassStats()`: Class-specific stats
- `ProgressCalculator.getSemanticColor()`: Color based on percentage
- `ProgressCalculator.getProgressBarColor()`: Progress bar colors
- `ProgressCalculator.calculateMilestoneStatus()`: Milestone logic
- `ProgressCalculator.calculateSegmentedProgress()`: Complex progress bars
- `ProgressCalculator.calculateRoleCompletion()`: Role completion rates
- `ProgressCalculator.calculateTimeEstimates()`: Time estimates
- `ProgressCalculator.calculateStreakInfo()`: Streak information

### Styles (`styles.css`)
Shared CSS utilities and design system:
- CSS custom properties for consistent theming
- Dark mode support
- Button variants and styles
- Input styles
- Card styles
- Grid utilities
- Flexbox utilities
- Spacing utilities
- Text utilities
- Color utilities
- Animation utilities
- Transition utilities
- Hover effects
- Focus effects
- Responsive utilities
- Accessibility utilities

## Benefits of DRY Implementation

1. **Consistency**: Both versions use the same logic and styling
2. **Maintainability**: Changes in one place affect both versions
3. **Testing**: Shared utilities can be tested once
4. **Performance**: Optimized functions used by both versions
5. **Type Safety**: TypeScript types ensure consistency
6. **Documentation**: Centralized documentation for shared functionality

## Migration Guide

### Vanilla JavaScript Version
Replace existing functions with shared utilities:

```javascript
// Before
const DDRAGON_VERSIONS = 'https://ddragon.leagueoflegends.com/api/versions.json';
const STORAGE_KEY = 'arenaWinsByChampion';

// After
import { API_CONFIG, STORAGE_CONFIG } from './shared/constants.js';
// Use API_CONFIG.DDRAGON_VERSIONS and STORAGE_CONFIG.WINS_KEY
```

### React Version
Replace component logic with shared utilities:

```javascript
// Before
const [wins, setWins] = useState({})
const loadWins = () => {
  const stored = localStorage.getItem('arenaWinsByChampion')
  if (stored) setWins(JSON.parse(stored))
}

// After
import { StorageManager } from './shared/storage.js'
const [wins, setWins] = useState(StorageManager.loadWins())
```

## Best Practices

1. **Import only what you need**: Use specific imports to reduce bundle size
2. **Use TypeScript**: Leverage the provided types for better development experience
3. **Test shared utilities**: Write tests for shared functions
4. **Document changes**: Update this README when adding new utilities
5. **Version compatibility**: Ensure shared utilities work with both versions

## Future Enhancements

- [ ] Add unit tests for shared utilities
- [ ] Create build scripts for shared utilities
- [ ] Add JSDoc comments for better IDE support
- [ ] Create example usage documentation
- [ ] Add performance benchmarks
- [ ] Create migration scripts for existing code
