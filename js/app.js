import { GameState } from './models/GameState.js';
import { firebaseService } from './services/FirebaseService.js';
import { TimeService } from './services/TimeService.js';
import { StatisticsService } from './services/StatisticsService.js';
import { TableRenderer } from './ui/TableRenderer.js';
import { ContextMenu } from './ui/ContextMenu.js';
import { gameConfig } from './config.js';

class App {
    constructor() {
        // Initialize game state
        this.gameState = new GameState();
        
        // Initialize services
        this.statisticsService = new StatisticsService(this.gameState);
        this.timeService = new TimeService(this.gameState, this.handleTimeTick.bind(this));
        
        // Initialize UI components
        this.tableRenderer = new TableRenderer(this.gameState, this.handleCellClick.bind(this));
        this.contextMenu = new ContextMenu(this.statisticsService);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize the UI
        this.initializeUI();
        
        // Start auto-save if online
        if (this.gameState.isOnline) {
            this.startAutoSave();
        }
    }

    setupEventListeners() {
        // Add player buttons
        document.getElementById('add-player-a').addEventListener('click', () => this.handleAddPlayer('A'));
        document.getElementById('add-player-b').addEventListener('click', () => this.handleAddPlayer('B'));

        // Time controls
        document.getElementById('pause-btn').addEventListener('click', () => this.handlePauseToggle());
        document.getElementById('reset-time-btn').addEventListener('click', () => this.handleTimeReset());
        document.getElementById('apply-time-config').addEventListener('click', () => this.handleTimeConfig());

        // Timeout buttons
        document.getElementById('timeout-button-a').addEventListener('click', () => this.handleTimeout('A'));
        document.getElementById('timeout-button-b').addEventListener('click', () => this.handleTimeout('B'));

        // Undo/Redo buttons
        document.getElementById('undo-btn').addEventListener('click', () => this.handleUndo());
        document.getElementById('redo-btn').addEventListener('click', () => this.handleRedo());

        // Online/Offline toggle
        document.getElementById('toggle-online-btn').addEventListener('click', () => this.handleOnlineToggle());
        document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        // Set current date
        const today = new Date();
        document.getElementById('match-date').textContent = today.toISOString().split('T')[0];
    }

    initializeUI() {
        // Render initial tables
        this.tableRenderer.renderTeamTable('A');
        this.tableRenderer.renderTeamTable('B');
        
        // Update displays
        this.tableRenderer.updatePeriodDisplay();
        this.tableRenderer.updateScoreDisplay();
        this.tableRenderer.updateTimeoutDisplay('A');
        this.tableRenderer.updateTimeoutDisplay('B');
        
        // Start the timer
        this.timeService.start();
    }

    handleTimeTick(data) {
        // Update time display
        document.getElementById('match-time').textContent = this.timeService.formatTime(data.periodSeconds);
        
        if (data.periodChanged) {
            this.tableRenderer.updatePeriodDisplay();
            this.tableRenderer.updateScoreDisplay();
        }
        
        if (data.timeoutEnded) {
            this.tableRenderer.updateTimeoutDisplay(this.gameState.timeoutTeam);
            this.tableRenderer.updateTimeoutTimer();
        }
        
        if (data.suspensionEnded) {
            this.tableRenderer.renderTeamTable('A');
            this.tableRenderer.renderTeamTable('B');
        }
    }

    handleCellClick(data, increment) {
        const success = this.statisticsService.updatePlayerStat(
            data.team,
            data.playerId,
            data.stat,
            parseInt(data.element.textContent || '0') + increment
        );
        
        if (success) {
            this.tableRenderer.renderTeamTable(data.team);
            this.tableRenderer.updateScoreDisplay();
        }
    }

    handleAddPlayer(team) {
        const nameInput = document.getElementById(`player-name-${team.toLowerCase()}`);
        const numberInput = document.getElementById(`player-number-${team.toLowerCase()}`);
        
        const success = this.statisticsService.addPlayer(
            team,
            nameInput.value.trim(),
            numberInput.value.trim()
        );
        
        if (success) {
            nameInput.value = '';
            numberInput.value = '';
            this.tableRenderer.renderTeamTable(team);
        } else {
            alert('Please enter both name and number, or check if team is full');
        }
    }

    handlePauseToggle() {
        const isPaused = this.timeService.togglePause();
        document.getElementById('pause-btn').textContent = isPaused ? '▶ Resume' : '⏸ Pause';
    }

    handleTimeReset() {
        if (confirm('Are you sure you want to reset the game time to 00:00?')) {
            this.timeService.reset();
            this.tableRenderer.updatePeriodDisplay();
            this.tableRenderer.updateScoreDisplay();
            this.tableRenderer.renderTeamTable('A');
            this.tableRenderer.renderTeamTable('B');
        }
    }

    handleTimeConfig() {
        const periods = ['1h', '2h', 'et1', 'et2'];
        const newDurations = {};
        
        for (const period of periods) {
            const duration = parseInt(document.getElementById(`period-${period}-duration`).value) || 0;
            if (duration > 0) {
                newDurations[period.toUpperCase()] = duration * 60;
            }
        }
        
        Object.assign(this.gameState.periodDurations, newDurations);
        
        // Update period duration displays
        document.querySelectorAll('.period-duration').forEach((el, index) => {
            el.textContent = Math.floor(Object.values(newDurations)[index] / 60);
        });
    }

    handleTimeout(team) {
        if (this.statisticsService.startTimeout(team)) {
            this.tableRenderer.updateTimeoutDisplay(team);
            this.tableRenderer.updateTimeoutDisplay(team === 'A' ? 'B' : 'A');
            if (!this.gameState.isPaused) {
                this.handlePauseToggle();
            }
        }
    }

    handleUndo() {
        if (this.statisticsService.undo()) {
            this.tableRenderer.renderTeamTable('A');
            this.tableRenderer.renderTeamTable('B');
            this.tableRenderer.updateScoreDisplay();
            this.tableRenderer.updateTimeoutDisplay('A');
            this.tableRenderer.updateTimeoutDisplay('B');
        }
    }

    handleRedo() {
        if (this.statisticsService.redo()) {
            this.tableRenderer.renderTeamTable('A');
            this.tableRenderer.renderTeamTable('B');
            this.tableRenderer.updateScoreDisplay();
            this.tableRenderer.updateTimeoutDisplay('A');
            this.tableRenderer.updateTimeoutDisplay('B');
        }
    }

    async handleOnlineToggle() {
        if (!this.gameState.isOnline) {
            this.gameState.isOnline = true;
            const user = await firebaseService.getCurrentUser();
            this.updateAuthUI(user);
            if (user) {
                const loaded = await this.loadGameState();
                if (!loaded) {
                    await this.saveGameState();
                }
                this.startAutoSave();
            }
        } else {
            this.gameState.isOnline = false;
            this.updateAuthUI(null);
            this.stopAutoSave();
        }
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }
        
        const success = await firebaseService.signIn(email, password);
        if (success) {
            const user = await firebaseService.getCurrentUser();
            this.updateAuthUI(user);
            await this.loadGameState();
            this.startAutoSave();
        } else {
            alert('Login failed');
        }
    }

    async handleLogout() {
        await firebaseService.signOut();
        this.updateAuthUI(null);
        this.gameState.isOnline = false;
        this.stopAutoSave();
    }

    updateAuthUI(user) {
        const authStatus = document.getElementById('auth-status');
        const userEmail = document.getElementById('user-email');
        const loginForm = document.getElementById('login-form');
        const toggleBtn = document.getElementById('toggle-online-btn');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (this.gameState.isOnline && user) {
            authStatus.textContent = 'Online Mode';
            userEmail.style.display = 'block';
            userEmail.textContent = user.email;
            loginForm.style.display = 'block';
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            toggleBtn.textContent = 'Go Offline';
        } else if (this.gameState.isOnline && !user) {
            authStatus.textContent = 'Online Mode (Not logged in)';
            userEmail.style.display = 'none';
            loginForm.style.display = 'block';
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            toggleBtn.textContent = 'Go Offline';
        } else {
            authStatus.textContent = 'Offline Mode';
            userEmail.style.display = 'none';
            loginForm.style.display = 'none';
            toggleBtn.textContent = 'Go Online';
        }
    }

    async saveGameState() {
        if (!this.gameState.isOnline) return;
        
        const success = await firebaseService.saveMatchData(
            this.gameState.matchId,
            this.gameState.toJSON()
        );
        
        if (success) {
            this.gameState.lastSaved = new Date();
        }
    }

    async loadGameState() {
        const loadedState = await firebaseService.loadMatchData(this.gameState.matchId);
        if (loadedState) {
            this.gameState = loadedState;
            this.initializeUI();
            return true;
        }
        return false;
    }

    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.saveGameState();
        }, gameConfig.autoSaveInterval);
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
}); 