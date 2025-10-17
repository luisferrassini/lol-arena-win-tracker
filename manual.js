// Refactored manual.js using shared utilities
// This demonstrates how to apply DRY principles to the existing code

// Import shared utilities
import { 
  API_CONFIG, 
  STORAGE_CONFIG, 
  GAME_CONFIG, 
  UI_CONFIG,
  ERROR_MESSAGES 
} from './shared/constants.js'

import { 
  calculateProgress,
  calculateClassStats,
  getSemanticColor,
  filterChampions,
  getChampionImageUrl,
  checkMilestone,
  setMilestoneFlag,
  debounce
} from './shared/utils.js'

import { 
  loadLatestVersion as loadLatestVersionFromAPI,
  loadChampions,
  getChampionImageUrl as getChampionImageUrlFromAPI
} from './shared/api.js'

import { StorageManager } from './shared/storage.js'
import { ProgressCalculator } from './shared/progress.js'

// State
let champions = []; // normalized array
let wins = {}; // champId -> boolean
let currentVersion = GAME_CONFIG.DEFAULT_VERSION;

// Elements
const gridEl = document.getElementById('grid');
const statsEl = document.getElementById('stats');
const championsProgressEl = document.getElementById('champions-progress');
const searchEl = document.getElementById('search');
const roleFilterEl = document.getElementById('roleFilter');
const completionFilterEl = document.getElementById('completionFilter');
const resetBtn = document.getElementById('resetBtn');
const tabChampionsBtn = document.getElementById('tab-champions');
const tabStatsBtn = document.getElementById('tab-stats');
const panelChampions = document.getElementById('panel-champions');
const panelStats = document.getElementById('panel-stats');

// Progress bar instances
let arenaGodBar;
let allChampionsBar;
let championsArenaGodBar;
let championsAllChampionsBar;
const gridSizeSelect = document.getElementById('gridSize');
const milestoneMessageEl = document.getElementById('milestoneMessage');
const milestoneMarkerEl = document.getElementById('milestoneMarker');

init().catch(console.error);

async function init() {
	await loadLatestVersionLocal();
	await loadChampionsLocal();
	loadWins();
    renderProgressCards();
    renderChampionsProgressCards();
    loadGridSize();
    initProgressBar();
    initChampionsProgressBar();
    updateProgressBars();
    render();
	setupEventListeners();
}

// Refactored to use shared API utilities
async function loadLatestVersionLocal() {
	try {
		currentVersion = await loadLatestVersionFromAPI();
	} catch (err) {
		console.warn('Failed to load latest version, using fallback:', currentVersion);
	}
}

// Refactored to use shared API utilities
async function loadChampionsLocal() {
	try {
		gridEl.classList.add('loading');
		
    const result = await loadChampions(currentVersion);
    champions = result;
    
		gridEl.classList.remove('loading');
	} catch (err) {
		console.error('Failed to load champions:', err);
		gridEl.classList.remove('loading');
		
		// Show error message to user
		gridEl.innerHTML = `
			<div class="error-message">
        <h3>${ERROR_MESSAGES.CHAMPIONS_LOAD_FAILED}</h3>
        <p>${ERROR_MESSAGES.NETWORK_ERROR}</p>
				<button onclick="location.reload()" class="retry-btn">Retry</button>
			</div>
		`;
	}
}

// Refactored to use shared storage utilities
function loadWins() {
  wins = StorageManager.loadWins();
}

// Refactored to use shared storage utilities
function saveWins() {
  StorageManager.saveWins(wins);
}

// Refactored to use shared utility functions
function render() {
	const searchTerm = searchEl.value.toLowerCase();
	const roleFilter = roleFilterEl.value;
	const completionFilter = completionFilterEl.value;
	
  const filtered = filterChampions(champions, searchTerm, roleFilter, completionFilter, wins);
	
	gridEl.innerHTML = '';
	filtered.forEach(champ => {
		gridEl.appendChild(renderCard(champ));
	});
	
	updateStats();
}

function renderCard(champion) {
	const won = !!wins[champion.id];
	const card = document.createElement('article');
	card.className = 'card' + (won ? ' won' : '');
	card.setAttribute('tabindex', '0');
	card.setAttribute('role', 'button');
	card.setAttribute('aria-pressed', String(won));
	card.dataset.id = champion.id;

	const img = document.createElement('img');
  img.src = getChampionImageUrl(champion.id, currentVersion);
	img.alt = `${champion.name}`;
	img.loading = 'lazy';
	img.className = 'portrait';
	// Fallback if primary image fails
	img.onerror = () => {
		img.onerror = null;
    img.src = getChampionImageUrl(champion.id, currentVersion, 'splash');
	};
	card.appendChild(img);

	// Create different layouts based on grid size
	const isSmall = gridEl.classList.contains('grid-small');

	if (!isSmall) {
		const meta = document.createElement('div');
		meta.className = 'meta';
		
		const name = document.createElement('div');
		name.className = 'name';
		name.textContent = champion.name;
		meta.appendChild(name);

		const role = document.createElement('div');
		role.className = 'role';
		role.textContent = champion.roles.join(' • ');
		meta.appendChild(role);
		
		card.appendChild(meta);
	}

	card.addEventListener('click', () => toggleWin(champion.id, card));
	card.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			toggleWin(champion.id, card);
		}
	});

	return card;
}

function toggleWin(id, card) {
	wins[id] = !wins[id];
	card.classList.toggle('won', wins[id]);
	card.setAttribute('aria-pressed', String(wins[id]));
	
	// Add visual feedback
	card.style.transform = 'scale(0.95)';
	setTimeout(() => {
		card.style.transform = '';
	}, 150);
	
	saveWins();
	updateStats();
	
	// Add haptic feedback if available
	if (navigator.vibrate) {
		navigator.vibrate(50);
	}
}

// Refactored to use shared progress calculation utilities
function updateStats() {
  const progress = calculateProgress(
    Object.values(wins).filter(Boolean).length,
    champions.length,
    GAME_CONFIG.ARENA_GOD_TARGET
  );
	
	// Update progress bars based on milestone status
    updateProgressBars();
	
  // Check for milestone using shared utility
  checkMilestoneLocal(progress.completed);
  
  // Calculate class-specific stats using shared utility
  const classStats = calculateClassStats(champions, wins);

    // Update non-progress summary cards individually
  if (progress.isTargetReached) {
        upsertCard('card-target', 'stat-card target-reached', `
            <div class="stat-card-header">
                <span class="stat-name">Arena God Completed</span>
            </div>
            <div class="stat-progress">
        <span class="stat-value" style="color: #44ff44">${GAME_CONFIG.ARENA_GOD_TARGET}/${GAME_CONFIG.ARENA_GOD_TARGET}</span>
            </div>
            <div class="stat-percentage" style="color: #44ff44">100% Complete</div>
        `);
        upsertCard('card-total-wins', 'stat-card', `
            <div class="stat-card-header">
                <span class="stat-name">Total Wins</span>
            </div>
            <div class="stat-progress">
        <span class="stat-value" style="color: #44ff44">${progress.completed}</span>
            </div>
      <div class="stat-percentage" style="color: #44ff44">${progress.percentage}% of all champions</div>
        `);
        upsertCard('card-remaining', 'stat-card', `
            <div class="stat-card-header">
                <span class="stat-name">Remaining</span>
            </div>
            <div class="stat-progress">
        <span class="stat-value" style="color: #44ff44">${progress.remaining}</span>
            </div>
            <div class="stat-percentage" style="color: #44ff44">champions left</div>
        `);
        removeCard('card-pre60-summary');
    } else {
        upsertCard('card-pre60-summary', 'stat-card', `
            <div class="stat-card-header">
                <span class="stat-name">Arena God</span>
            </div>
            <div class="stat-progress">
        <span class="stat-value" style="color: ${getSemanticColor(progress.targetPercentage)}">${progress.completed}/${GAME_CONFIG.ARENA_GOD_TARGET}</span>
            </div>
      <div class="stat-percentage" style="color: ${getSemanticColor(progress.targetPercentage)}">${progress.targetPercentage}% Complete</div>
        `);
        upsertCard('card-remaining', 'stat-card', `
            <div class="stat-card-header">
                <span class="stat-name">Remaining</span>
            </div>
            <div class="stat-progress">
        <span class="stat-value" style="color: ${getSemanticColor(progress.targetPercentage)}">${progress.remaining}</span>
            </div>
      <div class="stat-percentage" style="color: ${getSemanticColor(progress.targetPercentage)}">wins needed</div>
        `);
        upsertCard('card-all-champions-summary', 'stat-card', `
            <div class="stat-card-header">
                <span class="stat-name">All Champions</span>
            </div>
            <div class="stat-progress">
        <span class="stat-value" style="color: ${getSemanticColor(progress.targetPercentage)}">${progress.completed}/${progress.total}</span>
            </div>
      <div class="stat-percentage" style="color: ${getSemanticColor(progress.targetPercentage)}">${progress.percentage}% Complete</div>
        `);
        removeCard('card-target');
        removeCard('card-total-wins');
    }

    // Class cards - always show all cards
  GAME_CONFIG.CHAMPION_ROLES.forEach(className => {
        const stats = classStats[className];
        const color = getSemanticColor(stats.percentage);
        upsertCard(`card-class-${className}`, 'stat-card class-card', `
            <div class="stat-card-header">
                <span class="stat-name">${className}</span>
            </div>
            <div class="stat-progress">
                <span class="stat-value" style="color: ${color}">${stats.wins}</span>
                <span class="stat-label">wins</span>
            </div>
            <div class="stat-percentage" style="color: ${color}">${stats.percentage}% of total</div>
        `);
    });
    
    // Pie chart card
    upsertCard('card-pie', 'stat-card pie-chart-card', `
        <div class="stat-card-header">
            <span class="stat-name">Wins by Class</span>
        </div>
        <div class="pie-chart-container">
            <canvas id="classPieChart"></canvas>
        </div>
    `);
    
    // Create chart
    setTimeout(() => createPieChart(classStats), 0);
}

// Add/Update a single card element in the unified stats grid
function upsertCard(cardId, classNames, innerHTML) {
    let el = document.getElementById(cardId);
    if (!el) {
        el = document.createElement('div');
        el.id = cardId;
        statsEl.appendChild(el);
    }
    el.className = classNames;
    el.innerHTML = innerHTML;
}

function removeCard(cardId) {
    const el = document.getElementById(cardId);
    if (el && el.parentElement === statsEl) {
        statsEl.removeChild(el);
    } else if (el) {
        el.remove();
    }
}

// Render the two progress cards once and only once
function renderProgressCards() {
  const progressContainer = statsEl;
    if (!progressContainer) return;
    if (document.getElementById('arenaGodBar') && document.getElementById('allChampionsBar')) {
        return; // already rendered
    }
    const cardsHTML = `
        <div class="stat-card progress-card" role="group" aria-labelledby="arena-god-title">
            <div class="stat-card-header">
                <span class="stat-name" id="arena-god-title">Arena God</span>
            </div>
            <div class="progress-card-content">
        <div id="arenaGodBar" class="progress-card-semicircle" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="${GAME_CONFIG.ARENA_GOD_TARGET}" aria-label="Arena God progress bar"></div>
            </div>
        </div>
        <div class="stat-card progress-card" role="group" aria-labelledby="all-champions-title">
            <div class="stat-card-header">
                <span class="stat-name" id="all-champions-title">All Champions</span>
            </div>
            <div class="progress-card-content">
                <div id="allChampionsBar" class="progress-card-semicircle" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="167" aria-label="All Champions progress bar"></div>
            </div>
        </div>
    `;
    progressContainer.insertAdjacentHTML('afterbegin', cardsHTML);
}

// Render progress cards for champions tab
function renderChampionsProgressCards() {
    const progressContainer = championsProgressEl;
    if (!progressContainer) return;
    if (document.getElementById('championsArenaGodBar') && document.getElementById('championsAllChampionsBar')) {
        return; // already rendered
    }
    
    // Apply current grid size class to panel if not already applied
  const currentGridSize = StorageManager.loadGridSize();
    if (panelChampions) {
        panelChampions.classList.remove('grid-small', 'grid-medium');
        panelChampions.classList.add(`grid-${currentGridSize}`);
        console.log('Applied initial grid class to panel:', `grid-${currentGridSize}`);
    }
    const cardsHTML = `
        <div class="stat-card progress-card" role="group" aria-labelledby="champions-arena-god-title">
            <div class="stat-card-header">
                <span class="stat-name" id="champions-arena-god-title">Arena God</span>
            </div>
            <div class="progress-card-content">
        <div id="championsArenaGodBar" class="progress-card-semicircle" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="${GAME_CONFIG.ARENA_GOD_TARGET}" aria-label="Arena God progress bar"></div>
            </div>
        </div>
        <div class="stat-card progress-card" role="group" aria-labelledby="champions-all-champions-title">
            <div class="stat-card-header">
                <span class="stat-name" id="champions-all-champions-title">All Champions</span>
            </div>
            <div class="progress-card-content">
                <div id="championsAllChampionsBar" class="progress-card-semicircle" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="167" aria-label="All Champions progress bar"></div>
            </div>
        </div>
    `;
    progressContainer.insertAdjacentHTML('afterbegin', cardsHTML);
}

// Refactored to use shared milestone utilities
function checkMilestoneLocal(completed) {
  const milestoneStatus = checkMilestone(completed, GAME_CONFIG.ARENA_GOD_TARGET, StorageManager.loadMilestoneFlag());
	
  console.log('Checking milestone:', { completed, milestone: GAME_CONFIG.ARENA_GOD_TARGET, milestoneStatus });
	
  if (milestoneStatus.shouldShow) {
		console.log('Milestone reached! Showing message...');
		showMilestoneMessage();
    setMilestoneFlag(true);
	}

  if (milestoneStatus.shouldHide) {
		console.log('Milestone no longer met. Resetting flag and hiding message.');
    setMilestoneFlag(false);
		closeMilestoneMessage();
	}
}

function showMilestoneMessage() {
	console.log('Showing milestone message...');
	
	// Create dark overlay
	const overlay = document.createElement('div');
	overlay.className = 'milestone-overlay';
	overlay.id = 'milestoneOverlay';
	document.body.appendChild(overlay);
	
	// Show message
	milestoneMessageEl.style.display = 'block';
	milestoneMessageEl.classList.add('show');
	
	// Add haptic feedback if available
	if (navigator.vibrate) {
		navigator.vibrate([200, 100, 200, 100, 200]);
	}
}

function closeMilestoneMessage() {
	milestoneMessageEl.classList.remove('show');
	
	// Remove overlay
	const overlay = document.getElementById('milestoneOverlay');
	if (overlay) {
		overlay.remove();
	}
	
	setTimeout(() => {
		milestoneMessageEl.style.display = 'none';
  }, UI_CONFIG.MILESTONE_ANIMATION_DURATION);
}

// Make closeMilestoneMessage globally available
window.closeMilestoneMessage = closeMilestoneMessage;

// Test function to manually trigger milestone (for testing)
window.testMilestone = function() {
	console.log('Testing milestone message...');
	showMilestoneMessage();
};

// Refactored to use shared storage utilities
function setGridSize(size) {
	// Update select value
	gridSizeSelect.value = size;
	
	// Update grid class
	gridEl.className = `grid grid-${size}`;
	
	// Update panel class for responsive progress cards
	if (panelChampions) {
		panelChampions.classList.remove('grid-small', 'grid-medium');
		panelChampions.classList.add(`grid-${size}`);
		console.log('Applied grid class to panel:', `grid-${size}`, panelChampions.classList.toString());
	}
	
  // Save preference using shared storage utility
  StorageManager.saveGridSize(size);
	
	// Re-render cards with new layout
	render();
}

// Refactored to use shared storage utilities
function loadGridSize() {
  const savedSize = StorageManager.loadGridSize();
	setGridSize(savedSize);
}

// Rest of the functions would be similarly refactored...
// This is just a demonstration of the key changes

function updateProgressBars() {
  if (!arenaGodBar || !allChampionsBar) {
    console.log('Progress bars not ready for update, retrying in 100ms...');
    setTimeout(() => {
      updateProgressBars();
    }, UI_CONFIG.LOADING_DELAY);
    return;
  }

  console.log('Updating progress bars...');
  
  const completed = Object.values(wins).filter(Boolean).length;
  const total = champions.length;
  const target = GAME_CONFIG.ARENA_GOD_TARGET;
  
  // Ensure we have valid numbers
  if (isNaN(completed) || isNaN(total) || total === 0) {
    console.warn('Invalid progress values:', { completed, total });
    return;
  }
  
  try {
    // Update Arena God progress with animation (0-1 range)
		const arenaGodPercentage = Math.min(completed / target, 1.0);
		
		// Ensure value is properly clamped between 0 and 1
		const clampedArenaGodPercentage = Math.max(0, Math.min(1, arenaGodPercentage));
		
		console.log('Arena God Progress:', { completed, target, arenaGodPercentage, clampedArenaGodPercentage });
		
		// Validate percentage is in correct range
		if (clampedArenaGodPercentage < 0 || clampedArenaGodPercentage > 1) {
			console.warn('Invalid arenaGodPercentage:', clampedArenaGodPercentage);
			return;
		}
		
		// Use set() instead of animate() to avoid animation errors
		arenaGodBar.set(clampedArenaGodPercentage);
		
    // Update All Champions progress with animation (0-1 range)
		const allChampionsPercentage = completed / total;
		
		// Ensure value is properly clamped between 0 and 1
		const clampedAllChampionsPercentage = Math.max(0, Math.min(1, allChampionsPercentage));
		
		console.log('All Champions Progress:', { completed, total, allChampionsPercentage, clampedAllChampionsPercentage });
		
		// Validate percentage is in correct range
		if (clampedAllChampionsPercentage < 0 || clampedAllChampionsPercentage > 1) {
			console.warn('Invalid allChampionsPercentage:', clampedAllChampionsPercentage);
			return;
		}
		
		// Use set() instead of animate() to avoid animation errors
		allChampionsBar.set(clampedAllChampionsPercentage);
		
		// Update Arena God text inside the semicircle
		arenaGodBar.setText(`${Math.min(completed, target)}/${target}`);
		
		// Update All Champions text inside the semicircle
		allChampionsBar.setText(`${completed}/${total}`);
		
    // Update colors using shared utility
		updateProgressBarColors(arenaGodPercentage, allChampionsPercentage);
	} catch (error) {
		console.error('Error updating progress bars:', error);
    // Fallback logic...
	}
	
	// Also update champions progress bars
	updateChampionsProgressBars();
}

function updateChampionsProgressBars() {
	if (!championsArenaGodBar || !championsAllChampionsBar) {
		console.log('Champions progress bars not ready for update, retrying in 100ms...');
		// Retry after a short delay
		setTimeout(() => {
			updateChampionsProgressBars();
		}, UI_CONFIG.LOADING_DELAY);
		return;
	}
	
	console.log('Updating champions progress bars...');
	
	const completed = Object.values(wins).filter(Boolean).length;
	const total = champions.length;
	const target = GAME_CONFIG.ARENA_GOD_TARGET;
	
	// Ensure we have valid numbers
	if (isNaN(completed) || isNaN(total) || total === 0) {
		console.warn('Invalid progress values for champions bars:', { completed, total });
		return;
	}
	
	try {
		// Update Champions Arena God progress with animation
		const arenaGodPercentage = Math.min(completed / target, 1.0);
		
		// Ensure value is properly clamped between 0 and 1
		const clampedArenaGodPercentage = Math.max(0, Math.min(1, arenaGodPercentage));
		
		console.log('Champions Arena God Progress:', { completed, target, arenaGodPercentage, clampedArenaGodPercentage });
		
		// Validate percentage is in correct range
		if (clampedArenaGodPercentage < 0 || clampedArenaGodPercentage > 1) {
			console.warn('Invalid arenaGodPercentage for champions:', clampedArenaGodPercentage);
			return;
		}
		
		// Use set() instead of animate() to avoid animation errors
		championsArenaGodBar.set(clampedArenaGodPercentage);
		
		// Update Champions All Champions progress with animation
		const allChampionsPercentage = completed / total;
		
		// Ensure value is properly clamped between 0 and 1
		const clampedAllChampionsPercentage = Math.max(0, Math.min(1, allChampionsPercentage));
		
		console.log('Champions All Champions Progress:', { completed, total, allChampionsPercentage, clampedAllChampionsPercentage });
		
		// Validate percentage is in correct range
		if (clampedAllChampionsPercentage < 0 || clampedAllChampionsPercentage > 1) {
			console.warn('Invalid allChampionsPercentage for champions:', clampedAllChampionsPercentage);
			return;
		}
		
		// Use set() instead of animate() to avoid animation errors
		championsAllChampionsBar.set(clampedAllChampionsPercentage);
		
		// Update Champions Arena God text inside the semicircle
		championsArenaGodBar.setText(`${Math.min(completed, target)}/${target}`);
		
		// Update Champions All Champions text inside the semicircle
		championsAllChampionsBar.setText(`${completed}/${total}`);
		
		// Update champions progress bar colors
		updateChampionsProgressBarColors(arenaGodPercentage, allChampionsPercentage);
	} catch (error) {
		console.error('Error updating champions progress bars:', error);
		// Fallback to set() instead of animate() if animate() fails
		try {
			const arenaGodPercentage = Math.min(completed / target, 1.0);
			const allChampionsPercentage = completed / total;
			
			championsArenaGodBar.set(arenaGodPercentage);
			championsAllChampionsBar.set(allChampionsPercentage);
			
			championsArenaGodBar.setText(`${Math.min(completed, target)}/${target}`);
			championsAllChampionsBar.setText(`${completed}/${total}`);
			
			updateChampionsProgressBarColors(arenaGodPercentage, allChampionsPercentage);
		} catch (fallbackError) {
			console.error('Fallback champions progress bar update also failed:', fallbackError);
		}
	}
}

function updateProgressBarColors(arenaGodPercentage, allChampionsPercentage) {
	try {
		// Update Arena God color
		const arenaGodHue = arenaGodPercentage * 120; // 0 (red) to 120 (green)
		const arenaGodColor = `hsl(${arenaGodHue}, 70%, 50%)`;
		arenaGodBar.path.setAttribute('stroke', arenaGodColor);
		// Update text color inside the semicircle
		if (arenaGodBar.text) {
			arenaGodBar.text.style.color = arenaGodColor;
		}
		
		// Update All Champions color
		const allChampionsHue = allChampionsPercentage * 120; // 0 (red) to 120 (green)
		const allChampionsColor = `hsl(${allChampionsHue}, 70%, 50%)`;
		allChampionsBar.path.setAttribute('stroke', allChampionsColor);
		// Update text color inside the semicircle
		if (allChampionsBar.text) {
			allChampionsBar.text.style.color = allChampionsColor;
		}
	} catch (error) {
		console.error('Error updating progress bar colors:', error);
	}
}

function updateChampionsProgressBarColors(arenaGodPercentage, allChampionsPercentage) {
	try {
		// Update Champions Arena God Title color
		const arenaGodHue = arenaGodPercentage * 120; // 0 (red) to 120 (green)
		const arenaGodColor = `hsl(${arenaGodHue}, 70%, 50%)`;
		championsArenaGodBar.path.setAttribute('stroke', arenaGodColor);
		// Update text color inside the semicircle
		if (championsArenaGodBar.text) {
			championsArenaGodBar.text.style.color = arenaGodColor;
		}
		
		// Update Champions All Champions color
		const allChampionsHue = allChampionsPercentage * 120; // 0 (red) to 120 (green)
		const allChampionsColor = `hsl(${allChampionsHue}, 70%, 50%)`;
		championsAllChampionsBar.path.setAttribute('stroke', allChampionsColor);
		// Update text color inside the semicircle
		if (championsAllChampionsBar.text) {
			championsAllChampionsBar.text.style.color = allChampionsColor;
		}
	} catch (error) {
		console.error('Error updating champions progress bar colors:', error);
	}
}

function initProgressBar() {
	try {
		// Check if ProgressBar is available
		if (typeof ProgressBar === 'undefined') {
			console.error('ProgressBar.js not loaded');
			return;
		}
		
		// Check if progress bars exist and their DOM elements are still valid
		if (arenaGodBar && allChampionsBar) {
			// Check if the DOM elements still exist
			const arenaGodBarEl = document.getElementById('arenaGodBar');
			const allChampionsBarEl = document.getElementById('allChampionsBar');
			
			if (arenaGodBarEl && allChampionsBarEl) {
				console.log('Progress bars exist, updating values...');
				updateProgressBars();
				return;
			} else {
				console.log('Progress bars exist but DOM elements are gone, recreating...');
				// Destroy existing progress bars since DOM elements are gone
				arenaGodBar.destroy();
				allChampionsBar.destroy();
				arenaGodBar = null;
				allChampionsBar = null;
			}
		}
		
		console.log('Initializing progress bars...');
		
		// Get the progress bar elements after DOM is updated
		const arenaGodBarEl = document.getElementById('arenaGodBar');
		const allChampionsBarEl = document.getElementById('allChampionsBar');
		
		// Check if elements exist
		if (!arenaGodBarEl || !allChampionsBarEl) {
			console.log('Progress bar containers not found in DOM', { arenaGodBarEl, allChampionsBarEl });
			return;
		}
		
		console.log('Found progress bar containers, creating progress bars...');
		
		// Calculate current values
		const completed = Object.values(wins).filter(Boolean).length;
		const total = champions.length;
		const target = GAME_CONFIG.ARENA_GOD_TARGET;
		const arenaGodPercentage = Math.min(completed / target, 1.0);
		const allChampionsPercentage = completed / total;
		
		// Calculate colors
		const arenaGodHue = arenaGodPercentage * 120; // 0 (red) to 120 (green)
		const arenaGodColor = `hsl(${arenaGodHue}, 70%, 50%)`;
		const allChampionsHue = allChampionsPercentage * 120; // 0 (red) to 120 (green)
		const allChampionsColor = `hsl(${allChampionsHue}, 70%, 50%)`;
		
		// Initialize Arena God semicircle progress bar
		arenaGodBar = new ProgressBar.SemiCircle(arenaGodBarEl, {
			color: arenaGodColor,
			strokeWidth: 8,
			trailWidth: 6,
			trailColor: 'var(--border)',
			easing: 'easeInOut',
			duration: 1500,
			svgStyle: {
				display: 'block',
				width: '100%',
				height: '100%'
			},
			text: {
				value: `${Math.min(completed, target)}/${target}`,
				alignToBottom: true,
				style: {
					position: 'absolute',
					left: '50%',
					top: '50%',
					padding: 0,
					margin: 0,
					transform: {
						prefix: true,
						value: 'translate(-50%, -50%)'
					}
				}
			}
		});
		
		// Set the initial progress value
		arenaGodBar.set(arenaGodPercentage);
		
		// Initialize All Champions semicircle progress bar
		allChampionsBar = new ProgressBar.SemiCircle(allChampionsBarEl, {
			color: allChampionsColor,
			strokeWidth: 8,
			trailWidth: 6,
			trailColor: 'var(--border)',
			easing: 'easeInOut',
			duration: 1500,
			svgStyle: {
				display: 'block',
				width: '100%',
				height: '100%'
			},
			text: {
				value: `${completed}/${total}`,
				alignToBottom: true,
				style: {
					position: 'absolute',
					left: '50%',
					top: '50%',
					padding: 0,
					margin: 0,
					transform: {
						prefix: true,
						value: 'translate(-50%, -50%)'
					}
				}
			}
		});
		
		// Set the initial progress value
		allChampionsBar.set(allChampionsPercentage);
		
		console.log('Semicircle progress bars initialized successfully');
	} catch (error) {
		console.error('Failed to initialize progress bars:', error);
	}
}

function createPieChart(classStats) {
	const ctx = document.getElementById('classPieChart');
	if (!ctx) return;
	
	// Check if Chart.js is loaded
	if (typeof Chart === 'undefined') {
		console.log('Chart.js not loaded yet, retrying in 500ms...');
		setTimeout(() => createPieChart(classStats), 500);
		return;
	}
	
	console.log('Creating pie chart with data:', classStats);
	
	const classes = ['Fighter', 'Tank', 'Mage', 'Assassin', 'Marksman', 'Support'];
	const classColors = {
		'Fighter': '#ff6b6b',
		'Tank': '#4ecdc4',
		'Mage': '#45b7d1',
		'Assassin': '#96ceb4',
		'Marksman': '#feca57',
		'Support': '#ff9ff3'
	};
	
	// Destroy existing chart if it exists
	if (window.classPieChartInstance) {
		window.classPieChartInstance.destroy();
	}
	
	const chartData = classes.map(className => classStats[className].wins);
	const totalWins = chartData.reduce((a, b) => a + b, 0);
	
	console.log('Chart data:', chartData, 'Total wins:', totalWins);
	
	// Only create chart if there are wins to show
	if (totalWins === 0) {
		ctx.parentElement.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 40px;">No wins yet to display in chart</div>';
		return;
	}
	
	window.classPieChartInstance = new Chart(ctx, {
		type: 'pie',
		data: {
			labels: classes,
			datasets: [{
				data: chartData,
				backgroundColor: classes.map(className => classColors[className]),
				borderColor: '#1a1a1a',
				borderWidth: 2
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			animation: {
				duration: 1000,
				easing: 'easeInOut'
			},
			plugins: {
				legend: {
					position: 'bottom',
					labels: {
						padding: 20,
						usePointStyle: true,
						font: {
							size: 12,
							weight: '600'
						}
					}
				},
				tooltip: {
					callbacks: {
						label: function(context) {
							const label = context.label || '';
							const value = context.parsed;
							const percentage = totalWins > 0 ? Math.round((value / totalWins) * 100) : 0;
							return `${label}: ${value} wins (${percentage}% of total wins)`;
						}
					}
				}
			}
		}
	});
}

function initChampionsProgressBar() {
	try {
		// Check if ProgressBar is available
		if (typeof ProgressBar === 'undefined') {
			console.error('ProgressBar.js not loaded');
			return;
		}
		
		// Check if progress bars exist and their DOM elements are still valid
		if (championsArenaGodBar && championsAllChampionsBar) {
			// Check if the DOM elements still exist
			const championsArenaGodBarEl = document.getElementById('championsArenaGodBar');
			const championsAllChampionsBarEl = document.getElementById('championsAllChampionsBar');
			
			if (championsArenaGodBarEl && championsAllChampionsBarEl) {
				console.log('Champions progress bars exist, updating values...');
				updateChampionsProgressBars();
				return;
			} else {
				console.log('Champions progress bars exist but DOM elements are gone, recreating...');
				// Destroy existing progress bars since DOM elements are gone
				championsArenaGodBar.destroy();
				championsAllChampionsBar.destroy();
				championsArenaGodBar = null;
				championsAllChampionsBar = null;
			}
		}
		
		console.log('Initializing champions progress bars...');
		
		// Get the progress bar elements after DOM is updated
		const championsArenaGodBarEl = document.getElementById('championsArenaGodBar');
		const championsAllChampionsBarEl = document.getElementById('championsAllChampionsBar');
		
		// Check if elements exist
		if (!championsArenaGodBarEl || !championsAllChampionsBarEl) {
			console.log('Champions progress bar containers not found in DOM', { championsArenaGodBarEl, championsAllChampionsBarEl });
			return;
		}
		
		console.log('Found champions progress bar containers, creating progress bars...');
		
		// Calculate current values
		const completed = Object.values(wins).filter(Boolean).length;
		const total = champions.length;
		const target = GAME_CONFIG.ARENA_GOD_TARGET;
		const arenaGodPercentage = Math.min(completed / target, 1.0);
		const allChampionsPercentage = completed / total;
		
		// Calculate colors
		const arenaGodHue = arenaGodPercentage * 120; // 0 (red) to 120 (green)
		const arenaGodColor = `hsl(${arenaGodHue}, 70%, 50%)`;
		const allChampionsHue = allChampionsPercentage * 120; // 0 (red) to 120 (green)
		const allChampionsColor = `hsl(${allChampionsHue}, 70%, 50%)`;
		
		// Initialize Champions Arena God semicircle progress bar
		championsArenaGodBar = new ProgressBar.SemiCircle(championsArenaGodBarEl, {
			color: arenaGodColor,
			strokeWidth: 8,
			trailWidth: 6,
			trailColor: 'var(--border)',
			easing: 'easeInOut',
			duration: 1500,
			svgStyle: {
				display: 'block',
				width: '100%',
				height: '100%'
			},
			text: {
				value: `${Math.min(completed, target)}/${target}`,
				alignToBottom: true,
				style: {
					position: 'absolute',
					left: '50%',
					top: '50%',
					padding: 0,
					margin: 0,
					transform: {
						prefix: true,
						value: 'translate(-50%, -50%)'
					}
				}
			}
		});
		
		// Set the initial progress value
		championsArenaGodBar.set(arenaGodPercentage);
		
		// Initialize Champions All Champions semicircle progress bar
		championsAllChampionsBar = new ProgressBar.SemiCircle(championsAllChampionsBarEl, {
			color: allChampionsColor,
			strokeWidth: 8,
			trailWidth: 6,
			trailColor: 'var(--border)',
			easing: 'easeInOut',
			duration: 1500,
			svgStyle: {
				display: 'block',
				width: '100%',
				height: '100%'
			},
			text: {
				value: `${completed}/${total}`,
				alignToBottom: true,
				style: {
					position: 'absolute',
					left: '50%',
					top: '50%',
					padding: 0,
					margin: 0,
					transform: {
						prefix: true,
						value: 'translate(-50%, -50%)'
					}
				}
			}
		});
		
		// Set the initial progress value
		championsAllChampionsBar.set(allChampionsPercentage);
		
		console.log('Champions semicircle progress bars initialized successfully');
	} catch (error) {
		console.error('Failed to initialize champions progress bars:', error);
	}
}

function setupEventListeners() {
	// Search and filters
	searchEl.addEventListener('input', render);
	roleFilterEl.addEventListener('change', render);
	completionFilterEl.addEventListener('change', render);
	
	
	// Grid size controls
	gridSizeSelect.addEventListener('change', (e) => {
		const size = e.target.value;
		setGridSize(size);
	});
	
	// Reset button
	resetBtn.addEventListener('click', resetAllWins);

	// Tabs
	if (tabChampionsBtn && tabStatsBtn) {
		tabChampionsBtn.addEventListener('click', () => switchTab('champions'));
		tabStatsBtn.addEventListener('click', () => switchTab('stats'));
	}
}

function switchTab(tab) {
    const isChampions = tab === 'champions';
    // toggle selected states
    tabChampionsBtn.classList.toggle('active', isChampions);
    tabStatsBtn.classList.toggle('active', !isChampions);
    tabChampionsBtn.setAttribute('aria-selected', String(isChampions));
    tabStatsBtn.setAttribute('aria-selected', String(!isChampions));
    // toggle panels
    if (panelChampions && panelStats) {
        panelChampions.hidden = !isChampions;
        panelStats.hidden = isChampions;
    }
}

function resetAllWins() {
	if (confirm('Are you sure you want to reset all wins? This cannot be undone.')) {
		wins = {};
		saveWins();
		render();
	}
}
