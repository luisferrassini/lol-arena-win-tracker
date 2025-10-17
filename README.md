# LoL Arena Tracker

A professional web application for tracking League of Legends Arena champion victories. Built with vanilla JavaScript and modern web standards, featuring a clean dark theme and comprehensive progress tracking.

## Overview

The LoL Arena Tracker helps players monitor their Arena God achievement progress by tracking which champions they've won with. The application provides visual progress indicators, detailed statistics, and an intuitive interface for managing champion win states.

## Features

### Core Functionality
- **Champion Tracking**: Click to toggle win states for any champion
- **Progress Visualization**: Real-time progress bars for Arena God achievement (60 champions)
- **Smart Filtering**: Search by name, filter by role, and completion status
- **Statistics Dashboard**: Comprehensive stats with class distribution charts
- **Responsive Design**: Optimized for desktop and mobile devices

### Technical Features
- **Data Dragon Integration**: Fetches champion data from Riot's official API
- **Local Storage**: All progress saved locally in your browser
- **Offline Capable**: Works without internet after initial load
- **Modern UI**: Professional dark theme with smooth animations
- **Accessibility**: Full keyboard navigation and screen reader support

## Architecture

### Project Structure
```
├── index.html              # Main application entry point
├── styles.css              # Comprehensive styling system
├── manual.js              # Core application logic
├── shared/                 # Modular utilities and constants
│   ├── constants.js        # Configuration and API endpoints
│   ├── utils.js            # General utility functions
│   ├── api.js              # Riot Data Dragon integration
│   ├── storage.js          # LocalStorage management
│   ├── progress.js         # Progress calculation logic
│   └── types.ts            # TypeScript type definitions
└── README.md               # Project documentation
```

### Design Principles
- **DRY (Don't Repeat Yourself)**: Shared utilities eliminate code duplication
- **Modular Architecture**: Clean separation of concerns
- **Performance Optimized**: Lazy loading and efficient rendering
- **Maintainable Code**: Well-documented and structured codebase

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for initial data loading

### Installation
1. Clone or download the repository
2. Open `index.html` in your web browser
3. For development, use a local server:
   ```bash
   python3 -m http.server 8080
   # Navigate to http://localhost:8080
   ```

### Usage
1. **Track Wins**: Click on champion portraits to mark as won/lost
2. **Filter Champions**: Use the search bar and role filters to find specific champions
3. **Monitor Progress**: View your Arena God progress in the Stats tab
4. **Export Data**: Use the built-in export functionality to backup your progress

## Technical Implementation

### Data Sources
- **Riot Data Dragon API**: Official League of Legends data service
- **Champion Data**: Fetched from `ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion.json`
- **Champion Images**: Served from Riot's CDN with automatic fallback handling
- **Version Management**: Automatic detection of latest Data Dragon version

### Data Storage
- **Local Storage**: All progress stored in browser's localStorage
- **Storage Keys**: 
  - `arenaWinsByChampion`: Champion win states
  - `milestone60`: Arena God milestone status
  - `gridSize`: User interface preferences
- **Data Export**: Built-in JSON export/import functionality

### Performance Optimizations
- **Lazy Loading**: Champion images load on demand
- **Efficient Rendering**: Virtual DOM-like updates for smooth performance
- **Caching**: Champion data cached after initial load
- **Debounced Search**: Optimized search input handling

## Development

### Code Organization
The project follows modern JavaScript best practices with a modular architecture:

- **Separation of Concerns**: UI, data, and business logic clearly separated
- **Shared Utilities**: Common functions extracted to reusable modules
- **Type Safety**: TypeScript interfaces for data structures
- **Error Handling**: Comprehensive error handling and user feedback

### Key Modules
- **`shared/constants.js`**: Centralized configuration and API endpoints
- **`shared/api.js`**: Riot Data Dragon API integration
- **`shared/storage.js`**: LocalStorage management with error handling
- **`shared/utils.js`**: General utility functions and calculations
- **`shared/progress.js`**: Progress tracking and milestone logic

## Browser Support

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **ES6 Modules**: Requires modern browser with module support
- **Local Storage**: Requires localStorage support
- **CSS Grid**: Uses modern CSS Grid for layout

## Troubleshooting

### Common Issues
- **Images not loading**: Ensure internet connection for initial Data Dragon fetch
- **CORS errors**: Use a local server instead of opening file directly
- **Empty grid**: Clear browser cache or reset localStorage
- **Progress bars not showing**: Check browser console for JavaScript errors

### Reset Options
- **Reset all progress**: Use the "Reset All" button in the interface
- **Manual reset**: `localStorage.clear()` in browser console
- **Export/Import**: Use built-in data management features

## Contributing

This project demonstrates modern web development practices:
- Clean, maintainable code structure
- Comprehensive error handling
- Accessibility considerations
- Performance optimization
- Professional UI/UX design

## License

This project is open source and available under the MIT License.

