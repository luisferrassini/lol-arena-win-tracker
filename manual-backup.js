// Data Dragon endpoints
const DDRAGON_VERSIONS = 'https://ddragon.leagueoflegends.com/api/versions.json';
const DDRAGON_CDN = (version) => `https://ddragon.leagueoflegends.com/cdn/${version}`;
const DDRAGON_IMG = 'https://ddragon.leagueoflegends.com/cdn/img';

// Storage keys
const STORAGE_KEY = 'arenaWinsByChampion';

// State
let champions = []; // normalized array
let wins = {}; // champId -> boolean
let currentVersion = '14.21.1';

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
// Progress bar elements are now selected dynamically when needed

// Progress bar instances
let arenaGodBar;
let allChampionsBar;
let championsArenaGodBar;
let championsAllChampionsBar;
const gridSizeBtns = document.querySelectorAll('.grid-size-btn');
const milestoneMessageEl = document.getElementById('milestoneMessage');
const milestoneMarkerEl = document.getElementById('milestoneMarker');

init().catch(console.error);

async function init() {
	await loadLatestVersion();
	await loadChampions();
	loadWins();
    // Render progress cards for both tabs
    renderProgressCards();
    renderChampionsProgressCards();
    loadGridSize();
    // Initialize progress bars once (elements now exist)
    initProgressBar();
    initChampionsProgressBar();
    updateProgressBars();
    render();
	setupEventListeners();
}

async function loadLatestVersion() {
	try {
		const res = await fetch(DDRAGON_VERSIONS);
		const versions = await res.json();
		currentVersion = versions[0];
	} catch (err) {
		console.warn('Failed to load latest version, using fallback:', currentVersion);
	}
}

async function loadChampions() {
	try {
		// Add loading state
		gridEl.classList.add('loading');
		
		const res = await fetch(`${DDRAGON_CDN(currentVersion)}/data/en_US/champion.json`);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		
		const data = await res.json();
		champions = Object.values(data.data).map(champ => ({
			id: champ.id,
			name: champ.name,
			roles: champ.tags,
			key: champ.key
		}));
		
		// Remove loading state
		gridEl.classList.remove('loading');
	} catch (err) {
		console.error('Failed to load champions:', err);
		gridEl.classList.remove('loading');
		
		// Show error message to user
		gridEl.innerHTML = `
			<div class="error-message">
				<h3>Failed to load champions</h3>
				<p>Please check your internet connection and try again.</p>
				<button onclick="location.reload()" class="retry-btn">Retry</button>
			</div>
		`;
	}
}

function loadWins() {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored) {
		wins = JSON.parse(stored);
	}
}

function saveWins() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(wins));
}


function render() {
	const searchTerm = searchEl.value.toLowerCase();
	const roleFilter = roleFilterEl.value;
	const completionFilter = completionFilterEl.value;
	
	const filtered = champions.filter(champ => {
		const matchesSearch = champ.name.toLowerCase().includes(searchTerm);
		const matchesRole = !roleFilter || champ.roles.includes(roleFilter);
		const matchesCompletion = !completionFilter || 
			(completionFilter === 'won' && wins[champ.id]) ||
			(completionFilter === 'not-won' && !wins[champ.id]);
		
		return matchesSearch && matchesRole && matchesCompletion;
	});
	
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
	img.src = championSquare(champion.id);
	img.alt = `${champion.name}`;
	img.loading = 'lazy';
	img.className = 'portrait';
	// Fallback if primary image fails
	img.onerror = () => {
		img.onerror = null;
		img.src = championSplash(champion.id);
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

function updateStats() {
	const total = champions.length;
	const completed = Object.values(wins).filter(Boolean).length;
	const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
	
	// Update progress bars based on milestone status
	const target = 60;
	const isTargetReached = completed >= target;
	
    // Animate existing progress bars; they are initialized once
    updateProgressBars();
	
	
	// Check for milestone
	checkMilestone(completed);
	
	// Calculate stats based on total champions progress
	const totalChampions = champions.length;
	const totalPercentage = Math.round((completed / totalChampions) * 100);
	const remainingToTarget = Math.max(0, target - completed);
	
    // Calculate class-specific stats
    const classStats = calculateClassStats();

    // Update non-progress summary cards individually
    const statsPercentage = Math.round((completed / target) * 100);
    if (isTargetReached) {
        upsertCard('card-target', 'stat-card target-reached', `
            <div class="stat-card-header">
                <span class="stat-name">Arena God Completed</span>
            </div>
            <div class="stat-progress">
                <span class="stat-value" style="color: #44ff44">60/60</span>
            </div>
            <div class="stat-percentage" style="color: #44ff44">100% Complete</div>
        `);
        upsertCard('card-total-wins', 'stat-card', `
            <div class="stat-card-header">
                <span class="stat-name">Total Wins</span>
            </div>
            <div class="stat-progress">
                <span class="stat-value" style="color: #44ff44">${completed}</span>
            </div>
            <div class="stat-percentage" style="color: #44ff44">${totalPercentage}% of all champions</div>
        `);
        upsertCard('card-remaining', 'stat-card', `
            <div class="stat-card-header">
                <span class="stat-name">Remaining</span>
            </div>
            <div class="stat-progress">
                <span class="stat-value" style="color: #44ff44">${totalChampions - completed}</span>
            </div>
            <div class="stat-percentage" style="color: #44ff44">champions left</div>
        `);
        // Remove the pre-60 summary card if present
        removeCard('card-pre60-summary');
    } else {
        upsertCard('card-pre60-summary', 'stat-card', `
            <div class="stat-card-header">
                <span class="stat-name">Arena God</span>
            </div>
            <div class="stat-progress">
                <span class="stat-value" style="color: ${getSemanticColor(statsPercentage)}">${completed}/${target}</span>
            </div>
            <div class="stat-percentage" style="color: ${getSemanticColor(statsPercentage)}">${statsPercentage}% Complete</div>
        `);
        upsertCard('card-remaining', 'stat-card', `
            <div class="stat-card-header">
                <span class="stat-name">Remaining</span>
            </div>
            <div class="stat-progress">
                <span class="stat-value" style="color: ${getSemanticColor(statsPercentage)}">${remainingToTarget}</span>
            </div>
            <div class="stat-percentage" style="color: ${getSemanticColor(statsPercentage)}">wins needed</div>
        `);
        upsertCard('card-all-champions-summary', 'stat-card', `
            <div class="stat-card-header">
                <span class="stat-name">All Champions</span>
            </div>
            <div class="stat-progress">
                <span class="stat-value" style="color: ${getSemanticColor(statsPercentage)}">${completed}/${totalChampions}</span>
            </div>
            <div class="stat-percentage" style="color: ${getSemanticColor(statsPercentage)}">${totalPercentage}% Complete</div>
        `);
        // Remove the target reached card if present
        removeCard('card-target');
        removeCard('card-total-wins');
    }

    // Class cards - always show all cards
    const classes = ['Fighter', 'Tank', 'Mage', 'Assassin', 'Marksman', 'Support'];
    classes.forEach(className => {
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

// Ensure containers exist: a persistent progress cards section and a summary section
// Removed: separate containers; we will use a single stats grid

// Render the two progress cards once and only once
function renderProgressCards() {
    const progressContainer = statsEl; // use single unified grid container
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
                <div id="arenaGodBar" class="progress-card-semicircle" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="60" aria-label="Arena God progress bar"></div>
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
    const currentGridSize = localStorage.getItem('gridSize') || 'medium';
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
                <div id="championsArenaGodBar" class="progress-card-semicircle" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="60" aria-label="Arena God progress bar"></div>
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

function checkMilestone(completed) {
	const milestone = 60; // Arena God milestone
	const hasReachedMilestone = completed >= milestone;
	const wasAlreadyReached = localStorage.getItem('milestone60') === 'true';
	
	console.log('Checking milestone:', { completed, milestone, hasReachedMilestone, wasAlreadyReached });
	
	if (hasReachedMilestone && !wasAlreadyReached) {
		console.log('Milestone reached! Showing message...');
		showMilestoneMessage();
		localStorage.setItem('milestone60', 'true');
	}

	// If we drop below 60 after having reached it, reset the flag and hide
	if (!hasReachedMilestone && wasAlreadyReached) {
		console.log('Milestone no longer met. Resetting flag and hiding message.');
		localStorage.setItem('milestone60', 'false');
		closeMilestoneMessage();
	}

	if (completed < 60) {
		console.log('Milestone no longer met. Removing flag and hiding message.');
		localStorage.setItem('milestone60', 'false');
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
	}, 300);
}

// Make closeMilestoneMessage globally available
window.closeMilestoneMessage = closeMilestoneMessage;

// Test function to manually trigger milestone (for testing)
window.testMilestone = function() {
	console.log('Testing milestone message...');
	showMilestoneMessage();
};

function setGridSize(size) {
	// Update active button
	gridSizeBtns.forEach(btn => btn.classList.remove('active'));
	document.querySelector(`[data-size="${size}"]`).classList.add('active');
	
	// Update grid class
	gridEl.className = `grid grid-${size}`;
	
	// Update panel class for responsive progress cards
	if (panelChampions) {
		panelChampions.classList.remove('grid-small', 'grid-medium');
		panelChampions.classList.add(`grid-${size}`);
		console.log('Applied grid class to panel:', `grid-${size}`, panelChampions.classList.toString());
	}
	
	// Save preference
	localStorage.setItem('gridSize', size);
	
	// Re-render cards with new layout
	render();
}

function loadGridSize() {
	const savedSize = localStorage.getItem('gridSize') || 'medium';
	setGridSize(savedSize);
}

function updateProgressBars() {
	if (!arenaGodBar || !allChampionsBar) {
		console.log('Progress bars not ready for update, retrying in 100ms...');
		// Retry after a short delay
		setTimeout(() => {
			updateProgressBars();
		}, 100);
		return;
	}
	
	console.log('Updating progress bars...');
	
	const completed = Object.values(wins).filter(Boolean).length;
	const total = champions.length;
	const target = 60;
	
	try {
		// Update Arena God progress with animation
		const arenaGodPercentage = Math.min(completed / target, 1.0);
		arenaGodBar.animate(arenaGodPercentage, {
			duration: 800,
			easing: 'easeInOut'
		});
		
		// Update All Champions progress with animation
		const allChampionsPercentage = completed / total;
		allChampionsBar.animate(allChampionsPercentage, {
			duration: 800,
			easing: 'easeInOut'
		});
		
		// Update Arena God text inside the semicircle
		arenaGodBar.setText(`${Math.min(completed, target)}/${target}`);
		
		// Update All Champions text inside the semicircle
		allChampionsBar.setText(`${completed}/${total}`);
		
		// Update colors
		updateProgressBarColors(arenaGodPercentage, allChampionsPercentage);
	} catch (error) {
		console.error('Error updating progress bars:', error);
		// Fallback to set() instead of animate() if animate() fails
		try {
			const arenaGodPercentage = Math.min(completed / target, 1.0);
			const allChampionsPercentage = completed / total;
			
			arenaGodBar.set(arenaGodPercentage);
			allChampionsBar.set(allChampionsPercentage);
			
			arenaGodBar.setText(`${Math.min(completed, target)}/${target}`);
			allChampionsBar.setText(`${completed}/${total}`);
			
			updateProgressBarColors(arenaGodPercentage, allChampionsPercentage);
		} catch (fallbackError) {
			console.error('Fallback progress bar update also failed:', fallbackError);
		}
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
		}, 100);
		return;
	}
	
	console.log('Updating champions progress bars...');
	
	const completed = Object.values(wins).filter(Boolean).length;
	const total = champions.length;
	const target = 60;
	
	try {
		// Update Champions Arena God progress with animation
		const arenaGodPercentage = Math.min(completed / target, 1.0);
		championsArenaGodBar.animate(arenaGodPercentage, {
			duration: 800,
			easing: 'easeInOut'
		});
		
		// Update Champions All Champions progress with animation
		const allChampionsPercentage = completed / total;
		championsAllChampionsBar.animate(allChampionsPercentage, {
			duration: 800,
			easing: 'easeInOut'
		});
		
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
		const target = 60;
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
		const target = 60;
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

function updateMilestoneMarker(completed) {
	const target = 60;
	if (milestoneMarkerEl) {
		if (completed >= target) {
			milestoneMarkerEl.classList.add('reached');
		} else {
			milestoneMarkerEl.classList.remove('reached');
		}
	}
}


function updateProgressBarColor(progressFillEl, percentage) {
	// Calculate color based on percentage
	// 0% = red (#ff4444), 50% = yellow (#ffaa00), 100% = green (#44ff44)
	let red, green, blue;
	
	if (percentage <= 50) {
		// Red to Yellow transition (0% to 50%)
		const factor = percentage / 50;
		red = 255;
		green = Math.round(68 + (170 * factor)); // 68 to 238
		blue = 68;
	} else {
		// Yellow to Green transition (50% to 100%)
		const factor = (percentage - 50) / 50;
		red = Math.round(255 - (211 * factor)); // 255 to 44
		green = 255;
		blue = Math.round(68 + (187 * factor)); // 68 to 255
	}
	
	const color = `rgb(${red}, ${green}, ${blue})`;
	progressFillEl.style.background = `linear-gradient(90deg, ${color}, ${color})`;
}

function getSemanticColor(percentage) {
	// Calculate color with better contrast for accessibility
	// 0% = red (#ff6b6b), 50% = yellow (#ffd93d), 100% = green (#6bcf7f)
	let red, green, blue;
	
	if (percentage <= 50) {
		// Red to Yellow transition (0% to 50%)
		const factor = percentage / 50;
		red = 255;
		green = Math.round(107 + (148 * factor)); // 107 to 255
		blue = Math.round(107 + (61 * factor)); // 107 to 168
	} else {
		// Yellow to Green transition (50% to 100%)
		const factor = (percentage - 50) / 50;
		red = Math.round(255 - (188 * factor)); // 255 to 67
		green = 255;
		blue = Math.round(168 - (101 * factor)); // 168 to 67
	}
	
	return `rgb(${red}, ${green}, ${blue})`;
}

function updateSegmentedProgressBar(progressFillEl, completed, total, target) {
	const milestonePosition = (target / total) * 100; // 35.9% for 60/167
	
	if (completed <= target) {
		// First segment: 0 to 60 wins (red to yellow)
		const segmentProgress = (completed / target) * 100;
		const color = getSemanticColor(segmentProgress * 2); // Scale to 0-100% range
		progressFillEl.style.background = `linear-gradient(90deg, ${color}, ${color})`;
	} else {
		// Second segment: 60+ wins (yellow to green)
		const remainingChampions = total - target;
		const segmentProgress = ((completed - target) / remainingChampions) * 100;
		const color = getSemanticColor(50 + (segmentProgress * 0.5)); // Start from yellow (50%) and go to green
		progressFillEl.style.background = `linear-gradient(90deg, ${color}, ${color})`;
	}
}

function resetAllWins() {
	if (confirm('Are you sure you want to reset all wins? This cannot be undone.')) {
		wins = {};
		saveWins();
		render();
	}
}

function championSquare(id) {
	return `${DDRAGON_CDN(currentVersion)}/img/champion/${id}.png`;
}

function championSplash(id) {
	return `${DDRAGON_IMG}/champion/splash/${id}_0.jpg`;
}

function setupEventListeners() {
	// Search and filters
	searchEl.addEventListener('input', render);
	roleFilterEl.addEventListener('change', render);
	completionFilterEl.addEventListener('change', render);
	
	
	// Grid size controls
	gridSizeBtns.forEach(btn => {
		btn.addEventListener('click', (e) => {
			const size = e.currentTarget.dataset.size;
			setGridSize(size);
		});
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

function calculateClassStats() {
	const classes = ['Fighter', 'Tank', 'Mage', 'Assassin', 'Marksman', 'Support'];
	const classStats = {};
	
	console.log('Calculating class stats for champions:', champions.length);
	console.log('Wins object keys:', Object.keys(wins));
	console.log('Wins object values:', Object.values(wins));
	console.log('Total wins from wins object:', Object.values(wins).filter(Boolean).length);
	
	// Check what properties champions have
	if (champions.length > 0) {
		console.log('Sample champion:', champions[0]);
		console.log('Champion properties:', Object.keys(champions[0]));
	}
	
	// Get total wins once
	const totalWins = Object.values(wins).filter(Boolean).length;
	
	classes.forEach(className => {
		// Try different possible property names for class/tags
		const classChampions = champions.filter(champ => {
			return (champ.tags && champ.tags.includes(className)) ||
				   (champ.roles && champ.roles.includes(className)) ||
				   (champ.class && champ.class === className) ||
				   (champ.type && champ.type === className);
		});
		
		const classWins = classChampions.filter(champ => wins[champ.id]).length;
		const winsPercentage = totalWins > 0 ? Math.round((classWins / totalWins) * 100) : 0;
		
		console.log(`${className}: ${classWins} wins (${winsPercentage}% of total wins)`);
		
		classStats[className] = {
			wins: classWins,
			percentage: winsPercentage
		};
	});
	
	return classStats;
}

function generateClassStatsHTML(classStats) {
	const classes = ['Fighter', 'Tank', 'Mage', 'Assassin', 'Marksman', 'Support'];
	const classIcons = {
		'Fighter': '⚔️',
		'Tank': '🛡️',
		'Mage': '🔮',
		'Assassin': '🗡️',
		'Marksman': '🏹',
		'Support': '💚'
	};
	
	const classColors = {
		'Fighter': '#ff6b6b',
		'Tank': '#4ecdc4',
		'Mage': '#45b7d1',
		'Assassin': '#96ceb4',
		'Marksman': '#feca57',
		'Support': '#ff9ff3'
	};
	
    let classHTML = '';
	
	// Individual stat cards for each class
	classes.forEach(className => {
		const stats = classStats[className];
		const color = getSemanticColor(stats.percentage);
		const icon = classIcons[className];
		const classColor = classColors[className];
		
        classHTML += `
            <div class="stat-card class-card only-names">
				<div class="stat-card-header">
					<span class="stat-icon">${icon}</span>
					<span class="stat-name">${className}</span>
				</div>
				<div class="stat-progress">
					<span class="stat-value" style="color: ${color}">${stats.wins}</span>
					<span class="stat-label">wins</span>
				</div>
				<div class="stat-percentage" style="color: ${color}">${stats.percentage}% of total</div>
			</div>
		`;
	});
	
	// Pie chart card
    classHTML += `
        <div class="stat-card pie-chart-card only-names">
			<div class="stat-card-header">
				<span class="stat-icon">📊</span>
				<span class="stat-name">Wins by Class</span>
			</div>
			<div class="pie-chart-container">
				<canvas id="classPieChart"></canvas>
			</div>
		</div>
	`;
	
	return classHTML;
}

// Removed: updateNamesVisibility - all cards are now always visible

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
