## LoL Arena Tracker

Track which League of Legends champions you've already won with in Arena. Click a champion portrait to toggle as won; your progress is saved to localStorage.

### Features
- **Data Dragon integration**: pulls champion list and images without an API key
- **Quick filters**: by name, class/tag, and completion state (Won / Not Won)
- **Progress tracking**: visual progress bars for Arena God achievement (60 champions)
- **Statistics dashboard**: detailed stats with class distribution charts
- **Responsive design**: works on desktop and mobile devices
- **Local persistence**: progress is stored in `localStorage` only on your device
- **Professional UI**: clean, modern interface with dark theme

### Project structure
```
index.html              // main HTML file
styles.css              // comprehensive styling with dark theme
manual.js               // main application logic (vanilla JS)
shared/                 // shared utilities and constants
├── constants.js        // configuration and constants
├── utils.js            // utility functions
├── api.js              // Riot Data Dragon API integration
├── storage.js          // localStorage management
└── progress.js         // progress calculation logic
```

### Run locally
You can open `index.html` directly in a browser, or serve the folder (recommended to avoid any browser restrictions):

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

### Deploy for free

#### Option 1: GitHub Pages (Recommended)
1. Push your code to a GitHub repository
2. Go to repository Settings → Pages
3. Select "Deploy from a branch" → main branch
4. Your app will be available at `https://yourusername.github.io/repository-name`

#### Option 2: Netlify
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop your project folder
3. Get instant deployment with custom domain support

#### Option 3: Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Automatic deployments on every push

#### Option 4: Surge.sh
```bash
npm install -g surge
surge
# Follow prompts to deploy
```

### Recent improvements
- **DRY principle applied**: Refactored code to eliminate duplication and improve maintainability
- **Shared utilities**: Common functions extracted to reusable modules
- **Professional UI**: Modern, clean interface with consistent design
- **Progress tracking**: Visual progress bars and milestone celebrations
- **Statistics dashboard**: Comprehensive stats with class distribution charts
- **Responsive design**: Optimized for all screen sizes

### How it works
- Champion data is fetched from Riot's Data Dragon versions endpoint and the latest version is used.
- Champion list comes from `.../cdn/<version>/data/en_US/champion.json`.
- Portraits use the centered splash `.../img/champion/centered/<Champion>_0.jpg`.
- Win state is stored under the `localStorage` key `arenaWinsByChampion` as a map `{ championId: boolean }`.
- Progress tracking includes Arena God milestone (60 champions) with visual indicators.

### Reset your progress
In your browser devtools console:

```js
localStorage.removeItem('arenaWinsByChampion')
```

### Data source
- Riot Data Dragon docs: [`https://developer.riotgames.com/docs/lol#data-dragon`](https://developer.riotgames.com/docs/lol#data-dragon)

### Quick start
1. **Local development**: Open `index.html` in your browser or use a local server
2. **Deploy**: Choose one of the free hosting options above
3. **Use**: Click champions to mark as won, use filters to find specific champions
4. **Track progress**: Monitor your Arena God progress in the Stats tab

### Troubleshooting
- **Images not loading**: ensure you're online; Data Dragon is fetched at runtime.
- **CORS or file URL issues**: serve via a local server (see "Run locally").
- **Filters show empty grid**: clear filters or refresh; you may also clear localStorage.
- **Progress bars not showing**: check browser console for errors, ensure all files are loaded.

### Notes
- This app is client-only; no backend, no analytics, no tracking.
- Champion classes/tags are taken from Data Dragon `tags` for each champion.
- All data is stored locally in your browser's localStorage.
- The app works offline after initial load (champions are cached).

